// Test workers and their subprocesses must not load the owner's signing keys, hooks or editor.
process.env.GIT_CONFIG_GLOBAL = process.platform === "win32" ? "NUL" : "/dev/null";
process.env.GIT_CONFIG_NOSYSTEM = "1";
