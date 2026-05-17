import crypto from "node:crypto";

import { getDatabase } from "../db/index.ts";
import { authCredentialsSchema } from "../schema/index.ts";
import type { AuthSession, AuthUser } from "../type/index.ts";

const PASSWORD_HASH_ITERATIONS = 120_000;
const PASSWORD_HASH_BYTES = 64;
const PASSWORD_HASH_DIGEST = "sha512";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const JWT_ISSUER = "sideklick-local-backend";
const JWT_AUDIENCE = "sideklick-local-client";
const ALLOWED_JWT_IAT_SKEW_SECONDS = 5;

export type AuthenticatedJwtClaims = {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  jti: string;
  tokenVersion: number;
  iat: number;
  nbf: number;
  exp: number;
};

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  password_hash: string | null;
  password_salt: string | null;
  token_version: number | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getJwtSecret(): string {
  const secret =
    typeof process.env.BACKEND_JWT_SECRET === "string"
      ? process.env.BACKEND_JWT_SECRET.trim()
      : "";

  if (!secret) {
    throw new Error("Missing BACKEND_JWT_SECRET.");
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(
    password,
    salt,
    PASSWORD_HASH_ITERATIONS,
    PASSWORD_HASH_BYTES,
    PASSWORD_HASH_DIGEST,
  ).toString("base64");
}

function parseJwtHeader(token: string): { alg?: string; typ?: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT.");
  }

  try {
    return JSON.parse(base64UrlDecode(parts[0]).toString("utf8")) as {
      alg?: string;
      typ?: string;
    };
  } catch {
    throw new Error("Malformed JWT.");
  }
}

function parseJwtPayload(token: string): AuthenticatedJwtClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT.");
  }

  let payload: Partial<AuthenticatedJwtClaims>;
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]).toString("utf8")) as Partial<AuthenticatedJwtClaims>;
  } catch {
    throw new Error("Malformed JWT.");
  }

  if (payload.iss !== JWT_ISSUER) {
    throw new Error("JWT issuer is invalid.");
  }

  if (payload.aud !== JWT_AUDIENCE) {
    throw new Error("JWT audience is invalid.");
  }

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("JWT is missing subject.");
  }

  if (!payload.email || typeof payload.email !== "string") {
    throw new Error("JWT is missing email.");
  }

  if (!payload.jti || typeof payload.jti !== "string") {
    throw new Error("JWT is missing token id.");
  }

  if (
    typeof payload.tokenVersion !== "number" ||
    !Number.isInteger(payload.tokenVersion) ||
    payload.tokenVersion < 0
  ) {
    throw new Error("JWT is missing token version.");
  }

  if (typeof payload.iat !== "number" || !Number.isInteger(payload.iat)) {
    throw new Error("JWT is missing issued-at timestamp.");
  }

  if (typeof payload.nbf !== "number" || !Number.isInteger(payload.nbf)) {
    throw new Error("JWT is missing not-before timestamp.");
  }

  if (typeof payload.exp !== "number" || !Number.isInteger(payload.exp)) {
    throw new Error("JWT is missing expiry timestamp.");
  }

  return payload as AuthenticatedJwtClaims;
}

function getUserByEmail(email: string, db = getDatabase()) {
  return db.prepare(
    `
      SELECT
        id,
        email,
        display_name,
        password_hash,
        password_salt,
        token_version
      FROM users
      WHERE lower(email) = lower(?)
      LIMIT 1
    `,
  ).get(normalizeEmail(email)) as UserRow | undefined;
}

