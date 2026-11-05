# Architecture

A three-layer Page Object Model driven by Gherkin:

- **Feature files** express intent.
- **Step definitions** map each sentence onto page objects.
- **Page objects** own all UI detail.

The root [CLAUDE.md](../CLAUDE.md) is the terse summary; this is the deep-dive.

## The layers

```
features/**/*.feature        ← business intent (Gherkin), @tags, Examples tables
   │  compiled by `npx bddgen` → .features-gen/ (playwright-bdd; Playwright stays the runner)
steps/*.steps.js             ← ONE shared vocabulary by domain; call page objects + assert
   │  via the `pages` / `ctx` fixtures (support/fixtures.js)
pages/*.js, pages/components ← one class per page / shared fragment: locators + UI actions
   │  extend
pages/BasePage.js            ← shared behaviour: navigation, popups, dismissers, reCAPTCHA, presence checks
```

Supporting code sits beside the layers, never between them:

- `config/`: apps × environments, the non-prod allow-list, blocked routes and dismissers
- `support/`: fixtures, hooks, the destructive-action guard, report labels and the cleanup recorder
- `data/`: test data, the Examples-key resolver and the user factory
- `utils/`: Node-side file helpers, the cleanup ledger and the health-matrix model

### Layer 1: Features (`features/`)

