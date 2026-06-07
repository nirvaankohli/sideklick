import crypto from "node:crypto";

import { getDatabase } from "../db/index.ts";
import {
  canUseCreditAction,
  getCreditActionDefinition,
  getEffectivePlan,
  getPlanDefinition,
  normalizeBillingPlan,
  normalizeFoundingBetaStatus,
  normalizeSubscriptionStatus,
  type BillingPlan,
  type CreditActionType,
  type FoundingBetaStatus,
  type SubscriptionStatus,
} from "./entitlementService.ts";

type StatementLike = {
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
  run(...args: unknown[]): { changes?: number; lastInsertRowid?: number | bigint };
};

type DatabaseLike = {
  prepare(sql: string): StatementLike;
  transaction?<T>(fn: () => T): () => T;
};

type BillingProfileRow = {
  userId: string;
  plan: string;
  subscriptionStatus: string;
  foundingBetaStatus: string;
  billingProvider: string | null;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  monthlyCreditAllowance: number;
  monthlyCreditsRemaining: number;
  purchasedCreditsRemaining: number;
  createdAt: string;
  updatedAt: string;
};

export type BillingProfile = {
  userId: string;
  plan: BillingPlan;
  effectivePlan: BillingPlan;
  subscriptionStatus: SubscriptionStatus;
  foundingBetaStatus: FoundingBetaStatus;
  billingProvider: string | null;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  monthlyCreditAllowance: number;
  monthlyCreditsRemaining: number;
  purchasedCreditsRemaining: number;
  createdAt: string;
  updatedAt: string;
};

export type BillingSummary = {
  plan: BillingPlan;
  effectivePlan: BillingPlan;
  planName: string;
  subscriptionStatus: SubscriptionStatus;
  foundingBetaStatus: FoundingBetaStatus;
  renewalDate: string | null;
  credits: {
    monthly: {
      allowance: number;
      remaining: number;
      refreshesAt: string | null;
    };
    purchased: {
      remaining: number;
    };
    totalRemaining: number;
  };
  entitlement: {
    canUseMaxFeatures: boolean;
    lifetime: boolean;
  };
  billingProvider: string | null;
};

export type CreditQuote = {
  actionType: CreditActionType;
  label: string;
  description: string;
  cost: number;
  canAfford: boolean;
  hasRequiredEntitlement: boolean;
  requiredPlan: BillingPlan | null;
  plan: BillingPlan;
  effectivePlan: BillingPlan;
  monthlyCreditsRemaining: number;
  purchasedCreditsRemaining: number;
  totalCreditsRemaining: number;
};

export type CreditReservation = {
  transactionId: string;
  actionType: CreditActionType;
  cost: number;
  status: "reserved" | "committed" | "released" | "refunded";
  monthlyCreditsUsed: number;
  purchasedCreditsUsed: number;
  alreadyProcessed: boolean;
};

type ReserveCreditsInput = {
  userId: string;
  actionType: CreditActionType;
  idempotencyKey?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | number | null;
  db?: DatabaseLike;
  now?: Date;
};

type BillingProfilePatch = {
  plan?: BillingPlan;
  subscriptionStatus?: SubscriptionStatus;
  billingProvider?: string | null;
  billingCustomerId?: string | null;
  billingSubscriptionId?: string | null;
  foundingBetaStatus?: FoundingBetaStatus;
};

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export class InsufficientCreditsError extends Error {
  quote: CreditQuote;
  statusCode = 402;

  constructor(quote: CreditQuote) {
    super("Not enough Study Credits for this action.");
    this.name = "InsufficientCreditsError";
    this.quote = quote;
  }
}

export class EntitlementError extends Error {
  quote: CreditQuote;
  statusCode = 403;

  constructor(quote: CreditQuote) {
    super("This action requires a higher SideKlick plan.");
    this.name = "EntitlementError";
    this.quote = quote;
  }
}

function getDefaultDatabase(db?: DatabaseLike): DatabaseLike {
  return db ?? getDatabase();
}

function runAtomically<T>(db: DatabaseLike, fn: () => T): T {
  return typeof db.transaction === "function" ? db.transaction(fn)() : fn();
}

function toIsoString(date: Date): string {
  return date.toISOString();
}

function getNextPeriodEnd(now: Date): Date {
  return new Date(now.getTime() + MONTH_MS);
}

