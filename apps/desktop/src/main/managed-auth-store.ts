import fs from "node:fs";
import path from "node:path";
import type { SafeStorage } from "electron";

export type ManagedAuthSession = {
  token: string;
  user: Record<string, unknown>;
};

type StoredManagedAuthV1 = {
  version: 1;
  encryptedToken: string;
  user: Record<string, unknown>;
  updatedAt: string;
};

type ManagedAuthStoreOptions = {
  authPath: string;
  safeStorage: SafeStorage;
  platform?: NodeJS.Platform;
  readFile?: typeof fs.readFileSync;
  writeFile?: typeof fs.writeFileSync;
  renameFile?: typeof fs.renameSync;
  unlinkFile?: typeof fs.unlinkSync;
  exists?: typeof fs.existsSync;
  mkdir?: typeof fs.mkdirSync;
  chmod?: typeof fs.chmodSync;
  randomBytes?: typeof import("node:crypto").randomBytes;
};

function parseManagedAuthSession(value: unknown): ManagedAuthSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const token =
    typeof candidate.token === "string" && candidate.token.trim()
      ? candidate.token.trim()
      : "";
  const user =
    candidate.user && typeof candidate.user === "object"
      ? (candidate.user as Record<string, unknown>)
      : null;

  if (!token || !user) {
    return null;
  }

  return {
    token,
    user,
  };
}

function parseStoredPayload(value: unknown): StoredManagedAuthV1 | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1) {
    return null;
  }

  if (typeof candidate.encryptedToken !== "string" || !candidate.encryptedToken) {
    return null;
  }

  if (!candidate.user || typeof candidate.user !== "object") {
    return null;
  }

  return {
    version: 1,
    encryptedToken: candidate.encryptedToken,
    user: candidate.user as Record<string, unknown>,
    updatedAt:
      typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
  };
}

function resolveStorageSecurity(
  safeStorage: SafeStorage,
  platform: NodeJS.Platform,
): boolean {
  if (!safeStorage.isEncryptionAvailable()) {
    return false;
  }

  if (platform !== "linux") {
    return true;
  }

  if (typeof safeStorage.getSelectedStorageBackend !== "function") {
    return false;
  }

  return safeStorage.getSelectedStorageBackend() !== "basic_text";
}

function atomicWriteJson(
  filePath: string,
  payload: Record<string, unknown>,
  options: {
    writeFile: typeof fs.writeFileSync;
    renameFile: typeof fs.renameSync;
    mkdir: typeof fs.mkdirSync;
    chmod: typeof fs.chmodSync;
    randomBytes: typeof import("node:crypto").randomBytes;
  },
) {
  const directory = path.dirname(filePath);
  options.mkdir(directory, { recursive: true, mode: 0o700 });

  if (process.platform !== "win32") {
    try {
      options.chmod(directory, 0o700);
    } catch {
      // best effort permissions hardening
    }
  }

  const tempPath = `${filePath}.tmp-${options.randomBytes(8).toString("hex")}`;
  options.writeFile(tempPath, JSON.stringify(payload, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });

  if (process.platform !== "win32") {
    try {
      options.chmod(tempPath, 0o600);
    } catch {
      // best effort permissions hardening
    }
  }

  options.renameFile(tempPath, filePath);

  if (process.platform !== "win32") {
    try {
      options.chmod(filePath, 0o600);
    } catch {
      // best effort permissions hardening
    }
  }
}

export function createManagedAuthStore(options: ManagedAuthStoreOptions) {
  const readFile = options.readFile ?? fs.readFileSync;
  const writeFile = options.writeFile ?? fs.writeFileSync;
  const renameFile = options.renameFile ?? fs.renameSync;
  const unlinkFile = options.unlinkFile ?? fs.unlinkSync;
  const exists = options.exists ?? fs.existsSync;
  const mkdir = options.mkdir ?? fs.mkdirSync;
  const chmod = options.chmod ?? fs.chmodSync;
  const randomBytes =
    options.randomBytes ?? (require("node:crypto") as typeof import("node:crypto")).randomBytes;
  const platform = options.platform ?? process.platform;

  let runtimeSession: ManagedAuthSession | null = null;

  function canPersistSecurely() {
    return resolveStorageSecurity(options.safeStorage, platform);
  }

  function clearPersistedFile() {
    try {
      if (exists(options.authPath)) {
        unlinkFile(options.authPath);
      }
    } catch {
      // fail closed by treating persisted auth as unavailable
    }
  }

  function readPersistedSession(): ManagedAuthSession | null {
    if (!exists(options.authPath)) {
      return null;
    }

    const raw = readFile(options.authPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const versioned = parseStoredPayload(parsed);
    if (!versioned) {
      const legacySession = parseManagedAuthSession(parsed);
      if (!legacySession) {
        return null;
      }

      if (!canPersistSecurely()) {
        return null;
      }

      return persistSession(legacySession);
    }

    if (!canPersistSecurely()) {
      return null;
    }

    const encryptedToken = Buffer.from(versioned.encryptedToken, "base64");
    const token = options.safeStorage.decryptString(encryptedToken).trim();
    if (!token) {
      return null;
    }

    return {
      token,
      user: versioned.user,
    };
  }

  function persistSession(session: ManagedAuthSession): ManagedAuthSession {
    if (!canPersistSecurely()) {
      runtimeSession = session;
      clearPersistedFile();
      return session;
    }

    const encryptedToken = options.safeStorage.encryptString(session.token);
    const payload: StoredManagedAuthV1 = {
      version: 1,
      encryptedToken: encryptedToken.toString("base64"),
      user: session.user,
      updatedAt: new Date().toISOString(),
    };

    atomicWriteJson(options.authPath, payload, {
      writeFile,
      renameFile,
      mkdir,
      chmod,
      randomBytes,
    });

    runtimeSession = session;
    return session;
  }

  function clearSession() {
    runtimeSession = null;
    clearPersistedFile();
    return null;
  }

  return {
    canPersistSecurely,
    getSession() {
      if (runtimeSession) {
        return runtimeSession;
      }

      try {
        const persistedSession = readPersistedSession();
        if (persistedSession) {
          runtimeSession = persistedSession;
          return persistedSession;
        }
      } catch {
        // fall through and fail closed
      }

      clearPersistedFile();
      runtimeSession = null;
      return null;
    },
    setSession(value: unknown) {
      const session = parseManagedAuthSession(value);
      if (!session) {
        throw new Error("Invalid managed auth payload.");
      }

      try {
        return persistSession(session);
      } catch {
        clearSession();
        throw new Error("Failed to persist managed auth session securely.");
      }
    },
    clearSession,
    migrateSession(value: unknown) {
      const session = parseManagedAuthSession(value);
      if (!session || !canPersistSecurely()) {
        return null;
      }

      return this.setSession(session);
    },
    setRuntimeSession(value: unknown) {
      runtimeSession = parseManagedAuthSession(value);
      return runtimeSession;
    },
  };
}

export function normalizeManagedAuthSession(value: unknown): ManagedAuthSession | null {
  return parseManagedAuthSession(value);
}
