import { fileURLToPath } from "node:url";

// Test workers and their subprocesses must not load the owner's signing keys, hooks or editor.
process.env.GIT_CONFIG_GLOBAL = fileURLToPath(new URL("./test-git.config", import.meta.url));
process.env.GIT_CONFIG_NOSYSTEM = "1";
