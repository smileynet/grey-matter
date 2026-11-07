---
id: "264"
title: "deploy.mjs cannot run the kirocrew CLI on Windows, so Kiro Crew apps are built but never installed"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "With Kiro Crew's bin directory on PATH, node scripts/deploy.mjs installs/enables the app (or reports the trust refusal) instead of printing 'kirocrew not on PATH'"
  - "Change lands in the vendored deployer and is synced to tkt with sync-release-tools --deployer --write"
  - "deploy.test.mjs fake-kirocrew fixture covers a .cmd shim on win32"
tags: ["kind:bug", "stream:tooling"]
---
Found in the 2026-11-06 sync. Kiro Crew ships its CLI as resources/backend-dist/kirocrew-backend/bin/kirocrew.cmd (runs bundled python -m kiro_crew); the Scripts/kirocrew.exe launcher beside it exits 1 with no output. scripts/deploy.mjs kirocrewDeploy calls spawnSync('kirocrew', ...) without a shell, which on Windows only resolves .exe/.com, so it gets ENOENT even with bin on PATH and prints 'kirocrew not on PATH; built only'. Resolve kirocrew.cmd on win32 (shell or explicit cmd.exe /c with safe quoting), or accept a KIROCREW_BIN override. Manual install via the .cmd works; enable then stops at Kiro Crew's third-party execution policy (owner trust in Settings, agent.apps_trusted), which the deployer should report as pending.