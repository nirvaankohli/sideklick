import { spawn } from "node:child_process";

const target = process.argv[2];

if (target !== "node" && target !== "electron") {
  console.error('[rebuild:native] expected target "node" or "electron"');
  process.exit(1);
}

const env = {
  ...process.env,
  npm_config_build_from_source: "true",
};

if (target === "electron") {
  env.npm_config_runtime = "electron";
  env.npm_config_target = "37.10.3";
  env.npm_config_disturl = "https://electronjs.org/headers";
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(pnpmCommand, ["rebuild", "better-sqlite3"], {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("[rebuild:native] failed to start pnpm rebuild", error);
  process.exit(1);
});
