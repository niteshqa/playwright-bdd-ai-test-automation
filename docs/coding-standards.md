# Coding standards

These describe what the codebase already does; keep new code consistent with them. ESLint and
Prettier enforce the mechanical rules. This doc covers the conventions that tooling can't check.

## Error wrapping

Every page-object method wraps its body and rethrows with a `[PageObject:Class.method]` prefix. That
way a failure points to the exact page method and, via the stack, the step that called it.

```js
async proceedToCheckout() {
  try {
    await this.checkoutButton.click();
    await this.page.waitForURL(/checkout-step-one/);
  } catch (error) {
    throw new Error(`[PageObject:CartPage.proceedToCheckout] ${error.message}`);
  }
}
```

Typed or sentinel errors (for example `err.code = 'NOT_FOUND'`) may be re-thrown unwrapped, so that
callers can branch on them.

## Locator strategy

Precedence, most stable first:

1. `getByRole(...)` / `getByLabel(...)`: accessibility-first.
2. `getByTestId(...)` or stable `data-*` attributes. `playwright.config.js` can set `testIdAttribute`
   to match your app, e.g. `data-test`.
3. CSS / id / name selectors, combined with `.or()` fallbacks for fragile markup.

Additional rules:

- `this.page` is the real Playwright `Page`, so `.or()` and the full locator API work everywhere.
- Prefer `:visible` when a page renders hidden mobile and visible desktop variants of the same control.
- For visibility checks, use `BasePage.isShown(locator, timeout)`. `locator.isVisible({ timeout })`
  does **not** wait.
- Locators live only in page objects. Step definitions call `pages.<key>.<method>()` and never touch
  the DOM.

## Naming

- **Page classes:** PascalCase (`CheckoutPage`), one per file in `pages/`, registered in `pageRegistry`
  ([pages/index.js](../pages/index.js)).
- **Feature files:** `features/<suite>/<area>.feature`.
- **Step files:** `steps/<domain>.steps.js`.
- **Methods and locator properties:** camelCase (`checkoutButton`, `fillContactDetails`).
- **Private members:** `_` prefix (`_row`, `_step`).
- **Tags:** `@<suite><nnn>` (`@regression001`, `@HC003`), plus `@smoke` and `@heartbeat`.

## Comments

Comments explain **intent / why**, not obvious mechanics.

- Annotate selector repairs inline: `// HEALED: 2026-01-15 — <what changed and why the old selector failed>`.
- Mark unverified scaffolds `// SCAFFOLD: selectors unverified`.

## Synchronization

- Don't use `page.waitForTimeout()` as a synchronization gate where `waitFor`, `expect` or `isShown`
  works.
- Don't introduce `networkidle` waits in new code.
- `retries: 0` is intentional, because tests that write data must not silently re-run. Use
  `@retries:N` per read-only scenario instead.

## Modules

Use CommonJS (`require` / `module.exports`) throughout. `allurerc.mjs` is the only ESM file.

## Data and secrets

- Feature files hold keys. `data/testdata.js` holds values. Secrets come from `.env` via
  `process.env`.
- Never commit `.env`, `reports/` output, or the cleanup ledger.

## Lint & format

```bash
npm run lint          # eslint .
npm run lint:fix      # eslint . --fix
npm run format        # prettier --write .
npm run format:check  # prettier --check .
```

A husky pre-commit hook runs lint-staged (eslint --fix + prettier) on staged files. CI runs `lint` and
`format:check` before the Playwright step.

## Safety

- Any step that writes data calls `assertMayWrite(page.url())`.
- Production-writing scenarios are tagged `@prodWrite`.
- See [safety-guards.md](safety-guards.md). Commit only when asked.
