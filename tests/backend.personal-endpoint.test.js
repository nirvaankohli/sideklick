const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { importModule } = require("./helpers/import-module");

async function loadPersonalRouteModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "routes", "personal.ts"),
  );
}

test("personal analytics endpoint is secret-protected for Andreas", async () => {
  const {
    getBearerToken,
    isAndreasEndpointSecretAuthorized,
    personalRouter,
  } = await loadPersonalRouteModule();

  assert.equal(
    getBearerToken("Bearer andreas-test-secret"),
    "andreas-test-secret",
  );
  assert.equal(
    isAndreasEndpointSecretAuthorized({
      expectedSecret: "andreas-test-secret",
      personalSecret: "andreas-test-secret",
    }),
    true,
  );
  assert.equal(
    isAndreasEndpointSecretAuthorized({
      bearerToken: "andreas-test-secret",
      expectedSecret: "andreas-test-secret",
    }),
    true,
  );
  assert.equal(
    isAndreasEndpointSecretAuthorized({
      expectedSecret: "andreas-test-secret",
      personalSecret: "wrong-secret",
    }),
    false,
  );
  assert.equal(
    isAndreasEndpointSecretAuthorized({
      expectedSecret: "",
      personalSecret: "andreas-test-secret",
    }),
    false,
  );

  const registeredPaths = personalRouter.stack
    .map((layer) => layer.route?.path)
    .filter(Boolean);
  assert.ok(registeredPaths.includes("/andreas/web-visits"));
  assert.ok(registeredPaths.includes("/andreas/web-visits/public"));
});
