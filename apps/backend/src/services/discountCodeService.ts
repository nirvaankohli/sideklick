import crypto from "node:crypto";

import { getDatabase } from "../db/index.ts";
import {
  getBillingSummary,
  grantFoundingBetaStatus,
  type BillingSummary,
} from "./creditService.ts";
import type { FoundingBetaStatus } from "./entitlementService.ts";

type StatementLike = {
  get(...args: unknown[]): unknown;
  run(...args: unknown[]): { changes?: number; lastInsertRowid?: number | bigint };
};

type DatabaseLike = {
  prepare(sql: string): StatementLike;
  transaction?<T>(fn: () => T): () => T;
};

export type DiscountCodeType = Exclude<FoundingBetaStatus, "none">;

type DiscountCodeRow = {
  id: string;
  codeHash: string;
  codeType: string;
  label: string | null;
  maxRedemptions: number;
  redemptionCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiscountCodePublic = {
  id: string;
  codeType: DiscountCodeType;
  label: string | null;
  maxRedemptions: number;
  redemptionCount: number;
  expiresAt: string | null;
};

export type CreatedDiscountCode = DiscountCodePublic & {
  code: string;
};

export type RedeemedDiscountCode = {
  code: DiscountCodePublic;
  alreadyRedeemed: boolean;
  billing: BillingSummary;
  maxLifetimeCheckoutItem: "founding_beta_max_lifetime";
};

export class DiscountCodeError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "DiscountCodeError";
    this.statusCode = statusCode;
  }
}

function runAtomically<T>(db: DatabaseLike, fn: () => T): T {
  return typeof db.transaction === "function" ? db.transaction(fn)() : fn();
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(normalizeCode(code)).digest("hex");
}

function generateCode(): string {
  const raw = crypto.randomBytes(9).toString("hex").toUpperCase();
  return `SKBETA-${raw.slice(0, 6)}-${raw.slice(6, 12)}-${raw.slice(12, 18)}`;
}

function normalizeDiscountCodeType(value: unknown): DiscountCodeType {
  return value === "founding_beta_max" ? "founding_beta_max" : "founding_beta_plus";
}

function mapDiscountCodeRow(row: DiscountCodeRow): DiscountCodePublic {
  return {
    id: row.id,
    codeType: normalizeDiscountCodeType(row.codeType),
    label: row.label,
    maxRedemptions: Number(row.maxRedemptions || 0),
    redemptionCount: Number(row.redemptionCount || 0),
    expiresAt: row.expiresAt,
  };
}

function getDiscountCodeByHash(
  codeHash: string,
  db: DatabaseLike,
): DiscountCodeRow | null {
  return db.prepare(
    `
      SELECT
        id,
        code_hash AS codeHash,
        code_type AS codeType,
        label,
        max_redemptions AS maxRedemptions,
        redemption_count AS redemptionCount,
        expires_at AS expiresAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM discount_codes
      WHERE code_hash = ?
      LIMIT 1
    `,
  ).get(codeHash) as DiscountCodeRow | undefined ?? null;
}

function hasUserRedeemedCode(
  userId: string,
  discountCodeId: string,
  db: DatabaseLike,
): boolean {
  const row = db.prepare(
    `
      SELECT id
      FROM discount_code_redemptions
      WHERE user_id = ? AND discount_code_id = ?
      LIMIT 1
    `,
  ).get(userId, discountCodeId) as { id: string } | undefined;
  return Boolean(row);
}

function assertRedeemable(row: DiscountCodeRow, now: Date): void {
  if (row.expiresAt) {
    const expiresAtMs = Date.parse(row.expiresAt);
    if (Number.isFinite(expiresAtMs) && expiresAtMs <= now.getTime()) {
      throw new DiscountCodeError("Invalid or expired discount code.", 404);
    }
  }

  if (Number(row.redemptionCount || 0) >= Number(row.maxRedemptions || 0)) {
    throw new DiscountCodeError("Invalid or expired discount code.", 404);
  }
}

