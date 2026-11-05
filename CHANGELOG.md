# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-11-05

### Added

- **Layered BDD framework:** Playwright + playwright-bdd, with Gherkin features, shared domain steps
  and page objects on a common `BasePage`.
- **Plug-and-play config:** `config/framework.config.js` holds apps × environments, the non-prod
  allow-list, blocked routes and overlay dismissers.
- **Reference suite:** regression, smoke and monitoring suites against the public SauceDemo app.
- **AI tooling for Claude Code:** the `/qa` command, the pipeline-orchestrator, test-generation and
  self-healing skills, and the test-planner, test-generator and test-healer agents.
- **Safety:** the destructive-action guard, `@prodWrite` / `@nonProdOnly` / `@fixme<Reason>` hooks,
  and the record-then-clean-up ledger.
- **Monitoring:** a daily health check with an xlsx status matrix, and a 2-hourly heartbeat that
  emails on state change.
- **Reporting:** Playwright HTML, Cucumber HTML/JSON, JUnit and single-file Allure reports, plus an
  email summary.
- **CI templates:** GitHub Actions, Bitbucket Pipelines and Docker.
- **Tooling:** the `npm run new:page` scaffolder, and ESLint, Prettier and husky.
