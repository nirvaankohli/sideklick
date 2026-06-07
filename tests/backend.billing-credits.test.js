const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const path = require("node:path");
const Database = require("better-sqlite3");
const { importModule } = require("./helpers/import-module");

async function loadBillingDbModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "db", "billing.ts"),
  );
}

async function loadCreditServiceModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "services", "creditService.ts"),
  );
}

async function loadDiscountCodeServiceModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "services", "discountCodeService.ts"),
  );
}

async function loadBillingServiceModule() {
  return importModule(
    path.join(__dirname, "..", "apps", "backend", "src", "services", "billingService.ts"),
  );
}

async function createBillingTestDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      password_hash TEXT,
      password_salt TEXT,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO users (id, email) VALUES ('user-1', 'student@example.com');
  `);

  const { ensureBillingTables } = await loadBillingDbModule();
  ensureBillingTables(db);
  return db;
}

test("credit deduction is server-side and idempotent by key", async () => {
  const db = await createBillingTestDb();
  const {
    commitCreditReservation,
    getBillingSummary,
    reserveCredits,
  } = await loadCreditServiceModule();

  try {
    assert.equal(getBillingSummary("user-1", db).credits.totalRemaining, 10);

    const reservation = reserveCredits({
      userId: "user-1",
      actionType: "basic_quiz",
      idempotencyKey: "quiz-request-1",
      db,
    });
    commitCreditReservation("user-1", reservation.transactionId, db);

    assert.equal(getBillingSummary("user-1", db).credits.monthly.remaining, 8);

    const duplicate = reserveCredits({
      userId: "user-1",
      actionType: "basic_quiz",
      idempotencyKey: "quiz-request-1",
      db,
    });
    assert.equal(duplicate.alreadyProcessed, true);
    assert.equal(duplicate.transactionId, reservation.transactionId);
    assert.equal(getBillingSummary("user-1", db).credits.monthly.remaining, 8);
  } finally {
    db.close();
  }
});

test("insufficient credits returns a quote without deducting", async () => {
  const db = await createBillingTestDb();
  const {
    InsufficientCreditsError,
    getBillingSummary,
    reserveCredits,
  } = await loadCreditServiceModule();

  try {
    getBillingSummary("user-1", db);
    db.prepare(
      `
        UPDATE user_billing_profiles
        SET monthly_credits_remaining = 1, purchased_credits_remaining = 0
        WHERE user_id = 'user-1'
      `,
    ).run();

    assert.throws(
      () =>
        reserveCredits({
          userId: "user-1",
          actionType: "basic_quiz",
          idempotencyKey: "quiz-too-expensive",
          db,
        }),
      InsufficientCreditsError,
    );
    assert.equal(getBillingSummary("user-1", db).credits.totalRemaining, 1);
  } finally {
    db.close();
  }
});

test("failed AI action releases reserved Study Credits", async () => {
  const db = await createBillingTestDb();
  const { getBillingSummary, runWithCreditCharge } =
    await loadCreditServiceModule();

  try {
    await assert.rejects(
      () =>
        runWithCreditCharge(
          {
            userId: "user-1",
            actionType: "cram_plan",
            idempotencyKey: "cram-failure",
            db,
          },
          async () => {
            throw new Error("model failed");
          },
        ),
      /model failed/,
    );

    assert.equal(getBillingSummary("user-1", db).credits.totalRemaining, 10);
    const transaction = db.prepare(
      "SELECT status FROM credit_transactions WHERE idempotency_key = ?",
    ).get("cram-failure");
    assert.equal(transaction.status, "released");
  } finally {
    db.close();
  }
});

test("monthly plan credits refresh and do not roll over", async () => {
  const db = await createBillingTestDb();
  const { getBillingSummary, updateBillingProfile } =
    await loadCreditServiceModule();

  try {
    updateBillingProfile("user-1", {
      plan: "plus",
      subscriptionStatus: "active",
    }, db, new Date("2026-04-01T00:00:00.000Z"));
    db.prepare(
      `
        UPDATE user_billing_profiles
        SET
          monthly_credits_remaining = 0,
          current_period_end = '2026-05-01T00:00:00.000Z'
        WHERE user_id = 'user-1'
      `,
    ).run();

    const summary = getBillingSummary(
      "user-1",
      db,
      new Date("2026-06-02T00:00:00.000Z"),
    );
    assert.equal(summary.credits.monthly.allowance, 100);
    assert.equal(summary.credits.monthly.remaining, 100);
  } finally {
    db.close();
  }
});

test("purchased credit packs persist and are used after monthly credits", async () => {
  const db = await createBillingTestDb();
  const {
    addPurchasedCredits,
    commitCreditReservation,
    getBillingSummary,
    reserveCredits,
  } = await loadCreditServiceModule();

  try {
    addPurchasedCredits("user-1", 50, {
      source: "credits_50",
      idempotencyKey: "pack-1",
      db,
    });
    db.prepare(
      `
        UPDATE user_billing_profiles
        SET monthly_credits_remaining = 0
        WHERE user_id = 'user-1'
      `,
    ).run();

    const reservation = reserveCredits({
      userId: "user-1",
      actionType: "cram_plan",
      idempotencyKey: "cram-uses-pack",
      db,
    });
    commitCreditReservation("user-1", reservation.transactionId, db);

    const summary = getBillingSummary("user-1", db);
    assert.equal(summary.credits.monthly.remaining, 0);
    assert.equal(summary.credits.purchased.remaining, 45);
  } finally {
    db.close();
  }
});

test("Max-only credit actions require Max entitlement", async () => {
  const db = await createBillingTestDb();
  const {
    EntitlementError,
    commitCreditReservation,
    getBillingSummary,
    reserveCredits,
    updateBillingProfile,
  } = await loadCreditServiceModule();

  try {
    updateBillingProfile("user-1", {
      plan: "plus",
      subscriptionStatus: "active",
    }, db);

    assert.throws(
      () =>
        reserveCredits({
          userId: "user-1",
          actionType: "deep_cram_report",
          idempotencyKey: "deep-plus",
          db,
        }),
      EntitlementError,
    );

    updateBillingProfile("user-1", {
      plan: "max",
      subscriptionStatus: "active",
    }, db);
    const reservation = reserveCredits({
      userId: "user-1",
      actionType: "deep_cram_report",
      idempotencyKey: "deep-max",
      db,
    });
    commitCreditReservation("user-1", reservation.transactionId, db);

    assert.equal(getBillingSummary("user-1", db).effectivePlan, "max");
    assert.equal(getBillingSummary("user-1", db).credits.monthly.remaining, 285);
  } finally {
    db.close();
  }
});

test("founding beta Plus and Max grants create lifetime entitlements", async () => {
  const db = await createBillingTestDb();
  const { getBillingSummary, grantFoundingBetaStatus } =
    await loadCreditServiceModule();

  try {
    const plus = grantFoundingBetaStatus(
      "user-1",
      "founding_beta_plus",
      db,
      new Date("2026-06-02T00:00:00.000Z"),
    );
    assert.equal(plus.effectivePlan, "plus");
    assert.equal(plus.subscriptionStatus, "lifetime");
    assert.equal(plus.credits.monthly.allowance, 100);

    const max = grantFoundingBetaStatus(
      "user-1",
      "founding_beta_max",
      db,
      new Date("2026-06-02T00:00:00.000Z"),
    );
    assert.equal(max.effectivePlan, "max");
    assert.equal(max.foundingBetaStatus, "founding_beta_max");
    assert.equal(max.credits.monthly.allowance, 300);
    assert.equal(getBillingSummary("user-1", db).entitlement.canUseMaxFeatures, true);
  } finally {
    db.close();
  }
});

test("founding beta discount code redeems lifetime Plus once", async () => {
  const db = await createBillingTestDb();
  const {
    DiscountCodeError,
    createDiscountCode,
    redeemDiscountCode,
  } = await loadDiscountCodeServiceModule();

  try {
    db.prepare(
      "INSERT INTO users (id, email) VALUES ('user-2', 'other@example.com')",
    ).run();

    const created = createDiscountCode({
      code: "accepted-beta-1",
      codeType: "founding_beta_plus",
      label: "Accepted founding beta applicant",
    }, db);
    assert.equal(created.code, "accepted-beta-1");
    assert.equal(created.codeType, "founding_beta_plus");
    assert.equal(created.redemptionCount, 0);

    const redeemed = redeemDiscountCode(
      "user-1",
      {
        code: " ACCEPTED-BETA-1 ",
      },
      db,
      new Date("2026-06-02T00:00:00.000Z"),
    );
    assert.equal(redeemed.alreadyRedeemed, false);
    assert.equal(redeemed.code.redemptionCount, 1);
    assert.equal(redeemed.billing.effectivePlan, "plus");
    assert.equal(redeemed.billing.subscriptionStatus, "lifetime");
    assert.equal(redeemed.billing.foundingBetaStatus, "founding_beta_plus");
    assert.equal(redeemed.maxLifetimeCheckoutItem, "founding_beta_max_lifetime");

    const duplicate = redeemDiscountCode("user-1", { code: "accepted-beta-1" }, db);
    assert.equal(duplicate.alreadyRedeemed, true);
    assert.equal(duplicate.code.redemptionCount, 1);
    assert.equal(duplicate.billing.effectivePlan, "plus");

    assert.throws(
      () => redeemDiscountCode("user-2", { code: "accepted-beta-1" }, db),
      DiscountCodeError,
    );
  } finally {
    db.close();
  }
});

test("founding beta lifetime Max checkout requires redeemed beta access", async () => {
  const db = await createBillingTestDb();
  const previousMockMode = process.env.BILLING_MOCK_MODE;
  process.env.BILLING_MOCK_MODE = "true";

  try {
    const { createCheckout } = await loadBillingServiceModule();
    const {
      createDiscountCode,
      redeemDiscountCode,
    } = await loadDiscountCodeServiceModule();

    await assert.rejects(
      () =>
        createCheckout("user-1", {
          item: "founding_beta_max_lifetime",
        }, db),
      /redeemed founding beta code/,
    );

    createDiscountCode({
      code: "max-offer-eligible",
      codeType: "founding_beta_plus",
    }, db);
    redeemDiscountCode("user-1", { code: "max-offer-eligible" }, db);

    const checkout = await createCheckout("user-1", {
      item: "founding_beta_max_lifetime",
    }, db);
    assert.equal(checkout.provider, "mock");
    assert.equal(checkout.mode, "payment");
    assert.equal(checkout.item, "founding_beta_max_lifetime");
  } finally {
    if (previousMockMode === undefined) {
      delete process.env.BILLING_MOCK_MODE;
    } else {
      process.env.BILLING_MOCK_MODE = previousMockMode;
    }
    db.close();
  }
});

test("Stripe checkout webhooks provision plans, credits, and customer ids", async () => {
  const db = await createBillingTestDb();
  const { getBillingSummary } = await loadCreditServiceModule();
  const { handleBillingWebhook } = await loadBillingServiceModule();

  try {
    handleBillingWebhook({
      rawBody: Buffer.from(JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_plus",
            client_reference_id: "user-1",
            customer: "cus_plus",
            subscription: "sub_plus",
            metadata: {
              userId: "user-1",
              item: "plus_monthly",
            },
          },
        },
      })),
      signatureHeader: null,
    }, db);

    const plus = getBillingSummary("user-1", db);
    assert.equal(plus.plan, "plus");
    assert.equal(plus.subscriptionStatus, "active");
    assert.equal(plus.billingProvider, "stripe");

    handleBillingWebhook({
      rawBody: Buffer.from(JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_credits",
            client_reference_id: "user-1",
            customer: "cus_plus",
            metadata: {
              userId: "user-1",
              item: "credits_50",
            },
          },
        },
      })),
      signatureHeader: null,
    }, db);

    const withCredits = getBillingSummary("user-1", db);
    assert.equal(withCredits.credits.purchased.remaining, 50);
    assert.equal(withCredits.billingProvider, "stripe");
  } finally {
    db.close();
  }
});

test("billing portal returns a mock session in mock mode", async () => {
  const db = await createBillingTestDb();
  const previousMockMode = process.env.BILLING_MOCK_MODE;
  process.env.BILLING_MOCK_MODE = "true";

  try {
    const { createBillingPortalSession } = await loadBillingServiceModule();
    const portal = await createBillingPortalSession("user-1", {}, db);
    assert.equal(portal.provider, "mock");
    assert.equal(portal.mock, true);
    assert.match(portal.portalUrl, /portal=mock/);
  } finally {
    if (previousMockMode === undefined) {
      delete process.env.BILLING_MOCK_MODE;
    } else {
      process.env.BILLING_MOCK_MODE = previousMockMode;
    }
    db.close();
  }
});
