const { test } = require("./helpers/test-runner");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readRepoFile(...segments) {
  return fs.readFileSync(path.join(__dirname, "..", ...segments), "utf8");
}

test("web app exposes pricing and login surfaces with Study Credits plan copy", () => {
  const app = readRepoFile("apps", "web", "src", "App.tsx");
  const pricing = readRepoFile("apps", "web", "src", "components", "pricing-page.tsx");
  const login = readRepoFile("apps", "web", "src", "components", "login-page.tsx");
  const pricingData = readRepoFile("apps", "web", "src", "lib", "pricing.ts");
  const siteCopy = JSON.parse(
    readRepoFile("apps", "web", "src", "content", "site-copy.json"),
  );
  const authClient = readRepoFile("apps", "web", "src", "lib", "web-auth.ts");

  assert.match(app, /route === "pricing"/);
  assert.match(app, /route === "login"/);
  assert.match(pricing, /site-copy\.json/);
  assert.match(login, /site-copy\.json/);
  assert.match(siteCopy.pricing.body, /Study Credits/);
  assert.equal(siteCopy.login.tabs.login, "Sign in");
  assert.equal(siteCopy.login.tabs.register, "Create account");
  assert.deepEqual(
    siteCopy.pricing.plans.map((plan) => plan.name),
    ["Free", "Plus", "Max"],
  );
  assert.equal(siteCopy.pricing.plans[1].price, "$7.99/mo or $49/yr");
  assert.equal(siteCopy.pricing.plans[2].price, "$14.99/mo or $99/yr");
  assert.equal(siteCopy.pricing.creditPacks[1].name, "Finals Pack");
  assert.equal(
    siteCopy.pricing.foundingBetaApplicationUrl,
    "https://forms.gle/eFJsyvUeqwAsCuiQ9",
  );
  assert.doesNotMatch(pricing, /Prep Pack/i);
  assert.doesNotMatch(JSON.stringify(siteCopy.pricing), /Prep Pack/i);
  assert.doesNotMatch(pricingData, /Prep Pack/i);
  assert.doesNotMatch(JSON.stringify(siteCopy.pricing), /Price TBD/);
  assert.doesNotMatch(JSON.stringify(siteCopy.pricing), /Details TBD/);
  assert.match(authClient, /VITE_MANAGED_BACKEND_URL/);
  assert.match(authClient, /sideklick\.webAuthSession\.v1/);
  assert.match(authClient, /createBillingCheckout/);
  assert.match(authClient, /createBillingPortal/);
  assert.match(pricing, /plus_monthly/);
  assert.match(pricing, /max_yearly/);
  assert.match(pricing, /credits_50/);
  assert.match(pricing, /founding_beta_max_lifetime/);
  assert.match(pricing, /Manage billing/);
  assert.doesNotMatch(pricingData, /stripe/i);
});

test("desktop settings includes billing and Study Credits surfaces", () => {
  const homeHtml = readRepoFile("apps", "desktop", "src", "home.html");
  const homeJs = readRepoFile("apps", "desktop", "src", "home.js");
  const styles = readRepoFile("apps", "desktop", "src", "styles.css");

  assert.match(homeHtml, /settings-billing-link/);
  assert.match(homeHtml, /https:\/\/sideklick\.nirvaankohli\.com\/pricing/);
  assert.match(homeHtml, /Available Study Credits/);
  assert.match(homeHtml, /Refresh Date/);
  assert.match(homeHtml, /Generate Quiz/);
  assert.match(homeHtml, /2 Study Credits/);
  assert.match(homeHtml, /Generate Plan/);
  assert.match(homeHtml, /10 Study Credits/);
  assert.match(homeHtml, /Save &amp; Process - 8 Study Credits/);
  assert.match(homeHtml, /billing-modal-backdrop/);
  assert.doesNotMatch(homeHtml, /Prep Pack/i);
  assert.match(homeJs, /settingsBillingLink/);
  assert.match(homeJs, /getBillingSummary/);
  assert.match(homeJs, /createBillingCheckout/);
  assert.match(homeJs, /createBillingPortal/);
  assert.doesNotMatch(homeHtml, /Pricing Preview/);
  assert.doesNotMatch(homeHtml, /Price TBD/);
  assert.match(styles, /settings-pricing-section/);
  assert.match(styles, /study-credit-pill/);
  assert.match(styles, /settings-pricing-card-featured/);
});
