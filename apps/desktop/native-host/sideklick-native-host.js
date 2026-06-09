#!/usr/bin/env node

const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");

function resolveBridgeAuthModulePath() {
  const candidates = [
    path.resolve(__dirname, "../src/main/bridge-auth.cjs"),
    path.resolve(__dirname, "../desktop/main/bridge-auth.cjs"),
  ];

  for (const candidatePath of candidates) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error("Could not locate bridge-auth.cjs for native host.");
}

const {
  MAX_BRIDGE_MESSAGE_BYTES,
  createEnvelope,
  readBridgeSecret,
  resolveBridgeSocketPath,
} = require(resolveBridgeAuthModulePath());

function getSocketPath() {
  const explicit = process.env.SIDEKLICK_NATIVE_BRIDGE_SOCKET;
  return resolveBridgeSocketPath(explicit);
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
    const secret = readBridgeSecret();
    if (!secret) {
      reject(new Error("Desktop bridge secret is missing."));
      return;
    }

    const socketPath = getSocketPath();
    const socket = net.createConnection(socketPath);

    let responseBuffer = "";
    let responseBytes = 0;
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("Timed out waiting for desktop response"));
    }, 5000);

    socket.setEncoding("utf8");

    socket.on("connect", () => {
      try {
        const envelope = createEnvelope({ payload, secret });
        const rawEnvelope = JSON.stringify(envelope);
        if (Buffer.byteLength(rawEnvelope, "utf8") > MAX_BRIDGE_MESSAGE_BYTES) {
          throw new Error("Bridge payload exceeds 1 MiB limit");
        }
        socket.write(`${rawEnvelope}\n`);
      } catch (error) {
        clearTimeout(timeout);
        socket.destroy();
        reject(error instanceof Error ? error : new Error("Failed to sign bridge envelope"));
      }
    });

    socket.on("data", (chunk) => {
      responseBytes += Buffer.byteLength(chunk, "utf8");
      if (responseBytes > MAX_BRIDGE_MESSAGE_BYTES) {
        clearTimeout(timeout);
        socket.destroy();
        reject(new Error("Desktop bridge response exceeded 1 MiB limit"));
        return;
      }

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

  if (stdinBuffer.length > MAX_BRIDGE_MESSAGE_BYTES + 4) {
    stdinBuffer = Buffer.alloc(0);
    fail("Native host input exceeded 1 MiB limit");
    return;
  }

  while (stdinBuffer.length >= 4) {
    const messageLength = stdinBuffer.readUInt32LE(0);
    if (messageLength > MAX_BRIDGE_MESSAGE_BYTES) {
      stdinBuffer = Buffer.alloc(0);
      fail("Native host input exceeded 1 MiB limit");
      return;
    }

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
