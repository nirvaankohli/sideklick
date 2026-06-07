import { useRef } from "react";
import { motion } from "motion/react";

import assistPanel from "../../assets/assist-panel.png";
import weakSpots from "../../assets/weak-spots.png";
import CompareSection from "@/components/compare-section";
import siteCopy from "@/content/site-copy.json";
import { TimelineAnimation } from "@/components/ui/timeline-animation";

export const FeaturePlatform = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const copy = siteCopy.home.features;

  return (
    <section
      id="how-it-helps"
      className="px-4 py-28 md:px-8 md:py-40"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 md:mb-10">
          <h2 className="max-w-4xl text-4xl font-medium tracking-tight text-foreground md:text-6xl">
            {copy.heading}
          </h2>
        </div>

        <div className="mb-32 grid gap-6 lg:mb-56 lg:grid-cols-2">
          <TimelineAnimation
            animationNum={0}
            className="overflow-hidden rounded-[2rem] border border-violet-200/20 bg-[radial-gradient(circle_at_top,#7b96ff_0%,#5d7fe4_38%,#4a63b8_100%)] p-8 text-white"
            timelineRef={sectionRef}
          >
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <h3 className="max-w-md text-3xl font-medium leading-tight md:text-4xl">
                  {copy.weakSpots.headingPrefix}{" "}
                  <motion.span
                    animate={{
                      opacity: [0.75, 1, 0.75],
                      boxShadow: [
                        "0 0 0 rgba(255,255,255,0)",
                        "0 0 24px rgba(255,255,255,0.28)",
                        "0 0 0 rgba(255,255,255,0)",
                      ],
                    }}
                    className="inline-flex rounded-full border border-white/24 bg-white/14 px-3 py-1 text-[0.9em] backdrop-blur-sm"
                    transition={{
                      duration: 2.8,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    {copy.weakSpots.headingHighlight}
                  </motion.span>{" "}
                  {copy.weakSpots.headingSuffix}
                </h3>
                <p className="mt-4 max-w-md text-base leading-7 text-white/78">
                  {copy.weakSpots.body}
                </p>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-black/18 shadow-[0_18px_50px_rgba(16,24,40,0.22)] backdrop-blur-md">
                <img
                  alt={copy.weakSpots.imageAlt}
                  className="block w-full"
                  src={weakSpots}
                />
              </div>
            </div>
          </TimelineAnimation>

          <TimelineAnimation
            animationNum={1}
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(248,249,252,0.96),rgba(221,225,235,0.9))] p-8 text-slate-900"
            timelineRef={sectionRef}
          >
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <h3 className="max-w-lg text-3xl font-medium leading-tight md:text-4xl">
                  {copy.assist.headingPrefix}{" "}
                  <motion.span
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    className="inline-flex rounded-full px-3 py-1 text-[0.9em] text-slate-950 [background:linear-gradient(90deg,rgba(255,255,255,0.95),rgba(214,221,255,1),rgba(255,255,255,0.95))] [background-size:200%_100%] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)]"
                    transition={{
                      duration: 3.2,
                      ease: "easeInOut",
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    {copy.assist.headingHighlight}
                  </motion.span>{" "}
                  {copy.assist.headingSuffix}
                </h3>
                <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                  {copy.assist.body}
                </p>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-300/90 bg-[#4b4d57] shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <img
                  alt={copy.assist.imageAlt}
                  className="block w-full"
                  src={assistPanel}
                />
              </div>
            </div>
          </TimelineAnimation>
        </div>

        <TimelineAnimation
          animationNum={2}
          className="mt-56 border border-white/10 bg-black/18 p-0 md:mt-80"
          timelineRef={sectionRef}
        >
          <CompareSection />
        </TimelineAnimation>
      </div>
    </section>
  );
};
