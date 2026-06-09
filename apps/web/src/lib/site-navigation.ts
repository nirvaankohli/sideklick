import type { NavigationSection } from "@/components/shadcn-space/blocks/hero-01/header";
import siteCopy from "@/content/site-copy.json";
import type { AuthSession } from "@/lib/web-auth";

export type SiteRoute = "home" | "pricing" | "login";

export function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

export function getRouteFromPathname(pathname: string): SiteRoute {
  const normalized = normalizePathname(pathname);
  if (normalized === "/pricing") {
    return "pricing";
  }
  if (normalized === "/login") {
    return "login";
  }
  return "home";
}

export function getSiteNavigation(
  activeRoute: SiteRoute,
  session: AuthSession | null,
): NavigationSection[] {
  const nav = siteCopy.navigation;
  const links = nav.links.map((link) => ({
    title: link.title,
    href: link.href,
    isActive: link.route === activeRoute,
  }));

  return [
    ...links,
    {
      title: session ? nav.accountTitle : nav.signInTitle,
      href: nav.accountHref,
      isActive: activeRoute === "login",
    },
  ];
}
