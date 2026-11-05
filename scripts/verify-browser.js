#!/usr/bin/env node

// CI browser smoke check — launches the Chromium the tests will use (headless, exactly as CI runs
// it) and prints its version. Exits non-zero with the launch error if the binary is missing, so a
// pipeline fails fast with an actionable message. Version- and path-agnostic on purpose.
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  console.log('✅ Chromium launch OK — version ' + browser.version());
  await browser.close();
})().catch((e) => {
  console.error('❌ Chromium launch FAILED — run `npx playwright install chromium`.\n' + e.message);
  process.exit(1);
});
