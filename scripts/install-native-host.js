#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function fail(message) {
  console.error(`[native-host] ${message}`);
  process.exit(1);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeExecutable(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
  fs.chmodSync(filePath, 0o755);
}

function resolveHostManifestDirectory(browserName) {
  if (process.platform === "darwin") {
    if (browserName === "chromium") {
      return path.join(os.homedir(), "Library", "Application Support", "Chromium", "NativeMessagingHosts");
    }

    return path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome", "NativeMessagingHosts");
  }

  if (process.platform === "linux") {
    if (browserName === "chromium") {
      return path.join(os.homedir(), ".config", "chromium", "NativeMessagingHosts");
    }

    return path.join(os.homedir(), ".config", "google-chrome", "NativeMessagingHosts");
  }

  fail("Windows auto-install is not implemented yet. Use Chrome registry host registration manually.");
}

const extensionId = process.argv[2];
const browserName = process.argv[3] || "chrome";
const verifyMode = process.argv.includes("--verify");

if (!verifyMode && (!extensionId || !/^[a-p]{32}$/.test(extensionId))) {
  fail("Usage: node scripts/install-native-host.js <extension_id> [chrome|chromium] [--verify]");
}

const repoRoot = path.resolve(__dirname, "..");
const hostScriptPath = path.join(repoRoot, "apps", "desktop", "native-host", "sideklick-native-host.js");
const templatePath = path.join(repoRoot, "apps", "desktop", "native-host", "manifests", "com.sideklick.desktop_bridge.template.json");
const launcherDirectory = path.join(os.homedir(), ".sideklick", "native-host");
const launcherPath = path.join(launcherDirectory, "sideklick-native-host-launcher.sh");

if (!fs.existsSync(hostScriptPath)) {
  fail(`Native host script not found at ${hostScriptPath}`);
}

if (!fs.existsSync(templatePath)) {
  fail(`Manifest template not found at ${templatePath}`);
}

const manifestDirectory = resolveHostManifestDirectory(browserName);
ensureDir(manifestDirectory);

const nodeBinaryPath = process.execPath;
ensureDir(launcherDirectory);
writeExecutable(
  launcherPath,
  `#!/bin/sh\nexec "${nodeBinaryPath}" "${hostScriptPath}" "$@"\n`,
);

const template = fs.readFileSync(templatePath, "utf8");
const manifestContents = template
  .replace("__HOST_PATH__", launcherPath)
  .replace("__EXTENSION_ID__", extensionId);

const outputPath = path.join(manifestDirectory, "com.sideklick.desktop_bridge.json");
fs.writeFileSync(outputPath, manifestContents, "utf8");

console.log(`[native-host] Installed manifest at ${outputPath}`);
console.log(`[native-host] Allowed extension origin: chrome-extension://${extensionId}/`);
console.log(`[native-host] Host launcher path: ${launcherPath}`);
console.log(`[native-host] Host script path: ${hostScriptPath}`);
console.log(`[native-host] Node binary path: ${nodeBinaryPath}`);

if (verifyMode) {
  const installed = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  const checks = [
    { label: "manifest file exists", ok: fs.existsSync(outputPath) },
    { label: "launcher file exists", ok: fs.existsSync(launcherPath) },
    { label: "host script exists", ok: fs.existsSync(hostScriptPath) },
    { label: "node binary exists", ok: fs.existsSync(nodeBinaryPath) },
    { label: "manifest path matches launcher", ok: installed.path === launcherPath },
  ];

  for (const check of checks) {
    console.log(`[native-host][verify] ${check.ok ? "ok" : "fail"}: ${check.label}`);
  }
}
