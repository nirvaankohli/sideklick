import { ArrowUpRight, Flame, X } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import siteCopy from "@/content/site-copy.json";
import { foundingBetaApplicationUrl } from "@/lib/pricing";

type FoundingBetaPopupProps = {
  onDismiss: () => void;
};

export default function FoundingBetaPopup({
  onDismiss,
}: FoundingBetaPopupProps) {
  const copy = siteCopy.foundingBetaPopup;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-labelledby="founding-beta-popup-title"
      aria-modal="true"
      className="founding-beta-popup"
      initial={{ opacity: 0 }}
      role="dialog"
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <button
        aria-label={copy.dismissLabel}
        className="founding-beta-popup__backdrop"
        onClick={onDismiss}
        type="button"
      />
      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="founding-beta-popup__panel"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <button
          aria-label={copy.dismissLabel}
          className="founding-beta-popup__close"
          onClick={onDismiss}
          type="button"
        >
          <X className="size-4" />
        </button>

        <p className="founding-beta-popup__eyebrow">
          <Flame className="size-4" />
          {copy.eyebrow}
        </p>
        <h2 id="founding-beta-popup-title">{copy.heading}</h2>
        <p>{copy.body}</p>

        <div className="founding-beta-popup__actions">
          <Button asChild className="founding-beta-popup__primary" size="lg">
            <a
              href={foundingBetaApplicationUrl}
              onClick={onDismiss}
              rel="noopener noreferrer"
              target="_blank"
            >
              {copy.primaryCtaLabel}
              <ArrowUpRight className="size-4" />
            </a>
          </Button>
          <Button
            className="founding-beta-popup__secondary"
            onClick={onDismiss}
            size="lg"
            variant="outline"
          >
            {copy.secondaryCtaLabel}
          </Button>
        </div>
      </motion.section>
    </motion.div>
  );
}
