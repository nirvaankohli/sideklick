import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const rootDir = process.cwd();
const desktopSrcDir = path.join(rootDir, "apps", "desktop", "src");
const distDesktopDir = path.join(rootDir, "dist", "desktop");

async function resetDistDirectory() {
  await fs.rm(distDesktopDir, { recursive: true, force: true });
  await fs.mkdir(distDesktopDir, { recursive: true });
}

async function bundleMainProcess() {
  await build({
    entryPoints: [path.join(desktopSrcDir, "main.js")],
    outfile: path.join(distDesktopDir, "main.cjs"),
    bundle: true,
    format: "cjs",
    platform: "node",
    target: "node20",
    external: ["electron", "better-sqlite3", "pdf-parse"],
    define: {
      "process.env.SIDEKLICK_DISABLE_TSX_LOADER": "\"true\"",
    },
    loader: {
      ".ts": "ts",
    },
    sourcemap: false,
    logLevel: "info",
  });
}

async function copyRuntimeFiles() {
  const copyPlan = [
    [path.join(desktopSrcDir, "preload.js"), path.join(distDesktopDir, "preload.js")],
    [path.join(desktopSrcDir, "renderer.js"), path.join(distDesktopDir, "renderer.js")],
    [path.join(desktopSrcDir, "home.js"), path.join(distDesktopDir, "home.js")],
    [path.join(desktopSrcDir, "onboarding.js"), path.join(distDesktopDir, "onboarding.js")],
    [path.join(desktopSrcDir, "styles.css"), path.join(distDesktopDir, "styles.css")],
    [path.join(desktopSrcDir, "index.html"), path.join(distDesktopDir, "index.html")],
    [path.join(desktopSrcDir, "home.html"), path.join(distDesktopDir, "home.html")],
    [path.join(desktopSrcDir, "onboarding.html"), path.join(distDesktopDir, "onboarding.html")],
    [path.join(desktopSrcDir, "click_function.json"), path.join(distDesktopDir, "click_function.json")],
    [path.join(desktopSrcDir, "main"), path.join(distDesktopDir, "main")],
    [path.join(rootDir, "apps", "desktop", "assets"), path.join(rootDir, "dist", "assets")],
    [path.join(rootDir, "apps", "desktop", "native-host"), path.join(rootDir, "dist", "native-host")],
  ];

  await Promise.all(
    copyPlan.map(async ([from, to]) => {
      await fs.cp(from, to, { recursive: true });
    }),
  );
}

async function main() {
  await resetDistDirectory();
  await bundleMainProcess();
  await copyRuntimeFiles();
  console.log("[desktop:build] wrote dist/desktop");
}

main().catch((error) => {
  console.error("[desktop:build] failed", error);
  process.exitCode = 1;
});
