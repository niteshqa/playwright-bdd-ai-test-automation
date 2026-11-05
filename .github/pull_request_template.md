## What & why

<!-- What this PR changes and the motivation. Link related issues. -->

## How it was verified

- [ ] `npm run lint && npm run format:check`
- [ ] `npx bddgen` (no missing / ambiguous steps)
- [ ] `npx playwright test --project=chromium` (or the affected `--grep` tags)

## Checklist

- [ ] Framework code stays app-agnostic (no app-specific selectors in `BasePage` / `support/` / `utils/`)
- [ ] No secrets, `.env`, report output, or ledger files committed
- [ ] Docs and `CHANGELOG.md` (Unreleased) updated if behaviour changed
