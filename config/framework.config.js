// ─────────────────────────────────────────────────────────────────────────────
// framework.config.js — the ONE file a team edits to point this framework at its own app.
//
// Everything app-specific that the core (BasePage, fixtures, guards, reporters) needs lives here:
// which apps exist and their URL per environment, which hosts count as non-production (safe for
// destructive actions such as placing orders), third-party traffic to block, and overlay popups to
// dismiss. See docs/adapting-to-your-app.md.
// ─────────────────────────────────────────────────────────────────────────────

const config = {
  // Report title used by Allure and the email summary.
  reportName: process.env.REPORT_NAME || 'E2E Regression Report',

  // App used when a step/env doesn't name one. Override with APP=<key>.
  defaultApp: 'saucedemo',

  // Environment used when none is given. Override with TEST_ENV=dev|staging|prod.
  defaultEnv: 'staging',

  // System-under-test URLs: apps × environments. Add one key per app (storefront, admin portal,
  // back office…); features pick one with `Given the user navigates to "<app>" website`.
  // The public demo app has a single host, so all three envs point to it; it is listed as
  // non-prod below so the demo checkout can run unattended.
  apps: {
    saucedemo: {
      dev: 'https://www.saucedemo.com',
      staging: 'https://www.saucedemo.com',
      prod: 'https://www.saucedemo.com',
    },
  },

  // Hosts that are NOT production. The destructive-action guard (support/destructiveActionGuard.js)
  // allows writes (orders, bookings, account changes) only on these; every other host — including
  // one we don't recognise — fails closed. By default, every dev/staging URL above is non-prod;
  // list extra hosts here. Remove saucedemo.com when you plug in your own app.
  extraNonProdHosts: ['www.saucedemo.com'],

  // Third-party requests aborted for every test (RUM/analytics beacons that add latency or CORS
  // noise and are never asserted on). Regexes matched against the request URL.
  blockedRoutes: [/google-analytics\.com|googletagmanager\.com|doubleclick\.net|hotjar/i],

  // Overlays (newsletter/promo modals, chat widgets) dismissed after each navigation. Each entry
  // is a CSS selector for the CLOSE control; `removeSelector` (optional) is stripped from the DOM
  // if the close control can't be clicked. Cookie banners (OneTrust and common "Accept All"
  // buttons) are handled by BasePage already.
  dismissers: [
    // { name: 'newsletter', selector: '.newsletter-modal [aria-label="Close"]', removeSelector: '.newsletter-modal, .modal-backdrop' },
  ],

  // Attribute that page.getByTestId() reads. Playwright's default is data-testid; the demo app
  // uses data-test. Set this to whatever your app's markup uses.
  testIdAttribute: process.env.TEST_ID_ATTRIBUTE || 'data-test',

  // Where BasePage.screenshot() writes.
  screenshotDir: 'reports/screenshots',
};

const ENV_ALIASES = {
  dev: 'dev',
  development: 'dev',
  stg: 'staging',
  stage: 'staging',
  staging: 'staging',
  qa: 'staging',
  prod: 'prod',
  production: 'prod',
  live: 'prod',
};

function normalizeEnv(env) {
  return (
    ENV_ALIASES[String(env || process.env.TEST_ENV || config.defaultEnv).toLowerCase()] ||
    config.defaultEnv
  );
}

// Resolve the base URL for an app + environment. BASE_URL (blanket override) wins, so any run can
// be pointed at a preview/local build without touching this file.
function resolveBaseUrl(app, env) {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const appKey = String(app || process.env.APP || config.defaultApp).toLowerCase();
  const urls = config.apps[appKey];
  if (!urls) {
    throw new Error(
      `[framework.config] Unknown app "${appKey}". Known apps: ${Object.keys(config.apps).join(', ')}`
    );
  }
  return urls[normalizeEnv(env)] || urls[config.defaultEnv];
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

// Every host that is safe for destructive actions.
function nonProdHosts() {
  const urls = Object.values(config.apps).flatMap((u) => [u.dev, u.staging]);
  return new Set(
    [...urls.map(hostOf), ...config.extraNonProdHosts.map((h) => h.toLowerCase())].filter(Boolean)
  );
}

function isNonProdUrl(url) {
  const host = hostOf(url);
  return !!host && nonProdHosts().has(host);
}

// HTTP Basic-Auth credentials for gated environments: <ENV>_AUTH_USERNAME / <ENV>_AUTH_PASSWORD
// (e.g. STAGING_AUTH_USERNAME). Each environment keeps its own pair — sending one env's password to
// another returns 401 on the first navigation. Returns undefined when the env isn't gated.
function httpCredentialsFor(env) {
  const prefix = normalizeEnv(env).toUpperCase();
  const username = process.env[`${prefix}_AUTH_USERNAME`];
  const password = process.env[`${prefix}_AUTH_PASSWORD`];
  return username && password ? { username, password } : undefined;
}

module.exports = {
  ...config,
  normalizeEnv,
  resolveBaseUrl,
  nonProdHosts,
  isNonProdUrl,
  hostOf,
  httpCredentialsFor,
};
