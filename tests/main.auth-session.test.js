const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getManagedBackendErrorStatus,
  isManagedBackendAuthFailure,
  resolveStoredAuthAfterSessionRefreshFailure,
} = require("../src/main/auth-session.js");

test("managed backend auth helpers detect explicit auth failures", () => {
  const unauthorizedError = new Error("Unauthorized");
  unauthorizedError.status = 401;

  const forbiddenError = new Error("Forbidden");
  forbiddenError.status = 403;

  assert.equal(getManagedBackendErrorStatus(unauthorizedError), 401);
  assert.equal(isManagedBackendAuthFailure(unauthorizedError), true);
  assert.equal(isManagedBackendAuthFailure(forbiddenError), true);
});

test("managed backend auth helpers ignore non-auth failures", () => {
  const networkError = new Error("fetch failed");
  const serverError = new Error("Internal Server Error");
  serverError.status = 500;

  assert.equal(getManagedBackendErrorStatus(networkError), null);
  assert.equal(isManagedBackendAuthFailure(networkError), false);
  assert.equal(isManagedBackendAuthFailure(serverError), false);
});

test("session restore keeps cached auth unless the backend explicitly rejects it", () => {
  const storedAuth = {
    token: "persist-me",
    user: {
      id: "user-1",
      email: "student@example.com",
    },
  };
  const unauthorizedError = new Error("Unauthorized");
  unauthorizedError.status = 401;
  const transientError = new Error("fetch failed");

  assert.equal(
    resolveStoredAuthAfterSessionRefreshFailure(storedAuth, unauthorizedError),
    null,
  );
  assert.deepEqual(
    resolveStoredAuthAfterSessionRefreshFailure(storedAuth, transientError),
    storedAuth,
  );
});
