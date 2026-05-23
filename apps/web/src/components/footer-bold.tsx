export const BoldFooter = () => {
  return (
    <footer className="w-full overflow-hidden border-t border-white/10 bg-[#070707] text-white">
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-16 md:px-8 md:py-20">
        <div className="mb-16 flex w-full flex-col items-start justify-between gap-12 md:flex-row">
          <div className="max-w-md">
            <h2 className="mb-6 text-3xl font-medium tracking-tight md:text-4xl">
              Study smarter with the material you already have.
            </h2>
            <a
              href="mailto:nirvaan.kohli@gmail.com"
              className="border-b border-white pb-1 text-lg font-medium transition-all hover:text-white/70 hover:border-white/70"
            >
              nirvaan.kohli@gmail.com
            </a>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-24">
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                Product
              </p>
              <nav className="flex flex-col gap-2 text-sm text-white/75">
                <a href="#" className="hover:text-white">
                  Home
                </a>
                <a href="#how-it-helps" className="hover:text-white">
                  How it helps
                </a>
                <a href="#download" className="hover:text-white">
                  Download
                </a>
              </nav>
            </div>
            <div>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                More
              </p>
              <nav className="flex flex-col gap-2 text-sm text-white/75">
                <a href="#" className="hover:text-white">
                  Extension
                </a>
                <a href="#" className="hover:text-white">
                  Other releases
                </a>
                <a href="mailto:nirvaan.kohli@gmail.com" className="hover:text-white">
                  Contact
                </a>
              </nav>
            </div>
          </div>
        </div>

        <div className="relative w-full">
          <h1 className="pointer-events-none -mb-[2vw] select-none text-[12vw] font-black leading-none tracking-tighter text-white opacity-[0.06]">
            SIDEKLICK
          </h1>
          <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-8 pb-6">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
              © 2026 SideKlick
            </span>
            <div className="flex gap-8">
              <span className="text-xs text-white/45">Student study tools</span>
              <button className="text-xs font-medium uppercase tracking-[0.18em] text-white/65 transition-colors hover:text-white">
                Back to top ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
