---
name: pipeline-orchestrator
description: The QA orchestrator (master pipeline) for this Playwright + playwright-bdd framework — the 7 steps Requirements → Plan → Explore → Generate → Run+Heal → Report → Git, in three modes (regression | exploratory | defect-triage). Use whenever the user asks to "test / QA / check / validate <area or flow>" without scoping to a single step, or explicitly to "run the full QA pipeline", "run regression", "exploratory test <flow>", "triage the failures", or wants end-to-end test automation for a feature/ticket. Claude-native (Playwright MCP + subagents); no API key.
---

# Pipeline Orchestrator (Claude-native, 7 steps, 3 modes)

The **master QA orchestrator** — the top-level session runs this; there is no separate master agent.
Owns the end-to-end QA workflow, dispatching the `test-planner`, `test-generator`, and `test-healer`
subagents and writing artifacts to `reports/` and `specs/`. Read the root `CLAUDE.md` first for
architecture, conventions, and **prod-safety** rules.

## Modes (pick from the request; default = regression)

- **regression** _(default)_ — full 7 steps, weighted on **Run & self-heal + Report**. Use for "test X",
  "run the suite/regression", CI-style validation. Generates/updates scenarios as needed, runs them,
  heals drift, reports.
- **exploratory** — **Explore-heavy, no auto-generation.** Drive the live app via the Playwright MCP
  to hunt defects: happy path first, then probe edge/negative inputs (empty/invalid form fields,
  quantity limits, empty cart, bad credentials, back/refresh mid-flow), capture screenshots +
  console/network errors. Output candidate defects and _proposed_ new scenarios to
  `reports/exploratory_findings.md`; only generate scenarios if the user then asks. Skips destructive
  prod actions.
- **defect-triage** — **report-only, no browser run required.** Ingest the latest results
  (`reports/junit/results.xml`, `reports/step5_run_output.log`, Playwright traces) and classify each
  failure: **real defect** | **test drift / selector** | **environment / data** | **flaky**. Dedupe
  related failures, root-cause each, and write `reports/triage_report.md` (severity, suspected cause,
  suggested owner/next action). Does **not** file tickets. If drift is found, offer to hand off to the
  `self-healing` skill.

## Configuration

Read config from the user's request + env vars (with sensible defaults):

- `APP` (a key of `apps` in `config/framework.config.js`), `TEST_ENV` (dev|staging|prod, default
  staging) → `resolveBaseUrl(app, env)`; `BASE_URL` overrides both.
- Feature/plan source: a `features/**/*.feature` path or a `specs/*-test-plan.md`.
- `FIX_CONFIDENCE_THRESHOLD` (default 0.75), browser project (default chromium).
- Honor: never run `@prodWrite` scenarios unattended; commit only when the user asks.

## The 7 steps

1. **Ingest requirements** — parse the target `features/**/*.feature` (Feature/Scenario/Examples) or
   the user's brief / ticket text. Resolve Examples keys via `data/resolver.js` → `data/testdata.js`.
   Write `reports/step1_requirements_analysis.md`.
2. **Plan** — dispatch the **test-planner** agent to expand scenarios into a test matrix (happy/edge/
   negative, data-driven). Save to `specs/<feature>-test-plan.md`.
3. **Explore** — using the Playwright MCP browser, map stable selectors per page/action (role/label →
   testid → CSS) and note blockers (reCAPTCHA, overlays). Write `reports/step3_exploratory_findings.md`
   (+ screenshots).
4. **Generate** — dispatch the **test-generator** agent (and/or the `test-generation` skill) to add
   scenarios to `features/**/*.feature` (reusing `steps/*.steps.js` first, adding step definitions
   only when needed). Validate with `npx bddgen` + `npx playwright test --list --project=chromium` +
   `npm run lint`.
5. **Run & self-heal** — run the suite via Bash
   (`npx bddgen && npx playwright test --project=<proj> --grep-invert "@prodWrite"`). Classify each
   failure per `docs/failure-taxonomy.md`. For DRIFT/PO_BROKEN/REGRESSION_DRIFT, dispatch
   **test-healer** / the `self-healing` skill (apply fixes ≥ threshold, annotate `// HEALED: <date>`).
   Re-run failed tests (≤2 heal cycles). Write `reports/step5_run_output.log` +
   `reports/step5_healing_audit.md`.
6. **Report** — compile `reports/execution_report.md`: totals (pass/fail/flaky/skipped/healed/duration),
   results by tag + scenario, failure analysis, coverage matrix, healing audit, recommendations.
7. **Git** — summarize changed artifacts (new scenarios/step definitions, updated plan, reports, healed
   page objects) and a proposed commit message. **Only commit/push when the user explicitly asks.**

## Orchestration notes

- Run independent steps' subagents in parallel where safe; keep step order otherwise.
- If a step fails critically, halt and report the reason + partial artifacts produced.
- CI always excludes `@prodWrite`; never collect/run production-writing tests here. Secrets via `.env`
  only.

## Dependencies

- Subagents: `.claude/agents/{test-planner,test-generator,test-healer}.md`.
- Child skills: `.claude/skills/test-generation/SKILL.md`, `.claude/skills/self-healing/SKILL.md`.
- Playwright MCP (`.mcp.json`); the framework in `features/` → `steps/` → `pages/` (fixtures/hooks in
  `support/`), data in `data/testdata.js`, environments in `config/framework.config.js`.
