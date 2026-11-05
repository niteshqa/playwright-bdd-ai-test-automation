---
name: self-healing
description: Classify Playwright test failures and auto-repair drifted selectors / broken page-object code, then re-run to verify. Use when the user asks to "fix failing tests", "heal selectors", "auto-repair the suite", or after a deploy breaks selectors. Claude-native; no API key.
---

# Self-Healing Skill

Repairs failures caused by UI drift while protecting against masking real bugs. Read the root
`CLAUDE.md` and `docs/coding-standards.md` first. For live-DOM inspection + iterative fixing, prefer
dispatching the `test-healer` subagent (it drives the Playwright MCP and re-runs).

## Workflow

1. **Run / read failures** —
   `npx bddgen && npx playwright test --grep "<tag>" --project=chromium` (or parse
   `reports/step5_run_output.log`). Capture error + stack.
2. **Classify** per `docs/failure-taxonomy.md`: BUG / FLAKY / ENV / DRIFT / INFRA / REGRESSION_DRIFT /
   PO_BROKEN. Auto-heal only DRIFT / PO_BROKEN / REGRESSION_DRIFT. Report BUG/ENV/INFRA instead of
   patching.
3. **Locate** the broken method from the `[PageObject:Class.method]` error prefix (stacks also name
   the `steps/*.steps.js` step). Never edit generated `.features-gen/` files.
4. **Generate a fix** — inspect the live DOM (Playwright MCP `browser_snapshot` /
   `browser_generate_locator`) and propose a stable selector (role/label → testid → CSS with `.or()`
   fallbacks; regex for dynamic data). Assign a confidence.
5. **Apply** only when confidence ≥ `FIX_CONFIDENCE_THRESHOLD` (default 0.75). Keep the try/catch +
   `[PageObject:Class.method]` wrapper; annotate `// HEALED: <date> — <reason>`.
6. **Re-run** the affected test(s) to verify; iterate one fix at a time (≤2 heal cycles). Record
   changes in `reports/step5_healing_audit.md` (test, file, old→new selector, reason, confidence).
7. **If still failing** and the test logic is sound, park it: a `@fixme<Reason>` tag + `Before` hook in
   `support/hooks.js` — with an explanatory `# PARKED:` comment above the scenario.

## Rules

- Never weaken assertions to force green; fix the locator/page object, not the expectation.
- Never run `@prodWrite` scenarios to heal them (prod safety gates apply). Commit only when asked.

## Dependencies

Failure output, `pages/` (error-wrapping convention), Playwright MCP (`.mcp.json`),
`FIX_CONFIDENCE_THRESHOLD` env.
