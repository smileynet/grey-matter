import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { lstat, realpath, stat } from 'node:fs/promises';
import { Transform, pipeline } from 'node:stream';
import { isAbsolute, normalize, win32 } from 'node:path';
import { TextDecoder } from 'node:util';

const LIMIT_KEYS = [
  'maxArgumentBytes', 'maxInputBytes', 'maxStdoutBytes', 'maxStderrBytes',
  'maxLineBytes', 'deadlineMs', 'eofGraceMs', 'terminateGraceMs', 'forceGraceMs',
];
const LIMIT_CEILINGS = {
  maxExecutableBytes: 1_073_741_824,
  maxArgumentBytes: 1_048_576,
  maxInputBytes: 268_435_456,
  maxStdoutBytes: 268_435_456,
  maxStderrBytes: 67_108_864,
  maxLineBytes: 16_777_216,
  deadlineMs: 86_400_000,
  eofGraceMs: 60_000,
  terminateGraceMs: 60_000,
  forceGraceMs: 60_000,
};

function demand(condition, message) {
  if (!condition) throw new TypeError(message);
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function samePath(left, right) {
  if (process.platform === 'win32') {
    const clean = value => win32.normalize(value).replace(/^\\\\\?\\/, '').toLowerCase();
    return clean(left) === clean(right);
  }
  return normalize(left) === normalize(right);
}

function validateLimits(limits, executable) {
  demand(record(limits) && Object.keys(limits).length === LIMIT_KEYS.length
    && LIMIT_KEYS.every(key => Object.hasOwn(limits, key)), `limits must contain exactly: ${LIMIT_KEYS.join(', ')}`);
  demand(record(executable) && Object.keys(executable).length === 3
    && ['canonicalPath', 'sha256', 'maxBytes'].every(key => Object.hasOwn(executable, key)),
  'executable must contain canonicalPath, sha256 and maxBytes');
  for (const [key, value] of Object.entries({ ...limits, maxExecutableBytes: executable.maxBytes })) {
    demand(Number.isSafeInteger(value) && value > 0 && value <= LIMIT_CEILINGS[key], `${key} must be a positive finite integer within its ceiling`);
  }
  demand(limits.maxLineBytes <= limits.maxStdoutBytes, 'maxLineBytes cannot exceed maxStdoutBytes');
  demand(typeof executable.canonicalPath === 'string' && isAbsolute(executable.canonicalPath), 'Executable path must be absolute and canonical');
  demand(typeof executable.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(executable.sha256), 'Executable SHA-256 must be 64 hexadecimal characters');
}

function validateSpawnInput({ argv, cwd, env, limits }) {
  demand(Array.isArray(argv) && argv.length <= 256 && argv.every(arg => typeof arg === 'string' && !arg.includes('\0')),
    'argv must be an array of at most 256 NUL-free strings');
  const argumentBytes = argv.reduce((sum, arg) => sum + Buffer.byteLength(arg, 'utf8'), 0);
  demand(argumentBytes <= limits.maxArgumentBytes, 'argv exceeds maxArgumentBytes');
  demand(typeof cwd === 'string' && isAbsolute(cwd), 'cwd must be an absolute path');
  demand(record(env), 'An explicit adapter-owned environment object is required');
  const envEntries = Object.entries(env);
  demand(envEntries.length <= 256, 'env has too many entries');
  let envBytes = 0;
  for (const [key, value] of envEntries) {
    demand(/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && typeof value === 'string' && !value.includes('\0'), 'env keys and values must be valid strings');
    envBytes += Buffer.byteLength(key, 'utf8') + Buffer.byteLength(value, 'utf8');
  }
  demand(envBytes <= limits.maxArgumentBytes, 'env exceeds maxArgumentBytes');
}

async function hashExecutable(executable) {
  const resolved = await realpath(executable.canonicalPath);
  demand(samePath(resolved, executable.canonicalPath), 'Executable path is not canonical');
  const linkInfo = await lstat(resolved);
  demand(linkInfo.isFile() && !linkInfo.isSymbolicLink(), 'Executable must resolve to a regular file');
  demand(linkInfo.size <= executable.maxBytes, 'Executable exceeds maxBytes');
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(resolved)) {
    bytes += chunk.length;
    demand(bytes <= executable.maxBytes, 'Executable exceeds maxBytes while hashing');
    hash.update(chunk);
  }
  demand(hash.digest('hex') === executable.sha256.toLowerCase(), 'Executable SHA-256 hash mismatch');
  return resolved;
}

