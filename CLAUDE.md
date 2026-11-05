# CLAUDE.md — project context for AI agents

A plug-and-play Playwright + [playwright-bdd](https://github.com/vitalets/playwright-bdd) E2E framework
with Claude-native AI agents (plan → generate → run → self-heal → triage). It ships with a runnable
reference suite against the public [SauceDemo](https://www.saucedemo.com) shop; teams point
`config/framework.config.js` at their own app. This file is auto-loaded every session — read it before
acting, and dispatch the right agent/skill (see **Routing** below) instead of asking for context.

## Architecture — layers

**Features** (Gherkin) → **Steps** (step definitions) → **Pages** (page objects on a shared `BasePage`).

- **Features** ([features/](features/)) — every suite is executable Gherkin: `regression/`, `smoke/`,
  and `monitoring/` (daily health check `@HC###`, every-2-hours `@heartbeat`). `npx bddgen` compiles
  them into `.features-gen/` (gitignored), run by the `chromium`/`firefox`/`webkit` projects. Every
  scenario opens with `Given the user navigates to "<app>" website`. **Every scenario that uses data is
  a `Scenario Outline`**: steps say `"<placeholder>"`, values live in `Examples:` (testData **keys** for
  users/products/contacts, literal values for expected UI text and simple inputs), one tagged
  `Examples:` block per test. Tags: `@regression###`, `@smoke`, `@HC###`, `@heartbeat`, `@prodWrite`,
  `@nonProdOnly`, `@timeout:N`, `@retries:N`, `@fixme<Reason>`.
- **Steps** ([steps/](steps/)) — ONE shared, app-agnostic vocabulary organised by domain
  (`navigation`, `auth`, `catalog`, `cart`, `checkout`, `order`), used by every feature. Step bodies
  call page objects (`pages.<key>.<method>()`) and assert — no locators.
- **Pages** ([pages/](pages/)) — [BasePage](pages/BasePage.js) holds shared behaviour (navigate, popup
  and cookie-banner dismissal, configurable overlay dismissers, reCAPTCHA,
  `isShown`/`isTextShown`/`isAtUrl`); one class per page (`LoginPage`, `InventoryPage`, `ProductPage`,
  `CartPage`, `CheckoutPage`, `OrderConfirmationPage`) plus [components/](pages/components/)
  (`Header`) own every selector and UI action. [index.js](pages/index.js) is the `pageRegistry` the
  fixture builds from.
- **Config** ([config/framework.config.js](config/framework.config.js)) — the single plug-and-play
  surface: `apps` × env URLs, `resolveBaseUrl(app, env)`, non-prod host detection, blocked routes,
  overlay dismissers, report name.
- **Support** ([support/](support/)) — [fixtures.js](support/fixtures.js) (`pages`, `ctx` per-scenario
  state, `target` env, `healthCheck` matrix recorder; exports `Given/When/Then`),
  [hooks.js](support/hooks.js) (`@fixme…`, `@nonProdOnly`, `@prodWrite` gates),
  [destructiveActionGuard.js](support/destructiveActionGuard.js),
  [stepLabels.js](support/stepLabels.js) (page methods → named report steps, secret-free),
  [cleanupRecorder.js](support/cleanupRecorder.js).
- **Data** ([data/](data/)) — [testdata.js](data/testdata.js): users, products, contacts;
  [resolver.js](data/resolver.js) maps Examples keys → testdata (`<key>.sku` → bare id);
  [userFactory.js](data/userFactory.js) makes fresh registration users.
- **Utilities** — [utils/](utils/) (Node-side only): `fs`, `cleanupLedger`, `healthMatrix`.

## Coding standards (match the existing code)

- **Error wrapping**: every page-object method is
  `try { … } catch (e) { throw new Error('[PageObject:Class.method] ' + e.message) }`.
- **Locator precedence**: `getByRole`/`getByLabel` → `getByTestId` → CSS, with `.or()` fallbacks for
  fragile markup. `this.page` is the real Playwright `Page`.
- **Presence checks** use `this.isShown(locator, timeout)` — `locator.isVisible({ timeout })` does NOT
  wait (it samples instantly and false-fails on a page that is still rendering).
- **CommonJS** everywhere (`require`/`module.exports`); only `allurerc.mjs` is ESM.
- **Naming**: PascalCase page classes, camelCase methods/locator props, `_` prefix for private.
- **Comments** explain _intent / why_, not mechanics. Annotate selector fixes with
  `// HEALED: <date> — …`.
- **No `waitForTimeout`** for synchronization where a `waitFor`/`expect` works; never `networkidle` as
  a gate in new code.
- Run `npm run lint` + `npm run format:check` before committing (a husky pre-commit hook enforces this).

## Prod safety (do not violate)

- **Never write data on production in unattended runs** (orders, sign-ups, bookings). Such scenarios
  are tagged `@prodWrite` and are supervised-local-only, gated by three fail-closed checks: not `CI`,
  `ALLOW_PROD_WRITES=true`, and `--headed` (the `@prodWrite` hook in
  [support/hooks.js](support/hooks.js) skips otherwise).
- CI **always** excludes `@prodWrite` (`--grep-invert`).
- Every step that can write data ("they place the order", …) calls `assertMayWrite()` from
  [support/destructiveActionGuard.js](support/destructiveActionGuard.js), which refuses on any host not
  listed as dev/staging in `config/framework.config.js` unless all three checks pass. Never write
  around it.
- Data created on production is recorded in the cleanup ledger and removed by a later cleanup run —
  see [docs/safety-guards.md](docs/safety-guards.md).
- **Commit/push only when the user asks.** Secrets come from `.env` (gitignored); never hardcode them.

## Add a test

Add a scenario (or a tagged `Examples:` row) to the right `features/**/*.feature` and compose it from
the **existing shared steps** — e.g. a purchase is: `the user logs in as "<user>"` → `their cart is
empty` → `they add "<product>" to the cart` → `they open the cart` → `they proceed to checkout` →
`they enter the guest contact details` → `they place the order` → `the order is confirmed`. Only add a
step when no wording fits, in the matching `steps/<domain>.steps.js` (bodies call
`pages.<key>.<method>()`, data via `data/resolver.js`, cross-step state on `ctx`). Validate with
`npx bddgen` (fails on missing/ambiguous steps).

**Parameterise, never hardcode.**

```gherkin
Scenario Outline: Successful login with valid credentials
  When the user logs in as "<user>"
  Then the product catalog is displayed

  @regression001
  Examples: <user>
    | user     |
    | standard |
```

- One tagged `Examples:` block per test (its `@…###`, `@timeout:N`, `@fixme…` tags go on that block),
  so `--grep` selects exactly that test. Scenarios that differ only by data share one outline.
- Name it so the report reads well: `<column>`s in the outline title, or in the `Examples:` name
  (otherwise the test is called "Example #1"). Generated titles must be unique.
- Step definitions take every value as a `{string}`/`{int}` — **no test data in step bodies**; new
  fixed data goes in `data/testdata.js` and is referenced by key.
- Literals stay only where they're the step's meaning, not data: the Background app of a single-app
  feature, field/page selectors, and Gherkin DataTables used as lists.

## Add a page object

`npm run new:page <Name>` scaffolds `pages/<Name>.js extends BasePage` and registers it in
[pages/index.js](pages/index.js). Define locators in the constructor (role/label first, `.or()`
fallbacks); wrap each method's body in try/catch with the `[PageObject:Class.method]` prefix. A shared
page fragment goes in `pages/components/`. Steps reach it as `pages.<key>`.

## Commands

```bash
npm test                       # bddgen + all scenarios, all browsers
npm run smoke                  # @smoke only
npm run regression             # regression suite (excludes @prodWrite)
npm run health-check           # @HC### daily health check + matrix
npm run heartbeat              # @heartbeat availability check
npx bddgen                     # compile features → .features-gen (required before a direct `npx playwright test`)
npx playwright test --grep "@regression001" --project=chromium
npm run lint  /  npm run format
npm run allure:serve           # Allure report
npm run test:report            # open the last Playwright HTML report (never auto-opened)
```

## Routing — pick the agent/skill for the request

| Request                                                 | Use                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| "Test <area>" / "run QA on <flow>" (unscoped)           | **pipeline-orchestrator** skill — the default front door (see dispatch rule below); or type `/qa <target> [mode]`        |
| "Plan tests / design scenarios for <area>"              | **test-planner** agent ([.claude/agents/test-planner.md](.claude/agents/test-planner.md))                                |
| "Generate a scenario from a feature / test plan"        | **test-generation** skill ([.claude/skills/test-generation/](.claude/skills/test-generation/SKILL.md))                   |
| "Fix / heal a failing test or broken selector"          | **self-healing** skill + **test-healer** agent                                                                           |
| "Run the full QA pipeline / regression + heal + report" | **pipeline-orchestrator** skill ([.claude/skills/pipeline-orchestrator/](.claude/skills/pipeline-orchestrator/SKILL.md)) |
| "Exploratory test <flow>" / "poke <page> for defects"   | **pipeline-orchestrator** skill in `exploratory` mode                                                                    |
| "Triage the failures / classify what broke"             | **pipeline-orchestrator** skill in `defect-triage` mode                                                                  |

### Default dispatch rule (the "master orchestrator")

This top-level session **is** the QA orchestrator — there is no separate master agent. When the user
asks to **test / QA / check / validate** something without naming a narrower step, invoke the
**pipeline-orchestrator** skill and pick the mode from intent:

- **regression** (default) — "test X", "run the suite" → the 7 steps, run + heal + report.
- **exploratory** — "explore", "poke around", "find defects/edge cases in <flow>" → live-app defect
  hunting.
- **defect-triage** — "triage", "why did these fail?", "classify the failures" → analyze the latest
  run.

Only ask a clarifying question when the target or mode is genuinely ambiguous; otherwise state the
chosen mode and proceed. Route to a single sub-agent/skill (planner, generation, self-healing) instead
**only** when the user explicitly scopes to that one step. The `/qa` slash command
([.claude/commands/qa.md](.claude/commands/qa.md)) is the deterministic equivalent of this rule.

All agents/skills are **Claude-native** and use the Playwright MCP — no extra API key needed.

## Docs

Getting started, adapting to your app, architecture, coding standards, safety guards, monitoring and CI
live in [docs/](docs/) (see [docs/README.md](docs/README.md)). Don't re-document here what's recorded
there.
