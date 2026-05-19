const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadAuthServiceModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "apps", "backend", "src", "services", "auth.ts")).href
  );
}

async function loadAuthMiddlewareModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "apps", "backend", "src", "middleware", "auth.ts")).href
  );
}

async function loadRateLimitModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "apps", "backend", "src", "middleware", "rate-limit.ts")).href
  );
}

function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function createAuthTestDatabase(options = {}) {
  const state = {
    users: (options.users ?? []).map((row) => ({ ...row })),
    classes: (options.classes ?? []).map((row) => ({ ...row })),
    sessions: (options.sessions ?? []).map((row) => ({ ...row })),
    interactions: (options.interactions ?? []).map((row) => ({ ...row })),
    runCalls: [],
  };

  const db = {
    state,
    prepare(sql) {
      const normalized = normalizeSql(sql);

      return {
        get(value) {
          if (normalized.includes("from users where lower(email) = lower(?)")) {
            const normalizedEmail = String(value).trim().toLowerCase();
            return (
              state.users.find((row) => String(row.email ?? "").trim().toLowerCase() === normalizedEmail) ??
              undefined
            );
          }

          if (normalized.includes("from users where id = ?")) {
            return state.users.find((row) => row.id === value) ?? undefined;
          }

          if (normalized.includes("select owner_user_id from classes where id = ?")) {
            return state.classes.find((row) => row.id === value) ?? undefined;
          }

          if (normalized.includes("from sessions left join classes on classes.id = sessions.class_id")) {
            const session = state.sessions.find((row) => row.id === value);
            if (!session) {
              return undefined;
            }

            const owningClass = state.classes.find((row) => row.id === session.class_id) ?? null;
            return {
              session_owner_id: session.owner_user_id ?? null,
              class_owner_id: owningClass?.owner_user_id ?? null,
              class_id: session.class_id ?? null,
            };
          }

          if (
            normalized.includes("from interactions left join classes on classes.id = interactions.class_id")
          ) {
            const interaction = state.interactions.find((row) => row.id === value);
            if (!interaction) {
              return undefined;
            }

            const owningClass = state.classes.find((row) => row.id === interaction.class_id) ?? null;
            const owningSession = state.sessions.find((row) => row.id === interaction.session_id) ?? null;
            return {
              interaction_owner_id: interaction.owner_user_id ?? null,
              class_owner_id: owningClass?.owner_user_id ?? null,
              session_owner_id: owningSession?.owner_user_id ?? null,
              class_id: interaction.class_id ?? null,
              session_id: interaction.session_id ?? null,
            };
          }

          throw new Error(`Unsupported get SQL in auth test DB: ${normalized}`);
        },
        run(value) {
          state.runCalls.push({ sql: normalized, value });

          if (normalized.startsWith("insert into users")) {
            const nextEmail = String(value.email ?? "").trim().toLowerCase();
            if (
              options.failUniqueEmailInsertFor &&
              nextEmail === String(options.failUniqueEmailInsertFor).trim().toLowerCase()
            ) {
              const error = new Error("UNIQUE constraint failed: users_email_unique_idx");
              error.code = "SQLITE_CONSTRAINT_UNIQUE";
              throw error;
            }

            state.users.push({
              id: value.id,
              email: value.email,
              display_name: value.displayName ?? null,
              password_hash: value.passwordHash ?? null,
              password_salt: value.passwordSalt ?? null,
              token_version: value.tokenVersion ?? 0,
            });
            return { changes: 1, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("update users set token_version = coalesce(token_version, 0) + 1")) {
            const user = state.users.find((row) => row.id === value);
            if (!user) {
              return { changes: 0, lastInsertRowid: 0 };
            }

            user.token_version = (user.token_version ?? 0) + 1;
            return { changes: 1, lastInsertRowid: 0 };
          }

          throw new Error(`Unsupported run SQL in auth test DB: ${normalized}`);
        },
      };
    },
  };

  return db;
}

function decodeJwtPayload(token) {
  const [, payload] = token.split(".");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

function createMockRateLimitResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("JWT configuration fails closed when BACKEND_JWT_SECRET is missing", async () => {
  const previousSecret = process.env.BACKEND_JWT_SECRET;
  delete process.env.BACKEND_JWT_SECRET;

  try {
    const { assertJwtConfiguration } = await loadAuthServiceModule();
    assert.throws(() => assertJwtConfiguration(), /Missing BACKEND_JWT_SECRET/);
  } finally {
    if (previousSecret === undefined) {
      delete process.env.BACKEND_JWT_SECRET;
    } else {
      process.env.BACKEND_JWT_SECRET = previousSecret;
    }
  }
});

test("auth tokens include stronger claims and revoke cleanly through token versioning", async () => {
  process.env.BACKEND_JWT_SECRET = "test-jwt-secret";

  const db = createAuthTestDatabase();
  const {
    loginUser,
    registerUser,
    revokeUserSessions,
    verifyAuthenticatedToken,
  } = await loadAuthServiceModule();

  const registeredSession = registerUser(
    {
      email: "Student@Example.com",
      password: "correct-horse-battery-staple",
      displayName: "Student",
    },
    db,
  );
  const registeredClaims = decodeJwtPayload(registeredSession.token);

  assert.equal(registeredClaims.iss, "sideklick-local-backend");
  assert.equal(registeredClaims.aud, "sideklick-local-client");
  assert.equal(registeredClaims.email, "student@example.com");
  assert.equal(registeredClaims.tokenVersion, 0);
  assert.equal(typeof registeredClaims.jti, "string");
  assert.ok(registeredClaims.jti.length > 0);
  assert.equal(verifyAuthenticatedToken(registeredSession.token, db).sub, registeredSession.user.id);

  const loggedInSession = loginUser(
    {
      email: "student@example.com",
      password: "correct-horse-battery-staple",
    },
    db,
  );
  assert.equal(verifyAuthenticatedToken(loggedInSession.token, db).sub, registeredSession.user.id);

  assert.equal(revokeUserSessions(registeredSession.user.id, db), true);
  assert.throws(
    () => verifyAuthenticatedToken(loggedInSession.token, db),
    /JWT has been revoked/,
  );
});

test("registration translates unique email constraint races into a stable user-facing error", async () => {
  process.env.BACKEND_JWT_SECRET = "test-jwt-secret";

  const db = createAuthTestDatabase({
    failUniqueEmailInsertFor: "race@example.com",
  });
  const { registerUser } = await loadAuthServiceModule();

  assert.throws(
    () =>
      registerUser(
        {
          email: "race@example.com",
          password: "correct-horse-battery-staple",
        },
        db,
      ),
    /An account with that email already exists/,
  );
});

test("session authorization fails closed without mutating legacy ownership at request time", async () => {
  const db = createAuthTestDatabase({
    classes: [
      { id: 1, owner_user_id: "owner-1" },
      { id: 2, owner_user_id: null },
    ],
    sessions: [
      { id: 10, class_id: 1, owner_user_id: null },
      { id: 20, class_id: 2, owner_user_id: null },
    ],
  });
  const { authorizeSessionAccess } = await loadAuthMiddlewareModule();

  assert.equal(authorizeSessionAccess(10, "owner-1", db), null);
  assert.deepEqual(authorizeSessionAccess(20, "owner-1", db), {
    status: 403,
    error: "Forbidden session resource access.",
  });
  assert.equal(db.state.runCalls.length, 0);
});

test("auth rate limiting is stricter and isolates buckets by normalized email", async () => {
  const previousWindow = process.env.BACKEND_AUTH_RATE_LIMIT_WINDOW_MS;
  const previousMax = process.env.BACKEND_AUTH_RATE_LIMIT_MAX_REQUESTS;
  process.env.BACKEND_AUTH_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.BACKEND_AUTH_RATE_LIMIT_MAX_REQUESTS = "2";

  try {
    const { createAuthRateLimitMiddleware } = await loadRateLimitModule();
    const middleware = createAuthRateLimitMiddleware();
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };

    const makeRequest = (email) => ({
      method: "POST",
      path: "/login",
      body: { email },
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    });

    middleware(makeRequest("Student@example.com"), createMockRateLimitResponse(), next);
    middleware(makeRequest(" student@example.com "), createMockRateLimitResponse(), next);

    const blockedResponse = createMockRateLimitResponse();
    middleware(makeRequest("student@example.com"), blockedResponse, next);
    assert.equal(blockedResponse.statusCode, 429);
    assert.deepEqual(blockedResponse.body, {
      error: "Too many authentication attempts.",
    });

    const separateBucketResponse = createMockRateLimitResponse();
    middleware(makeRequest("other@example.com"), separateBucketResponse, next);
    assert.equal(separateBucketResponse.statusCode, 200);
    assert.equal(nextCalls, 3);
  } finally {
    if (previousWindow === undefined) {
      delete process.env.BACKEND_AUTH_RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.BACKEND_AUTH_RATE_LIMIT_WINDOW_MS = previousWindow;
    }

    if (previousMax === undefined) {
      delete process.env.BACKEND_AUTH_RATE_LIMIT_MAX_REQUESTS;
    } else {
      process.env.BACKEND_AUTH_RATE_LIMIT_MAX_REQUESTS = previousMax;
    }
  }
});