function jsonLineDecoder(maxLineBytes, onLimit) {
  let pending = [];
  let pendingBytes = 0;
  let line = 1;
  return new Transform({
    readableObjectMode: true,
    transform(chunk, _encoding, callback) {
      let offset = 0;
      while (offset < chunk.length) {
        const newline = chunk.indexOf(0x0a, offset);
        const end = newline === -1 ? chunk.length : newline;
        const part = chunk.subarray(offset, end);
        if (pendingBytes + part.length > maxLineBytes) {
          const error = new OwnedProcessError(`stdout line ${line} exceeds ${maxLineBytes} bytes`, 'LINE_LIMIT', { line, limitBytes: maxLineBytes });
          onLimit(error);
          callback(error);
          return;
        }
        if (part.length) {
          pending.push(part);
          pendingBytes += part.length;
        }
        if (newline === -1) break;
        let bytes = Buffer.concat(pending, pendingBytes);
        if (bytes.at(-1) === 0x0d) bytes = bytes.subarray(0, -1);
        try {
          const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          try {
            this.push({ type: 'record', line, value: JSON.parse(text) });
          } catch {
            this.push({ type: 'malformed', line });
          }
        } catch {
          this.push({ type: 'invalid-utf8', line });
        }
        line += 1;
        pending = [];
        pendingBytes = 0;
        offset = newline + 1;
      }
      callback();
    },
    flush(callback) {
      if (pendingBytes) this.push({ type: 'truncated', line, bytes: pendingBytes });
      callback();
    },
  });
}

function byteLimit(name, maxBytes, onLimit, counter) {
  let seen = 0;
  return new Transform({
    transform(chunk, _encoding, callback) {
      seen += chunk.length;
      counter.value = seen;
      if (seen > maxBytes) {
        const error = new OwnedProcessError(`${name} exceeds ${maxBytes} bytes`, 'OUTPUT_LIMIT', { stream: name, limitBytes: maxBytes, observedBytes: seen });
        onLimit(error);
        callback(error);
      } else callback(null, chunk);
    },
  });
}

function waitForWritable(stream, child) {
  return new Promise((resolveDrain, rejectDrain) => {
    const cleanup = () => {
      stream.off('drain', onDrain);
      stream.off('error', onError);
      stream.off('close', onClose);
      child.off('close', onChildClose);
    };
    const finish = callback => value => { cleanup(); callback(value); };
    const onDrain = finish(resolveDrain);
    const onError = finish(rejectDrain);
    const onClose = () => finish(rejectDrain)(new OwnedProcessError('process exited before stdin drained', 'EARLY_EXIT'));
    const onChildClose = () => finish(rejectDrain)(new OwnedProcessError('process exited before stdin drained', 'EARLY_EXIT'));
    stream.once('drain', onDrain);
    stream.once('error', onError);
    stream.once('close', onClose);
    child.once('close', onChildClose);
  });
}

export class OwnedProcessError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'OwnedProcessError';
    this.code = code;
    Object.assign(this, details);
  }
}

