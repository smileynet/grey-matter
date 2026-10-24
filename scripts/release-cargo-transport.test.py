#!/usr/bin/env python3
"""Test snapshot semantics without Linux mounts or registry access.

Usage: python3 scripts/release-cargo-transport.test.py (macOS/Linux, Git required).
"""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("transport", Path(__file__).with_name("release-cargo-transport.py"))
transport = importlib.util.module_from_spec(spec)
spec.loader.exec_module(transport)


class SnapshotTests(unittest.TestCase):
    def test_detached_git_needs_its_empty_refs_directory(self):
        env = {"PATH": os.environ["PATH"], "GIT_CONFIG_GLOBAL": "/dev/null", "GIT_CONFIG_NOSYSTEM": "1", "DO_NOT_TRACK": "1"}
        with tempfile.TemporaryDirectory(prefix="detached-snapshot-") as temporary:
            root = Path(temporary)
            source = root / "source"
            source.mkdir()
            (source / "input").write_text("fixture\n")
            def git(repo, *args):
                return subprocess.run(["git", "-c", "core.hooksPath=/dev/null", "-C", str(repo), *args], env=env, capture_output=True, text=True, check=True).stdout.strip()
            git(source, "init", "-q")
            git(source, "add", ".")
            git(source, "-c", "user.name=Probe", "-c", "user.email=probe@example.invalid", "commit", "-qm", "Fixture")
            branch = git(source, "symbolic-ref", "--short", "HEAD")
            candidate = git(source, "rev-parse", "HEAD")
            git(source, "checkout", "--detach", candidate)
            git(source, "branch", "-D", branch)
            snapshot = transport.inventory(source)
            self.assertEqual(snapshot[".git/refs"]["kind"], "directory")
            copy = root / "copy"
            copy.mkdir()
            for name, item in snapshot.items():
                if item["kind"] == "file":
                    path = copy / name
                    path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(source / name, path)
                    path.chmod(item["mode"])
            self.assertFalse((copy / ".git/refs").exists())
            with self.assertRaises(subprocess.CalledProcessError):
                git(copy, "rev-parse", "HEAD")
            for name, item in snapshot.items():
                if item["kind"] == "directory":
                    (copy / name).mkdir(parents=True, exist_ok=True)
                    (copy / name).chmod(item["mode"])
            self.assertEqual(git(copy, "rev-parse", "HEAD"), candidate)
            self.assertEqual(transport.inventory(copy), snapshot)

    def test_empty_directory_modes_survive_the_inventory(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "empty").mkdir(mode=0o700)
            self.assertEqual(transport.inventory(root), {"empty": {"kind": "directory", "mode": 0o700}})

    def test_symlink_targets_must_stay_in_the_candidate(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "input").write_text("fixture")
            (root / "inside").symlink_to("input")
            self.assertEqual(transport.inventory(root)["inside"], {"kind": "symlink", "target": "input"})
            (root / "escape").symlink_to("../outside")
            with self.assertRaisesRegex(RuntimeError, "escaping"):
                transport.inventory(root)


if __name__ == "__main__":
    result = unittest.TextTestRunner().run(unittest.defaultTestLoader.loadTestsFromTestCase(SnapshotTests))
    print(json.dumps({"status": "pass" if result.wasSuccessful() else "fail", "metrics": {"tests": result.testsRun}, "errors": [str(error) for _, error in result.errors + result.failures]}))
    raise SystemExit(0 if result.wasSuccessful() else 1)
