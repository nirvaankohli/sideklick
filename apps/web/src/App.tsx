import Grainient from "@/components/Grainient";
import CTA from "@/components/cta";
import { FeaturePlatform } from "@/components/feature-platform";
import { BoldFooter } from "@/components/footer-bold";
import AgencyHeroSection from "@/components/shadcn-space/blocks/hero-01";

export default function App() {
  return (
    <main className="background-canvas">
      <Grainient
        className="background-canvas__grainient"
        color1="#000000"
        color2="#010051"
        color3="#131313"
        timeSpeed={0.25}
        colorBalance={0}
        warpStrength={1}
        warpFrequency={5}
        warpSpeed={2}
        warpAmplitude={50}
        blendAngle={0}
        blendSoftness={0.05}
        rotationAmount={500}
        noiseScale={2}
        grainAmount={0.1}
        grainScale={2}
        grainAnimated={false}
        contrast={1.5}
        gamma={1}
        saturation={1}
        centerX={0}
        centerY={0}
        zoom={0.9}
      />
      <div className="background-canvas__content">
        <AgencyHeroSection />
        <FeaturePlatform />
        <CTA />
        <BoldFooter />
      </div>
    </main>
  );
}
