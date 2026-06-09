import { Check, Minus } from "lucide-react";

import siteCopy from "@/content/site-copy.json";

type ComparisonRow = {
  label: string;
  sideklick: string;
  quizlet: string;
  sideklickPositive?: boolean;
  quizletPositive?: boolean;
};

function ComparisonCell({
  text,
  positive = true,
  emphasize = false,
}: {
  text: string;
  positive?: boolean;
  emphasize?: boolean;
}) {
  const Icon = positive ? Check : Minus;

  return (
    <div
      className={[
        "compare-value-cell flex min-h-24 items-start gap-3 border-t border-white/10 px-4 py-4 text-sm leading-6 text-foreground/82 md:min-h-0 md:px-5",
        emphasize ? "bg-white/6" : "bg-black/18",
      ].join(" ")}
    >
      <span
        className={[
          "compare-icon mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.65rem]",
          positive
            ? "border-violet-300/30 bg-violet-300/10 text-violet-100"
            : "border-white/12 bg-white/8 text-foreground/70",
        ].join(" ")}
      >
        <Icon className="size-3" />
      </span>
      <span className="font-medium text-foreground">{text}</span>
    </div>
  );
}

function MobileComparisonCard({
  brand,
  text,
  positive = true,
  emphasize = false,
}: {
  brand: string;
  text: string;
  positive?: boolean;
  emphasize?: boolean;
}) {
  const Icon = positive ? Check : Minus;

  return (
    <div
      className={[
        "compare-mobile-card rounded-2xl border px-3 py-3",
        emphasize
          ? "border-violet-200/20 bg-violet-300/10"
          : "border-white/10 bg-black/20",
      ].join(" ")}
    >
      <div className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-foreground/55">
        {brand}
      </div>
      <div className="mt-3 flex items-start gap-2.5">
        <span
          className={[
            "compare-icon mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.65rem]",
            positive
              ? "border-violet-300/30 bg-violet-300/10 text-violet-100"
              : "border-white/12 bg-white/8 text-foreground/70",
          ].join(" ")}
        >
          <Icon className="size-3" />
        </span>
        <span className="text-sm font-medium leading-5 text-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}

export default function CompareSection() {
  const copy = siteCopy.home.compare;
  const comparisonRows = copy.rows as ComparisonRow[];

  return (
    <section className="compare-section px-0 py-0" id="compare">
      <div className="mx-auto max-w-5xl">
        <div className="compare-shell border-0 bg-transparent backdrop-blur-[2px]">
          <div className="compare-top-row grid gap-3 border-b border-white/10 px-4 py-5 md:grid-cols-[1.1fr_1fr_1fr] md:items-stretch md:px-5">
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                {copy.heading}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-foreground/72">
                {copy.body}
              </p>
            </div>
            <div className="compare-sideklick-card border border-violet-200/20 bg-violet-300/10 px-4 py-4 md:h-full">
              <div className="text-sm font-medium text-foreground">
                {copy.sideklick.name}
              </div>
              <p className="mt-1 text-sm leading-6 text-foreground/72">
                {copy.sideklick.description}
              </p>
            </div>
            <div className="compare-quizlet-card border border-white/10 bg-black/18 px-4 py-4 md:h-full">
              <div className="text-sm font-medium text-foreground">
                {copy.quizlet.name}
              </div>
              <p className="mt-1 text-sm leading-6 text-foreground/72">
                {copy.quizlet.description}
              </p>
            </div>
          </div>

          <div className="hidden md:grid md:grid-cols-[1.1fr_1fr_1fr]">
            {comparisonRows.map((row) => (
              <div className="contents" key={row.label}>
                <div className="compare-label-cell border-t border-white/10 bg-black/30 px-5 py-4 text-sm font-medium text-foreground">
                  {row.label}
                </div>
                <ComparisonCell
                  emphasize
                  positive={row.sideklickPositive}
                  text={row.sideklick}
                />
                <ComparisonCell
                  positive={row.quizletPositive}
                  text={row.quizlet}
                />
              </div>
            ))}
          </div>

          <div className="md:hidden">
            {comparisonRows.map((row) => (
              <div
                className="compare-mobile-row border-t border-white/10 px-4 py-5"
                key={row.label}
              >
                <div className="max-w-[18rem] text-[0.95rem] font-medium leading-6 text-foreground">
                  {row.label}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MobileComparisonCard
                    brand={copy.sideklick.name}
                    emphasize
                    positive={row.sideklickPositive}
                    text={row.sideklick}
                  />
                  <MobileComparisonCard
                    brand={copy.quizlet.name}
                    positive={row.quizletPositive}
                    text={row.quizlet}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
