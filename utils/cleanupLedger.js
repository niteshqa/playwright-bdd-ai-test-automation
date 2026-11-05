const path = require('path');
const { saveJSON, loadJSON, fileExists } = require('./fs');

/**
 * CleanupLedger — durable record of data a test run created on a shared or production environment
 * (orders, bookings, accounts) for the decoupled record-then-clean-up workflow:
 *   Phase A: the creating test records it here (support/cleanupRecorder.js).
 *   Phase B: a later run (scripts/run-cleanup.js) reads pending records — once any downstream
 *            systems have ingested them — cleans each up via an adapter, and writes the status.
 * It lives OUTSIDE the ephemeral reports/ dir so it survives between the two runs.
 *
 * Backend is swappable behind a tiny Store interface (readAll/writeAll). Default: a JSON file. A
 * SQLite/shared-DB backend can be added (select via CLEANUP_LEDGER_BACKEND) without changing any
 * call site. The JSON store is single-writer — fine for single-worker supervised runs; a DB backend
 * is the path to parallel/multi-machine safety.
 *
 * Record schema (one per created record, keyed by id):
 *   { id, type, app, env, email, total, createdAt, status, cleanedAt, reason, attempts, lastError,
 *     runId }
 *   status: 'pending' | 'cleaned' | 'failed'
 */

const DEFAULT_LEDGER_PATH = path.join(process.cwd(), 'cleanup-ledger', 'records.json');

// ── JSON file store (default backend) ──────────────────────────────────────────
class JsonFileStore {
  constructor(filePath) {
    this.filePath = filePath || process.env.CLEANUP_LEDGER_PATH || DEFAULT_LEDGER_PATH;
  }
  readAll() {
    if (!fileExists(this.filePath)) return [];
    try {
      const data = loadJSON(this.filePath);
      return Array.isArray(data) ? data : [];
    } catch {
      // Corrupt/partial file — treat as empty rather than crash the run.
      return [];
    }
  }
  writeAll(records) {
    saveJSON(this.filePath, records); // saveJSON mkdirs the parent dir
  }
}

function createStore() {
  const backend = (process.env.CLEANUP_LEDGER_BACKEND || 'json').toLowerCase();
  switch (backend) {
    case 'json':
      return new JsonFileStore();
    // Future: case 'sqlite': return new SqliteStore(); — same readAll/writeAll interface.
    default:
      throw new Error(`[CleanupLedger] Unknown CLEANUP_LEDGER_BACKEND "${backend}".`);
  }
}

class CleanupLedger {
  constructor(store) {
    this.store = store || createStore();
  }

  // Idempotent upsert keyed on id. A new record is 'pending'. An existing record is left as-is
  // (never duplicated, never reset from 'cleaned' back to 'pending') — only blank metadata is filled.
  record({ id, type = 'order', app, env = 'prod', email, total, runId } = {}) {
    if (!id) throw new Error('[CleanupLedger.record] id is required.');
    const records = this.store.readAll();
    const existing = records.find((r) => r.id === id);
    if (existing) {
      existing.app = existing.app || app;
      existing.email = existing.email || email;
      existing.total = existing.total || total;
      existing.runId = existing.runId || runId;
      this.store.writeAll(records);
      return existing;
    }
    const rec = {
      id,
      type,
      app,
      env,
      email,
      total,
      createdAt: new Date().toISOString(),
      status: 'pending',
      cleanedAt: null,
      reason: null,
      attempts: 0,
      lastError: null,
      runId: runId || null,
    };
    records.push(rec);
    this.store.writeAll(records);
    return rec;
  }

  // Pending records old enough for downstream systems to have ingested them (e.g. an order that
  // must reach a back-office system before it can be cancelled there). includeFailed re-surfaces
  // previously-failed records for a retry run.
  listPending({ minAgeMinutes = 10, app, env, type, includeFailed = false } = {}) {
    const cutoff = Date.now() - minAgeMinutes * 60 * 1000;
    return this.store.readAll().filter((r) => {
      const eligibleStatus = r.status === 'pending' || (includeFailed && r.status === 'failed');
      if (!eligibleStatus) return false;
      if (app && r.app !== app) return false;
      if (env && r.env !== env) return false;
      if (type && r.type !== type) return false;
      const createdMs = Date.parse(r.createdAt || '');
      return Number.isFinite(createdMs) ? createdMs <= cutoff : true;
    });
  }

  _update(id, mutate) {
    const records = this.store.readAll();
    const rec = records.find((r) => r.id === id);
    if (!rec) return null;
    mutate(rec);
    this.store.writeAll(records);
    return rec;
  }

  markCleaned(id, { reason } = {}) {
    return this._update(id, (r) => {
      r.status = 'cleaned';
      r.cleanedAt = new Date().toISOString();
      r.reason = reason || r.reason || null;
      r.attempts = (r.attempts || 0) + 1;
      r.lastError = null;
    });
  }

  markFailed(id, { error } = {}) {
    return this._update(id, (r) => {
      r.status = 'failed';
      r.attempts = (r.attempts || 0) + 1;
      r.lastError = error ? String(error).slice(0, 500) : 'unknown';
    });
  }

  get(id) {
    return this.store.readAll().find((r) => r.id === id) || null;
  }

  all() {
    return this.store.readAll();
  }

  // Human-readable CSV export for audit/hand-off.
  exportCsv(outPath) {
    const cols = [
      'id',
      'type',
      'app',
      'env',
      'email',
      'total',
      'createdAt',
      'status',
      'cleanedAt',
      'reason',
      'attempts',
      'lastError',
      'runId',
    ];
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = this.all().map((r) => cols.map((c) => esc(r[c])).join(','));
    const csv = [cols.map(esc).join(','), ...rows].join('\n') + '\n';
    const fs = require('fs');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, csv, 'utf8');
    return outPath;
  }
}

module.exports = { CleanupLedger, JsonFileStore, DEFAULT_LEDGER_PATH };
