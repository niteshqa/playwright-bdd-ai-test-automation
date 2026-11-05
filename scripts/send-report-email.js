#!/usr/bin/env node
/**
 * send-report-email.js — emails a run summary with the Playwright HTML report attached.
 *
 *   - Verdict from the JUnit report (fails CLOSED: missing/unparseable results = FAILED, never a
 *     false green), or from reports/health-summary.json when the health-check matrix was built.
 *   - EMAIL_ON_FAILURE_ONLY=true → silent on green (heartbeat-style alerting), except one
 *     "RECOVERED" mail when RECOVERED=true (set by CI when the previous run was red).
 *   - Attachments respect per-file and total size caps (mail servers bounce ~25 MB messages);
 *     oversized reports are skipped with a note to fetch them from CI artifacts.
 *
 * Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO, [EMAIL_CC], [EMAIL_FROM_NAME],
 *      [REPORT_SUITE], [TEST_ENV], [BUILD_URL], [PLAYWRIGHT_REPORT], [MAX_ATTACH_MB],
 *      [MAX_TOTAL_ATTACH_MB], [EMAIL_ON_FAILURE_ONLY], [RECOVERED].
 */
require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { parseJunit } = require('./junit');
const framework = require('../config/framework.config');

const REPORT_DIR = path.join(__dirname, '..', 'reports');
const JUNIT_FILE =
  process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE || path.join(REPORT_DIR, 'junit', 'results.xml');
const HTML_REPORT = path.join(REPORT_DIR, 'playwright-report', 'index.html');
const HEALTH_XLSX = path.join(REPORT_DIR, 'health-matrix.xlsx');
const HEALTH_SUMMARY = path.join(REPORT_DIR, 'health-summary.json');
const RECORDS_JSON = path.join(REPORT_DIR, 'created-records.json');

const {
  SMTP_HOST = '',
  SMTP_PORT = '587',
  SMTP_USER = '',
  SMTP_PASS = '',
  EMAIL_TO = '',
  EMAIL_CC = '',
  EMAIL_FROM_NAME = 'QA Bot',
  TEST_ENV = framework.defaultEnv,
  REPORT_SUITE = framework.reportName,
  BUILD_URL = '',
  MAX_ATTACH_MB = '20',
  MAX_TOTAL_ATTACH_MB = '22',
  EMAIL_ON_FAILURE_ONLY = 'false',
  RECOVERED = 'false',
} = process.env;

const esc = (v) =>
  String(v == null ? '' : v).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );

function assertConfig() {
  const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_TO'].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function readJson(file) {
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  } catch {
    return null;
  }
}

function summaryTable(s) {
  const cell = (label, value, color) =>
    `<td style="padding:8px 16px;text-align:center"><div style="font-size:22px;font-weight:bold;color:${color}">${esc(value)}</div><div style="font-size:12px;color:#555">${label}</div></td>`;
  return `<table style="border-collapse:collapse;border:1px solid #ddd"><tr>
    ${cell('Total', s.total, '#333')}${cell('Passed', s.passed, '#1a7f37')}
    ${cell('Failed', s.failures, '#cf222e')}${cell('Skipped', s.skipped, '#9a6700')}
  </tr></table>`;
}

function healthTable(health) {
  if (!health || !health.rows || !health.rows.length) return '';
  const apps = Object.keys(health.rows[0]).filter((k) => !['id', 'title'].includes(k));
  const color = { PASS: '#c6efce', FAIL: '#ffc7ce', Skip: '#ffeb9c', NA: '#e7e6e6', HB: '#ddebf7' };
  const head = ['ID', 'Check', ...apps]
    .map((h) => `<th style="padding:4px 8px;border:1px solid #ddd">${esc(h)}</th>`)
    .join('');
  const rows = health.rows
    .map(
      (r) =>
        `<tr><td style="padding:4px 8px;border:1px solid #ddd">${esc(r.id)}</td><td style="padding:4px 8px;border:1px solid #ddd">${esc(r.title)}</td>` +
        apps
          .map(
            (a) =>
              `<td style="padding:4px 8px;border:1px solid #ddd;text-align:center;background:${color[r[a]] || '#fff'}">${esc(r[a])}</td>`
          )
          .join('') +
        '</tr>'
    )
    .join('');
  return `<h3>Health-check matrix</h3><table style="border-collapse:collapse;font-size:13px"><tr>${head}</tr>${rows}</table>`;
}

