import Header, {
  type NavigationSection,
} from "@/components/shadcn-space/blocks/hero-01/header";
import HeroSection from "@/components/shadcn-space/blocks/hero-01/hero";
import type { ThemeMode } from "@/App";

type AgencyHeroSectionProps = {
  onToggleTheme: () => void;
  themeMode: ThemeMode;
};

export default function AgencyHeroSection({
  onToggleTheme,
  themeMode,
}: AgencyHeroSectionProps) {
  const navigationData: NavigationSection[] = [
    {
      title: "Home",
      href: "#",
      isActive: true,
    },
    {
      title: "How it helps",
      href: "#how-it-helps",
    },
    {
      title: "Compare",
      href: "#compare",
    },
    {
      title: "Download",
      href: "#download",
    },
    {
      title: "Extension",
      href: "#",
    },
  ];

  return (
    <div className="relative">
      <Header
        navigationData={navigationData}
        onToggleTheme={onToggleTheme}
        themeMode={themeMode}
      />
      <main className="pt-20">
        <HeroSection />
      </main>
    </div>
  );
}
