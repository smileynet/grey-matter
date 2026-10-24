#!/usr/bin/env python3
"""Probe private source/output mounts on Linux; no Cargo upload or credentials.

Usage: sudo python3 docs/agents/research/examples/cargo-private-mount.py [--cargo]
Requires bubblewrap, Git and Linux memfd sealing. All writes use a disposable tree.
"""
import errno
import fcntl
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import platform
import select
import shlex
import shutil
import stat
import subprocess
import sys
import tempfile
import threading


def digest(data):
    return hashlib.sha256(data).hexdigest()


def inventory(root):
    return {
        str(path.relative_to(root)): {
            "sha256": digest(path.read_bytes()),
            "mode": stat.S_IMODE(path.stat().st_mode),
        }
        for path in sorted(root.rglob("*")) if path.is_file()
    }


CHILD = r'''
import errno, hashlib, json, os, pathlib, stat, subprocess, sys
root = pathlib.Path('/tmp/candidate')
def inventory():
    return {str(p.relative_to(root)): {'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'mode': stat.S_IMODE(p.stat().st_mode)} for p in sorted(root.rglob('*')) if p.is_file()}
def git(*args):
    return subprocess.check_output(['/usr/bin/git', '-C', str(root), *args], text=True).strip()
before = inventory()
head = git('rev-parse', 'HEAD')
assert git('status', '--porcelain') == ''
target = pathlib.Path('/tmp/target/archive')
target.write_text('private output')
def cargo(*args):
    return subprocess.run([os.environ['PROBE_CARGO'], *args, '--registry', 'probe', '--locked', '--no-verify', '--target-dir', '/tmp/target'], cwd=root, text=True, capture_output=True, timeout=30)
if 'PROBE_CARGO' in os.environ:
    policy = json.loads(pathlib.Path('/tmp/policy.json').read_text())
    packaged = cargo('package')
    assert packaged.returncode == 0, packaged.stderr
    crate = pathlib.Path('/tmp/target/package/tkt-mount-fixture-0.0.1.crate')
    assert hashlib.sha256(crate.read_bytes()).hexdigest() == policy['sha256']
print(json.dumps({'phase': 'ready', 'head': head, 'inventory': before}), flush=True)
assert sys.stdin.readline().strip() == 'mutated'
denials = []
operations = {
    'rewrite': lambda: (root / 'source.txt').write_text('child mutation'),
    'create': lambda: (root / 'new.txt').write_text('child mutation'),
    'rename': lambda: (root / 'rename.txt').rename(root / 'renamed.txt'),
    'unlink': lambda: (root / 'replace.txt').unlink(),
    'chmod': lambda: (root / 'source.txt').chmod(0o777),
    'git-head': lambda: (root / '.git/HEAD').write_text('child mutation'),
}
for name, operation in operations.items():
    try:
        operation()
    except OSError as error:
        assert error.errno == errno.EROFS, (name, error.errno)
        denials.append({'operation': name, 'errno': error.errno})
    else:
        raise AssertionError('source mutation succeeded: ' + name)
assert inventory() == before
assert git('rev-parse', 'HEAD') == head
assert git('status', '--porcelain') == ''
assert pathlib.Path('/tmp/source-control').read_text() == 'host rewrite'
assert pathlib.Path('/tmp/output-control').read_text() == 'host output rewrite'
assert target.read_text() == 'private output'
target.write_text('private output remains writable')
upload = None
if 'PROBE_CARGO' in os.environ:
    assert hashlib.sha256(crate.read_bytes()).hexdigest() == policy['sha256']
    published = cargo('publish')
    assert published.returncode == 101 and 'Local capture deliberately refused' in published.stderr, published.stderr
    upload = {'cargoExit': published.returncode, 'sealedSha256': policy['sha256'], 'repackagedSha256': hashlib.sha256(crate.read_bytes()).hexdigest(), 'stderr': published.stderr}
    assert upload['repackagedSha256'] == policy['sha256']
    assert inventory() == before and git('rev-parse', 'HEAD') == head
mountinfo = pathlib.Path('/proc/self/mountinfo').read_text()
mounts = [line for line in mountinfo.splitlines() if line.split()[4].startswith('/tmp/candidate') or line.split()[4] == '/tmp/target']
assert mounts and all('ro' in line.split()[5].split(',') for line in mounts if line.split()[4].startswith('/tmp/candidate'))
print(json.dumps({'phase': 'verified', 'head': head, 'inventory': inventory(), 'denials': denials, 'ordinaryBindFollowsHost': True, 'privateOutputUnchanged': True, 'mountinfo': mounts, 'cargo': upload}), flush=True)
'''


