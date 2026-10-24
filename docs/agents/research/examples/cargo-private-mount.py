#!/usr/bin/env python3
"""Probe private source/output mounts on Linux; no Cargo upload or credentials.

Usage: sudo python3 docs/agents/research/examples/cargo-private-mount.py
Requires bubblewrap, Git and Linux memfd sealing. All writes use a disposable tree.
"""
import errno
import fcntl
import hashlib
import json
import os
from pathlib import Path
import platform
import select
import shutil
import stat
import subprocess
import sys
import tempfile


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
mountinfo = pathlib.Path('/proc/self/mountinfo').read_text()
mounts = [line for line in mountinfo.splitlines() if line.split()[4].startswith('/tmp/candidate') or line.split()[4] == '/tmp/target']
assert mounts and all('ro' in line.split()[5].split(',') for line in mounts if line.split()[4].startswith('/tmp/candidate'))
print(json.dumps({'phase': 'verified', 'head': head, 'inventory': inventory(), 'denials': denials, 'ordinaryBindFollowsHost': True, 'privateOutputUnchanged': True, 'mountinfo': mounts}), flush=True)
'''


def main():
    if len(sys.argv) != 1 or sys.platform != "linux":
        raise ValueError("usage: sudo python3 cargo-private-mount.py (Linux only)")
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
        def git(*args):
            return subprocess.check_output(["git", "-C", str(source), *args], env=env, text=True, stderr=subprocess.STDOUT).strip()
        git("init", "-q")
        git("add", ".")
        git("-c", "user.name=Probe", "-c", "user.email=probe@example.invalid", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "Fixture")
        expected = inventory(source)
        head = git("rev-parse", "HEAD")
        old_output = root / "old-output"
        old_output.write_text("original host output")
        arguments = [bwrap, "--unshare-user", "--unshare-pid", "--unshare-ipc", "--unshare-uts", "--die-with-parent", "--new-session", "--cap-drop", "ALL", "--ro-bind", "/", "/", "--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp", "--tmpfs", "/tmp/candidate", "--tmpfs", "/tmp/target", "--ro-bind", str(source / "source.txt"), "/tmp/source-control", "--ro-bind", str(old_output), "/tmp/output-control"]
        descriptors = []
        seal_checks = []
        seals = fcntl.F_SEAL_WRITE | fcntl.F_SEAL_GROW | fcntl.F_SEAL_SHRINK | fcntl.F_SEAL_SEAL
        child = None
        try:
            for directory in sorted(path for path in source.rglob("*") if path.is_dir()):
                arguments.extend(["--dir", "/tmp/candidate/" + str(directory.relative_to(source))])
            for relative, record in expected.items():
                path = source / relative
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
                seal_checks.append(relative)
                os.lseek(descriptor, 0, os.SEEK_SET)
                arguments.extend(["--perms", format(record["mode"], "o"), "--ro-bind-data", str(descriptor), "/tmp/candidate/" + relative])
            arguments.extend(["--remount-ro", "/tmp/candidate", "--clearenv", "--setenv", "PATH", "/usr/bin:/bin", "--setenv", "GIT_CONFIG_NOSYSTEM", "1", "--setenv", "GIT_CONFIG_GLOBAL", "/dev/null", "--setenv", "GIT_OPTIONAL_LOCKS", "0", "--setenv", "GIT_NO_REPLACE_OBJECTS", "1", "--chdir", "/tmp/candidate", "/usr/bin/python3", "-c", CHILD])
            child = subprocess.Popen(arguments, env=env, pass_fds=descriptors, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if not select.select([child.stdout], [], [], 20)[0]:
                raise TimeoutError("private mount readiness timed out")
            line = child.stdout.readline()
            if not line:
                raise RuntimeError("private mount setup failed: " + child.stderr.read())
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
            stdout, stderr = child.communicate("mutated\n", timeout=20)
            if child.returncode != 0:
                raise RuntimeError("private mount checks failed: " + stderr)
            result = json.loads(stdout)
            assert result["phase"] == "verified" and result["head"] == head and result["inventory"] == expected
            assert len(result["denials"]) == 6 and inventory(source) != expected
            return {"status": "pass", "metrics": {"filesSealed": len(seal_checks), "sourceWriteDenials": 6, "hostMutations": 7}, "errors": [], "kernel": platform.release(), "bubblewrap": subprocess.check_output([bwrap, "--version"], text=True).strip(), "uid": os.getuid(), "candidateSha": head, "inventorySha256": digest(json.dumps(expected, sort_keys=True).encode()), "result": result, "limits": ["Disposable text/Git fixture; no Cargo packaging, provider or upload integration", "No hostile root, ptrace, process replacement or mount-namespace entry claim", "Host runtime remains trusted through a read-only root bind", "Data-backed mounts copy sealed inputs; destination inodes do not inherit seals"]}
        finally:
            if child is not None and child.poll() is None:
                child.kill()
                child.communicate()
            for descriptor in descriptors:
                os.close(descriptor)


if __name__ == "__main__":
    try:
        print(json.dumps(main(), indent=2))
    except (OSError, ValueError, AssertionError, RuntimeError, subprocess.SubprocessError) as error:
        print(json.dumps({"status": "error", "metrics": {}, "errors": [str(error) or type(error).__name__]}))
        sys.exit(2)