function recordsTable(records) {
  if (!records || !records.length) return '';
  const rows = records
    .map(
      (r) =>
        `<tr><td>${esc(r.testId)}</td><td>${esc(r.app)}</td><td>${esc(r.type)}</td><td>${esc(r.id)}</td><td>${esc(r.total)}</td></tr>`
    )
    .join('');
  return `<h3>Records created by this run</h3><table cellpadding="4" style="font-size:13px"><tr><th>Test</th><th>App</th><th>Type</th><th>ID</th><th>Total</th></tr>${rows}</table>`;
}

async function main() {
  assertConfig();
  const health = readJson(HEALTH_SUMMARY);
  const summary = parseJunit(JUNIT_FILE);
  const reportMissing = summary.parsed === false;
  const status = health
    ? health.verdict || 'FAILED'
    : reportMissing || summary.failures > 0
      ? 'FAILED'
      : 'PASSED';
  const recovered = RECOVERED === 'true' && status === 'PASSED';
  if (EMAIL_ON_FAILURE_ONLY === 'true' && status === 'PASSED' && !recovered) {
    console.log('✅ Run PASSED and EMAIL_ON_FAILURE_ONLY=true — no email sent.');
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const badge = recovered ? '✅ RECOVERED' : `${status === 'PASSED' ? '✅' : '❌'} ${status}`;
  const subject = `[QA] ${badge}${reportMissing ? ' (results unavailable)' : ''} — ${REPORT_SUITE} ${TEST_ENV} | ${dateStr}`;

  // Attach within per-file and total budgets.
  const candidates = [
    {
      name: 'Playwright report',
      path: process.env.PLAYWRIGHT_REPORT || HTML_REPORT,
      filename: `playwright-report-${dateStr}.html`,
    },
  ];
  if (health && fs.existsSync(HEALTH_XLSX)) {
    candidates.push({
      name: 'Health matrix',
      path: HEALTH_XLSX,
      filename: `health-matrix-${dateStr}.xlsx`,
    });
  }
  const maxBytes = parseFloat(MAX_ATTACH_MB) * 1024 * 1024;
  const maxTotal = parseFloat(MAX_TOTAL_ATTACH_MB) * 1024 * 1024;
  const attachments = [];
  const skipped = [];
  let total = 0;
  for (const c of candidates) {
    if (!fs.existsSync(c.path)) continue;
    const bytes = fs.statSync(c.path).size;
    if (bytes > maxBytes || total + bytes > maxTotal) {
      skipped.push(`${c.name} (${(bytes / 1048576).toFixed(1)} MB)`);
      continue;
    }
    attachments.push({ filename: c.filename, path: c.path });
    total += bytes;
  }

  const html = `<div style="font-family:Arial,sans-serif">
    <h2 style="color:${status === 'PASSED' ? '#1a7f37' : '#cf222e'}">${esc(REPORT_SUITE)} — ${esc(badge)}</h2>
    <p>Environment: <b>${esc(TEST_ENV)}</b> · ${esc(dateStr)}${BUILD_URL ? ` · <a href="${esc(BUILD_URL)}">CI build</a>` : ''}</p>
    ${reportMissing && !health ? '<p style="color:#cf222e"><b>Results file missing or unreadable — treated as FAILED.</b></p>' : summaryTable(summary)}
    ${healthTable(health)}
    ${recordsTable(readJson(RECORDS_JSON))}
    <p style="color:#555;font-size:12px">${attachments.length ? 'Report attached.' : ''}${skipped.length ? ` Too large to attach: ${esc(skipped.join(', '))} — download from the CI artifacts.` : ''}</p>
  </div>`;

  const port = parseInt(SMTP_PORT, 10);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  console.log(`📧 Sending "${subject}" to ${EMAIL_TO}${EMAIL_CC ? ` (CC ${EMAIL_CC})` : ''}`);
  const info = await transporter.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${SMTP_USER}>`,
    to: EMAIL_TO,
    cc: EMAIL_CC || undefined,
    subject,
    html,
    attachments,
  });
  console.log(`✅ Email sent: ${info.messageId}`);
}

main().catch((err) => {
  console.error(`❌ Failed to send report email: ${err.message}`);
  process.exit(1);
});
