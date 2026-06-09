import Header from "@/components/shadcn-space/blocks/hero-01/header";
import HeroSection from "@/components/shadcn-space/blocks/hero-01/hero";
import { getSiteNavigation } from "@/lib/site-navigation";
import type { AuthSession } from "@/lib/web-auth";

type AgencyHeroSectionProps = {
  session: AuthSession | null;
};

export default function AgencyHeroSection({ session }: AgencyHeroSectionProps) {
  return (
    <div className="relative">
      <Header navigationData={getSiteNavigation("home", session)} />
      <main className="pt-20">
        <HeroSection />
      </main>
    </div>
  );
}
