"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { GITHUB_RELEASES_PAGE_URL } from "@/components/download-target";
import siteCopy from "@/content/site-copy.json";

import demoVideo from "../../../../../assets/cover.mp4";

function HeroSection() {
  const copy = siteCopy.home.hero;

  return (
    <section>
      <div className="relative h-full w-full">
        <div className="relative w-full pb-12 pt-0 md:pb-16 md:pt-20">
          <div className="container relative z-10 mx-auto">
            <div className="mx-auto flex max-w-5xl flex-col gap-8">
              <div className="relative flex flex-col items-center gap-4 text-center sm:gap-6">
                <motion.h1
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="text-5xl font-medium leading-14 md:text-7xl md:leading-20 lg:text-8xl lg:leading-24"
                >
                  {copy.headingPrefix}{" "}
                  <span className="font-instrument-serif italic tracking-tight">
                    {copy.headingEmphasis}
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.1, ease: "easeInOut" }}
                  className="max-w-2xl text-base font-normal text-muted-foreground"
                >
                  {copy.body}
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                <Button
                  asChild
                  className="group relative h-12 w-fit cursor-pointer overflow-hidden rounded-full p-1 ps-6 pe-14 text-sm font-medium transition-all duration-500 hover:ps-14 hover:pe-6"
                >
                  <a
                    href={GITHUB_RELEASES_PAGE_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="relative z-10 transition-all duration-500">
                      {copy.secondaryCtaLabel}
                    </span>
                    <span className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
                      <ArrowUpRight size={16} />
                    </span>
                  </a>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
                className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black/35"
              >
                <video
                  autoPlay
                  className="block h-auto w-full"
                  loop
                  muted
                  playsInline
                  src={demoVideo}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
