const { execFileSync } = require("child_process");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const TARGET_PORTS = [3001, 4353];
const TARGET_COMMAND_SNIPPETS = [
  `${REPO_ROOT}/node_modules/.bin/electron .`,
  `${REPO_ROOT}/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron .`,
];

function runCommand(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (error) {
    return error && typeof error.stdout === "string" ? error.stdout : "";
  }
}

function collectRepoProcessIds() {
  const output = runCommand("ps", ["-ax", "-o", "pid=,ppid=,command="]);
  const pids = new Set();

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const match = trimmed.match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!match) {
      continue;
    }

    const [, pidText, ppidText, command] = match;
    if (
      TARGET_COMMAND_SNIPPETS.some((snippet) => command.includes(snippet))
    ) {
      pids.add(Number(pidText));
      pids.add(Number(ppidText));
    }
  }

  return pids;
}

function collectPortOwnerIds() {
  const pids = new Set();

  for (const port of TARGET_PORTS) {
    const output = runCommand("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"]);
    for (const line of output.split("\n").slice(1)) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      const columns = trimmed.split(/\s+/);
      const pid = Number(columns[1]);
      if (Number.isFinite(pid)) {
        pids.add(pid);
      }
    }
  }

  return pids;
}

function killProcesses(pids) {
  const numericPids = [...pids].filter((pid) => Number.isInteger(pid) && pid > 1);
  if (numericPids.length === 0) {
    console.log("No SideKlick processes found.");
    return;
  }

  execFileSync("kill", numericPids.map(String), { stdio: "ignore" });
  console.log(`Stopped SideKlick processes: ${numericPids.join(", ")}`);
}

function main() {
  const pids = new Set([
    ...collectRepoProcessIds(),
    ...collectPortOwnerIds(),
  ]);
  killProcesses(pids);
}

main();
