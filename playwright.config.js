const { defineConfig, devices } = require('@playwright/test');
const { defineBddConfig, cucumberReporter } = require('playwright-bdd');
require('dotenv').config();
const framework = require('./config/framework.config');

// playwright-bdd compiles features/**/*.feature (+ the step defs below) into plain Playwright
// test() files under .features-gen — Playwright stays the runner, so projects, reporters,
// retries/workers and fixtures work as usual. Every `npm run test*` script runs `bddgen` first;
// run `npx bddgen` yourself before a direct `npx playwright test`.
//
// Per-scenario timeouts/retries use playwright-bdd's built-in tags on an Examples block:
// @timeout:240000, @retries:2.
const bddConfig = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['steps/**/*.js', 'support/fixtures.js', 'support/hooks.js'],
  outputDir: './.features-gen',
});

// Output paths are env-overridable so parallel CI shards can each write their own files.
const reporters = [
  [
    'html',
    {
      outputFolder: process.env.PLAYWRIGHT_HTML_REPORT_DIR || 'reports/playwright-report',
      // Never auto-open: 'on-failure' leaves a report server running and the run never exits.
      open: 'never',
    },
  ],
  ['list'],
  // Cucumber-style HTML (features → scenarios → Given/When/Then) + standard Cucumber JSON.
  cucumberReporter('html', {
    outputFile: process.env.CUCUMBER_HTML_REPORT || 'reports/cucumber-report/index.html',
  }),
  cucumberReporter('json', {
    outputFile: process.env.CUCUMBER_JSON_REPORT || 'reports/cucumber-report/report.json',
  }),
  [
    'junit',
    { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE || 'reports/junit/results.xml' },
  ],
  [
    'allure-playwright',
    {
      resultsDir: process.env.PLAYWRIGHT_ALLURE_DIR || 'reports/allure-results',
      // Record only our named steps (page-object methods, labelled secret-free by
      // support/stepLabels.js). detail:true would also record raw `Fill "<value>"` steps, which
      // puts real passwords and card numbers into a report that gets emailed.
      detail: false,
    },
  ],
];

// HEALTH_RESULTS_JSON=<path> → JSON report that scripts/write-health-matrix.js reads to build the
// health-check status matrix (set by `npm run health-check`).
if (process.env.HEALTH_RESULTS_JSON) {
  reporters.push(['json', { outputFile: process.env.HEALTH_RESULTS_JSON }]);
}

// PW_BLOB=true → also emit a blob report so parallel shards can be fused into one HTML report
// with `npx playwright merge-reports`. Give each shard its own file name to avoid collisions.
if (process.env.PW_BLOB === 'true') {
  reporters.push([
    'blob',
    {
      outputDir: process.env.PLAYWRIGHT_BLOB_DIR || 'blob-report',
      fileName: process.env.PLAYWRIGHT_BLOB_FILE || undefined,
    },
  ]);
}

// The run's target comes from the same resolver the steps use, so config and steps can't disagree
// about which environment is under test.
const targetUrl = framework.resolveBaseUrl();

module.exports = defineConfig({
  outputDir: './reports/test-results/artifacts',
  // End-to-end purchase journeys on real environments can take 1–2 minutes; raise per scenario
  // with @timeout:N rather than here.
  timeout: 120000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Suites that create data (orders, accounts) must not auto-retry: a retry after the submit step
  // duplicates the record. Opt in per scenario with @retries:N, or per run with --retries.
  retries: 0,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 1,
  reporter: reporters,
  use: {
    baseURL: targetUrl,
    testIdAttribute: framework.testIdAttribute,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // LIGHT_REPORT=true turns videos off so a self-contained report stays small enough to email.
    video: process.env.LIGHT_REPORT === 'true' ? 'off' : 'retain-on-failure',
    httpCredentials: framework.httpCredentialsFor(),
    ...(process.env.GEOLOCATION_LATITUDE && process.env.GEOLOCATION_LONGITUDE
      ? {
          permissions: ['geolocation'],
          geolocation: {
            latitude: parseFloat(process.env.GEOLOCATION_LATITUDE),
            longitude: parseFloat(process.env.GEOLOCATION_LONGITUDE),
          },
        }
      : {}),
  },
  // testDir must equal the bddConfig output exactly. CI runs chromium only.
  projects: [
    {
      name: 'chromium',
      testDir: bddConfig,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'firefox',
      testDir: bddConfig,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'webkit',
      testDir: bddConfig,
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
