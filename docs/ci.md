# Continuous integration

Templates ship for GitHub Actions, Bitbucket Pipelines and Docker. Every template follows the same
rules:

- They run `npm run lint` and `npm run format:check` before any browser work.
- They run `npx bddgen` before Playwright.
- They use **chromium only**. Add `--project=firefox`/`webkit` if you need cross-browser coverage.
- They **always** pass `--grep-invert "@prodWrite"`, and `CI=true` additionally makes the
  destructive-action guard refuse production writes.
- They upload `reports/` (HTML, Allure, JUnit, Cucumber) as artifacts.

## GitHub Actions (`.github/workflows/`)

| Workflow           | Trigger                   | Runs                                                                  |
| ------------------ | ------------------------- | --------------------------------------------------------------------- |
| `ci.yml`           | push / pull request       | lint + format + bddgen + `@smoke`                                     |
| `regression.yml`   | weekday schedule + manual | full regression (excl. `@prodWrite`), Allure + email                  |
| `health-check.yml` | daily schedule + manual   | `@HC###` against prod with `--retries=2`, health-matrix xlsx artifact |
| `heartbeat.yml`    | every 2 hours + manual    | `@heartbeat`; emails only on failure or recovery                      |

Configure these in **Settings → Secrets and variables → Actions**:

| Name                                               | Type     | Used for                              |
| -------------------------------------------------- | -------- | ------------------------------------- |
| `BASE_URL`, `APP`, `TEST_ENV`                      | variable | Target selection (optional)           |
| `STAGING_AUTH_USERNAME` / `_PASSWORD`              | secret   | HTTP basic auth on gated environments |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | secret   | Report email                          |
| `EMAIL_TO`, `EMAIL_CC`                             | variable | Report recipients                     |

Adjust the `cron` lines to your timezone; GitHub schedules run in UTC.

## Bitbucket Pipelines (`bitbucket-pipelines.yml`)

- **Default pipeline:** lint, then a smoke run.
- **Custom pipelines:** `regression`, `health-check` and `heartbeat`. Trigger them manually, or attach
  them to schedules under **Repository settings → Schedules**.
- **Parallel runs across apps:** the regression pipeline shows how to run one `APP` per parallel step.
  Each step writes a blob report, and the blobs are merged with `npx playwright merge-reports`.
- **Variables:** define the same names as above under **Repository variables**, marking secrets as
  secured.

## Docker

```bash
docker compose run --rm e2e                       # default: npm run regression
docker compose run --rm e2e npm run smoke
```

- The `Dockerfile` builds on the official Playwright image (with browsers preinstalled) at the same
  version as `@playwright/test`. Keep them in sync when you upgrade.
- `docker-compose.yml` loads `.env` and mounts `reports/` back to the host.

## Other CI systems

Any runner works. The minimal sequence is:

```bash
npm ci
npx playwright install --with-deps chromium
npm run lint && npm run format:check
npx bddgen
CI=true npx playwright test --project=chromium --grep-invert "@prodWrite"
```

Publish `reports/junit/results.xml` to your CI's test-results view, and archive `reports/`.
