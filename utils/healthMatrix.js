/**
 * healthMatrix.js — resolves the health-check status matrix: one row per check (@HC### tag), one
 * column per app. The static plan lives in config/health-matrix.json; a cell resolves to:
 *   NA    — the check doesn't apply to that app, or is excluded by policy (unsafe unattended)
 *   HB    — covered by the 2-hourly heartbeat instead of the daily run (not a gap, not a failure)
 *   Skip  — planned but not automated yet, or automated but didn't run
 *   PASS / FAIL — the run result of the automated test backing the cell
 * scripts/write-health-matrix.js merges this plan with a run's `health-status` attachments.
 */
const path = require('path');
const { loadJSON } = require('./fs');

const PLAN_FILE =
  process.env.HEALTH_MATRIX_PLAN || path.join(__dirname, '..', 'config', 'health-matrix.json');
const STATUS = { PASS: 'PASS', FAIL: 'FAIL', SKIP: 'Skip', NA: 'NA', HB: 'HB' };

function loadPlan(file = PLAN_FILE) {
  const plan = loadJSON(file);
  return { apps: plan.apps || [], checks: plan.checks || {} };
}

// Static status for one (check, app) cell, or 'AUTO' when the run result decides it.
function staticStatus(check, app) {
  if (!check || !(check.applies || []).includes(app)) return STATUS.NA;
  if (check.policy === 'excluded') return STATUS.NA;
  if (check.policy === 'heartbeat') return STATUS.HB;
  return (check.backed || []).includes(app) ? 'AUTO' : STATUS.SKIP;
}

function resolveCell(check, app, outcome) {
  const s = staticStatus(check, app);
  if (s !== 'AUTO') return s;
  if (outcome === 'pass') return STATUS.PASS;
  if (outcome === 'fail') return STATUS.FAIL;
  return STATUS.SKIP;
}

module.exports = { STATUS, PLAN_FILE, loadPlan, staticStatus, resolveCell };