function mapBillingProfile(row: BillingProfileRow): BillingProfile {
  const plan = normalizeBillingPlan(row.plan);
  const foundingBetaStatus = normalizeFoundingBetaStatus(
    row.foundingBetaStatus,
  );
  const profile = {
    userId: row.userId,
    plan,
    effectivePlan: plan,
    subscriptionStatus: normalizeSubscriptionStatus(row.subscriptionStatus),
    foundingBetaStatus,
    billingProvider: row.billingProvider,
    billingCustomerId: row.billingCustomerId,
    billingSubscriptionId: row.billingSubscriptionId,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    monthlyCreditAllowance: Number(row.monthlyCreditAllowance || 0),
    monthlyCreditsRemaining: Number(row.monthlyCreditsRemaining || 0),
    purchasedCreditsRemaining: Number(row.purchasedCreditsRemaining || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  return {
    ...profile,
    effectivePlan: getEffectivePlan(profile),
  };
}

function getBillingProfileRow(
  userId: string,
  db: DatabaseLike,
): BillingProfileRow | null {
  return db.prepare(
    `
      SELECT
        user_id AS userId,
        plan,
        subscription_status AS subscriptionStatus,
        founding_beta_status AS foundingBetaStatus,
        billing_provider AS billingProvider,
        billing_customer_id AS billingCustomerId,
        billing_subscription_id AS billingSubscriptionId,
        current_period_start AS currentPeriodStart,
        current_period_end AS currentPeriodEnd,
        monthly_credit_allowance AS monthlyCreditAllowance,
        monthly_credits_remaining AS monthlyCreditsRemaining,
        purchased_credits_remaining AS purchasedCreditsRemaining,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM user_billing_profiles
      WHERE user_id = ?
      LIMIT 1
    `,
  ).get(userId) as BillingProfileRow | undefined ?? null;
}

function createBillingProfile(
  userId: string,
  db: DatabaseLike,
  now: Date,
): BillingProfile {
  const plan = getPlanDefinition("free");
  const periodStart = toIsoString(now);
  const periodEnd = toIsoString(getNextPeriodEnd(now));

  db.prepare(
    `
      INSERT INTO user_billing_profiles (
        user_id,
        plan,
        subscription_status,
        founding_beta_status,
        current_period_start,
        current_period_end,
        monthly_credit_allowance,
        monthly_credits_remaining,
        purchased_credits_remaining,
        created_at,
        updated_at
      ) VALUES (
        @userId,
        'free',
        'inactive',
        'none',
        @periodStart,
        @periodEnd,
        @allowance,
        @allowance,
        0,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `,
  ).run({
    userId,
    periodStart,
    periodEnd,
    allowance: plan.monthlyStudyCredits,
  });

  const row = getBillingProfileRow(userId, db);
  if (!row) {
    throw new Error("Failed to create billing profile.");
  }

  return mapBillingProfile(row);
}

function insertLedgerEntry(
  db: DatabaseLike,
  input: {
    transactionId?: string | null;
    userId: string;
    actionType: string;
    entryType: string;
    creditBucket: "monthly" | "purchased" | "system";
    amount: number;
    status: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | number | null;
  },
): void {
  db.prepare(
    `
      INSERT INTO credit_ledger (
        transaction_id,
        user_id,
        action_type,
        entry_type,
        credit_bucket,
        amount,
        status,
        related_entity_type,
        related_entity_id,
        created_at
      ) VALUES (
        @transactionId,
        @userId,
        @actionType,
        @entryType,
        @creditBucket,
        @amount,
        @status,
        @relatedEntityType,
        @relatedEntityId,
        CURRENT_TIMESTAMP
      )
    `,
  ).run({
    transactionId: input.transactionId ?? null,
    userId: input.userId,
    actionType: input.actionType,
    entryType: input.entryType,
    creditBucket: input.creditBucket,
    amount: input.amount,
    status: input.status,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId:
      input.relatedEntityId === undefined || input.relatedEntityId === null
        ? null
        : String(input.relatedEntityId),
  });
}

function syncBillingProfileForPeriod(
  profile: BillingProfile,
  db: DatabaseLike,
  now: Date,
): BillingProfile {
  const planDefinition = getPlanDefinition(profile.effectivePlan);
  const expectedAllowance = planDefinition.monthlyStudyCredits;
  const periodEndMs = profile.currentPeriodEnd
    ? Date.parse(profile.currentPeriodEnd)
    : Number.NaN;
  const shouldRefresh = !Number.isFinite(periodEndMs) || periodEndMs <= now.getTime();
  const allowanceChanged = profile.monthlyCreditAllowance !== expectedAllowance;

  if (!shouldRefresh && !allowanceChanged) {
    return profile;
  }

  const periodStart = shouldRefresh
    ? toIsoString(now)
    : profile.currentPeriodStart ?? toIsoString(now);
  const periodEnd = shouldRefresh
    ? toIsoString(getNextPeriodEnd(now))
    : profile.currentPeriodEnd ?? toIsoString(getNextPeriodEnd(now));
  const nextMonthlyCreditsRemaining = shouldRefresh
    ? expectedAllowance
    : Math.min(
        expectedAllowance,
        Math.max(profile.monthlyCreditsRemaining, expectedAllowance),
      );

  db.prepare(
    `
      UPDATE user_billing_profiles
      SET
        monthly_credit_allowance = @allowance,
        monthly_credits_remaining = @monthlyCreditsRemaining,
        current_period_start = @periodStart,
        current_period_end = @periodEnd,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = @userId
    `,
  ).run({
    userId: profile.userId,
    allowance: expectedAllowance,
    monthlyCreditsRemaining: nextMonthlyCreditsRemaining,
    periodStart,
    periodEnd,
  });

  insertLedgerEntry(db, {
    userId: profile.userId,
    actionType: shouldRefresh ? "monthly_refresh" : "plan_allowance_sync",
    entryType: shouldRefresh ? "monthly_refresh" : "plan_allowance_sync",
    creditBucket: "monthly",
    amount: nextMonthlyCreditsRemaining,
    status: "committed",
  });

  const row = getBillingProfileRow(profile.userId, db);
  if (!row) {
    throw new Error("Billing profile disappeared during credit refresh.");
  }

  return mapBillingProfile(row);
}

export function getOrCreateBillingProfile(
  userId: string,
  db: DatabaseLike = getDatabase(),
  now: Date = new Date(),
): BillingProfile {
  return runAtomically(db, () => {
    const existingRow = getBillingProfileRow(userId, db);
    const profile = existingRow
      ? mapBillingProfile(existingRow)
      : createBillingProfile(userId, db, now);

    return syncBillingProfileForPeriod(profile, db, now);
  });
}

export function getBillingSummary(
  userId: string,
  db: DatabaseLike = getDatabase(),
  now: Date = new Date(),
): BillingSummary {
  const profile = getOrCreateBillingProfile(userId, db, now);
  const planDefinition = getPlanDefinition(profile.effectivePlan);

  return {
    plan: profile.plan,
    effectivePlan: profile.effectivePlan,
    planName: planDefinition.name,
    subscriptionStatus: profile.subscriptionStatus,
    foundingBetaStatus: profile.foundingBetaStatus,
    renewalDate: profile.currentPeriodEnd,
    credits: {
      monthly: {
        allowance: profile.monthlyCreditAllowance,
        remaining: profile.monthlyCreditsRemaining,
        refreshesAt: profile.currentPeriodEnd,
      },
      purchased: {
        remaining: profile.purchasedCreditsRemaining,
      },
      totalRemaining:
        profile.monthlyCreditsRemaining + profile.purchasedCreditsRemaining,
    },
    entitlement: {
      canUseMaxFeatures: profile.effectivePlan === "max",
      lifetime: profile.foundingBetaStatus !== "none",
    },
    billingProvider: profile.billingProvider,
  };
}

export function quoteCreditAction(
  userId: string,
  actionType: CreditActionType,
  db: DatabaseLike = getDatabase(),
  now: Date = new Date(),
): CreditQuote {
  const profile = getOrCreateBillingProfile(userId, db, now);
  const action = getCreditActionDefinition(actionType);
  const totalCredits =
    profile.monthlyCreditsRemaining + profile.purchasedCreditsRemaining;

  return {
    actionType,
    label: action.label,
    description: action.description,
    cost: action.cost,
    canAfford: totalCredits >= action.cost,
    hasRequiredEntitlement: canUseCreditAction(profile, actionType),
    requiredPlan: action.requiredPlan ?? null,
    plan: profile.plan,
    effectivePlan: profile.effectivePlan,
    monthlyCreditsRemaining: profile.monthlyCreditsRemaining,
    purchasedCreditsRemaining: profile.purchasedCreditsRemaining,
    totalCreditsRemaining: totalCredits,
  };
}

function getExistingTransaction(
  userId: string,
  idempotencyKey: string,
  db: DatabaseLike,
) {
  return db.prepare(
    `
      SELECT
        id,
        action_type AS actionType,
        cost,
        status,
        monthly_credits_used AS monthlyCreditsUsed,
        purchased_credits_used AS purchasedCreditsUsed
      FROM credit_transactions
      WHERE user_id = ? AND idempotency_key = ?
      LIMIT 1
    `,
  ).get(userId, idempotencyKey) as {
    id: string;
    actionType: CreditActionType;
    cost: number;
    status: CreditReservation["status"];
    monthlyCreditsUsed: number;
    purchasedCreditsUsed: number;
  } | undefined;
}

function createIdempotencyKey(input: ReserveCreditsInput): string {
  if (input.idempotencyKey?.trim()) {
    return input.idempotencyKey.trim();
  }

  return `auto:${input.actionType}:${crypto.randomUUID()}`;
}

export function reserveCredits(input: ReserveCreditsInput): CreditReservation {
  const db = getDefaultDatabase(input.db);
  const idempotencyKey = createIdempotencyKey(input);

  return runAtomically(db, () => {
    const existingTransaction = getExistingTransaction(
      input.userId,
      idempotencyKey,
      db,
    );
    if (existingTransaction) {
      return {
        transactionId: existingTransaction.id,
        actionType: existingTransaction.actionType,
        cost: Number(existingTransaction.cost),
        status: existingTransaction.status,
        monthlyCreditsUsed: Number(existingTransaction.monthlyCreditsUsed),
        purchasedCreditsUsed: Number(existingTransaction.purchasedCreditsUsed),
        alreadyProcessed: true,
      };
    }

    const quote = quoteCreditAction(
      input.userId,
      input.actionType,
      db,
      input.now ?? new Date(),
    );
    if (!quote.hasRequiredEntitlement) {
      throw new EntitlementError(quote);
    }

    if (!quote.canAfford) {
      throw new InsufficientCreditsError(quote);
    }

    const monthlyCreditsUsed = Math.min(
      quote.monthlyCreditsRemaining,
      quote.cost,
    );
    const purchasedCreditsUsed = quote.cost - monthlyCreditsUsed;
    const transactionId = crypto.randomUUID();

    db.prepare(
      `
        UPDATE user_billing_profiles
        SET
          monthly_credits_remaining = monthly_credits_remaining - @monthlyCreditsUsed,
          purchased_credits_remaining = purchased_credits_remaining - @purchasedCreditsUsed,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = @userId
      `,
    ).run({
      userId: input.userId,
      monthlyCreditsUsed,
      purchasedCreditsUsed,
    });

    db.prepare(
      `
        INSERT INTO credit_transactions (
          id,
          user_id,
          idempotency_key,
          action_type,
          cost,
          status,
          monthly_credits_used,
          purchased_credits_used,
          related_entity_type,
          related_entity_id,
          created_at,
          updated_at
        ) VALUES (
          @id,
          @userId,
          @idempotencyKey,
          @actionType,
          @cost,
          'reserved',
          @monthlyCreditsUsed,
          @purchasedCreditsUsed,
          @relatedEntityType,
          @relatedEntityId,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
    ).run({
      id: transactionId,
      userId: input.userId,
      idempotencyKey,
      actionType: input.actionType,
      cost: quote.cost,
      monthlyCreditsUsed,
      purchasedCreditsUsed,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId:
        input.relatedEntityId === undefined || input.relatedEntityId === null
          ? null
          : String(input.relatedEntityId),
    });

    if (monthlyCreditsUsed > 0) {
      insertLedgerEntry(db, {
        transactionId,
        userId: input.userId,
        actionType: input.actionType,
        entryType: "reserve",
        creditBucket: "monthly",
        amount: -monthlyCreditsUsed,
        status: "reserved",
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
      });
    }

    if (purchasedCreditsUsed > 0) {
      insertLedgerEntry(db, {
        transactionId,
        userId: input.userId,
        actionType: input.actionType,
        entryType: "reserve",
        creditBucket: "purchased",
        amount: -purchasedCreditsUsed,
        status: "reserved",
        relatedEntityType: input.relatedEntityType,
        relatedEntityId: input.relatedEntityId,
      });
    }

    return {
      transactionId,
      actionType: input.actionType,
      cost: quote.cost,
      status: "reserved",
      monthlyCreditsUsed,
      purchasedCreditsUsed,
      alreadyProcessed: false,
    };
  });
}

function getTransactionById(userId: string, transactionId: string, db: DatabaseLike) {
  return db.prepare(
    `
      SELECT
        id,
        action_type AS actionType,
        cost,
        status,
        monthly_credits_used AS monthlyCreditsUsed,
        purchased_credits_used AS purchasedCreditsUsed,
        related_entity_type AS relatedEntityType,
        related_entity_id AS relatedEntityId
      FROM credit_transactions
      WHERE user_id = ? AND id = ?
      LIMIT 1
    `,
  ).get(userId, transactionId) as {
    id: string;
    actionType: CreditActionType;
    cost: number;
    status: CreditReservation["status"];
    monthlyCreditsUsed: number;
    purchasedCreditsUsed: number;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
  } | undefined;
}

export function commitCreditReservation(
  userId: string,
  transactionId: string,
  db: DatabaseLike = getDatabase(),
): void {
  runAtomically(db, () => {
    const transaction = getTransactionById(userId, transactionId, db);
    if (!transaction || transaction.status === "committed") {
      return;
    }

    if (transaction.status !== "reserved") {
      throw new Error("Cannot commit a released credit reservation.");
    }

    db.prepare(
      `
        UPDATE credit_transactions
        SET status = 'committed', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND id = ?
      `,
    ).run(userId, transactionId);

    insertLedgerEntry(db, {
      transactionId,
      userId,
      actionType: transaction.actionType,
      entryType: "commit",
      creditBucket: "system",
      amount: 0,
      status: "committed",
      relatedEntityType: transaction.relatedEntityType,
      relatedEntityId: transaction.relatedEntityId,
    });
  });
}

export function releaseCreditReservation(
  userId: string,
  transactionId: string,
  db: DatabaseLike = getDatabase(),
): void {
  runAtomically(db, () => {
    const transaction = getTransactionById(userId, transactionId, db);
    if (!transaction || transaction.status === "released") {
      return;
    }

    if (transaction.status !== "reserved") {
      throw new Error("Only reserved Study Credits can be released.");
    }

    db.prepare(
      `
        UPDATE user_billing_profiles
        SET
          monthly_credits_remaining = monthly_credits_remaining + @monthlyCreditsUsed,
          purchased_credits_remaining = purchased_credits_remaining + @purchasedCreditsUsed,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = @userId
      `,
    ).run({
      userId,
      monthlyCreditsUsed: Number(transaction.monthlyCreditsUsed),
      purchasedCreditsUsed: Number(transaction.purchasedCreditsUsed),
    });

    db.prepare(
      `
        UPDATE credit_transactions
        SET status = 'released', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND id = ?
      `,
    ).run(userId, transactionId);

    if (transaction.monthlyCreditsUsed > 0) {
      insertLedgerEntry(db, {
        transactionId,
        userId,
        actionType: transaction.actionType,
        entryType: "release",
        creditBucket: "monthly",
        amount: Number(transaction.monthlyCreditsUsed),
        status: "released",
        relatedEntityType: transaction.relatedEntityType,
        relatedEntityId: transaction.relatedEntityId,
      });
    }

    if (transaction.purchasedCreditsUsed > 0) {
      insertLedgerEntry(db, {
        transactionId,
        userId,
        actionType: transaction.actionType,
        entryType: "release",
        creditBucket: "purchased",
        amount: Number(transaction.purchasedCreditsUsed),
        status: "released",
        relatedEntityType: transaction.relatedEntityType,
        relatedEntityId: transaction.relatedEntityId,
      });
    }
  });
}

export async function runWithCreditCharge<T>(
  input: ReserveCreditsInput,
  action: () => Promise<T>,
): Promise<T> {
  const db = getDefaultDatabase(input.db);
  const reservation = reserveCredits({
    ...input,
    db,
  });

  try {
    const result = await action();
    commitCreditReservation(input.userId, reservation.transactionId, db);
    return result;
  } catch (error) {
    releaseCreditReservation(input.userId, reservation.transactionId, db);
    throw error;
  }
}

export function updateBillingProfile(
  userId: string,
  patch: BillingProfilePatch,
  db: DatabaseLike = getDatabase(),
  now: Date = new Date(),
): BillingSummary {
  return runAtomically(db, () => {
    getOrCreateBillingProfile(userId, db, now);
    const current = getOrCreateBillingProfile(userId, db, now);
    const nextPlan = patch.plan ?? current.plan;
    const nextFoundingBetaStatus =
      patch.foundingBetaStatus ?? current.foundingBetaStatus;
    const effectivePlan = getEffectivePlan({
      plan: nextPlan,
      foundingBetaStatus: nextFoundingBetaStatus,
    });
    const nextAllowance = getPlanDefinition(effectivePlan).monthlyStudyCredits;
    const nextMonthlyCreditsRemaining =
      nextAllowance >= current.monthlyCreditAllowance
        ? Math.max(current.monthlyCreditsRemaining, nextAllowance)
        : Math.min(current.monthlyCreditsRemaining, nextAllowance);

    db.prepare(
      `
        UPDATE user_billing_profiles
        SET
          plan = @plan,
          subscription_status = @subscriptionStatus,
          founding_beta_status = @foundingBetaStatus,
          billing_provider = @billingProvider,
          billing_customer_id = @billingCustomerId,
          billing_subscription_id = @billingSubscriptionId,
          monthly_credit_allowance = @monthlyCreditAllowance,
          monthly_credits_remaining = @monthlyCreditsRemaining,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = @userId
      `,
    ).run({
      userId,
      plan: nextPlan,
      subscriptionStatus: patch.subscriptionStatus ?? current.subscriptionStatus,
      foundingBetaStatus: nextFoundingBetaStatus,
      billingProvider:
        patch.billingProvider === undefined
          ? current.billingProvider
          : patch.billingProvider,
      billingCustomerId:
        patch.billingCustomerId === undefined
          ? current.billingCustomerId
          : patch.billingCustomerId,
      billingSubscriptionId:
        patch.billingSubscriptionId === undefined
          ? current.billingSubscriptionId
          : patch.billingSubscriptionId,
      monthlyCreditAllowance: nextAllowance,
      monthlyCreditsRemaining: nextMonthlyCreditsRemaining,
    });

    insertLedgerEntry(db, {
      userId,
      actionType: "billing_profile_update",
      entryType: "billing_profile_update",
      creditBucket: "system",
      amount: 0,
      status: "committed",
    });

    return getBillingSummary(userId, db, now);
  });
}

export function addPurchasedCredits(
  userId: string,
  amount: number,
  input: {
    source: string;
    idempotencyKey?: string | null;
    db?: DatabaseLike;
    now?: Date;
  },
): BillingSummary {
  const db = getDefaultDatabase(input.db);
  const idempotencyKey =
    input.idempotencyKey?.trim() ||
    `purchase:${input.source}:${userId}:${crypto.randomUUID()}`;
  const safeAmount = Math.max(0, Math.floor(amount));

  if (safeAmount <= 0) {
    return getBillingSummary(userId, db, input.now ?? new Date());
  }

  return runAtomically(db, () => {
    getOrCreateBillingProfile(userId, db, input.now ?? new Date());
    const existingTransaction = getExistingTransaction(
      userId,
      idempotencyKey,
      db,
    );
    if (existingTransaction) {
      return getBillingSummary(userId, db, input.now ?? new Date());
    }

    const transactionId = crypto.randomUUID();
    db.prepare(
      `
        UPDATE user_billing_profiles
        SET
          purchased_credits_remaining = purchased_credits_remaining + @amount,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = @userId
      `,
    ).run({
      userId,
      amount: safeAmount,
    });

    db.prepare(
      `
        INSERT INTO credit_transactions (
          id,
          user_id,
          idempotency_key,
          action_type,
          cost,
          status,
          monthly_credits_used,
          purchased_credits_used,
          created_at,
          updated_at
        ) VALUES (
          @id,
          @userId,
          @idempotencyKey,
          @actionType,
          0,
          'committed',
          0,
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
    ).run({
      id: transactionId,
      userId,
      idempotencyKey,
      actionType: input.source,
    });

    insertLedgerEntry(db, {
      transactionId,
      userId,
      actionType: input.source,
      entryType: "purchase",
      creditBucket: "purchased",
      amount: safeAmount,
      status: "committed",
    });

    return getBillingSummary(userId, db, input.now ?? new Date());
  });
}

export function grantFoundingBetaStatus(
  userId: string,
  foundingBetaStatus: Exclude<FoundingBetaStatus, "none">,
  db: DatabaseLike = getDatabase(),
  now: Date = new Date(),
): BillingSummary {
  const plan = foundingBetaStatus === "founding_beta_max" ? "max" : "plus";
  return updateBillingProfile(
    userId,
    {
      plan,
      subscriptionStatus: "lifetime",
      foundingBetaStatus,
      billingProvider: "manual",
    },
    db,
    now,
  );
}
