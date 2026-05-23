const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { EventEmitter } = require("node:events");
const { once } = require("node:events");
const path = require("node:path");
const { PassThrough } = require("node:stream");
const { importModule } = require("./helpers/import-module");

async function loadBridgeModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "desktop", "src", "main", "bridge.ts")
  );
}

function createFakeServerFactory() {
  let latestServer = null;

  function createServer(handler) {
    const events = new EventEmitter();
    let closed = false;
    let listenCount = 0;
    const server = {
      on(eventName, callback) {
        events.on(eventName, callback);
        return server;
      },
      once(eventName, callback) {
        events.once(eventName, callback);
        return server;
      },
      listen(_port, _host, callback) {
        listenCount += 1;
        if (typeof callback === "function") {
          callback();
        }
        queueMicrotask(() => {
          events.emit("listening");
        });
        return server;
      },
      close(callback) {
        closed = true;
        if (typeof callback === "function") {
          callback();
        }
        queueMicrotask(() => {
          events.emit("close");
        });
        return server;
      },
      address() {
        return {
          address: "127.0.0.1",
          family: "IPv4",
          port: 4353,
        };
      },
      get listenCount() {
        return listenCount;
      },
      get closed() {
        return closed;
      },
      async dispatch({
        method = "POST",
        headers = {},
        url = "/",
        body = "",
      } = {}) {
        const request = new PassThrough();
        request.method = method;
        request.url = url;
        request.headers = Object.fromEntries(
          Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), value]),
        );

        const responseEvents = new EventEmitter();
        const chunks = [];
        const response = {
          statusCode: 200,
          headers: {},
          setHeader(name, value) {
            this.headers[String(name).toLowerCase()] = value;
          },
          end(chunk = "") {
            if (chunk) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
            }
            queueMicrotask(() => {
              responseEvents.emit("finish");
            });
          },
          on(eventName, callback) {
            responseEvents.on(eventName, callback);
            return this;
          },
        };

        const responseFinished = once(responseEvents, "finish");
        void handler(request, response);
        if (body) {
          request.write(body);
        }
        request.end();
        await responseFinished;

        return {
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks).toString("utf8"),
          json() {
            return JSON.parse(this.body || "{}");
          },
        };
      },
    };

    latestServer = server;
    return server;
  }

  return {
    createServer,
    getLatestServer() {
      return latestServer;
    },
  };
}

function createSignature({
  secret = "test-secret",
  method = "POST",
  pathname = "/",
  expires,
  nonce = "nonce-1234567890abcd",
  body = "",
} = {}) {
  return crypto
    .createHmac("sha256", secret)
    .update([method.toUpperCase(), pathname, String(expires), nonce, body].join("\n"))
    .digest("hex");
}

function createAuthHeaders({
  secret = "test-secret",
  nonce = "nonce-1234567890abcd",
  expires = Date.now() + 30_000,
  body = "",
} = {}) {
  return {
    "Content-Type": "application/json",
    "x-sideclick-nonce": nonce,
    "x-sideclick-expires": String(expires),
    "x-sideclick-signature": createSignature({
      secret,
      nonce,
      expires,
      body,
    }),
  };
}

test("incoming message bridge normalizes a payload and dispatches it", async () => {
  const { createIncomingMessageBridge } = await loadBridgeModule();
  const dispatched = [];
  const logs = [];
  const fakeServerFactory = createFakeServerFactory();
  const bridge = createIncomingMessageBridge({
    authSecret: "test-secret",
    host: "127.0.0.1",
    port: 4353,
    dispatchIncomingPayload(payload) {
      dispatched.push(payload);
    },
    log: {
      log(message) {
        logs.push(message);
      },
      error() {},
    },
    createServer: fakeServerFactory.createServer,
  });

  const server = bridge.start();
  await once(server, "listening");
  const address = server.address();
  assert.equal(typeof address.port, "number");
  const requestBody = JSON.stringify({
    actionType: "explain",
    selectedText: "hello",
    surroundingText: "context",
    pageTitle: "Page",
    pageUrl: "https://example.com",
    userNote: "note",
    screenshotDataUrl: "data:image/png;base64,abc",
    click_function: "restore-window",
  });

  const response = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({ body: requestBody }),
    body: requestBody,
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.json(), { ok: true });
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
  const fakeServerFactory = createFakeServerFactory();
  const bridge = createIncomingMessageBridge({
    authSecret: "test-secret",
    host: "127.0.0.1",
    port: 4353,
    dispatchIncomingPayload() {
      throw new Error("dispatch should not run");
    },
    log: {
      log() {},
      error() {},
    },
    createServer: fakeServerFactory.createServer,
  });

  const server = bridge.start();
  await once(server, "listening");
  const methodResponse = await server.dispatch({
    method: "GET",
  });
  assert.equal(methodResponse.status, 405);
  assert.deepEqual(methodResponse.json(), {
    ok: false,
    error: "Method not allowed",
  });

  const invalidJsonResponse = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({ body: "{not-json" }),
    body: "{not-json",
  });
  assert.equal(invalidJsonResponse.status, 400);
  assert.deepEqual(invalidJsonResponse.json(), {
    ok: false,
    error: "Invalid JSON payload",
  });

  bridge.stop();
  await once(server, "close");
});

