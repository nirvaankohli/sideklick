import crypto from "node:crypto";

import { getDatabase } from "../db/index.ts";
import { authCredentialsSchema } from "../schema/index.ts";
import type { AuthSession, AuthUser } from "../type/index.ts";

const PASSWORD_HASH_ITERATIONS = 120_000;
const PASSWORD_HASH_BYTES = 64;
const PASSWORD_HASH_DIGEST = "sha512";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  password_hash: string | null;
  password_salt: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getJwtSecret(): string {
  const secret =
    typeof process.env.BACKEND_JWT_SECRET === "string"
      ? process.env.BACKEND_JWT_SECRET.trim()
      : "";

  return secret || "sideclick-managed-backend-dev-secret";
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
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

function signUserJwt(userId: string, email: string): string {
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      email,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    }),
  );
  const signature = crypto
    .createHmac("sha256", getJwtSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

function mapUserRow(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  };
}

function getUserByEmail(email: string) {
  const db = getDatabase();
  return db.prepare(
    `
      SELECT
        id,
        email,
        display_name,
        password_hash,
        password_salt
      FROM users
      WHERE lower(email) = lower(?)
      LIMIT 1
    `,
  ).get(normalizeEmail(email)) as UserRow | undefined;
}

function getUserById(userId: string) {
  const db = getDatabase();
  return db.prepare(
    `
      SELECT
        id,
        email,
        display_name,
        password_hash,
        password_salt
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
  ).get(userId) as UserRow | undefined;
}

export function getAuthenticatedUser(userId: string): AuthUser | null {
  const userRow = getUserById(userId);
  return userRow ? mapUserRow(userRow) : null;
}

export function registerUser(credentials: {
  email: string;
  password: string;
  displayName?: string;
}): AuthSession {
  const parsed = authCredentialsSchema.parse(credentials);
  if (getUserByEmail(parsed.email)) {
    throw new Error("An account with that email already exists.");
  }

  const db = getDatabase();
  const userId = crypto.randomUUID();
  const salt = crypto.randomBytes(16).toString("base64");
  const passwordHash = hashPassword(parsed.password, salt);
  const normalizedEmail = normalizeEmail(parsed.email);

  db.prepare(
    `
      INSERT INTO users (
        id,
        email,
        display_name,
        password_hash,
        password_salt,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @email,
        @displayName,
        @passwordHash,
        @passwordSalt,
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

  return {
    token: signUserJwt(userId, normalizedEmail),
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
}): AuthSession {
  const parsed = authCredentialsSchema.parse(credentials);
  const userRow = getUserByEmail(parsed.email);

  if (!userRow || !userRow.password_hash || !userRow.password_salt) {
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
    token: signUserJwt(userRow.id, userRow.email),
    user: mapUserRow(userRow),
  };
}
