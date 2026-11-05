// Builds docs/presentation/automation-benefits.pptx — the 2-slide benefits deck used to demo the
// framework to other teams. pptxgenjs is deliberately NOT a repo dependency; see README.md here.
//   node build-deck.js [output.pptx]
const path = require('path');
const PptxGenJS = require('pptxgenjs');

const OUT = process.argv[2] || path.join(__dirname, 'automation-benefits.pptx');

const NAVY = '0F1B33';
const ACCENT = '14B8A6'; // teal
const ACCENT_DARK = '0E7C70';
const INK = '1F2937';
const MUTED = '64748B';
const LIGHT = 'F1F5F9';
const WHITE = 'FFFFFF';
const BAD = 'B91C1C';
const FONT = 'Calibri';

const W = 13.333;
const M = 0.4; // page margin

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.title = 'AI-powered test automation — measured benefits';

function titleBand(slide, title, subtitle) {
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 1.0, fill: { color: NAVY } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.0, w: W, h: 0.06, fill: { color: ACCENT } });
  slide.addText(title, {
    x: M,
    y: 0.1,
    w: W - 2 * M,
    h: 0.55,
    fontFace: FONT,
    fontSize: 28,
    bold: true,
    color: WHITE,
    margin: 0,
  });
  slide.addText(subtitle, {
    x: M,
    y: 0.6,
    w: W - 2 * M,
    h: 0.32,
    fontFace: FONT,
    fontSize: 14,
    color: 'CBD5E1',
    margin: 0,
  });
}

// ── Slide 1: measured impact ─────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  titleBand(
    s,
    'Measured impact of AI-powered test automation',
    'Legacy Selenium  →  Playwright + Claude AI agents  ·  regression across 3 e-commerce storefronts'
  );

  // Hero stat tiles
  const heroes = [
    ['~80%', 'faster full regression', '~3 h → ~35 min'],
    ['~12 h', 'saved per week', '~2.4 h saved per run × 5 runs'],
    ['~74%', 'faster per test', '~5 min → ~1.3 min'],
    ['~90%+', 'less selector-fix effort', '2–4 h → minutes (self-heal)'],
  ];
  const gap = 0.2;
  const tw = (W - 2 * M - gap * 3) / 4;
  heroes.forEach(([big, label, sub], i) => {
    const x = M + i * (tw + gap);
    const y = 1.3;
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: tw,
      h: 1.35,
      fill: { color: LIGHT },
      line: { color: LIGHT },
      rectRadius: 0.08,
    });
    s.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h: 1.35, fill: { color: ACCENT } });
    s.addText(big, {
      x: x + 0.25,
      y: y + 0.08,
      w: tw - 0.35,
      h: 0.62,
      fontFace: FONT,
      fontSize: 34,
      bold: true,
      color: ACCENT_DARK,
      margin: 0,
    });
    s.addText(label, {
      x: x + 0.25,
      y: y + 0.7,
      w: tw - 0.35,
      h: 0.3,
      fontFace: FONT,
      fontSize: 14,
      bold: true,
      color: INK,
      margin: 0,
    });
    s.addText(sub, {
      x: x + 0.25,
      y: y + 0.99,
      w: tw - 0.35,
      h: 0.28,
      fontFace: FONT,
      fontSize: 12,
      color: MUTED,
      margin: 0,
    });
  });

  // Before / after table
  const hdr = (t) => ({
    text: t,
    options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 13 },
  });
  const before = (t) => ({ text: t, options: { color: BAD } });
  const after = (t) => ({ text: t, options: { color: ACCENT_DARK, bold: true } });
  const gain = (t) => ({ text: t, options: { bold: true, color: INK } });
  const rows = [
    [hdr('Metric'), hdr('Before (Selenium)'), hdr('After (Playwright + AI)'), hdr('Gain')],
    ['Time per test', before('~5 min'), after('~1.3 min'), gain('~74% faster')],
    ['Full regression (3 storefronts)', before('~3 h'), after('~35 min'), gain('~80% faster')],
    [
      'Broken-selector fix',
      before('2–4 h engineer time'),
      after('Minutes — auto self-heal'),
      gain('~90%+ less effort'),
    ],
    [
      'Add a new scenario',
      before('Dozens of classes'),
      after('One Examples row (~6 lines)'),
      gain('Data, not code'),
    ],
    ['reCAPTCHA hard-fails', before('Run aborts'), after('0 — handled gracefully'), gain('Zero')],
  ];
  const tableW = 8.45;
  s.addText('Before vs. after', {
    x: M,
    y: 2.85,
    w: tableW,
    h: 0.35,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: INK,
    margin: 0,
  });
  s.addTable(rows, {
    x: M,
    y: 3.25,
    w: tableW,
    colW: [2.45, 1.95, 2.35, 1.7],
    rowH: 0.48,
    fontFace: FONT,
    fontSize: 12.5,
    color: INK,
    valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: 'E2E8F0' },
    fill: { color: WHITE },
    margin: [0, 6, 0, 6],
  });

  // Coverage tiles (2 × 2)
  const cx = M + tableW + 0.3;
  const cw = W - M - cx;
  s.addText('Coverage running today', {
    x: cx,
    y: 2.85,
    w: cw,
    h: 0.35,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: INK,
    margin: 0,
  });
  const cov = [
    ['~200', 'data-driven scenarios'],
    ['133', 'reusable steps'],
    ['~80', 'production checks daily'],
    ['2 h', 'heartbeat interval'],
  ];
  const cgap = 0.15;
  const cTileW = (cw - cgap) / 2;
  const cTileH = (2.88 - cgap) / 2;
  cov.forEach(([big, label], i) => {
    const x = cx + (i % 2) * (cTileW + cgap);
    const y = 3.25 + Math.floor(i / 2) * (cTileH + cgap);
    s.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: cTileW,
      h: cTileH,
      fill: { color: NAVY },
      line: { color: NAVY },
      rectRadius: 0.08,
    });
    s.addText(big, {
      x,
      y: y + 0.12,
      w: cTileW,
      h: 0.65,
      align: 'center',
      fontFace: FONT,
      fontSize: 32,
      bold: true,
      color: ACCENT,
      margin: 0,
    });
    s.addText(label, {
      x: x + 0.1,
      y: y + 0.78,
      w: cTileW - 0.2,
      h: 0.45,
      align: 'center',
      valign: 'top',
      fontFace: FONT,
      fontSize: 12.5,
      color: WHITE,
      margin: 0,
    });
  });

  s.addText(
    'Source: live staging runs. % and weekly savings derived from those figures; weekly assumes 5 regression runs/week.',
    {
      x: M,
      y: 6.95,
      w: W - 2 * M,
      h: 0.3,
      fontFace: FONT,
      fontSize: 10,
      italic: true,
      color: MUTED,
      margin: 0,
    }
  );
}

