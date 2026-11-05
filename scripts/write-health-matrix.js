#!/usr/bin/env node
/**
 * write-health-matrix.js — builds the health-check status matrix after a run.
 *   1. Reads the Playwright JSON report (HEALTH_RESULTS_JSON, default reports/results.json) and
 *      collects every `health-status` attachment ({ app, status: { HC001: 'pass'|'fail' } }).
 *   2. Merges it with the static plan (config/health-matrix.json via utils/healthMatrix.js).
 *   3. Writes reports/health-matrix.xlsx (rows = checks, columns = apps, colour-coded) and
 *      reports/health-summary.json (counts + grid + verdict) for the email body.
 */
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const matrix = require('../utils/healthMatrix');
const { saveJSON } = require('../utils/fs');

const ROOT = path.join(__dirname, '..');
const RESULTS_JSON = process.env.HEALTH_RESULTS_JSON || path.join(ROOT, 'reports', 'results.json');
const XLSX_FILE = process.env.HEALTH_XLSX || path.join(ROOT, 'reports', 'health-matrix.xlsx');
const SUMMARY_JSON = path.join(ROOT, 'reports', 'health-summary.json');

const FILL = {
  PASS: 'FFC6EFCE',
  FAIL: 'FFFFC7CE',
  Skip: 'FFFFEB9C',
  NA: 'FFE7E6E6',
  HB: 'FFDDEBF7',
};

// { app: { HC001: 'pass'|'fail' } } from the JSON report's health-status attachments.
function collectRunResults() {
  const runByApp = {};
  if (!fs.existsSync(RESULTS_JSON)) {
    console.log(`⚠️  ${RESULTS_JSON} not found — automated cells will show Skip.`);
    return runByApp;
  }
  const report = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf8'));
  const read = (att) => {
    try {
      if (att.path && fs.existsSync(att.path)) return fs.readFileSync(att.path, 'utf8');
      if (att.body) return Buffer.from(att.body, 'base64').toString('utf8');
    } catch {
      /* unreadable attachment */
    }
    return null;
  };
  const visitTest = (t) => {
    // Retries produce several results in order — the LAST is the final attempt.
    const finalByApp = {};
    for (const result of t.results || []) {
      for (const att of result.attachments || []) {
        if (att.name !== 'health-status') continue;
        let parsed;
        try {
          parsed = JSON.parse(read(att));
        } catch {
          continue;
        }
        const app = (parsed && parsed.app ? parsed.app : '').toLowerCase();
        if (app) finalByApp[app] = { ...(finalByApp[app] || {}), ...(parsed.status || {}) };
      }
    }
    // Several Examples rows can back one cell: any failing row fails it, so a later pass can't mask it.
    for (const [app, status] of Object.entries(finalByApp)) {
      const cell = (runByApp[app] = runByApp[app] || {});
      for (const [id, outcome] of Object.entries(status)) {
        if (cell[id] !== 'fail') cell[id] = outcome;
      }
    }
  };
  const walk = (suite) => {
    (suite.specs || []).forEach((spec) => (spec.tests || []).forEach(visitTest));
    (suite.suites || []).forEach(walk);
  };
  (report.suites || []).forEach(walk);
  return runByApp;
}

async function main() {
  const runByApp = collectRunResults();
  const { apps, checks } = matrix.loadPlan();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Health Matrix');
  ws.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Check', key: 'title', width: 48 },
    ...apps.map((a) => ({ header: a, key: a, width: 14 })),
  ];
  ws.getRow(1).font = { bold: true };

  const summary = { generatedAt: new Date().toISOString(), counts: {}, rows: [] };
  for (const [id, check] of Object.entries(checks)) {
    const row = { id, title: check.title || '' };
    for (const app of apps) {
      const status = matrix.resolveCell(check, app, (runByApp[app] || {})[id]);
      row[app] = status;
      summary.counts[status] = (summary.counts[status] || 0) + 1;
    }
    const added = ws.addRow(row);
    apps.forEach((app, i) => {
      const cell = added.getCell(3 + i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL[row[app]] } };
      cell.alignment = { horizontal: 'center' };
    });
    summary.rows.push(row);
  }

  fs.mkdirSync(path.dirname(XLSX_FILE), { recursive: true });
  await wb.xlsx.writeFile(XLSX_FILE);
  summary.verdict = (summary.counts.FAIL || 0) > 0 ? 'FAILED' : 'PASSED';
  saveJSON(SUMMARY_JSON, summary);

  const c = summary.counts;
  console.log(
    `✅ Health matrix → ${path.relative(ROOT, XLSX_FILE)} (PASS ${c.PASS || 0} / FAIL ${c.FAIL || 0} / ` +
      `Skip ${c.Skip || 0} / NA ${c.NA || 0} / HB ${c.HB || 0}). Verdict: ${summary.verdict}.`
  );
}

main().catch((err) => {
  console.error(`❌ Failed to write health matrix: ${err.message}`);
  process.exit(1);
});
