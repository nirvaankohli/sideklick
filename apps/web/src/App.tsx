import { useEffect, useState } from "react";
import CTA from "@/components/cta";
import { FeaturePlatform } from "@/components/feature-platform";
import { BoldFooter } from "@/components/footer-bold";
import FoundingBetaPopup from "@/components/founding-beta-popup";
import LoginPage from "@/components/login-page";
import PricingPage from "@/components/pricing-page";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";
import {
  clearStoredAuthSession,
  loginAccount,
  logoutAccount,
  readStoredAuthSession,
  refreshAuthSession,
  registerAccount,
  type AuthCredentials,
  type AuthSession,
} from "@/lib/web-auth";
import { getRouteFromPathname } from "@/lib/site-navigation";

export type ThemeMode = "dark" | "light";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

const getInitialPathname = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
};

const FOUNDING_BETA_POPUP_STORAGE_KEY =
  "sideklick.foundingBetaPopup.seen.v1";

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [pathname, setPathname] = useState(getInitialPathname);
  const [authReady, setAuthReady] = useState(false);
  const [showFoundingBetaPopup, setShowFoundingBetaPopup] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    readStoredAuthSession(),
  );
  const route = getRouteFromPathname(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-light", themeMode === "light");
    root.classList.toggle("theme-dark", themeMode === "dark");
  }, [themeMode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setThemeMode(event.matches ? "light" : "dark");
    };

    media.addEventListener("change", handleMediaChange);
    return () => {
      media.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (route !== "home") {
      setShowFoundingBetaPopup(false);
      return;
    }

    try {
      const hasSeenPopup = window.localStorage.getItem(
        FOUNDING_BETA_POPUP_STORAGE_KEY,
      );
      setShowFoundingBetaPopup(hasSeenPopup !== "true");
    } catch {
      setShowFoundingBetaPopup(true);
    }
  }, [route]);

  const dismissFoundingBetaPopup = () => {
    try {
      window.localStorage.setItem(FOUNDING_BETA_POPUP_STORAGE_KEY, "true");
    } catch {
      // Ignore storage failures; dismissing should still work for this page view.
    }
    setShowFoundingBetaPopup(false);
  };

  useEffect(() => {
    let isCancelled = false;
    const storedSession = readStoredAuthSession();

    if (!storedSession) {
      setAuthReady(true);
      return;
    }

    void refreshAuthSession(storedSession)
      .then((nextSession) => {
        if (!isCancelled) {
          setAuthSession(nextSession);
        }
      })
      .catch((error) => {
        const status =
          error && typeof error === "object" && "status" in error
            ? Number((error as { status?: unknown }).status)
            : null;
        if (!isCancelled && (status === 401 || status === 403)) {
          clearStoredAuthSession();
          setAuthSession(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setAuthReady(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLogin = async (credentials: AuthCredentials) => {
    const nextSession = await loginAccount(credentials);
    setAuthSession(nextSession);
    return nextSession;
  };

  const handleRegister = async (credentials: AuthCredentials) => {
    const nextSession = await registerAccount(credentials);
    setAuthSession(nextSession);
    return nextSession;
  };

  const handleLogout = async () => {
    const sessionToEnd = authSession;
    try {
      await logoutAccount(sessionToEnd);
    } finally {
      setAuthSession(null);
    }
  };

  const currentPage = (() => {
    if (route === "pricing") {
      return <PricingPage session={authSession} />;
    }

    if (route === "login") {
      return (
        <LoginPage
          authReady={authReady}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onRegister={handleRegister}
          session={authSession}
        />
      );
    }

    return (
      <>
        <AgencyHeroSection session={authSession} />
        <FeaturePlatform />
        <CTA />
      </>
    );
  })();

  const compactPage = route === "pricing" || route === "login";

  return (
    <main className="background-canvas">
      <div
        className={[
          "background-canvas__content flex flex-col",
          compactPage ? "gap-0" : "gap-24 md:gap-40",
        ].join(" ")}
      >
        {currentPage}
        <BoldFooter session={authSession} />
        {showFoundingBetaPopup && route === "home" ? (
          <FoundingBetaPopup onDismiss={dismissFoundingBetaPopup} />
        ) : null}
      </div>
    </main>
  );
}
