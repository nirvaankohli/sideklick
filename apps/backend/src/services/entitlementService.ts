export type BillingPlan = "free" | "plus" | "max";
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "lifetime";
export type FoundingBetaStatus =
  | "none"
  | "founding_beta_plus"
  | "founding_beta_max";
export type CreditActionType =
  | "basic_quiz"
  | "cram_plan"
  | "graded_work_analysis"
  | "prep_pack_create"
  | "deep_cram_report";

export type BillingProfileLike = {
  plan: BillingPlan;
  foundingBetaStatus: FoundingBetaStatus;
};

export type PlanDefinition = {
  plan: BillingPlan;
  name: string;
  monthlyStudyCredits: number;
  rank: number;
};

export type CreditActionDefinition = {
  actionType: CreditActionType;
  label: string;
  description: string;
  cost: number;
  requiredPlan?: BillingPlan;
};

export const PLAN_DEFINITIONS: Record<BillingPlan, PlanDefinition> = {
  free: {
    plan: "free",
    name: "Free",
    monthlyStudyCredits: 10,
    rank: 0,
  },
  plus: {
    plan: "plus",
    name: "Plus",
    monthlyStudyCredits: 100,
    rank: 1,
  },
  max: {
    plan: "max",
    name: "Max",
    monthlyStudyCredits: 300,
    rank: 2,
  },
};

export const CREDIT_ACTIONS: Record<CreditActionType, CreditActionDefinition> = {
  basic_quiz: {
    actionType: "basic_quiz",
    label: "Generate basic quiz",
    description: "Build a focused practice quiz from class material.",
    cost: 2,
  },
  cram_plan: {
    actionType: "cram_plan",
    label: "Generate Cram Plan",
    description: "Turn notes, weak spots, and exam timing into a plan.",
    cost: 5,
  },
  graded_work_analysis: {
    actionType: "graded_work_analysis",
    label: "Analyze graded work / point leaks",
    description: "Diagnose where points are leaking and what to fix next.",
    cost: 8,
    requiredPlan: "max",
  },
  prep_pack_create: {
    actionType: "prep_pack_create",
    label: "Create Prep Pack",
    description: "Generate a shareable prep set for a class or test.",
    cost: 10,
  },
  deep_cram_report: {
    actionType: "deep_cram_report",
    label: "Generate deep Max-style cram report",
    description: "Produce a deeper Max report for high-stakes review.",
    cost: 15,
    requiredPlan: "max",
  },
};

export function normalizeBillingPlan(value: unknown): BillingPlan {
  return value === "plus" || value === "max" ? value : "free";
}

export function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus {
  return value === "active" ||
    value === "trialing" ||
    value === "past_due" ||
    value === "canceled" ||
    value === "lifetime"
    ? value
    : "inactive";
}

export function normalizeFoundingBetaStatus(value: unknown): FoundingBetaStatus {
  return value === "founding_beta_plus" || value === "founding_beta_max"
    ? value
    : "none";
}

export function normalizeCreditActionType(value: unknown): CreditActionType | null {
  return typeof value === "string" && value in CREDIT_ACTIONS
    ? (value as CreditActionType)
    : null;
}

export function getEffectivePlan(profile: BillingProfileLike): BillingPlan {
  if (profile.foundingBetaStatus === "founding_beta_max") {
    return "max";
  }

  if (profile.foundingBetaStatus === "founding_beta_plus") {
    return PLAN_DEFINITIONS[profile.plan].rank > PLAN_DEFINITIONS.plus.rank
      ? profile.plan
      : "plus";
  }

  return profile.plan;
}

export function getPlanDefinition(plan: BillingPlan): PlanDefinition {
  return PLAN_DEFINITIONS[plan];
}

export function getCreditActionDefinition(
  actionType: CreditActionType,
): CreditActionDefinition {
  return CREDIT_ACTIONS[actionType];
}

export function hasPlanEntitlement(
  profile: BillingProfileLike,
  requiredPlan: BillingPlan,
): boolean {
  return (
    PLAN_DEFINITIONS[getEffectivePlan(profile)].rank >=
    PLAN_DEFINITIONS[requiredPlan].rank
  );
}

export function canUseCreditAction(
  profile: BillingProfileLike,
  actionType: CreditActionType,
): boolean {
  const action = getCreditActionDefinition(actionType);
  return action.requiredPlan
    ? hasPlanEntitlement(profile, action.requiredPlan)
    : true;
}
