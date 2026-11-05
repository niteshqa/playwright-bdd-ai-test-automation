# Failure taxonomy

This is the reference for classifying test failures. Two consumers use it to decide whether to
auto-fix, retry, or escalate a failure:

- the **self-healing** skill ([.claude/skills/self-healing/SKILL.md](../.claude/skills/self-healing/SKILL.md))
- Step 5 of the [pipeline-orchestrator](../.claude/skills/pipeline-orchestrator/SKILL.md)

## Types

Classify every failure into exactly one type. The type determines the action.

| Type                 | Meaning                                                     | Action                                                                                                                 |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **BUG**              | App behavior differs from the acceptance criteria           | Real defect: report it in the triage/execution report (file a ticket only if asked). Do **not** heal the test.         |
| **FLAKY**            | Intermittent timeout / race                                 | Replace the racy wait with a deterministic `waitFor`/`expect`; retry ≤ `RETRY_COUNT`.                                  |
| **ENV**              | Environment issue (reCAPTCHA challenge, auth, network)      | Log environment detail; `test.skip` with a reason. Not a code fix. See [recaptcha-handling.md](recaptcha-handling.md). |
| **DRIFT**            | Selector no longer matches DOM (markup changed)             | Inspect live DOM (Playwright MCP), pick a stable `getByRole`/`getByLabel`, patch the page object, `// HEALED: <date>`. |
| **REGRESSION_DRIFT** | Previously-passing selector went stale post-deploy          | Same as DRIFT; annotate `// HEALED: <date> — <old> → <new>`.                                                           |
| **PO_BROKEN**        | Page-object method throws (the `[PageObject:Class.method]`) | Use the error prefix to jump to the method; re-derive the selector from the live DOM and repair.                       |
| **INFRA**            | Slow response / large payload timeout                       | Raise the step timeout (`@timeout:N`) or split the test; not a selector fix.                                           |

**Heal only DRIFT, REGRESSION_DRIFT and PO_BROKEN**, and only when confidence is at or above
`FIX_CONFIDENCE_THRESHOLD` (default 0.75). Never "heal" BUG or ENV failures, because doing so would
hide a real problem.

## Severity & retry strategy

| Severity    | Types                   | Strategy                            | Max attempts | Skip? |
| ----------- | ----------------------- | ----------------------------------- | ------------ | ----- |
| 🔴 Critical | BUG, PO_BROKEN          | Fail fast; report (ticket if asked) | 0            | No    |
| 🟡 High     | DRIFT, REGRESSION_DRIFT | Auto-heal once, retry 1×            | 2            | No    |
| 🟠 Medium   | FLAKY                   | Retry up to `RETRY_COUNT`           | 3            | No    |
| 🟢 Low      | ENV, INFRA              | Log & skip                          | 0            | Yes   |

## Known patterns for your app

Each app has its own quirks: slow SPA navigations, overlays that intercept clicks, sandbox payment
rules, and so on. Record them in a table here as you find them, so that people and agents check it
before deep-debugging a "new" failure:

| Symptom | Root cause | Mitigation |
| ------- | ---------- | ---------- |
|         |            |            |