/** Spawn one verified executable and expose only the exact child this call owns. */
export async function startOwnedProcess(options) {
  demand(record(options), 'Options object is required');
  const executableInput = options.executable;
  const argvInput = options.argv;
  const cwdInput = options.cwd;
  const envInput = options.env;
  const limitsInput = options.limits;
  const stdoutModeInput = options.stdoutMode;
  demand(Object.keys(options).every(key => ['executable', 'argv', 'cwd', 'env', 'limits', 'stdoutMode'].includes(key)), 'Unsupported process option');
  const executable = record(executableInput) ? { ...executableInput } : executableInput;
  const argv = Array.isArray(argvInput) ? [...argvInput] : argvInput;
  const cwd = cwdInput;
  const env = record(envInput) ? { ...envInput } : envInput;
  const limits = record(limitsInput) ? { ...limitsInput } : limitsInput;
  const stdoutMode = stdoutModeInput ?? 'jsonl';
  validateLimits(limits, executable);
  validateSpawnInput({ argv, cwd, env, limits });
  demand(stdoutMode === 'jsonl' || stdoutMode === 'raw', 'stdoutMode must be jsonl or raw');

  const executablePath = await hashExecutable(executable);
  const canonicalCwd = await realpath(cwd);
  demand(samePath(canonicalCwd, cwd), 'cwd must be canonical');
  demand((await stat(canonicalCwd)).isDirectory(), 'cwd must be a directory');

  const generation = randomUUID();
  const requestedAt = new Date().toISOString();
  let child;
  try {
    child = spawn(executablePath, [...argv], {
      cwd: canonicalCwd,
      env: { ...env },
      shell: false,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new OwnedProcessError(`process spawn failed: ${error.message}`, 'SPAWN_ERROR');
  }
  let spawnedAt = null;
  let exitedAt = null;
  let processExited = false;
  let closedAt = null;
  let exitResult = null;
  let childError = null;
  let stopReason = null;
  let stopFailure = null;
  let stopPromise = null;
  let endPromise = null;
  let inputEnded = false;
  let inputBytes = 0;
  const stdoutCount = { value: 0 };
  const stderrCount = { value: 0 };
  const completion = new Promise(resolveCompletion => {
    child.once('spawn', () => { spawnedAt = new Date().toISOString(); });
    child.once('exit', () => { processExited = true; exitedAt = new Date().toISOString(); });
    child.once('error', error => { childError = { phase: spawnedAt ? 'runtime' : 'spawn', error }; });
    child.once('close', (exitCode, signal) => {
      closedAt = new Date().toISOString();
      clearTimeout(deadline);
      exitResult = Object.freeze({
        reason: stopReason ?? (childError?.phase === 'spawn' ? 'spawn-error' : 'exit'),
        pid: child.pid ?? null,
        generation,
        requestedAt,
        startedAt: spawnedAt,
        exitedAt,
        closedAt,
        exitCode,
        signal,
        stdoutBytes: stdoutCount.value,
        stderrBytes: stderrCount.value,
        error: childError ? {
          phase: childError.phase,
          code: childError.error.code ?? null,
          message: childError.error.message,
        } : null,
        stopFailure,
      });
      resolveCompletion(exitResult);
    });
  });
  child.stdin.on('error', () => {});

  function waitForCompletion(milliseconds) {
    if (exitResult) return Promise.resolve(exitResult);
    let timer;
    return Promise.race([
      completion,
      new Promise(resolveWait => { timer = setTimeout(() => resolveWait(null), milliseconds); timer.unref?.(); }),
    ]).finally(() => clearTimeout(timer));
  }

  async function endInput() {
    if (inputEnded) return endPromise;
    if (exitResult || child.stdin.destroyed) throw new OwnedProcessError('process is no longer writable', 'EARLY_EXIT');
    inputEnded = true;
    endPromise ??= new Promise((resolveEnd, rejectEnd) => {
      const cleanup = () => {
        child.stdin.off('finish', onFinish);
        child.stdin.off('error', onError);
        child.off('close', onClose);
      };
      const onFinish = () => { cleanup(); resolveEnd(); };
      const onError = error => { cleanup(); rejectEnd(error); };
      const onClose = () => { cleanup(); rejectEnd(new OwnedProcessError('process exited before stdin EOF completed', 'EARLY_EXIT')); };
      child.stdin.once('finish', onFinish);
      child.stdin.once('error', onError);
      child.once('close', onClose);
      child.stdin.end();
    });
    return endPromise;
  }

  async function write(data) {
    if (inputEnded || exitResult || child.stdin.destroyed || !child.stdin.writable) {
      throw new OwnedProcessError('process is no longer writable', 'EARLY_EXIT');
    }
    if (typeof data !== 'string' && !(data instanceof Uint8Array)) throw new TypeError('write accepts a string or Uint8Array');
    const bytes = Buffer.from(data);
    if (inputBytes + bytes.length > limits.maxInputBytes) throw new OwnedProcessError(`stdin exceeds ${limits.maxInputBytes} bytes`, 'INPUT_LIMIT');
    inputBytes += bytes.length;
    let writeCallback;
    const callback = new Promise((resolveWrite, rejectWrite) => {
      writeCallback = error => error ? rejectWrite(error) : resolveWrite();
    });
    let accepted;
    try { accepted = child.stdin.write(bytes, writeCallback); }
    catch (error) { throw new OwnedProcessError(`stdin write failed: ${error.message}`, 'WRITE_ERROR'); }
    const backpressured = !accepted;
    const drained = backpressured ? waitForWritable(child.stdin, child) : Promise.resolve();
    try { await Promise.all([callback, drained]); }
    catch (error) { throw new OwnedProcessError(`stdin write failed: ${error.message}`, 'WRITE_ERROR'); }
    return { bytes: bytes.length, backpressured };
  }

  async function stopOwned(reason) {
    if (exitResult) return exitResult;
    stopReason ??= reason;
    stopPromise ??= (async () => {
      if (!exitResult) {
        void endInput().catch(() => {});
      }
      let result = await waitForCompletion(limits.eofGraceMs);
      if (result) return result;
      if (!exitResult && !processExited && child.pid !== undefined) child.kill('SIGTERM');
      result = await waitForCompletion(limits.terminateGraceMs);
      if (result) return result;
      if (!exitResult && !processExited && child.pid !== undefined) child.kill('SIGKILL');
      result = await waitForCompletion(limits.forceGraceMs);
      if (result) return result;
      stopFailure = 'child did not close before forceGraceMs elapsed';
      throw new OwnedProcessError(stopFailure, 'STOP_TIMEOUT');
    })();
    return stopPromise;
  }

  const deadline = setTimeout(() => {
    void stopOwned('deadline').catch(error => { stopFailure = error.message; });
  }, limits.deadlineMs);
  deadline.unref?.();

  const onOutputLimit = () => {
    void stopOwned('output-limit').catch(error => { stopFailure = error.message; });
  };
  const stdoutLimiter = byteLimit('stdout', limits.maxStdoutBytes, onOutputLimit, stdoutCount);
  const stderrLimiter = byteLimit('stderr', limits.maxStderrBytes, onOutputLimit, stderrCount);
  let stdout;
  if (stdoutMode === 'jsonl') {
    const decoder = jsonLineDecoder(limits.maxLineBytes, onOutputLimit);
    stdout = decoder;
    pipeline(child.stdout, stdoutLimiter, decoder, () => {});
  } else {
    stdout = stdoutLimiter;
    pipeline(child.stdout, stdoutLimiter, () => {});
  }
  const stderr = stderrLimiter;
  pipeline(child.stderr, stderrLimiter, () => {});
  stdout.on('error', () => {});
  stderr.on('error', () => {});

  return {
    get pid() { return child.pid ?? null; },
    generation,
    requestedAt,
    stdout,
    stderr,
    completion,
    write,
    endInput,
    stop: () => stopOwned('stopped'),
  };
}
