const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { importModule } = require("./helpers/import-module");

async function loadPostgresModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "db", "postgres.ts"),
  );
}

test("postgres SSL defaults to verified TLS for non-local database URLs", async () => {
  const originalRejectUnauthorized = process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED;
  const originalNodeEnv = process.env.NODE_ENV;
  delete process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED;
  process.env.NODE_ENV = "test";

  try {
    const { buildSslConfig } = await loadPostgresModule();
    assert.deepEqual(
      buildSslConfig("postgres://user:pass@db.example.com:5432/sideklick"),
      { rejectUnauthorized: true },
    );
  } finally {
    if (originalRejectUnauthorized === undefined) {
      delete process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED;
    } else {
      process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }
});

test("postgres SSL rejects insecure overrides for non-local database URLs", async () => {
  const originalRejectUnauthorized = process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED = "false";
  process.env.NODE_ENV = "test";

  try {
    const { buildSslConfig } = await loadPostgresModule();
    assert.throws(
      () => buildSslConfig("postgres://user:pass@db.example.com:5432/sideklick"),
      /certificate verification cannot be disabled/i,
    );
  } finally {
    if (originalRejectUnauthorized === undefined) {
      delete process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED;
    } else {
      process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }
});

test("postgres SSL allows localhost opt-out during non-production development", async () => {
  const originalSsl = process.env.POSTGRES_SSL;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.POSTGRES_SSL = "false";
  process.env.NODE_ENV = "development";

  try {
    const { buildSslConfig } = await loadPostgresModule();
    assert.equal(
      buildSslConfig("postgres://user:pass@127.0.0.1:5432/sideklick"),
      undefined,
    );
  } finally {
    if (originalSsl === undefined) {
      delete process.env.POSTGRES_SSL;
    } else {
      process.env.POSTGRES_SSL = originalSsl;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  }
});
