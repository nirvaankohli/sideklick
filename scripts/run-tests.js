const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const testFiles = readdirSync(join(__dirname, "..", "tests"))
  .filter((file) => file.endsWith(".test.js"))
  .sort()
  .map((file) => join("tests", file));

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...testFiles], {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
