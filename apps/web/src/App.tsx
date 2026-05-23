import CTA from "@/components/cta";
import { FeaturePlatform } from "@/components/feature-platform";
import { BoldFooter } from "@/components/footer-bold";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";

export default function App() {
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
