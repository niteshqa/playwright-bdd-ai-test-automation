# Safety guards

E2E tests often **write data**, for example by placing orders, creating accounts or submitting
bookings. Doing that by accident on production can be expensive. The framework uses several
independent, fail-closed safeguards, plus a pattern for cleaning up any data that is deliberately
created on production.

## 1. The destructive-action guard

[support/destructiveActionGuard.js](../support/destructiveActionGuard.js):

- `writeBlockReason(url, { ci, allowProdWrites, headless })` is a pure function. It returns `null`
  when a write is allowed, or a human-readable reason when it is not.
- `assertMayWrite(url)` throws `[destructiveActionGuard] <reason>` when the write is blocked.

A write is **allowed** on any host listed under `dev` or `staging` in `config/framework.config.js`
(`nonProdHosts()`). On any other host, including production and unrecognised redirect domains, a
write requires **all three** of the following:

1. The run is not in CI (`CI` is unset).
2. `ALLOW_PROD_WRITES=true` is set.
3. The run is headed (`--headed`), so a person is watching it.

**Every step that can write data must call it first:**

```js
When('they place the order', async ({ page, pages, ctx }) => {
  assertMayWrite(page.url());
  await pages.checkout.finish();
  ctx.orderPlaced = true;
});
```

## 2. Tag gates (`support/hooks.js`)

| Tag            | Behaviour                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `@prodWrite`   | Skipped unless not-CI + `ALLOW_PROD_WRITES=true` + headed. Use it for supervised production writes. |
| `@nonProdOnly` | Skipped when the resolved base URL is not a known dev/staging host.                                 |

## 3. CI exclusion

Every CI template runs with `--grep-invert "@prodWrite"`, so those scenarios are never even collected
in CI.

## 4. Reports without secrets

- `support/stepLabels.js` labels report steps using a **whitelist** of safe argument fields: id/sku,
  search term, email or username, type, state/zip, quantity. Passwords, card numbers, CVVs and PINs
  never appear.
- Allure runs with `detail: false`, so raw `Fill "<value>"` steps are not recorded.

## Record-then-clean-up for production data

Data that is deliberately created on production in a supervised run must be removed again. That
usually happens in another system, such as an admin portal or an order-management API, and often
only after an ingestion delay. Waiting inside the test would make it slow and flaky, so the work is
split into two runs joined by a durable **cleanup ledger**:

```
Phase A (supervised):   create data on prod  ──▶  recordForCleanup({ id, app, env, … })  ──▶  ledger: pending
          … wait for downstream ingestion (minutes) …
Phase B (later run):    ledger.listPending({ minAgeMinutes })  ──▶  cleanup(record)  ──▶  markCleaned / markFailed
```

### The ledger: [utils/cleanupLedger.js](../utils/cleanupLedger.js)

- `CleanupLedger` exposes `record`, `listPending({ minAgeMinutes, app, env, includeFailed })`,
  `markCleaned`, `markFailed`, `get`, `all` and `exportCsv`.
- Records are keyed by `id` and idempotent: re-running never duplicates a record, and a cleaned record
  is never reset to pending.
- **Storage is pluggable.** The default store is a JSON file (`CLEANUP_LEDGER_PATH`, default
  `cleanup-ledger/records.json`). To add a SQLite or shared-DB store for parallel or multi-machine
  safety, implement `readAll()`/`writeAll(records)` and select it with `CLEANUP_LEDGER_BACKEND`.
- The ledger lives **outside** `reports/` so it survives between the two phases. It is gitignored,
  because it can contain identifiers and emails.

### Recording: [support/cleanupRecorder.js](../support/cleanupRecorder.js)

`recordForCleanup(details)` is best-effort and never fails a passing test. It writes the record to
the ledger and tags it with the scenario's `@…###` id.

### Cleanup adapter: you provide this

Cleanup is app-specific, so the framework defines only the contract:

```js
// e.g. cleanup/orderCleanup.js
/** @param {object} record a pending ledger record  @returns {Promise<void>} throws on failure */
async function cleanup(record) {
  // UI: log into the admin portal once, search record.id, cancel/delete, verify status.
  // API (preferred if available): DELETE /orders/{record.id} with an admin token from .env.
}
module.exports = { cleanup };
```

Drive the adapter from a supervised Phase B scenario (tagged `@prodWrite`) or from a Node script:

```js
const ledger = new CleanupLedger();
for (const rec of ledger.listPending({ minAgeMinutes: 10 })) {
  try {
    await cleanup(rec);
    ledger.markCleaned(rec.id, { reason: 'test data' });
  } catch (e) {
    ledger.markFailed(rec.id, { error: e.message }); // batch continues; failures reported at the end
  }
}
ledger.exportCsv('reports/cleanup.csv');
```

Cleanup behaviour:

- **Partial failure:** a failed record is marked `failed` and the batch continues.
- **Retrying failures:** `includeFailed: true` re-surfaces failed records for a retry run.
- **Records that are too new:** records younger than `minAgeMinutes` are left for the next run.
