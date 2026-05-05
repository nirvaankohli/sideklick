const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadBridgeModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "src", "main", "bridge.ts")).href
  );
}

function createAuthHeaders({
  token = "test-token",
  nonce = "nonce-1234567890abcd",
  timestamp = Date.now(),
} = {}) {
  return {
    "Content-Type": "application/json",
    "x-sideclick-token": token,
    "x-sideclick-nonce": nonce,
    "x-sideclick-timestamp": String(timestamp),
  };
}

test("incoming message bridge normalizes a payload and dispatches it", async () => {
  const { createIncomingMessageBridge } = await loadBridgeModule();
  const dispatched = [];
  const logs = [];
  const bridge = createIncomingMessageBridge({
    authToken: "test-token",
    host: "127.0.0.1",
    port: 0,
    dispatchIncomingPayload(payload) {
      dispatched.push(payload);
    },
    log: {
      log(message) {
        logs.push(message);
      },
      error() {},
    },
  });

  const server = bridge.start();
  await once(server, "listening");
  const address = server.address();
  assert.equal(typeof address.port, "number");

  const response = await fetch(`http://127.0.0.1:${address.port}`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: JSON.stringify({
      actionType: "explain",
      selectedText: "hello",
      surroundingText: "context",
      pageTitle: "Page",
      pageUrl: "https://example.com",
      userNote: "note",
      screenshotDataUrl: "data:image/png;base64,abc",
      click_function: "restore-window",
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(dispatched, [
    {
      action_type: "explain",
      selected_text: "hello",
      surrounding_text: "context",
      page_title: "Page",
      page_url: "https://example.com",
      user_note: "note",
      screenshot_data_url: "data:image/png;base64,abc",
      click_function: "restore-window",
    },
  ]);
  assert.equal(logs.length, 1);

  bridge.stop();
  await once(server, "close");
});

test("incoming message bridge rejects non-POST requests and invalid JSON", async () => {
  const { createIncomingMessageBridge } = await loadBridgeModule();
  const bridge = createIncomingMessageBridge({
    authToken: "test-token",
    host: "127.0.0.1",
    port: 0,
    dispatchIncomingPayload() {
      throw new Error("dispatch should not run");
    },
    log: {
      log() {},
      error() {},
    },
  });

  const server = bridge.start();
  await once(server, "listening");
  const address = server.address();

  const methodResponse = await fetch(`http://127.0.0.1:${address.port}`);
  assert.equal(methodResponse.status, 405);
  assert.deepEqual(await methodResponse.json(), {
    ok: false,
    error: "Method not allowed",
  });

  const invalidJsonResponse = await fetch(`http://127.0.0.1:${address.port}`, {
    method: "POST",
    headers: createAuthHeaders(),
    body: "{not-json",
  });
  assert.equal(invalidJsonResponse.status, 400);
  assert.deepEqual(await invalidJsonResponse.json(), {
    ok: false,
    error: "Invalid JSON payload",
  });

  bridge.stop();
  await once(server, "close");
});

test("incoming message bridge rejects missing auth, replayed nonces, stale timestamps, and invalid payloads", async () => {
  const { createIncomingMessageBridge } = await loadBridgeModule();
  const dispatched = [];
  const bridge = createIncomingMessageBridge({
    authToken: "test-token",
    host: "127.0.0.1",
    port: 0,
    dispatchIncomingPayload(payload) {
      dispatched.push(payload);
    },
    log: {
      log() {},
      error() {},
    },
    allowedTimestampSkewMs: 1000,
  });

  const server = bridge.start();
  await once(server, "listening");
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}`;

  const unauthorizedResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sideclick-nonce": "nonce-unauthorized-1234",
      "x-sideclick-timestamp": String(Date.now()),
    },
    body: JSON.stringify({ action_type: "chat", selected_text: "" }),
  });
  assert.equal(unauthorizedResponse.status, 401);
  assert.deepEqual(await unauthorizedResponse.json(), {
    ok: false,
    error: "Unauthorized caller",
  });

  const staleResponse = await fetch(url, {
    method: "POST",
    headers: createAuthHeaders({
      timestamp: Date.now() - 5000,
      nonce: "nonce-stale-123456789",
    }),
    body: JSON.stringify({ action_type: "chat", selected_text: "" }),
  });
  assert.equal(staleResponse.status, 401);
  assert.deepEqual(await staleResponse.json(), {
    ok: false,
    error: "Expired request timestamp",
  });

  const firstValidResponse = await fetch(url, {
    method: "POST",
    headers: createAuthHeaders({
      nonce: "nonce-replay-123456789",
    }),
    body: JSON.stringify({ action_type: "chat", selected_text: "" }),
  });
  assert.equal(firstValidResponse.status, 200);

  const replayResponse = await fetch(url, {
    method: "POST",
    headers: createAuthHeaders({
      nonce: "nonce-replay-123456789",
    }),
    body: JSON.stringify({ action_type: "chat", selected_text: "" }),
  });
  assert.equal(replayResponse.status, 409);
  assert.deepEqual(await replayResponse.json(), {
    ok: false,
    error: "Replay detected for nonce",
  });

  const invalidPayloadResponse = await fetch(url, {
    method: "POST",
    headers: createAuthHeaders({
      nonce: "nonce-invalid-payload-123",
    }),
    body: JSON.stringify({
      action_type: "chat",
      selected_text: "",
      page_url: "not-a-url",
    }),
  });
  assert.equal(invalidPayloadResponse.status, 400);
  assert.deepEqual(await invalidPayloadResponse.json(), {
    ok: false,
    error: "Invalid bridge payload",
  });

  assert.equal(dispatched.length, 1);

  bridge.stop();
  await once(server, "close");
});

test("incoming message bridge start is idempotent", async () => {
  const { createIncomingMessageBridge } = await loadBridgeModule();
  const bridge = createIncomingMessageBridge({
    authToken: "test-token",
    host: "127.0.0.1",
    port: 0,
    dispatchIncomingPayload() {},
    log: {
      log() {},
      error() {},
    },
  });

  const firstServer = bridge.start();
  const secondServer = bridge.start();
  assert.equal(firstServer, secondServer);

  await once(firstServer, "listening");
  bridge.stop();
  await once(firstServer, "close");
});