def main():
    if sys.argv[1:] not in [[], ["--cargo"]] or sys.platform != "linux":
        raise ValueError("usage: sudo python3 cargo-private-mount.py [--cargo] (Linux only)")
    cargo_mode = sys.argv[1:] == ["--cargo"]
    bwrap = shutil.which("bwrap")
    if not bwrap:
        raise ValueError("bubblewrap is required; no weaker fallback is permitted")
    env = {"PATH": "/usr/bin:/bin", "LANG": "C", "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": "/dev/null", "GIT_OPTIONAL_LOCKS": "0", "GIT_NO_REPLACE_OBJECTS": "1"}
    with tempfile.TemporaryDirectory(prefix="cargo-private-mount-") as temporary:
        root = Path(temporary)
        source = root / "source"
        source.mkdir()
        for name in ["source.txt", "replace.txt", "rename.txt"]:
            (source / name).write_text("original " + name)
        server = None
        captures = []
        extra_mounts = []
        cargo_version = None
        if cargo_mode:
            if any(not os.environ.get(key) for key in ["PROBE_CARGO", "PROBE_RUSTC", "PROBE_NODE"]):
                raise ValueError("PROBE_CARGO, PROBE_RUSTC and PROBE_NODE are required")
            cargo_path = Path(os.environ["PROBE_CARGO"])
            rustc_path = Path(os.environ["PROBE_RUSTC"])
            node_path = Path(os.environ["PROBE_NODE"])
            if not all(path.is_absolute() and path.is_file() for path in [cargo_path, rustc_path, node_path]):
                raise ValueError("PROBE_CARGO, PROBE_RUSTC and PROBE_NODE require absolute executable paths")
            cargo_version = subprocess.check_output([str(cargo_path), "--version"], text=True).strip()
            if not cargo_version.startswith("cargo 1.99.1 "):
                raise ValueError("Cargo 1.99.1 is required for the source-audited checksum boundary")
            class Capture(BaseHTTPRequestHandler):
                def log_message(self, *_args):
                    pass

                def do_GET(self):
                    if self.path != "/index/config.json":
                        self.send_error(404)
                        return
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"api": f"http://127.0.0.1:{server.server_port}", "dl": f"http://127.0.0.1:{server.server_port}/download"}).encode())

                def do_PUT(self):
                    self.connection.settimeout(5)
                    length = int(self.headers.get("Content-Length", "0"))
                    if self.path != "/api/v1/crates/new" or not 8 <= length <= 2 * 1024 * 1024:
                        self.send_error(400)
                        return
                    body = self.rfile.read(length)
                    metadata_end = 4 + int.from_bytes(body[:4], "little")
                    if len(body) != length or not 4 <= metadata_end <= length - 4 or metadata_end + 4 + int.from_bytes(body[metadata_end:metadata_end + 4], "little") != length:
                        self.send_error(400)
                        return
                    crate_bytes = body[metadata_end + 4:]
                    captures.append({"sha256": digest(crate_bytes), "size": len(crate_bytes), "dummyAuthorizationMatched": self.headers.get("Authorization") == "local-probe-only"})
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(b'{"errors":[{"detail":"Local capture deliberately refused"}]}')

            server = ThreadingHTTPServer(("127.0.0.1", 0), Capture)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            index = f"sparse+http://127.0.0.1:{server.server_port}/index/"
            (source / "src").mkdir()
            (source / "src/main.rs").write_text("fn main() {}\n")
            (source / "Cargo.toml").write_text('[package]\nname="tkt-mount-fixture"\nversion="0.0.1"\nedition="2021"\npublish=["probe"]\ninclude=["/src/**","/Cargo.toml","/Cargo.lock"]\n')
            (source / ".probe").mkdir()
            provider = Path(__file__).resolve().parents[4] / "scripts/release-cargo-credentials.mjs"
            (source / ".probe/provider.mjs").write_bytes(provider.read_bytes())
            (source / ".probe/provider").write_text("#!/bin/sh\nexec " + shlex.quote(str(node_path)) + " /tmp/candidate/.probe/provider.mjs \"$@\"\n")
            (source / ".probe/provider").chmod(0o755)
            home = root / "home"
            home.mkdir()
            config = root / "config.toml"
            config.write_text("[registries.probe]\nindex = " + json.dumps(index) + "\ncredential-provider = [\"/tmp/candidate/.probe/provider\"]\n")
            (home / "config.toml").write_text("[registries.probe]\nindex = " + json.dumps(index) + "\n")
            env.update({"CARGO_HOME": str(home), "HOME": str(home), "RUSTC": str(rustc_path), "CARGO_HTTP_PROXY": "", "NO_PROXY": "127.0.0.1"})
            subprocess.run([str(cargo_path), "generate-lockfile", "--offline"], cwd=source, env=env, check=True, capture_output=True, timeout=30)
        def git(*args):
            return subprocess.check_output(["git", "-C", str(source), *args], env=env, text=True, stderr=subprocess.STDOUT).strip()
        git("init", "-q")
        git("add", ".")
        git("-c", "user.name=Probe", "-c", "user.email=probe@example.invalid", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "Fixture")
        if cargo_mode:
            subprocess.run([str(cargo_path), "package", "--registry", "probe", "--locked", "--no-verify", "--target-dir", str(root / "host-target")], cwd=source, env=env, check=True, capture_output=True, timeout=30)
            sealed = (root / "host-target/package/tkt-mount-fixture-0.0.1.crate").read_bytes()
            policy = root / "policy.json"
            policy.write_text(json.dumps({"name": "tkt-mount-fixture", "version": "0.0.1", "sha256": digest(sealed), "index": index}))
            extra_mounts = [(policy, "/tmp/policy.json"), (config, "/tmp/cargo-home/config.toml")]
        expected = inventory(source)
        head = git("rev-parse", "HEAD")
        old_output = root / "old-output"
        old_output.write_text("original host output")
        arguments = [bwrap, "--unshare-user", "--unshare-pid", "--unshare-ipc", "--unshare-uts", "--die-with-parent", "--new-session", "--cap-drop", "ALL", "--ro-bind", "/", "/", "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp", "--tmpfs", "/tmp/candidate", "--tmpfs", "/tmp/target", "--ro-bind", str(source / "source.txt"), "/tmp/source-control", "--ro-bind", str(old_output), "/tmp/output-control"]
        if cargo_mode:
            arguments.extend(["--tmpfs", "/tmp/cargo-home"])
        descriptors = []
        seal_checks = []
        seals = fcntl.F_SEAL_WRITE | fcntl.F_SEAL_GROW | fcntl.F_SEAL_SHRINK | fcntl.F_SEAL_SEAL
        child = None
        try:
            for directory in sorted(path for path in source.rglob("*") if path.is_dir()):
                arguments.extend(["--dir", "/tmp/candidate/" + str(directory.relative_to(source))])
            inputs = [(source / relative, record, "/tmp/candidate/" + relative) for relative, record in expected.items()]
            inputs.extend((path, {"mode": 0o444, "sha256": digest(path.read_bytes())}, destination) for path, destination in extra_mounts)
            for path, record, destination in inputs:
                if path.is_symlink():
                    raise ValueError("this fixture contains only regular files")
                descriptor = os.memfd_create("verified-input", os.MFD_ALLOW_SEALING | os.MFD_CLOEXEC)
                descriptors.append(descriptor)
                data = path.read_bytes()
                with os.fdopen(os.dup(descriptor), "wb") as stream:
                    stream.write(data)
                os.fchmod(descriptor, record["mode"])
                fcntl.fcntl(descriptor, fcntl.F_ADD_SEALS, seals)
                assert fcntl.fcntl(descriptor, fcntl.F_GET_SEALS) & seals == seals
                assert digest(os.pread(descriptor, len(data), 0)) == record["sha256"]
                for operation in [lambda: os.write(descriptor, b"x"), lambda: os.ftruncate(descriptor, 0), lambda: os.ftruncate(descriptor, len(data) + 1)]:
                    try:
                        operation()
                    except OSError as error:
                        assert error.errno == errno.EPERM
                    else:
                        raise AssertionError("sealed input was writable")
                seal_checks.append(destination)
                os.lseek(descriptor, 0, os.SEEK_SET)
                arguments.extend(["--perms", format(record["mode"], "o"), "--ro-bind-data", str(descriptor), destination])
            arguments.extend(["--remount-ro", "/tmp/candidate", "--clearenv", "--setenv", "PATH", "/usr/bin:/bin", "--setenv", "GIT_CONFIG_NOSYSTEM", "1", "--setenv", "GIT_CONFIG_GLOBAL", "/dev/null", "--setenv", "GIT_OPTIONAL_LOCKS", "0", "--setenv", "GIT_NO_REPLACE_OBJECTS", "1"])
            if cargo_mode:
                for key, value in {"PROBE_CARGO": str(cargo_path), "RUSTC": str(rustc_path), "HOME": "/tmp/cargo-home", "CARGO_HOME": "/tmp/cargo-home", "CARGO_HTTP_PROXY": "", "NO_PROXY": "127.0.0.1", "RELEASE_CARGO_POLICY": "/tmp/policy.json", "RELEASE_CARGO_TOKEN": "local-probe-only"}.items():
                    arguments.extend(["--setenv", key, value])
            arguments.extend(["--chdir", "/tmp/candidate", "/usr/bin/python3", "-c", CHILD])
            child = subprocess.Popen(arguments, env=env, pass_fds=descriptors, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if not select.select([child.stdout], [], [], 20)[0]:
                raise TimeoutError("private mount readiness timed out")
            line = child.stdout.readline()
            if not line:
                _, stderr = child.communicate(timeout=5)
                raise RuntimeError("private mount setup failed: " + stderr)
            ready = json.loads(line)
            assert ready == {"phase": "ready", "head": head, "inventory": expected}
            # These operate on the original inodes and paths while the child is paused.
            (source / "source.txt").write_text("host rewrite")
            (source / "replacement").write_text("host replacement")
            (source / "replacement").replace(source / "replace.txt")
            (source / "rename.txt").rename(source / "host-renamed.txt")
            (source / "host-added.txt").write_text("host addition")
            (source / ".git/HEAD").write_text("host changed Git identity")
            old_output.write_text("host output rewrite")
            if cargo_mode:
                (source / "src/main.rs").write_text('fn main() { println!("host mutation"); }\n')
                (root / "host-target/package/tkt-mount-fixture-0.0.1.crate").write_bytes(b"corrupt host output")
            stdout, stderr = child.communicate("mutated\n", timeout=20)
            if child.returncode != 0:
                raise RuntimeError("private mount checks failed: " + stderr)
            result = json.loads(stdout)
            assert result["phase"] == "verified" and result["head"] == head and result["inventory"] == expected
            assert len(result["denials"]) == 6 and inventory(source) != expected
            if cargo_mode:
                assert len(captures) == 1 and captures[0]["sha256"] == digest(sealed) and captures[0]["size"] == len(sealed) and captures[0]["dummyAuthorizationMatched"]
            return {"status": "pass", "metrics": {"filesSealed": len(seal_checks), "sourceWriteDenials": 6, "hostMutations": 9 if cargo_mode else 7, "puts": len(captures)}, "errors": [], "kernel": platform.release(), "bubblewrap": subprocess.check_output([bwrap, "--version"], text=True).strip(), "uid": os.getuid(), "cargoVersion": cargo_version, "candidateSha": head, "inventorySha256": digest(json.dumps(expected, sort_keys=True).encode()), "result": result, "captures": captures, "limits": ["Disposable dependency-free fixture; actual tkt dependencies and production transport lifecycle remain untested", "Dummy credential and localhost refusing capture only; no real registry publication", "No hostile root, ptrace, process replacement or mount-namespace entry claim", "Host runtime remains trusted through a read-only root bind", "Data-backed mounts copy sealed inputs; destination inodes do not inherit seals"]}
        finally:
            if child is not None and child.poll() is None:
                child.kill()
                child.communicate()
            for descriptor in descriptors:
                os.close(descriptor)
            if server is not None:
                server.shutdown()
                server.server_close()


if __name__ == "__main__":
    try:
        print(json.dumps(main(), indent=2))
    except (OSError, ValueError, AssertionError, RuntimeError, subprocess.SubprocessError) as error:
        print(json.dumps({"status": "error", "metrics": {}, "errors": [str(error) or type(error).__name__]}))
        sys.exit(2)
