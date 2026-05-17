const fs = require("fs");
const os = require("os");
const path = require("path");

const APP_NAME = "sideklick";
const REPO_ROOT = path.resolve(__dirname, "..");
const SQLITE_PATH = path.join(REPO_ROOT, "sideklick.sqlite");

function getUserDataRoot() {
  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  }

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support");
  }

  return (
    process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
  );
}

function getPreferencesPath() {
  return path.join(getUserDataRoot(), APP_NAME, "preferences.json");
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function resetPreferences() {
  const preferencesPath = getPreferencesPath();
  const current = readJson(preferencesPath);
  const next = {
    ...current,
    hasLaunchedBefore: false,
  };

  delete next.managedAuth;
  writeJson(preferencesPath, next);
  return preferencesPath;
}

function maybeDeleteSqlite(fullReset) {
  if (!fullReset || !fs.existsSync(SQLITE_PATH)) {
    return false;
  }

  fs.unlinkSync(SQLITE_PATH);
  return true;
}

function printUsage() {
  console.log("Usage: node scripts/reset-first-launch.js [--full]");
  console.log("");
  console.log("  default  resets the first-launch flag in preferences.json");
  console.log("  --full   also deletes sideklick.sqlite in the repo root");
}

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    printUsage();
    return;
  }

  const fullReset = args.has("--full");
  const preferencesPath = resetPreferences();
  const deletedSqlite = maybeDeleteSqlite(fullReset);

  console.log(`Reset first-launch flag in: ${preferencesPath}`);
  if (fullReset) {
    console.log(
      deletedSqlite
        ? `Deleted SQLite state: ${SQLITE_PATH}`
        : `SQLite state not found: ${SQLITE_PATH}`,
    );
  } else {
    console.log("SQLite state left in place. Use --full to remove it too.");
  }
}

main();
