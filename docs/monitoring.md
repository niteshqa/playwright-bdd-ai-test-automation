# Monitoring: daily health check and heartbeat

Two production-facing, **read-only** suites live in `features/monitoring/`. They answer different
questions:

| Suite              | Tag(s)       | Cadence (CI template) | Question it answers                             | Output                               |
| ------------------ | ------------ | --------------------- | ----------------------------------------------- | ------------------------------------ |
| Daily health check | `@HC###`     | Daily (early morning) | "Is every critical feature working today?"      | Status matrix (xlsx) + full reports  |
| Heartbeat          | `@heartbeat` | Every 2 hours         | "Is the site up and can a user reach checkout?" | Email **only** on failure / recovery |

Neither suite writes data, so neither is tagged `@prodWrite`. They point at production through the
`target` fixture (the Background step sets `target.env = 'prod'`). To dry-run against staging, set
`TEST_ENV=staging`.

## Daily health check

- **One scenario per check.** Each scenario carries a single `@HC###` tag, and every check is
  independent, with its own preconditions.
- **Recording outcomes.** On teardown, the `healthCheck` fixture in `support/fixtures.js` attaches the
  test's outcome as a `health-status` JSON object: `{ app, status: { HC001: 'pass' | 'fail' } }`.
- **Running it.** Use `npm run health-check`. It sets `HEALTH_RESULTS_JSON` so Playwright also writes
  a JSON report, and runs with `--retries=2` to absorb transient noise.
- **Building the matrix.** `npm run health:matrix` (`scripts/write-health-matrix.js`) reads those
  attachments and merges them with the **plan** in `config/health-matrix.json` to write
  `reports/health-matrix.xlsx`.

### The plan file

`config/health-matrix.json` lists the matrix columns (`apps`) and every check, keyed by its `@HC###`
id, with the apps it applies to, the apps that have an automated scenario (`backed`), and an
optional policy:

```json
{
  "apps": ["saucedemo"],
  "checks": {
    "HC001": {
      "title": "Login page renders",
      "policy": "heartbeat",
      "applies": ["saucedemo"],
      "backed": ["saucedemo"]
    },
    "HC003": {
      "title": "Catalog lists products",
      "applies": ["saucedemo"],
      "backed": ["saucedemo"]
    },
    "HC008": {
      "title": "Place a real order",
      "policy": "excluded",
      "applies": ["saucedemo"],
      "backed": []
    }
  }
}
```

`utils/healthMatrix.js` resolves each cell to one of these statuses:

| Status   | Meaning                                                                              |
| -------- | ------------------------------------------------------------------------------------ |
| **PASS** | The check ran and passed                                                             |
| **FAIL** | The check ran and failed                                                             |
| **HB**   | The check is covered by the heartbeat instead (`policy: "heartbeat"`)                |
| **NA**   | The check does not apply to this app, or is `policy: "excluded"` (unsafe unattended) |
| **Skip** | Planned but not `backed` by a scenario yet, or backed but did not run                |

This keeps the matrix complete even for checks that are not automated yet.

## Heartbeat

- A handful of fast scenarios tagged `@heartbeat`: home page and logo, login, cart, guest reaches
  checkout.
- `npm run heartbeat` runs them with `--retries=1`.
- The `heartbeat.yml` workflow, and its Bitbucket equivalent, emails **only when the state changes**:
  - a failure sends an alert
  - the first green run after a failure sends a "recovered" notice
  - steady green runs stay silent, which avoids alert fatigue
- The last state is cached between runs (GitHub Actions cache / Bitbucket artifact).

## Email

`scripts/send-report-email.js` (`npm run report:email`):

- reads `reports/junit/results.xml` and builds a pass/fail summary
- attaches the single-file Allure report
- sends through `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` to `EMAIL_TO` (and `EMAIL_CC`)

Recipients come only from the environment and are never hardcoded. Set `LIGHT_REPORT=true` to turn off
failure videos so the attachment stays small.
