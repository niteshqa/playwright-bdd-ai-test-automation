# Getting started

Goal: a green run against the bundled SauceDemo reference suite in about five minutes.

## Prerequisites

- Node.js 18+ and npm
- Git
- Optional: [Claude Code](https://claude.com/claude-code) for the AI agents (see
  [ai-agents.md](ai-agents.md))

## 1. Install

```bash
git clone <this-repo> && cd playwright-bdd-ai-test-automation
npm install                      # also installs the husky pre-commit hook
npx playwright install chromium  # add firefox webkit for cross-browser runs
```

## 2. Configure (optional)

```bash
cp .env.example .env
```

The defaults target `https://www.saucedemo.com`, so nothing needs to be set for the reference suite.
`.env` is gitignored, so this is where secrets go (basic-auth credentials, SMTP, and so on).

## 3. Run

```bash
npm run smoke                                     # @smoke scenarios
npx bddgen && npx playwright test --project=chromium
npx playwright test --grep "@regression001" --project=chromium   # a single test
npm run test:headed                               # watch it in a browser
```

Every `npm` test script runs `npx bddgen` first. That step compiles `features/**/*.feature` into
`.features-gen/`. Run it yourself before calling `npx playwright test` directly.

## 4. Read the results

| Report          | Where / how                                   |
| --------------- | --------------------------------------------- |
| Playwright HTML | `npm run test:report`                         |
| Cucumber HTML   | `npm run cucumber:report`                     |
| Allure          | `npm run allure:serve` (or `allure:generate`) |
| JUnit (for CI)  | `reports/junit/results.xml`                   |

Report steps are named after page-object methods, for example `LoginPage.login (standard_user)`.
Only whitelisted, non-secret arguments appear in those names.

## 5. Next steps

- [adapting-to-your-app.md](adapting-to-your-app.md) shows how to point the framework at your own
  app.
- [architecture.md](architecture.md) explains how the layers fit together.
- In Claude Code, try `/qa "cart page" exploratory`.
