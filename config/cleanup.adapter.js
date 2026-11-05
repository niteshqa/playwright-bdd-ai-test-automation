// Cleanup adapter for scripts/run-cleanup.js — how to undo a record the suite created on a shared
// or production environment (cancel an order, delete an account, release a booking).
//
// Implement `cleanup(record, { page })` for your app: `page` is a fresh Playwright page (already
// launched by the runner) you can use to drive an admin UI, or ignore it and call an API instead.
// Return { ok: true, reason } when the record is gone/cancelled, or { ok: false, error } to leave
// it 'failed' for a retry run. Throwing is treated as { ok: false }.
//
// The default below cleans nothing — it reports every record as not handled, so a fresh clone
// never marks anything as cleaned by accident.
module.exports = {
  // Minutes to wait after creation before attempting cleanup (downstream ingestion window).
  minAgeMinutes: Number(process.env.CLEANUP_MIN_AGE_MIN || 10),

  // eslint-disable-next-line no-unused-vars
  async cleanup(record, { page }) {
    return {
      ok: false,
      error: `No cleanup implemented for ${record.app} ${record.type} — edit config/cleanup.adapter.js`,
    };
  },
};
