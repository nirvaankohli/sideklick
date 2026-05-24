import { useEffect, useState } from "react";
import CTA from "@/components/cta";
import { FeaturePlatform } from "@/components/feature-platform";
import { BoldFooter } from "@/components/footer-bold";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";

export type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "sideklick-theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-light", themeMode === "light");
    root.classList.toggle("theme-dark", themeMode === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  return (
    <main className="background-canvas">
      <div className="background-canvas__content flex flex-col gap-24 md:gap-40">
        <AgencyHeroSection
          themeMode={themeMode}
          onToggleTheme={() =>
            setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))
          }
        />
        <FeaturePlatform />
        <CTA />
        <BoldFooter />
      </div>
    </main>
  );
}
