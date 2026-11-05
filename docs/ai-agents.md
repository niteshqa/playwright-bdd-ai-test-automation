# AI agents

The repo is set up for [Claude Code](https://claude.com/claude-code). The agents use the Playwright
MCP servers in `.mcp.json` to drive a real browser, so no extra API key is needed.
[CLAUDE.md](../CLAUDE.md) is loaded automatically and tells Claude the architecture, conventions,
safety rules and routing.

## What's included

| Path                                    | Role                                                              |
| --------------------------------------- | ----------------------------------------------------------------- |
| `.claude/commands/qa.md`                | `/qa <target> [mode] [app] [env]`, the one-line front door        |
| `.claude/skills/pipeline-orchestrator/` | The 7-step pipeline, in 3 modes                                   |
| `.claude/skills/test-generation/`       | Plan or brief → scenarios, plus any missing steps or page methods |
| `.claude/skills/self-healing/`          | Classify failures → repair drifted selectors → re-run             |
| `.claude/agents/test-planner.md`        | Explores the app and writes `specs/<feature>-test-plan.md`        |
| `.claude/agents/test-generator.md`      | Verifies steps on the live UI and writes features and steps       |
| `.claude/agents/test-healer.md`         | Reproduces, classifies, fixes and re-runs failing tests           |

## The pipeline

```
1 Requirements → 2 Plan → 3 Explore → 4 Generate → 5 Run + self-heal → 6 Report → 7 Git (proposal only)
```

| Mode                     | Use it for                        | Weighted on                                                                                  |
| ------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `regression` _(default)_ | "test the cart", "run regression" | Run, heal and report                                                                         |
| `exploratory`            | "find defects in checkout"        | Driving the live app with edge and negative inputs; writes `reports/exploratory_findings.md` |
| `defect-triage`          | "why did last night's run fail?"  | Classifying the latest results; writes `reports/triage_report.md` (report-only)              |

Artifacts are written to `reports/step*_*.md`, `reports/execution_report.md` and
`specs/*-test-plan.md`.

## Examples

```text
/qa "login page"
/qa "checkout" exploratory
/qa "last run" defect-triage
/qa features/regression/cart.feature regression saucedemo staging
Plan tests for the product detail page
Generate scenarios from specs/product-detail-test-plan.md
The cart tests started failing after today's deploy — heal them
```

## Guardrails the agents follow

- They reuse existing steps and page methods before adding new ones, and they keep locators in page
  objects only.
- They **only auto-heal** DRIFT, REGRESSION_DRIFT and PO_BROKEN failures, at confidence ≥
  `FIX_CONFIDENCE_THRESHOLD` (default 0.75). Every fix is annotated `// HEALED: <date>`.
- They never weaken an assertion to get a test to pass.
- They never run `@prodWrite` scenarios.
- They **never commit or push** unless you ask. Step 7 only proposes a commit message.

## Optional integrations

You can add more MCP servers to `.mcp.json` so the pipeline can do more. For example:

- An issue-tracker server can read acceptance criteria from a ticket in step 1.
- A Git-hosting server can open pull requests.

Neither is required. Leave out anything your organisation hasn't approved.
