import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDownloadLabel } from "@/lib/download-label";

const CTA = () => {
  const downloadLabel = useDownloadLabel();

  return (
    <section
      className="px-4 pb-32 pt-12 md:px-8 md:pb-44 md:pt-20"
      id="download"
    >
      <div className="mx-auto max-w-5xl border border-white/10 bg-black/24">
        <div className="relative isolate overflow-hidden px-6 py-10 md:px-10 md:py-14">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/30 to-transparent" />
          <h2 className="max-w-3xl text-3xl font-medium tracking-tight text-white md:text-5xl">
            Ready to study from what actually happened in class?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 md:text-base">
            Download SideKlick, connect it to your notes and materials, and let
            it help with the parts you are most likely to miss.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="bg-white text-black hover:bg-white/90"
              size="lg"
            >
              {downloadLabel} <ArrowUpRight />
            </Button>
            <Button
              className="border-white/14 bg-transparent text-white hover:bg-white/8"
              size="lg"
              variant="outline"
            >
              Get the extension
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
