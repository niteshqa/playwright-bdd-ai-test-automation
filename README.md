# Playwright BDD AI Test Automation

A plug-and-play end-to-end test framework built on **Playwright** and **Gherkin (playwright-bdd)**, with
**Claude-native AI agents** that plan, generate, run, self-heal and triage tests.

Clone it, point one config file at your web app, and you have:

- readable Gherkin suites (regression, smoke, health check, heartbeat)
- a shared, reusable step vocabulary
- page objects with consistent error reporting
- safety guards for production
- rich reports and CI templates

It ships with a working reference suite against the public [SauceDemo](https://www.saucedemo.com)
shop, so `npm test` passes out of the box.

## Features

- **Gherkin-first, Playwright-native.** Features compile to plain Playwright tests via
  [playwright-bdd](https://github.com/vitalets/playwright-bdd), so you get Playwright's runner,
  traces, parallelism and all three browsers (Chromium, Firefox, WebKit).
- **Three clean layers.** Features → shared steps → page objects on a common `BasePage`. Locators live
  only in page objects.
- **Data-driven by default.** Every data-bearing scenario is a `Scenario Outline` whose `Examples:`
  cells are keys into `data/testdata.js`. Adding a test case means adding a row.
- **AI agents (Claude Code).** Use `/qa <target>` for a 7-step pipeline (Requirements → Plan → Explore →
  Generate → Run + Heal → Report → Git) in `regression`, `exploratory` or `defect-triage` mode, plus
  dedicated planner, generator and healer agents. The agents use the Playwright MCP and need no extra
  API key.
- **Self-healing.** Failures are classified (BUG / FLAKY / ENV / DRIFT / PO_BROKEN …). Only selector
  drift is auto-repaired, and every fix is annotated `// HEALED: <date>`.
- **Production safety.**
  - A fail-closed guard blocks any data-writing step on non-allow-listed hosts.
  - `@prodWrite` scenarios are supervised-only.
  - A record-then-clean-up ledger handles test data created on production.
- **Monitoring suites.** A daily health check (`@HC###`) writes a status matrix to xlsx. A 2-hourly
  heartbeat (`@heartbeat`) emails only on failure or recovery.
- **Reporting.**
  - Playwright HTML, Cucumber HTML/JSON, JUnit and single-file Allure reports.
  - Report steps are named after page-object methods, and arguments are whitelisted so secrets never
    appear.
  - Optional email summary.
- **Built-in resilience.** Popup, cookie-banner and overlay dismissal; reCAPTCHA detection; presence
  helpers that actually wait.
- **CI-ready.** Templates for GitHub Actions, Bitbucket Pipelines and Docker. Lint, format and a husky
  pre-commit hook are included.

## Quick start

```bash
git clone <this-repo> && cd playwright-bdd-ai-test-automation
npm install
npx playwright install chromium
cp .env.example .env          # optional — defaults target SauceDemo
npm run smoke                 # compile features + run @smoke
npm test -- --project=chromium
npm run test:report           # open the HTML report
```

To use it on your own app, see [docs/adapting-to-your-app.md](docs/adapting-to-your-app.md). The
short version:

1. Add your app's URLs to `config/framework.config.js`.
2. Run `npm run new:page <Name>` for each page.
3. Write features from the shared steps, or ask Claude: `/qa "checkout flow"`.

## Architecture

```
features/**/*.feature         Business intent (Gherkin) + @tags + Examples tables
      │  npx bddgen → .features-gen/  (Playwright stays the runner)
steps/*.steps.js              One shared vocabulary by domain; calls page objects, asserts
      │  via fixtures: pages · ctx · target · healthCheck   (support/fixtures.js)
pages/*.js, pages/components  One class per page: locators + UI actions
      │  extends
pages/BasePage.js             navigate · popups · dismissers · reCAPTCHA · isShown/isAtUrl

config/framework.config.js    apps × envs, non-prod hosts, blocked routes, dismissers
support/                      hooks · destructive-action guard · step labels · cleanup recorder
data/                         testdata · Examples-key resolver · user factory
utils/                        fs · cleanup ledger · health matrix
```

## Scripts

| Script                                                  | What it does                                     |
| ------------------------------------------------------- | ------------------------------------------------ |
| `npm test`                                              | bddgen + every scenario on every browser project |
| `npm run smoke`                                         | `@smoke` scenarios                               |
| `npm run regression`                                    | Regression suite, excluding `@prodWrite`         |
| `npm run health-check`                                  | `@HC###` daily health check (feeds the matrix)   |
| `npm run heartbeat`                                     | `@heartbeat` availability check                  |
| `npm run test:headed` / `test:debug` / `test:ui`        | Headed, inspector, or UI mode                    |
| `npm run test:report`                                   | Open the last Playwright HTML report             |
| `npm run cucumber:report`                               | Open the Cucumber HTML report                    |
| `npm run allure:serve` / `allure:generate`              | Serve or build the single-file Allure report     |
| `npm run report:email`                                  | Email a run summary (SMTP settings from `.env`)  |
| `npm run health:matrix`                                 | Write the health-check status matrix (xlsx)      |
| `npm run new:page <Name>`                               | Scaffold a page object and register it           |
| `npm run lint` / `lint:fix` / `format` / `format:check` | ESLint + Prettier                                |

## AI agents

This repo is set up for [Claude Code](https://claude.com/claude-code); `CLAUDE.md` is loaded
automatically.

| Ask / command                       | What runs                                               |
| ----------------------------------- | ------------------------------------------------------- |
| `/qa "cart page"`                   | Full 7-step pipeline, regression mode                   |
| `/qa "checkout" exploratory`        | Live-app defect hunting, proposed scenarios             |
| `/qa "last run" defect-triage`      | Classify + root-cause the latest failures (report-only) |
| "Plan tests for the login page"     | `test-planner` agent → `specs/*-test-plan.md`           |
| "Generate scenarios from this plan" | `test-generator` agent / `test-generation` skill        |
| "Fix the failing tests"             | `test-healer` agent / `self-healing` skill              |

See [docs/ai-agents.md](docs/ai-agents.md).

## Documentation

- [Getting started](docs/getting-started.md)
- [Adapting to your app](docs/adapting-to-your-app.md)
- [Architecture](docs/architecture.md) · [Coding standards](docs/coding-standards.md)
- [AI agents](docs/ai-agents.md) · [Failure taxonomy](docs/failure-taxonomy.md)
- [Safety guards](docs/safety-guards.md) · [Monitoring](docs/monitoring.md) · [CI](docs/ci.md)
- [reCAPTCHA handling](docs/recaptcha-handling.md)

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md), and report security issues as described in
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
