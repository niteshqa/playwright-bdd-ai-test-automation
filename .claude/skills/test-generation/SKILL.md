---
name: test-generation
description: Generate executable Gherkin scenarios (playwright-bdd) and any needed step definitions / page-object methods from a test plan or brief, following this repo's layered conventions. Use when the user asks to "generate tests from features", "create scenario(s) from this plan", "add a scenario for…", or "scaffold automation for <scenario>". Claude-native; no API key.
---

# Test Generation Skill

Turns plans/briefs into executable scenarios. Read the root `CLAUDE.md` and
`docs/coding-standards.md` first. For UI verification + writing, prefer dispatching the
`test-generator` subagent (it can drive the Playwright MCP); use this skill's steps directly for
straightforward, code-only generation.

Every suite (regression, smoke, health check, heartbeat) is playwright-bdd: `features/**/*.feature` →
`npx bddgen` → `.features-gen/` (run by the `chromium` / `firefox` / `webkit` projects). All features
share ONE step vocabulary in `steps/` (domain files: navigation, auth, catalog, cart, checkout, order),
which calls page objects in `pages/` — see the purchase recipe in `CLAUDE.md` › "Add a test".

## Workflow

1. **Parse the source** — a `specs/*-test-plan.md` or brief. Resolve every data reference to a real
   `data/testdata.js` key (add the key there, and a resolver in `data/resolver.js` for a new data
   family).
2. **Map to steps** — match each step to an existing definition in `steps/*.steps.js` (exact
   wording). List any step with no match, and any missing page-object capability.
3. **Generate page-object methods (only if missing)** — add to the right `pages/*` class
   (`extends BasePage`), locators role/label → testid → CSS with `.or()` fallbacks, body in try/catch →
   `[PageObject:Class.method]`. A new page: `npm run new:page <Name>` (file + registry line).
4. **Generate step definitions (only if missing)** in the matching domain file
   `steps/<domain>.steps.js`: `require('../support/fixtures')` for `Given/When/Then`; bodies call
   `pages.<key>.<method>()` only; data through the resolver; cross-step state on `ctx`. Any step that
   writes data (submits an order, form, booking) must call `assertMayWrite(page.url())` from
   `support/destructiveActionGuard.js` first.
5. **Write the scenario(s)** in `features/regression/<area>.feature`: tag `@regression###` on its
   `Examples:` block. **Every scenario that uses data is a `Scenario Outline`** — steps use
   `"<placeholder>"`, values (testData keys, expected UI text) live in one tagged `Examples:` block per
   test; no literals in steps and no test data in step bodies; `@timeout:N` for slow journeys;
   `@fixme<Reason>` + `Before` hook in `support/hooks.js` for env blocks.
6. **Validate** — `npx bddgen` succeeds (no missing/ambiguous steps);
   `npx playwright test --list --project=chromium --grep "<tag>"` collects it; `npm run lint` passes.
   Do NOT run `@prodWrite` scenarios.

## Conventions (non-negotiable)

- No hardcoded data/URLs/secrets. CommonJS. Locator-free features and step files; UI detail in page
  objects.
- Production-writing scenarios are `@prodWrite`, gated by a `Before` hook (not-CI +
  `ALLOW_PROD_WRITES=true` + `--headed`).
- Commit only when the user asks.

## Dependencies

`features/`, `steps/`, `support/`, `pages/`, `data/testdata.js` + `data/resolver.js`,
`config/framework.config.js`, `playwright.config.js`.
