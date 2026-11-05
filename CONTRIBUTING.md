# Contributing

Thanks for helping improve the framework. Bug reports, docs fixes, new reusable steps and framework
features are all welcome.

## Development setup

```bash
npm install                      # installs deps + the husky pre-commit hook
npx playwright install chromium
npm run smoke                    # sanity check against the SauceDemo reference suite
```

## Before you open a pull request

1. Follow [docs/coding-standards.md](docs/coding-standards.md):
   - layers: features → steps → pages
   - the `[PageObject:Class.method]` error wrapping
   - locator precedence
   - no `waitForTimeout`/`networkidle` gates
2. Keep framework code app-agnostic. App-specific selectors and data belong in the reference
   implementation (`pages/`, `data/testdata.js`) or in your own fork, never in `BasePage`, `support/`
   or `utils/`.
3. Run the checks:

   ```bash
   npm run lint && npm run format:check
   npx bddgen
   npx playwright test --project=chromium
   ```

4. Update the docs, and `CHANGELOG.md` under **Unreleased**, if you changed behaviour or added a
   feature.
5. Never commit secrets, `.env`, `reports/` output or ledger files.

## Commit and pull request style

- Use small, focused commits with imperative subjects ("Add heartbeat recovery email").
- Describe what changed and why, and how you verified it, in the PR template.

## Reporting bugs and requesting features

Use the GitHub issue templates. For security issues, see [SECURITY.md](SECURITY.md) instead.

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
