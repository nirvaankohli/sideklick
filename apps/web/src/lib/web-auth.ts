const DEFAULT_MANAGED_BACKEND_URL = "https://api.sideklick.app";
const AUTH_STORAGE_KEY = "sideklick.webAuthSession.v1";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type AuthCredentials = {
  email: string;
  password: string;
  displayName?: string;
};

export type CheckoutItem =
  | "plus_monthly"
  | "plus_yearly"
  | "max_monthly"
  | "max_yearly"
  | "credits_50"
  | "finals_pack"
  | "founding_beta_max_lifetime";

export type CheckoutResult = {
  provider: "stripe" | "mock";
  mode: "subscription" | "payment";
  checkoutUrl: string;
  item: CheckoutItem;
  mock: boolean;
};

export type BillingPortalResult = {
  provider: "stripe" | "mock";
  portalUrl: string;
  mock: boolean;
};

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

function getViteEnvValue(key: string): string {
  const env = (import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }).env;
  return env?.[key]?.trim() ?? "";
}

export function getManagedBackendUrl(): string {
  return (
    getViteEnvValue("VITE_MANAGED_BACKEND_URL") || DEFAULT_MANAGED_BACKEND_URL
  ).replace(/\/+$/, "");
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    (typeof candidate.displayName === "string" || candidate.displayName === null)
  );
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession>;
  return typeof candidate.token === "string" && isAuthUser(candidate.user);
}

export function readStoredAuthSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredAuthSession(session: AuthSession | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

async function parseAuthResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

async function requestAuthEndpoint<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    token?: string;
  } = {},
): Promise<T> {
  const response = await fetch(`${getManagedBackendUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await parseAuthResponse(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : "Authentication request failed.";
    throw new AuthApiError(message, response.status);
  }

  return payload as T;
}

export async function loginAccount(
  credentials: AuthCredentials,
): Promise<AuthSession> {
  const session = await requestAuthEndpoint<AuthSession>("/api/auth/login", {
    method: "POST",
    body: {
      email: credentials.email,
      password: credentials.password,
    },
  });
  writeStoredAuthSession(session);
  return session;
}

export async function registerAccount(
  credentials: AuthCredentials,
): Promise<AuthSession> {
  const session = await requestAuthEndpoint<AuthSession>("/api/auth/register", {
    method: "POST",
    body: {
      email: credentials.email,
      password: credentials.password,
      displayName: credentials.displayName,
    },
  });
  writeStoredAuthSession(session);
  return session;
}

export async function refreshAuthSession(
  session: AuthSession,
): Promise<AuthSession> {
  const payload = await requestAuthEndpoint<{ user: AuthUser }>("/api/auth/me", {
    token: session.token,
  });
  const nextSession = {
    token: session.token,
    user: payload.user,
  };
  writeStoredAuthSession(nextSession);
  return nextSession;
}

export async function logoutAccount(session: AuthSession | null): Promise<void> {
  try {
    if (session?.token) {
      await requestAuthEndpoint<{ ok: true }>("/api/auth/logout", {
        method: "POST",
        token: session.token,
      });
    }
  } finally {
    writeStoredAuthSession(null);
  }
}

export function clearStoredAuthSession(): void {
  writeStoredAuthSession(null);
}

export async function createBillingCheckout(
  session: AuthSession,
  input: {
    item: CheckoutItem;
    successUrl?: string;
    cancelUrl?: string;
  },
): Promise<CheckoutResult> {
  return requestAuthEndpoint<CheckoutResult>("/api/billing/checkout", {
    method: "POST",
    token: session.token,
    body: input,
  });
}

export async function createBillingPortal(
  session: AuthSession,
  input: {
    returnUrl?: string;
  } = {},
): Promise<BillingPortalResult> {
  return requestAuthEndpoint<BillingPortalResult>("/api/billing/portal", {
    method: "POST",
    token: session.token,
    body: input,
  });
}