export function createDiscountCode(
  input: {
    code?: string | null;
    codeType?: DiscountCodeType | null;
    label?: string | null;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
  },
  db: DatabaseLike = getDatabase(),
): CreatedDiscountCode {
  const code = input.code?.trim() || generateCode();
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    throw new DiscountCodeError("Discount code cannot be empty.");
  }

  const maxRedemptions = Math.max(1, Math.floor(input.maxRedemptions ?? 1));
  const id = crypto.randomUUID();
  const codeType = normalizeDiscountCodeType(input.codeType);
  const label = input.label?.trim() || null;

  try {
    db.prepare(
      `
        INSERT INTO discount_codes (
          id,
          code_hash,
          code_type,
          label,
          max_redemptions,
          expires_at,
          created_at,
          updated_at
        ) VALUES (
          @id,
          @codeHash,
          @codeType,
          @label,
          @maxRedemptions,
          @expiresAt,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `,
    ).run({
      id,
      codeHash: hashCode(normalizedCode),
      codeType,
      label,
      maxRedemptions,
      expiresAt: input.expiresAt ?? null,
    });
  } catch (error) {
    throw new DiscountCodeError(
      error instanceof Error && /unique|duplicate/i.test(error.message)
        ? "That discount code already exists."
        : "Discount code could not be created.",
    );
  }

  const row = getDiscountCodeByHash(hashCode(normalizedCode), db);
  if (!row) {
    throw new DiscountCodeError("Discount code could not be created.");
  }

  return {
    ...mapDiscountCodeRow(row),
    code,
  };
}

export function redeemDiscountCode(
  userId: string,
  input: {
    code: string;
  },
  db: DatabaseLike = getDatabase(),
  now: Date = new Date(),
): RedeemedDiscountCode {
  const normalizedCode = normalizeCode(input.code);
  if (!normalizedCode) {
    throw new DiscountCodeError("Enter a discount code.");
  }

  const redemption = runAtomically(db, () => {
    const row = getDiscountCodeByHash(hashCode(normalizedCode), db);
    if (!row) {
      throw new DiscountCodeError("Invalid or expired discount code.", 404);
    }

    const alreadyRedeemed = hasUserRedeemedCode(userId, row.id, db);
    if (alreadyRedeemed) {
      return {
        code: mapDiscountCodeRow(row),
        alreadyRedeemed,
      };
    }

    assertRedeemable(row, now);

    const updateResult = db.prepare(
      `
        UPDATE discount_codes
        SET
          redemption_count = redemption_count + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND redemption_count < max_redemptions
      `,
    ).run(row.id);
    if (updateResult.changes !== 1) {
      throw new DiscountCodeError("Invalid or expired discount code.", 404);
    }

    db.prepare(
      `
        INSERT INTO discount_code_redemptions (
          id,
          discount_code_id,
          user_id,
          redeemed_at,
          metadata
        ) VALUES (
          @id,
          @discountCodeId,
          @userId,
          CURRENT_TIMESTAMP,
          @metadata
        )
      `,
    ).run({
      id: crypto.randomUUID(),
      discountCodeId: row.id,
      userId,
      metadata: JSON.stringify({
        codeType: normalizeDiscountCodeType(row.codeType),
      }),
    });

    const nextRow = getDiscountCodeByHash(hashCode(normalizedCode), db) ?? row;
    return {
      code: mapDiscountCodeRow(nextRow),
      alreadyRedeemed: false,
    };
  });

  return {
    ...redemption,
    billing: grantFoundingBetaStatus(userId, redemption.code.codeType, db, now),
    maxLifetimeCheckoutItem: "founding_beta_max_lifetime",
  };
}

export function hasRedeemedFoundingBetaCode(
  userId: string,
  db: DatabaseLike = getDatabase(),
): boolean {
  const row = db.prepare(
    `
      SELECT redemptions.id
      FROM discount_code_redemptions redemptions
      JOIN discount_codes codes ON codes.id = redemptions.discount_code_id
      WHERE redemptions.user_id = ?
        AND codes.code_type IN ('founding_beta_plus', 'founding_beta_max')
      LIMIT 1
    `,
  ).get(userId) as { id: string } | undefined;

  if (row) {
    return true;
  }

  const summary = getBillingSummary(userId, db);
  return summary.foundingBetaStatus !== "none";
}
