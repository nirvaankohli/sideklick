import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2];

if (target !== "node" && target !== "electron") {
  console.error('[rebuild:native] expected target "node" or "electron"');
  process.exit(1);
}

const env = {
  ...process.env,
  npm_config_build_from_source: "true",
};

function getElectronTargetVersion() {
  const installedPackagePath = path.join(
    process.cwd(),
    "node_modules",
    "electron",
    "package.json",
  );

  try {
    const installedPackage = JSON.parse(
      fs.readFileSync(installedPackagePath, "utf8"),
    );
    if (typeof installedPackage.version === "string" && installedPackage.version.trim()) {
      return installedPackage.version.trim();
    }
  } catch {
    // fall through to package.json fallback
  }

  const rootPackagePath = path.join(process.cwd(), "package.json");
  const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"));
  const rawVersion =
    rootPackage?.devDependencies?.electron ??
    rootPackage?.dependencies?.electron ??
    "";

  if (typeof rawVersion !== "string" || !rawVersion.trim()) {
    throw new Error("[rebuild:native] Could not determine Electron target version.");
  }

  return rawVersion.trim().replace(/^[~^]/, "");
}

if (target === "electron") {
  env.npm_config_runtime = "electron";
  env.npm_config_target = getElectronTargetVersion();
  env.npm_config_disturl = "https://electronjs.org/headers";
}

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(pnpmCommand, ["rebuild", "better-sqlite3"], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
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
