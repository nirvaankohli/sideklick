import { useState } from "react";
import { ArrowUpRight, Check, Coins, Info, Loader2 } from "lucide-react";
import { motion } from "motion/react";

import Header from "@/components/shadcn-space/blocks/hero-01/header";
import { Button } from "@/components/ui/button";
import siteCopy from "@/content/site-copy.json";
import {
  creditActionCosts,
  creditPacks,
  foundingBetaHighlights,
  pricingPlans,
} from "@/lib/pricing";
import { getSiteNavigation } from "@/lib/site-navigation";
import {
  AuthApiError,
  createBillingCheckout,
  createBillingPortal,
  type AuthSession,
  type CheckoutItem,
} from "@/lib/web-auth";

type PricingPageProps = {
  session: AuthSession | null;
};

export default function PricingPage({ session }: PricingPageProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const FoundingBetaIcon = foundingBetaHighlights.icon;
  const copy = siteCopy.pricing;

  function getErrorMessage(error: unknown): string {
    if (error instanceof AuthApiError || error instanceof Error) {
      return error.message;
    }
    return "Billing request failed.";
  }

  async function startCheckout(item: CheckoutItem) {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setPendingAction(item);
    setErrorMessage("");
    try {
      const origin = window.location.origin;
      const checkout = await createBillingCheckout(session, {
        item,
        successUrl: `${origin}/pricing?checkout=success`,
        cancelUrl: `${origin}/pricing?checkout=cancelled`,
      });
      window.location.href = checkout.checkoutUrl;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function openBillingPortal() {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setPendingAction("portal");
    setErrorMessage("");
    try {
      const portal = await createBillingPortal(session, {
        returnUrl: `${window.location.origin}/pricing?portal=return`,
      });
      window.location.href = portal.portalUrl;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  function getPlanCheckoutItems(planName: string): CheckoutItem[] {
    if (planName === "Plus") {
      return ["plus_monthly", "plus_yearly"];
    }
    if (planName === "Max") {
      return ["max_monthly", "max_yearly"];
    }
    return [];
  }

  function getCheckoutLabel(item: CheckoutItem): string {
    const labels: Record<CheckoutItem, string> = {
      plus_monthly: "Monthly",
      plus_yearly: "Yearly",
      max_monthly: "Monthly",
      max_yearly: "Yearly",
      credits_50: "Buy +50",
      finals_pack: "Buy finals pack",
      founding_beta_max_lifetime: "Buy lifetime Max",
    };
    return labels[item];
  }

  return (
    <>
      <Header
        homeHref="/"
        navigationData={getSiteNavigation("pricing", session)}
      />
      <section className="pricing-page relative overflow-hidden px-4 pb-28 pt-36 md:px-8 md:pb-36 md:pt-44">
        <div className="pricing-page__grid" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <p className="mb-5 text-xs font-medium uppercase text-foreground/48">
              {copy.eyebrow}
            </p>
            <h1 className="text-5xl font-medium leading-[1.02] text-foreground md:text-7xl">
              {copy.headingPrefix}{" "}
              <span className="font-instrument-serif italic">
                {copy.headingEmphasis}
              </span>
              {copy.headingSuffix}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-foreground/68 md:text-lg md:leading-8">
              {copy.body}
            </p>
          </motion.div>

          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {pricingPlans.map((plan, index) => {
              const Icon = plan.icon;
              const external = plan.ctaHref.startsWith("mailto:");

              return (
                <motion.article
                  animate={{ opacity: 1, y: 0 }}
                  className="pricing-plan-card"
                  data-accent={plan.accent}
                  initial={{ opacity: 0, y: 28 }}
                  key={plan.name}
                  transition={{
                    duration: 0.75,
                    delay: 0.08 * index,
                    ease: "easeInOut",
                  }}
                >
                  <div className="pricing-plan-card__top">
                    <span className="pricing-plan-card__icon">
                      <Icon className="size-4" />
                    </span>
                    <span className="pricing-plan-card__note">
                      <Info className="size-3.5" />
                      {plan.note}
                    </span>
                  </div>

                  <div>
                    <p className="pricing-plan-card__audience">
                      {plan.audience}
                    </p>
                    <h2>{plan.name}</h2>
                    <p className="pricing-plan-card__price">{plan.price}</p>
                    <p className="pricing-plan-card__description">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="pricing-plan-card__features">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check className="size-4" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="pricing-plan-card__cta"
                    size="lg"
                    variant={plan.accent === "focused" ? "default" : "outline"}
                  >
                    <a
                      href={plan.ctaHref}
                      rel={external ? "noopener noreferrer" : undefined}
                    >
                      {plan.ctaLabel}
                      <ArrowUpRight className="size-4" />
                    </a>
                  </Button>
                  {getPlanCheckoutItems(plan.name).length > 0 ? (
                    <div className="pricing-plan-card__actions">
                      {getPlanCheckoutItems(plan.name).map((item) => (
                        <Button
                          className="pricing-plan-card__mini-cta"
                          disabled={pendingAction !== null}
                          key={item}
                          onClick={() => void startCheckout(item)}
                          size="sm"
                          type="button"
                          variant={item.endsWith("yearly") ? "default" : "outline"}
                        >
                          {pendingAction === item ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          {getCheckoutLabel(item)}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </motion.article>
              );
            })}
          </div>
          {session ? (
            <div className="pricing-page__account-actions mt-5">
              <Button
                disabled={pendingAction !== null}
                onClick={() => void openBillingPortal()}
                size="lg"
                type="button"
                variant="outline"
              >
                {pendingAction === "portal" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Manage billing
              </Button>
            </div>
          ) : null}
          {errorMessage ? (
            <p className="pricing-page__message pricing-page__message--error">
              {errorMessage}
            </p>
          ) : null}
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.25fr]">
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="pricing-page__disclaimer text-left"
              initial={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.75, delay: 0.28, ease: "easeInOut" }}
            >
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Coins className="size-4" />
                {copy.creditPacksHeading}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {creditPacks.map((pack) => (
                  <article className="pricing-mini-card" key={pack.name}>
                    <div>
                      <p className="pricing-mini-card__kicker">{pack.credits}</p>
                      <h2>{pack.name}</h2>
                    </div>
                    <div className="pricing-mini-card__price">{pack.price}</div>
                    <p>{pack.description}</p>
                    <Button
                      className="pricing-mini-card__button"
                      disabled={pendingAction !== null}
                      onClick={() =>
                        void startCheckout(
                          pack.name === "Finals Pack" ? "finals_pack" : "credits_50",
                        )
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {pendingAction ===
                      (pack.name === "Finals Pack" ? "finals_pack" : "credits_50") ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : null}
                      {pack.name === "Finals Pack" ? "Buy pack" : "Buy credits"}
                    </Button>
                  </article>
                ))}
              </div>
            </motion.section>

            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="pricing-page__disclaimer text-left"
              initial={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.75, delay: 0.34, ease: "easeInOut" }}
            >
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <FoundingBetaIcon className="size-4" />
                {foundingBetaHighlights.title}
              </div>
              <p>{foundingBetaHighlights.body}</p>
              <Button
                className="pricing-beta-cta mt-5"
                disabled={pendingAction !== null}
                onClick={() => void startCheckout("founding_beta_max_lifetime")}
                size="lg"
                type="button"
                variant="default"
              >
                {pendingAction === "founding_beta_max_lifetime" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Buy lifetime Max
                <ArrowUpRight className="size-4" />
              </Button>
              <Button
                asChild
                className="pricing-beta-cta mt-3"
                size="lg"
                variant="outline"
              >
                <a
                  href={foundingBetaHighlights.ctaHref}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {foundingBetaHighlights.ctaLabel}
                  <ArrowUpRight className="size-4" />
                </a>
              </Button>
              <div className="pricing-cost-grid mt-5">
                {creditActionCosts.map((action) => (
                  <div className="pricing-cost-row" key={action.label}>
                    <span>{action.label}</span>
                    <strong>{action.cost}</strong>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          <div className="pricing-page__disclaimer mt-8">
            <p>{copy.disclaimer}</p>
          </div>
        </div>
      </section>
    </>
  );
}
