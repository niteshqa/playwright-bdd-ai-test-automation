---
description: Run the 7-step QA pipeline (regression | exploratory | defect-triage) for a target
argument-hint: <target> [mode] [app] [env]
---

Run the **pipeline-orchestrator** skill (`.claude/skills/pipeline-orchestrator/SKILL.md`) end-to-end
for this request. Read the root `CLAUDE.md` first for architecture, conventions, and prod-safety rules.

**Request:** $ARGUMENTS

Interpret the arguments as `<target> [mode] [app] [env]`:

- **target** — the feature/flow/page to exercise (e.g. "cart page", "guest checkout", a
  `features/**/*.feature` path, or a `specs/*-test-plan.md`). Required.
- **mode** — one of `regression` (default), `exploratory`, `defect-triage`. If omitted, infer from the
  wording; if still unclear, default to `regression` and say so.
- **app** — a key of `apps` in `config/framework.config.js` (default: `defaultApp`).
  **env** — dev | staging | prod (default staging).

Then execute the skill in the selected mode. Honor the non-negotiables from `CLAUDE.md`:

- **Never write data on production in unattended runs**; CI/agent runs exclude `@prodWrite`.
- **Commit/push only if I explicitly ask** — step 7 proposes a commit, it does not auto-commit.
- Defect triage is **report-only** (classify + root-cause + write the triage report; no ticket filing).

Finish with a short summary: mode run, target, pass/fail/healed counts (or exploratory/triage
findings), and the artifact paths written under `reports/` and `specs/`.
