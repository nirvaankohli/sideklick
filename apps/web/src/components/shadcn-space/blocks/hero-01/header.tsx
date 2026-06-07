"use client";

import { useCallback, useEffect, useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  downloadAssetToDevice,
  useDownloadTarget,
} from "@/components/download-target";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { motion } from "motion/react";

import Logo from "@/assets/logo/logo";
import { Button } from "@/components/ui/button";

export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};

type HeaderProps = {
  navigationData: NavigationSection[];
  className?: string;
  homeHref?: string;
};

const CollaborateButton = ({ className }: { className?: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { canDownload, downloadFileName, downloadLabel, downloadUrl, isMobile } =
    useDownloadTarget();

  if (isMobile) {
    return (
      <Button
        className={cn(
          "group relative h-10 w-fit cursor-pointer overflow-hidden rounded-full p-1 ps-4 pe-12 text-sm font-medium transition-all duration-500 hover:ps-12 hover:pe-4",
          className,
        )}
        disabled
        title="Desktop app downloads are only available on desktop devices."
      >
        <span className="relative z-10 transition-all duration-500">
          {downloadLabel}
        </span>
        <span className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
          <ArrowUpRight size={16} />
        </span>
      </Button>
    );
  }

  return (
    <Button
      className={cn(
        "group relative h-10 w-fit cursor-pointer overflow-hidden rounded-full p-1 ps-4 pe-12 text-sm font-medium transition-all duration-500 hover:ps-12 hover:pe-4",
        className,
      )}
      disabled={isDownloading || !canDownload}
      onClick={() => {
        void (async () => {
          if (!canDownload) {
            return;
          }
          try {
            setIsDownloading(true);
            await downloadAssetToDevice(downloadUrl, downloadFileName);
          } finally {
            setIsDownloading(false);
          }
        })();
      }}
    >
      <span className="relative z-10 transition-all duration-500">
        {isDownloading ? "Downloading..." : downloadLabel}
      </span>
      <span className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </span>
    </Button>
  );
};

const Header = ({
  navigationData,
  className,
  homeHref = "#",
}: HeaderProps) => {
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize, handleScroll]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-center px-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-fit w-full max-w-6xl items-center justify-between gap-3.5 transition-all duration-500 lg:gap-6 max-lg:rounded-full max-lg:border max-lg:border-white/18 max-lg:bg-black/42 max-lg:p-2.5 max-lg:shadow-xl max-lg:shadow-black/20 max-lg:backdrop-blur-xl",
          sticky
            ? "rounded-full border border-border/40 bg-background/60 p-2.5 shadow-2xl shadow-primary/5 backdrop-blur-lg"
            : "",
        )}
      >
        <div>
          <a href={homeHref}>
            <Logo className="site-header-logo gap-3" />
          </a>
        </div>

        <div>
          <NavigationMenu className="max-lg:hidden rounded-full bg-muted p-0.5">
            <NavigationMenuList className="flex gap-0">
              {navigationData.map((navItem) => (
                <NavigationMenuItem key={navItem.title}>
                  <NavigationMenuLink
                    href={navItem.href}
                    className={cn(
                      "rounded-full px-2 py-2 text-sm font-medium tracking-normal text-muted-foreground outline outline-transparent transition hover:bg-background hover:text-foreground hover:outline-border hover:shadow-xs lg:px-4",
                      navItem.isActive ? "bg-background text-foreground" : "",
                    )}
                  >
                    {navItem.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <CollaborateButton className="hidden lg:flex" />

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger">
                <span className="block rounded-full border border-white/24 bg-white/8 p-2 text-white shadow-sm backdrop-blur-md">
                  <Menu width={20} height={20} />
                  <span className="sr-only">Menu</span>
                </span>
              </SheetTrigger>

              <SheetContent
                showCloseButton={false}
                side="right"
                className="w-full border-l border-white/10 bg-[#050505]/96 p-0 text-white backdrop-blur-2xl sm:w-96"
              >
                <div className="flex items-center justify-between border-b border-white/10 p-6">
                  <a href={homeHref}>
                    <Logo className="site-menu-logo gap-2" />
                  </a>
                  <SheetClose id="mobile-menu-close">
                    <span className="block rounded-full border border-white/20 bg-white/8 p-2.5 text-white backdrop-blur-md">
                      <X width={16} height={16} />
                    </span>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-12 overflow-y-auto px-6 pb-6">
                  <div className="flex flex-col gap-8">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <NavigationMenu
                      orientation="vertical"
                      className="items-start flex-none"
                    >
                      <NavigationMenuList className="flex flex-col items-start gap-3">
                        {navigationData.map((item) => (
                          <NavigationMenuItem key={item.title}>
                            <NavigationMenuLink
                              href={item.href}
                              className={cn(
                                "group/nav flex items-center rounded-2xl border border-transparent px-4 py-3 text-2xl font-semibold tracking-tight transition-all hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                                item.isActive
                                  ? "border-white/14 bg-white/8 text-white"
                                  : "text-white/72 hover:translate-x-2 hover:border-white/10 hover:bg-white/6 hover:text-white",
                              )}
                            >
                              <div
                                className={cn(
                                  "h-0.5 overflow-hidden bg-primary transition-all duration-300",
                                  item.isActive
                                    ? "w-0 opacity-0"
                                    : "w-0 opacity-0 group-hover/nav:mr-2 group-hover/nav:w-4 group-hover/nav:opacity-100",
                                )}
                              />
                              {item.title}
                            </NavigationMenuLink>
                          </NavigationMenuItem>
                        ))}
                      </NavigationMenuList>
                    </NavigationMenu>

                    <div className="w-fit">
                      <CollaborateButton />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      © 2026 SideKlick
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
