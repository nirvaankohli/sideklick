const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { importModule } = require("./helpers/import-module");

async function loadServerModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "server.ts")
  );
}

test("backend server exposes /health and /api/health endpoints", async () => {
  // Set env vars that server.ts looks up to prevent it from failing
  process.env.BACKEND_JWT_SECRET = "test-jwt-secret";
  process.env.DATABASE_URL = ""; // SQLite fallback

  const { createServer } = await loadServerModule();
  const app = createServer();

  // We mock request and response objects to verify routing and health check
  const makeMockResponse = () => {
    const res = {
      statusCode: 200,
      headers: {},
      locals: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
      disable() {},
      on() {}
    };
    return res;
  };

  // Find the GET /health and GET /api/health routes in express routing table
  const getRoutes = app.router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: layer.route.methods,
      handler: layer.route.stack[layer.route.stack.length - 1].handle,
    }));

  const healthRoutes = getRoutes.filter((route) => {
    if (Array.isArray(route.path)) {
      return route.path.includes("/health") || route.path.includes("/api/health");
    }
    return route.path === "/health" || route.path === "/api/health";
  });

  assert.ok(healthRoutes.length >= 1, "Should find registered health routes");
  
  // Directly test the handler to ensure it behaves correctly for health check
  const handler = healthRoutes[0].handler;
  const mockReq = {};
  const mockRes = makeMockResponse();

  handler(mockReq, mockRes);

  assert.equal(mockRes.statusCode, 200);
  assert.equal(mockRes.body.ok, true);
  assert.equal(mockRes.body.service, "sideklick-local-backend");
  assert.ok(mockRes.body.observability);
});

test("backend root endpoint does not expose database counts", async () => {
  process.env.BACKEND_JWT_SECRET = "test-jwt-secret";
  process.env.DATABASE_URL = "";

  const { createServer } = await loadServerModule();
  const app = createServer();
  const rootRoute = app.router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      handler: layer.route.stack[layer.route.stack.length - 1].handle,
    }))
    .find((route) => route.path === "/");

  assert.ok(rootRoute, "Should find registered root route");

  const mockRes = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  rootRoute.handler({}, mockRes);

  assert.equal(mockRes.statusCode, 200);
  assert.equal(mockRes.body.message, "Local backend is running.");
  assert.equal("database" in mockRes.body, false);
});
