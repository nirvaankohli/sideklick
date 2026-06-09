import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogOut,
} from "lucide-react";
import { motion } from "motion/react";

import Header from "@/components/shadcn-space/blocks/hero-01/header";
import { Button } from "@/components/ui/button";
import siteCopy from "@/content/site-copy.json";
import { getSiteNavigation } from "@/lib/site-navigation";
import { AuthApiError } from "@/lib/web-auth";
import type { AuthSession } from "@/lib/web-auth";

type LoginMode = "login" | "register";

type LoginPageProps = {
  authReady: boolean;
  session: AuthSession | null;
  onLogin: (credentials: {
    email: string;
    password: string;
  }) => Promise<AuthSession>;
  onRegister: (credentials: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<AuthSession>;
  onLogout: () => Promise<void>;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return siteCopy.login.validation.genericError;
}

function formatSignedInStatus(account: string): string {
  return siteCopy.login.status.signedInTemplate.replace("{account}", account);
}

export default function LoginPage({
  authReady,
  session,
  onLogin,
  onLogout,
  onRegister,
}: LoginPageProps) {
  const [mode, setMode] = useState<LoginMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const copy = siteCopy.login;

  const submitLabel =
    mode === "register" ? copy.buttons.register : copy.buttons.login;
  const loadingLabel =
    mode === "register" ? copy.buttons.registerLoading : copy.buttons.loginLoading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (!email.trim()) {
      setError(copy.validation.emailRequired);
      return;
    }

    if (password.length < 8) {
      setError(copy.validation.passwordTooShort);
      return;
    }

    try {
      setSubmitting(true);
      const nextSession =
        mode === "register"
          ? await onRegister({
              email: email.trim(),
              password,
              displayName: displayName.trim() || undefined,
            })
          : await onLogin({
              email: email.trim(),
              password,
            });
      setPassword("");
      setStatus(
        formatSignedInStatus(
          nextSession.user.displayName || nextSession.user.email,
        ),
      );
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");
    setStatus("");

    try {
      setSubmitting(true);
      await onLogout();
      setStatus(copy.status.signedOut);
    } catch (logoutError) {
      setError(getErrorMessage(logoutError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header homeHref="/" navigationData={getSiteNavigation("login", session)} />
      <section className="login-page relative overflow-hidden px-4 pb-28 pt-36 md:px-8 md:pb-36 md:pt-44">
        <div className="login-page__grid" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_28rem] lg:items-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <p className="mb-5 text-xs font-medium uppercase text-foreground/48">
              {copy.eyebrow}
            </p>
            <h1 className="text-5xl font-medium leading-[1.02] text-foreground md:text-7xl">
              {copy.headingPrefix}{" "}
              <span className="font-instrument-serif italic">
                {copy.headingEmphasis}
              </span>
              {copy.headingSuffix}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-foreground/68 md:text-lg md:leading-8">
              {copy.body}
            </p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="login-card"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.75, delay: 0.12, ease: "easeInOut" }}
          >
            {session ? (
              <div className="login-card__signed-in">
                <span className="login-card__success-icon">
                  <CheckCircle2 className="size-5" />
                </span>
                <p className="login-card__eyebrow">{copy.signedIn.eyebrow}</p>
                <h2>{session.user.displayName || copy.signedIn.fallbackName}</h2>
                <p>{session.user.email}</p>
                <Button
                  className="login-card__button"
                  disabled={submitting}
                  onClick={handleLogout}
                  size="lg"
                  variant="outline"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  {copy.buttons.logout}
                </Button>
              </div>
            ) : (
              <>
                <div className="login-card__tabs" role="tablist">
                  <button
                    aria-selected={mode === "login"}
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setStatus("");
                    }}
                    role="tab"
                    type="button"
                  >
                    {copy.tabs.login}
                  </button>
                  <button
                    aria-selected={mode === "register"}
                    onClick={() => {
                      setMode("register");
                      setError("");
                      setStatus("");
                    }}
                    role="tab"
                    type="button"
                  >
                    {copy.tabs.register}
                  </button>
                </div>

                <form className="login-card__form" onSubmit={handleSubmit}>
                  {mode === "register" ? (
                    <label>
                      <span>{copy.fields.displayName.label}</span>
                      <input
                        autoComplete="name"
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder={copy.fields.displayName.placeholder}
                        type="text"
                        value={displayName}
                      />
                    </label>
                  ) : null}

                  <label>
                    <span>{copy.fields.email.label}</span>
                    <input
                      autoComplete="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={copy.fields.email.placeholder}
                      type="email"
                      value={email}
                    />
                  </label>

                  <label>
                    <span>{copy.fields.password.label}</span>
                    <input
                      autoComplete={
                        mode === "register" ? "new-password" : "current-password"
                      }
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={copy.fields.password.placeholder}
                      type="password"
                      value={password}
                    />
                  </label>

                  {error ? (
                    <p className="login-card__message login-card__message--error">
                      {error}
                    </p>
                  ) : null}
                  {status ? (
                    <p className="login-card__message login-card__message--success">
                      {status}
                    </p>
                  ) : null}

                  <Button
                    className="login-card__button"
                    disabled={!authReady || submitting}
                    size="lg"
                    type="submit"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {loadingLabel}
                      </>
                    ) : (
                      <>
                        {submitLabel}
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}
