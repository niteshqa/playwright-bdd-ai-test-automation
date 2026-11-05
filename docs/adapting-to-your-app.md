# Adapting the framework to your app

The framework is app-agnostic. The SauceDemo pages, steps and features are a working **reference
implementation**. Keep them while you learn the patterns, then replace them with your own.

## Checklist

### 1. Register your app and environments in `config/framework.config.js`

```js
apps: {
  shop: {
    dev: 'https://dev.shop.example.com',
    staging: 'https://staging.shop.example.com',
    prod: 'https://www.shop.example.com',
  },
},
defaultApp: 'shop',
```

How these values are used:

- `resolveBaseUrl(app, env)` picks the URL.
  - `APP` and `TEST_ENV` select the defaults.
  - `BASE_URL` overrides everything.
  - Env aliases: `dev`/`development`, `stg`/`stage`/`staging`, `prod`/`production`/`www`.
- The `dev` and `staging` hosts become the **non-prod allow-list** used by the safety guard (see
  [safety-guards.md](safety-guards.md)). Anything else is treated as production.
- `blockedRoutes`: a list of regexes for third-party traffic to abort, such as analytics/RUM beacons
  that add flakiness.
- `dismissers`: selectors for site-specific overlays (newsletter popups, promo modals) that
  `BasePage.handlePopups()` should close after each navigation.
- `reportName`: the title used on the Allure report.

### 2. Add credentials, if your environments are gated, to `.env`

```bash
STAGING_AUTH_USERNAME=…   STAGING_AUTH_PASSWORD=…   # HTTP basic auth, picked per target env
DEV_AUTH_USERNAME=…       DEV_AUTH_PASSWORD=…
```

### 3. Scaffold page objects

```bash
npm run new:page Search
```

This command:

- creates `pages/SearchPage.js`, which extends `BasePage`
- includes a try/catch template using the `[PageObject:SearchPage.method]` error prefix
- adds a `search` entry to `pageRegistry` in `pages/index.js`

Steps then reach the page as `pages.search`.

Locators belong in the constructor. Prefer `getByRole`/`getByLabel`, then `getByTestId`, then CSS,
with `.or()` fallbacks. See [coding-standards.md](coding-standards.md).

### 4. Add test data to `data/testdata.js`

- Users, products, contacts and any new data family, each keyed by a short name.
- Add a resolver in `data/resolver.js` for any new family.
- Put secrets in `.env` (`process.env.X`). Never write them into `testdata.js`.

### 5. Reuse or add steps in `steps/<domain>.steps.js`

- Reuse the existing wording wherever it fits. Add a step only when no wording fits.
- Step bodies call `pages.<key>.<method>()` and assert.
- Any step that writes data must call `assertMayWrite(page.url())` first.

### 6. Write features in `features/regression/<area>.feature`

- Each feature starts with `Background: Given the user navigates to "<app>" website`.
- Scenarios are `Scenario Outline`s with one tagged `Examples:` block per test (`@regression###`).

### 7. Let the agents help

In Claude Code:

- `/qa "search page"` plans, explores, generates, runs and heals.
- `/qa "search page" exploratory` hunts for defects first.

### 8. Validate

```bash
npx bddgen
npx playwright test --list --project=chromium
npm run lint
npm run format:check
```

### 9. Wire up CI

Copy or adjust the templates described in [ci.md](ci.md).

## Removing the reference implementation

Once your own suite is in place, delete:

- the SauceDemo `pages/*`, including any unused components, and their `pageRegistry` entries
- the SauceDemo-only steps
- `features/**`
- the `saucedemo` entries in `config/framework.config.js` and `data/testdata.js`

Keep the following, because it is the framework itself:

- `BasePage`
- `support/`
- `utils/`
- `scripts/`
- `.claude/`
