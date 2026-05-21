import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(command, ["run", "desktop:dev"], {
  stdio: "inherit",
  env: {
    ...process.env,
    SIDEKLICK_FORCE_LOCAL_BACKEND: "true",
    MANAGED_BACKEND_URL: "",
    MANAGED_BACKEND_JWT: "",
    LOCAL_API_BASE_URL:
      process.env.LOCAL_API_BASE_URL || "http://127.0.0.1:3001",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
