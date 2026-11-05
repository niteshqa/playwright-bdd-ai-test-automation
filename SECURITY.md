# Security policy

## Supported versions

Security fixes are applied to the latest release on the `main` branch.

## Reporting a vulnerability

**Please do not open a public issue for security problems.** Report them privately, using GitHub's
[private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
("Report a vulnerability" on the repository's Security tab).

Include affected files or versions, reproduction steps, and the impact. We aim to acknowledge reports
within 5 working days.

## Handling secrets in this project

- Credentials are read from environment variables (`.env` locally, CI secrets in pipelines). They are
  never committed. `.env` is gitignored, and `.env.example` contains placeholders only.
- Report step labels use a whitelist of safe arguments, and Allure runs with `detail: false`, so
  passwords and card data do not appear in reports.
- The destructive-action guard blocks unattended writes to production. See
  [docs/safety-guards.md](docs/safety-guards.md).

If you find a secret in the history of a fork, rotate it first, then purge it from the history.
