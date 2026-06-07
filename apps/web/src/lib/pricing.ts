import { BookOpenCheck, Crown, Flame, Target } from "lucide-react";

import siteCopy from "@/content/site-copy.json";

const pricingIconMap = {
  BookOpenCheck,
  Crown,
  Flame,
  Target,
};

type PricingIconName = keyof typeof pricingIconMap;
type PricingAccent = "neutral" | "focused" | "school";

type PricingPlanCopy = Omit<PricingPlan, "accent" | "icon"> & {
  accent: PricingAccent;
  icon: PricingIconName;
};

type FoundingBetaCopy = {
  icon: PricingIconName;
  title: string;
  body: string;
  ctaLabel: string;
};

export type PricingPlan = {
  name: string;
  price: string;
  audience: string;
  description: string;
  note: string;
  ctaLabel: string;
  ctaHref: string;
  accent: "neutral" | "focused" | "school";
  features: string[];
  icon: typeof BookOpenCheck;
};

export type CreditPack = {
  name: string;
  credits: string;
  price: string;
  description: string;
};

export const foundingBetaApplicationUrl =
  siteCopy.pricing.foundingBetaApplicationUrl;

export const pricingPlans: PricingPlan[] = (
  siteCopy.pricing.plans as PricingPlanCopy[]
).map((plan) => ({
  ...plan,
  icon: pricingIconMap[plan.icon] ?? BookOpenCheck,
}));

export const creditPacks: CreditPack[] = siteCopy.pricing.creditPacks;

export const creditActionCosts = siteCopy.pricing.creditActionCosts;

const foundingBetaCopy =
  siteCopy.pricing.foundingBetaHighlights as FoundingBetaCopy;

export const foundingBetaHighlights = {
  ...foundingBetaCopy,
  icon: pricingIconMap[foundingBetaCopy.icon] ?? Flame,
  ctaHref: foundingBetaApplicationUrl,
};