Features are executable Gherkin run via [playwright-bdd](https://github.com/vitalets/playwright-bdd):

| Folder        | Contents                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `regression/` | Full functional coverage (`@regression###`)                                                                     |
| `smoke/`      | A fast critical-path subset (`@smoke`)                                                                          |
| `monitoring/` | The daily health check (`@HC###`) and the 2-hourly heartbeat (`@heartbeat`); see [monitoring.md](monitoring.md) |

Every scenario opens its app with `Given the user navigates to "<app>" website`.

**Every scenario that uses data is a `Scenario Outline`.**

- Steps carry `"<placeholder>"`s, and the values live in `Examples:` tables.
- Each test gets **one `Examples:` block**, carrying that test's `@…###` tag, so `--grep` keeps selecting
  individual cases.
- Scenarios that differ only by data share one outline.
- Cells hold testData **keys** for structured data (users, products, contacts) and literal values for
  expected UI text and simple inputs.
- Step definitions take every value as a parameter; there is no test data in step bodies.
- Name each test from its data (`<column>`s in the outline title or the `Examples:` name) so reports
  don't show "Example #1".

Special tags:

| Tag                                            | Handled by                  |
| ---------------------------------------------- | --------------------------- |
| `@timeout:N`, `@retries:N`                     | playwright-bdd built-ins    |
| `@fixme<Reason>`, `@nonProdOnly`, `@prodWrite` | hooks in `support/hooks.js` |

The generated specs are gitignored. The `chromium`/`firefox`/`webkit` projects run them; playwright-bdd
requires a project's `testDir` to equal its output dir.

### Layer 2: Steps (`steps/`)

There is one shared vocabulary, organised by business domain and used by every feature, so the same
action always reads and runs the same way:

| File                  | Covers                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------- |
| `navigation.steps.js` | `the user navigates to "<app>" website`, page-level checks                             |
| `auth.steps.js`       | `the user logs in as "<user>"`, failed login / validation, logout                      |
| `catalog.steps.js`    | product list, sorting, product detail                                                  |
| `cart.steps.js`       | `their cart is empty`, `they add "<product>" to the cart`, `they open the cart`, badge |
| `checkout.steps.js`   | `they proceed to checkout`, `they enter the guest contact details`, form validation    |
| `order.steps.js`      | `they place the order` (guarded), `the order is confirmed`                             |

Rules for step bodies:

- A step body calls page objects (`pages.<key>.<method>()`) and asserts with `expect`. It contains
  **no locators**.
- A step may compose several pages.
- Data comes through [data/resolver.js](../data/resolver.js). `<key>.sku` resolves to the bare id, and
  unknown search keys pass through as literal phrases.
- State that one step leaves for a later one lives on the per-scenario `ctx` fixture (`ctx.baseUrl`,
  `ctx.loggedIn`, `ctx.lastItem`, `ctx.orderPlaced`), never in module scope.

### Layer 3: Pages (`pages/`)

| Page / component        | Owns (reference implementation)          |
| ----------------------- | ---------------------------------------- |
| `components/Header`     | menu, cart badge/link, logout            |
| `LoginPage`             | sign in, login error message             |
| `InventoryPage`         | product list, sort, add/remove from list |
| `ProductPage`           | product detail, add to cart              |
| `CartPage`              | cart lines, remove, continue / checkout  |
| `CheckoutPage`          | contact information, overview, finish    |
| `OrderConfirmationPage` | confirmation heading / message           |

Every page class follows the same pattern:

- It extends [BasePage](../pages/BasePage.js) and defines its locators in the constructor.
- Every method body is wrapped in try/catch with the `[PageObject:Class.method]` prefix (see
  [coding-standards.md](coding-standards.md)).
- `this.page` is the real Playwright `Page`, so `.or()` and the full locator API are available
  everywhere.

**BasePage** provides:

- `navigate`
- `handlePopups`, which auto-closes new windows, accepts cookie banners and runs the configured
  `dismissers`
- `dismissCookieBanner`
- reCAPTCHA detection
- `screenshot`
- the presence helpers `isShown(locator, timeout)`, `isTextShown(text)` and `isAtUrl(pattern)`

Use `isShown` for "does this appear?" checks. `locator.isVisible({ timeout })` does **not** wait, so on
a page that is still rendering it reports a false failure. `_step(name, fn)` names the phases inside a
long method in the report.

**[pages/index.js](../pages/index.js)** exports `pageRegistry`, and the `pages` fixture builds one
instance of each entry per test. `npm run new:page <Name>` adds both the file and its registry line.

## Fixtures and hooks (`support/`)

[support/fixtures.js](../support/fixtures.js) extends playwright-bdd's `test` and binds
`Given/When/Then` with `createBdd`. It provides these fixtures:

- **`pages`:** one instance of every registered page object, each wrapped by
  [stepLabels.js](../support/stepLabels.js) so its public methods appear as named report steps (for
  example `LoginPage.login (standard_user)`). Argument labels use a whitelist, so secrets never appear.
  Before the first navigation, the fixture also aborts the `blockedRoutes` from the config.
- **`ctx`:** per-scenario state shared between steps.
- **`target`:** which environment `navigates to … website` resolves against. The health check points
  it at production.
- **`healthCheck`:** turns each `@HC###` test's outcome into a status attachment for the matrix.

[support/hooks.js](../support/hooks.js) holds the `Before` hooks:

- `@fixme<Reason>` parks env-blocked scenarios with a reason.
- `@nonProdOnly` skips on production hosts.
- `@prodWrite` is the supervised-run gate.

See [safety-guards.md](safety-guards.md).

## Data (`data/`) and config (`config/`)

- [config/framework.config.js](../config/framework.config.js) is the single source of truth for URLs.
  `resolveBaseUrl(app, env)` maps app × env to a URL and honours `APP`/`TEST_ENV`/`BASE_URL`.
- [testdata.js](../data/testdata.js) holds users, products and contacts.
- [resolver.js](../data/resolver.js) maps Examples keys onto that test data.
- [userFactory.js](../data/userFactory.js) creates fresh registration users on `TEST_EMAIL_DOMAIN`.

## Configuration & tooling

- **[playwright.config.js](../playwright.config.js)**
  - Uses `defineBddConfig` to compile features into `.features-gen/`.
  - Reporters: HTML, list, Cucumber HTML/JSON, JUnit and Allure, plus JSON and blob when enabled by
    env. Allure runs with `detail: false`, so only named steps are recorded. Raw `Fill "<value>"` API
    steps would put secrets into the report.
  - Defines `chromium`/`firefox`/`webkit` projects.
  - Uses HTTP basic auth per target env.
  - `retries: 0`, because a retried write step could duplicate data.
- **[allurerc.mjs](../allurerc.mjs):** builds a single-file Allure HTML report that can be emailed.
- **CI:** GitHub Actions, Bitbucket Pipelines and Docker templates; see [ci.md](ci.md).
- **Lint/format:** `eslint.config.js` + `.prettierrc`, with a husky pre-commit hook running
  lint-staged.
