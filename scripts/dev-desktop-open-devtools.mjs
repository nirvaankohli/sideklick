import { spawn } from "node:child_process";

const child = spawn(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["run", "desktop:dev"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      SIDEKLICK_OPEN_DEVTOOLS: "true",
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