function getUserById(userId: string, db = getDatabase()) {
  return db.prepare(
    `
      SELECT
        id,
        email,
        display_name,
        password_hash,
        password_salt,
        token_version
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
  ).get(userId) as UserRow | undefined;
}

function isUniqueEmailConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message : String(error);

  return (
    code === "23505" ||
    code === "SQLITE_CONSTRAINT_UNIQUE" ||
    /users_email_unique_idx/i.test(message) ||
    /unique constraint failed:\s*users\.(email|lower\(email\))/i.test(message)
  );
}

export function assertJwtConfiguration(): void {
  getJwtSecret();
}

export function signUserJwt(input: {
  userId: string;
  email: string;
  tokenVersion: number;
  now?: Date;
}): string {
  const issuedAt = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      sub: input.userId,
      email: normalizeEmail(input.email),
      jti: crypto.randomUUID(),
      tokenVersion: input.tokenVersion,
      iat: issuedAt,
      nbf: issuedAt,
      exp: issuedAt + SESSION_TTL_SECONDS,
    }),
  );
  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function mapUserRow(row: UserRow): AuthUser {
  if (!row.email) {
    throw new Error("Authenticated user record is missing an email.");
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  };
}

export function verifyAuthenticatedToken(
  token: string,
  db = getDatabase(),
): AuthenticatedJwtClaims {
  const header = parseJwtHeader(token);
  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Unsupported JWT algorithm.");
  }

  const parts = token.split(".");
  const signatureInput = `${parts[0]}.${parts[1]}`;
  const expectedSignature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(signatureInput)
    .digest("base64url");
  const providedSignature = parts[2];
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error("Invalid JWT signature.");
  }

  const payload = parseJwtPayload(token);
  const now = Math.floor(Date.now() / 1000);

  if (payload.nbf > now) {
    throw new Error("JWT is not active yet.");
  }

  if (payload.iat > now + ALLOWED_JWT_IAT_SKEW_SECONDS) {
    throw new Error("JWT issued-at timestamp is invalid.");
  }

  if (payload.exp <= now) {
    throw new Error("JWT has expired.");
  }

  const userRow = getUserById(payload.sub, db);
  if (!userRow?.email) {
    throw new Error("Authenticated user not found.");
  }

  if (normalizeEmail(userRow.email) !== normalizeEmail(payload.email)) {
    throw new Error("JWT subject no longer matches the account.");
  }

  if ((userRow.token_version ?? 0) !== payload.tokenVersion) {
    throw new Error("JWT has been revoked.");
  }

  return payload;
}

export function getAuthenticatedUser(
  userId: string,
  db = getDatabase(),
): AuthUser | null {
  const userRow = getUserById(userId, db);
  return userRow ? mapUserRow(userRow) : null;
}

export function registerUser(credentials: {
  email: string;
  password: string;
  displayName?: string;
}, db = getDatabase()): AuthSession {
  const parsed = authCredentialsSchema.parse(credentials);
  if (getUserByEmail(parsed.email, db)) {
    throw new Error("An account with that email already exists.");
  }

  const userId = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString("base64");
  const passwordHash = hashPassword(parsed.password, salt);
  const normalizedEmail = normalizeEmail(parsed.email);

  try {
    db.prepare(
      `
        INSERT INTO users (
          id,
          email,
          display_name,
          password_hash,
          password_salt,
          token_version,
          created_at,
          updated_at
        ) VALUES (
          @id,
          @email,
          @displayName,
          @passwordHash,
          @passwordSalt,
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
    ).run({
      id: userId,
      email: normalizedEmail,
      displayName: parsed.displayName?.trim() || null,
      passwordHash,
      passwordSalt: salt,
    });
  } catch (error) {
    if (isUniqueEmailConstraintError(error)) {
      throw new Error("An account with that email already exists.");
    }
    throw error;
  }

  return {
    token: signUserJwt({
      userId,
      email: normalizedEmail,
      tokenVersion: 0,
    }),
    user: {
      id: userId,
      email: normalizedEmail,
      displayName: parsed.displayName?.trim() || null,
    },
  };
}

export function loginUser(credentials: {
  email: string;
  password: string;
}, db = getDatabase()): AuthSession {
  const parsed = authCredentialsSchema.parse(credentials);
  const userRow = getUserByEmail(parsed.email, db);

  if (!userRow || !userRow.email || !userRow.password_hash || !userRow.password_salt) {
    throw new Error("Invalid email or password.");
  }

  const expectedHash = hashPassword(parsed.password, userRow.password_salt);
  const expectedBuffer = Buffer.from(expectedHash, "utf8");
  const providedBuffer = Buffer.from(userRow.password_hash, "utf8");
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    throw new Error("Invalid email or password.");
  }

  return {
    token: signUserJwt({
      userId: userRow.id,
      email: userRow.email,
      tokenVersion: userRow.token_version ?? 0,
    }),
    user: mapUserRow(userRow),
  };
}

export function revokeUserSessions(
  userId: string,
  db = getDatabase(),
): boolean {
  const result = db.prepare(
    `
      UPDATE users
      SET
        token_version = COALESCE(token_version, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
  ).run(userId);

  return result.changes > 0;
}
