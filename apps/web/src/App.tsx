import { useEffect, useState } from "react";
import CTA from "@/components/cta";
import { FeaturePlatform } from "@/components/feature-platform";
import { BoldFooter } from "@/components/footer-bold";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";

export type ThemeMode = "dark" | "light";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
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

  return (
    <main className="background-canvas">
      <div className="background-canvas__content flex flex-col gap-24 md:gap-40">
        <AgencyHeroSection />
        <FeaturePlatform />
        <CTA />
        <BoldFooter />
      </div>
    </main>
  );
}
