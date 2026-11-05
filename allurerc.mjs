import { defineConfig } from 'allure';

// Allure 3 report config. `singleFile: true` bundles the whole report into one self-contained
// reports/allure-report/index.html so it can be shared or emailed as a single file.
const name = process.env.REPORT_NAME || 'E2E Regression Report';

export default defineConfig({
  name,
  output: 'reports/allure-report',
  plugins: {
    awesome: {
      options: { singleFile: true, reportName: name },
    },
  },
});
