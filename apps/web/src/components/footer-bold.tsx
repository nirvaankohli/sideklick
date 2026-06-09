import { GITHUB_RELEASES_PAGE_URL } from "@/components/download-target";
import siteCopy from "@/content/site-copy.json";
import type { AuthSession } from "@/lib/web-auth";

type BoldFooterProps = {
  session: AuthSession | null;
};

export const BoldFooter = ({ session }: BoldFooterProps) => {
  const copy = siteCopy.footer;
  const moreLinks = [
    {
      label: session ? copy.accountLabel : copy.signInLabel,
      href: "/login",
    },
    ...copy.moreLinks.map((link) => ({
      ...link,
      href:
        link.href === "GITHUB_RELEASES_PAGE_URL"
          ? GITHUB_RELEASES_PAGE_URL
          : link.href,
    })),
  ];

  return (
    <footer className="site-footer w-full overflow-hidden border-t border-white/10 bg-[#070707] text-white">
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-16 md:px-8 md:py-20">
        <div className="mb-16 flex w-full flex-col items-start justify-between gap-12 md:flex-row">
          <div className="max-w-md">
            <h2 className="mb-6 text-3xl font-medium tracking-tight md:text-4xl">
              {copy.headline}
            </h2>
            <div className="flex flex-col items-start gap-2">
              {copy.contacts.map((contact) => (
                <a
                  className="border-b border-white pb-1 text-lg font-medium transition-all hover:text-white/70 hover:border-white/70"
                  href={contact.href}
                  key={contact.href}
                >
                  {contact.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-24">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                {copy.productTitle}
              </p>
              <nav className="footer-nav flex flex-col gap-2 text-sm text-white/75">
                {copy.productLinks.map((link) => (
                  <a className="hover:text-white" href={link.href} key={link.href}>
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                {copy.moreTitle}
              </p>
              <nav className="footer-nav flex flex-col gap-2 text-sm text-white/75">
                {moreLinks.map((link) => (
                  <a
                    className="hover:text-white"
                    href={link.href}
                    key={`${link.label}-${link.href}`}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    target={link.external ? "_blank" : undefined}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="relative w-full">
          <h1 className="footer-wordmark pointer-events-none -mb-[2vw] select-none text-[12vw] font-black leading-none tracking-tighter text-white opacity-[0.06]">
            {copy.wordmark}
          </h1>
          <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-8 pb-6">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
              {copy.copyright}
            </span>
            <div className="flex gap-8">
              <span className="text-xs text-white/45">{copy.tagline}</span>
              <button className="text-xs font-medium uppercase tracking-[0.18em] text-white/65 transition-colors hover:text-white">
                {copy.backToTopLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