test("incoming message bridge rejects missing auth, bad signatures, replayed nonces, expired requests, and invalid payloads", async () => {
  const { createIncomingMessageBridge } = await loadBridgeModule();
  const dispatched = [];
  const fakeServerFactory = createFakeServerFactory();
  const bridge = createIncomingMessageBridge({
    authSecret: "test-secret",
    host: "127.0.0.1",
    port: 4353,
    dispatchIncomingPayload(payload) {
      dispatched.push(payload);
    },
    log: {
      log() {},
      error() {},
    },
    allowedRequestTtlMs: 1000,
    createServer: fakeServerFactory.createServer,
  });

  const server = bridge.start();
  await once(server, "listening");
  const unauthorizedResponse = await server.dispatch({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sideclick-nonce": "nonce-unauthorized-1234",
      "x-sideclick-expires": String(Date.now() + 500),
    },
    body: JSON.stringify({ action_type: "chat", selected_text: "" }),
  });
  assert.equal(unauthorizedResponse.status, 401);
  assert.deepEqual(unauthorizedResponse.json(), {
    ok: false,
    error: "Unauthorized caller",
  });

  const staleResponse = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({
      expires: Date.now() - 5000,
      nonce: "nonce-stale-123456789",
      body: JSON.stringify({ action_type: "chat", selected_text: "" }),
    }),
    body: JSON.stringify({ action_type: "chat", selected_text: "" }),
  });
  assert.equal(staleResponse.status, 401);
  assert.deepEqual(staleResponse.json(), {
    ok: false,
    error: "Expired request",
  });

  const tooFarFutureBody = JSON.stringify({ action_type: "chat", selected_text: "" });
  const tooFarFutureResponse = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({
      expires: Date.now() + 5000,
      nonce: "nonce-too-far-1234567",
      body: tooFarFutureBody,
    }),
    body: tooFarFutureBody,
  });
  assert.equal(tooFarFutureResponse.status, 401);
  assert.deepEqual(tooFarFutureResponse.json(), {
    ok: false,
    error: "Request expiry too far in future",
  });

  const badSignatureBody = JSON.stringify({ action_type: "chat", selected_text: "" });
  const badSignatureResponse = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({
      secret: "wrong-secret",
      nonce: "nonce-bad-signature1",
      expires: Date.now() + 500,
      body: badSignatureBody,
    }),
    body: badSignatureBody,
  });
  assert.equal(badSignatureResponse.status, 401);
  assert.deepEqual(badSignatureResponse.json(), {
    ok: false,
    error: "Unauthorized caller",
  });

  const firstValidBody = JSON.stringify({ action_type: "chat", selected_text: "" });
  const firstValidResponse = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({
      nonce: "nonce-replay-123456789",
      expires: Date.now() + 500,
      body: firstValidBody,
    }),
    body: firstValidBody,
  });
  assert.equal(firstValidResponse.status, 200);

  const replayBody = JSON.stringify({ action_type: "chat", selected_text: "" });
  const replayResponse = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({
      nonce: "nonce-replay-123456789",
      expires: Date.now() + 500,
      body: replayBody,
    }),
    body: replayBody,
  });
  assert.equal(replayResponse.status, 409);
  assert.deepEqual(replayResponse.json(), {
    ok: false,
    error: "Replay detected for nonce",
  });

  const invalidPayloadBody = JSON.stringify({
    action_type: "chat",
    selected_text: "",
    page_url: "not-a-url",
  });
  const invalidPayloadResponse = await server.dispatch({
    method: "POST",
    headers: createAuthHeaders({
      nonce: "nonce-invalid-payload-123",
      expires: Date.now() + 500,
      body: invalidPayloadBody,
    }),
    body: invalidPayloadBody,
  });
  assert.equal(invalidPayloadResponse.status, 400);
  assert.deepEqual(invalidPayloadResponse.json(), {
    ok: false,
    error: "Invalid bridge payload",
  });

  assert.equal(dispatched.length, 1);

  bridge.stop();
  await once(server, "close");
});

test("incoming message bridge start is idempotent", async () => {
  const { createIncomingMessageBridge } = await loadBridgeModule();
  const fakeServerFactory = createFakeServerFactory();
  const bridge = createIncomingMessageBridge({
    authSecret: "test-secret",
    host: "127.0.0.1",
    port: 4353,
    dispatchIncomingPayload() {},
    log: {
      log() {},
      error() {},
    },
    createServer: fakeServerFactory.createServer,
  });

  const firstServer = bridge.start();
  const secondServer = bridge.start();
  assert.equal(firstServer, secondServer);
  assert.equal(fakeServerFactory.getLatestServer().listenCount, 1);

  await once(firstServer, "listening");
  bridge.stop();
  await once(firstServer, "close");
  assert.equal(fakeServerFactory.getLatestServer().closed, true);
});