// ── Slide 2: how it works & adoption ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  titleBand(
    s,
    'How it works & how your team adopts it',
    'playwright-bdd-ai-test-automation — plug-and-play Playwright + BDD framework with Claude AI agents'
  );

  const top = 1.3;
  const colH = 4.95;
  const gap = 0.25;
  const colW = (W - 2 * M - 2 * gap) / 3;
  const colX = (i) => M + i * (colW + gap);

  const colHeader = (i, text) => {
    s.addShape(pptx.ShapeType.rect, {
      x: colX(i),
      y: top,
      w: colW,
      h: colH,
      fill: { color: LIGHT },
      line: { color: LIGHT },
    });
    s.addShape(pptx.ShapeType.rect, {
      x: colX(i),
      y: top,
      w: colW,
      h: 0.06,
      fill: { color: ACCENT },
    });
    s.addText(text, {
      x: colX(i) + 0.2,
      y: top + 0.15,
      w: colW - 0.4,
      h: 0.4,
      fontFace: FONT,
      fontSize: 17,
      bold: true,
      color: NAVY,
      margin: 0,
    });
  };

  // Column 1 — architecture
  colHeader(0, '3-layer architecture');
  const layers = [
    ['Gherkin features', 'Scenario Outlines + Examples data'],
    ['Shared step vocabulary', 'One org-agnostic set of steps'],
    ['Page objects on BasePage', 'Own every selector & UI action'],
  ];
  layers.forEach(([t, sub], i) => {
    const y = top + 0.68 + i * 0.68;
    s.addShape(pptx.ShapeType.roundRect, {
      x: colX(0) + 0.2,
      y,
      w: colW - 0.4,
      h: 0.56,
      fill: { color: i === 0 ? NAVY : i === 1 ? '1E3A5F' : '2B4C7E' },
      line: { color: NAVY },
      rectRadius: 0.06,
    });
    s.addText(
      [
        { text: t, options: { bold: true, color: WHITE, fontSize: 13, breakLine: true } },
        { text: sub, options: { color: 'CBD5E1', fontSize: 11 } },
      ],
      { x: colX(0) + 0.32, y, w: colW - 0.6, h: 0.56, fontFace: FONT, valign: 'middle', margin: 0 }
    );
  });
  s.addText('Built in', {
    x: colX(0) + 0.2,
    y: top + 2.8,
    w: colW - 0.4,
    h: 0.3,
    fontFace: FONT,
    fontSize: 13,
    bold: true,
    color: ACCENT_DARK,
    margin: 0,
  });
  const builtins = [
    'Allure · HTML · Cucumber · JUnit reports',
    'Self-healing selectors',
    'reCAPTCHA handling',
    'Prod-write safety guard',
    'Health check + 2-hourly heartbeat',
    'GitHub Actions · Bitbucket · Docker CI',
  ];
  s.addText(
    builtins.map((b) => ({ text: b, options: { bullet: { indent: 14 }, breakLine: true } })),
    {
      x: colX(0) + 0.2,
      y: top + 3.1,
      w: colW - 0.4,
      h: 1.75,
      fontFace: FONT,
      fontSize: 12,
      color: INK,
      valign: 'top',
      margin: 0,
      paraSpaceAfter: 2,
    }
  );

  // Column 2 — AI pipeline
  colHeader(1, 'AI pipeline — one /qa prompt');
  const steps = ['Requirements', 'Plan', 'Explore', 'Generate', 'Run + Heal', 'Report', 'Git'];
  const stepH = 0.42;
  const stepGap = 0.1;
  steps.forEach((t, i) => {
    const y = top + 0.68 + i * (stepH + stepGap);
    s.addShape(pptx.ShapeType.ellipse, {
      x: colX(1) + 0.3,
      y: y + 0.04,
      w: 0.34,
      h: 0.34,
      fill: { color: ACCENT },
      line: { color: ACCENT },
    });
    s.addText(String(i + 1), {
      x: colX(1) + 0.3,
      y: y + 0.04,
      w: 0.34,
      h: 0.34,
      align: 'center',
      valign: 'middle',
      fontFace: FONT,
      fontSize: 12,
      bold: true,
      color: WHITE,
      margin: 0,
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: colX(1) + 0.8,
      y,
      w: colW - 1.1,
      h: stepH,
      fill: { color: WHITE },
      line: { color: 'CBD5E1' },
      rectRadius: 0.05,
    });
    s.addText(t, {
      x: colX(1) + 0.95,
      y,
      w: colW - 1.3,
      h: stepH,
      valign: 'middle',
      fontFace: FONT,
      fontSize: 13,
      bold: true,
      color: INK,
      margin: 0,
    });
  });
  s.addText(
    [
      { text: 'Modes: ', options: { bold: true, color: INK } },
      {
        text: 'regression | exploratory | defect-triage',
        options: { color: ACCENT_DARK, bold: true },
      },
    ],
    {
      x: colX(1) + 0.2,
      y: top + 4.35,
      w: colW - 0.4,
      h: 0.45,
      fontFace: FONT,
      fontSize: 12,
      margin: 0,
      valign: 'middle',
    }
  );

  // Column 3 — adoption
  colHeader(2, 'Adopt in an afternoon');
  const adopt = [
    ['Clone', 'playwright-bdd-ai-test-automation'],
    ['Configure', 'Set BASE_URL in config/framework.config.js'],
    ['Scaffold', 'npm run new:page <Name>'],
    ['Test', 'Write a .feature — or run /qa <flow>'],
  ];
  adopt.forEach(([t, sub], i) => {
    const y = top + 0.7 + i * 1.02;
    s.addShape(pptx.ShapeType.roundRect, {
      x: colX(2) + 0.2,
      y,
      w: colW - 0.4,
      h: 0.88,
      fill: { color: WHITE },
      line: { color: 'CBD5E1' },
      rectRadius: 0.06,
    });
    s.addText(String(i + 1), {
      x: colX(2) + 0.3,
      y,
      w: 0.5,
      h: 0.88,
      valign: 'middle',
      align: 'center',
      fontFace: FONT,
      fontSize: 30,
      bold: true,
      color: ACCENT,
      margin: 0,
    });
    s.addText(
      [
        { text: t, options: { bold: true, color: INK, fontSize: 14, breakLine: true } },
        { text: sub, options: { color: MUTED, fontSize: 12, fontFace: 'Consolas' } },
      ],
      { x: colX(2) + 0.9, y, w: colW - 1.2, h: 0.88, fontFace: FONT, valign: 'middle', margin: 0 }
    );
  });

  // Bottom strip
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 6.5, w: W, h: 1.0, fill: { color: NAVY } });
  s.addText(
    [
      { text: 'No AI API key needed', options: { bold: true, color: ACCENT } },
      { text: '  —  runs on Claude Code + Playwright MCP', options: { color: WHITE } },
    ],
    {
      x: M,
      y: 6.5,
      w: W - 2 * M,
      h: 1.0,
      align: 'center',
      valign: 'middle',
      fontFace: FONT,
      fontSize: 20,
      margin: 0,
    }
  );
}

pptx.writeFile({ fileName: OUT }).then((f) => console.log(`Wrote ${f}`));
