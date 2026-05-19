#!/usr/bin/env node

const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

function getSocketPath() {
  const explicit = process.env.SIDEKLICK_NATIVE_BRIDGE_SOCKET;
  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }

  if (process.platform === "win32") {
    return "\\\\.\\pipe\\sideklick-native-bridge";
  }

  return path.join(os.homedir(), ".sideklick", "native-bridge.sock");
}

function sendNativeMessage(message) {
  const raw = Buffer.from(JSON.stringify(message), "utf8");
  const header = Buffer.alloc(4);
  header.writeUInt32LE(raw.length, 0);
  process.stdout.write(Buffer.concat([header, raw]));
}

function fail(message) {
  sendNativeMessage({ ok: false, error: message });
}

function forwardToDesktop(payload) {
  return new Promise((resolve, reject) => {
    const socketPath = getSocketPath();
    const socket = net.createConnection(socketPath);

    let responseBuffer = "";
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("Timed out waiting for desktop response"));
    }, 5000);

    socket.setEncoding("utf8");

    socket.on("connect", () => {
      socket.write(`${JSON.stringify(payload)}\n`);
    });

    socket.on("data", (chunk) => {
      responseBuffer += chunk;
      const newlineIndex = responseBuffer.indexOf("\n");
      if (newlineIndex < 0) {
        return;
      }

      clearTimeout(timeout);
      const line = responseBuffer.slice(0, newlineIndex);
      socket.end();

      try {
        const parsed = JSON.parse(line);
        if (parsed?.ok) {
          resolve({ ok: true });
        } else {
          reject(new Error(parsed?.error || "Desktop bridge rejected payload"));
        }
      } catch {
        reject(new Error("Desktop bridge sent invalid response"));
      }
    });

    socket.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    socket.on("end", () => {
      clearTimeout(timeout);
    });
  });
}

let stdinBuffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  stdinBuffer = Buffer.concat([stdinBuffer, chunk]);

  while (stdinBuffer.length >= 4) {
    const messageLength = stdinBuffer.readUInt32LE(0);
    if (stdinBuffer.length < 4 + messageLength) {
      return;
    }

    const body = stdinBuffer.subarray(4, 4 + messageLength).toString("utf8");
    stdinBuffer = stdinBuffer.subarray(4 + messageLength);

    let message;
    try {
      message = JSON.parse(body);
    } catch {
      fail("Invalid native message JSON");
      continue;
    }

    forwardToDesktop(message)
      .then(() => sendNativeMessage({ ok: true }))
      .catch((error) => fail(error?.message || "Failed to reach desktop app"));
  }
});

process.stdin.on("error", () => {
  fail("Native host stdin error");
});
