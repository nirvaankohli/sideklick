const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { importModule } = require("./helpers/import-module");

async function loadServerModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "server.ts")
  );
}

test("backend CORS defaults allow web auth origins and authorization headers", async () => {
  const {
    CORS_ALLOW_HEADERS,
    getAllowedCorsOrigins,
    resolveCorsOrigin,
  } = await loadServerModule();

  const defaults = getAllowedCorsOrigins({ BACKEND_ALLOWED_ORIGINS: "" });

  assert.ok(defaults.includes("http://localhost:5173"));
  assert.ok(defaults.includes("http://127.0.0.1:5173"));
  assert.ok(defaults.includes("https://sideklick.app"));
  assert.ok(defaults.includes("https://www.sideklick.app"));
  assert.match(CORS_ALLOW_HEADERS, /Authorization/);
  assert.equal(
    resolveCorsOrigin("http://localhost:5173", defaults),
    "http://localhost:5173",
  );
  assert.equal(resolveCorsOrigin("https://not-sideklick.example", defaults), null);
});

test("backend CORS env allowlist is exact and trims trailing slashes", async () => {
  const { getAllowedCorsOrigins, resolveCorsOrigin } = await loadServerModule();
  const origins = getAllowedCorsOrigins({
    BACKEND_ALLOWED_ORIGINS: "https://app.example.com/, https://admin.example.com",
  });

  assert.deepEqual(origins, [
    "https://app.example.com",
    "https://admin.example.com",
  ]);
  assert.equal(
    resolveCorsOrigin("https://app.example.com/", origins),
    "https://app.example.com",
  );
  assert.equal(resolveCorsOrigin("https://example.com", origins), null);
});
