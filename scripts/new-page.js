#!/usr/bin/env node
/**
 * new-page.js — scaffold a page object and register it.
 *
 *   npm run new:page -- Search            → pages/SearchPage.js, registry key `search`
 *   npm run new:page -- Footer --component → pages/components/Footer.js, registry key `footer`
 *
 * The generated class follows the house rules (docs/coding-standards.md): extends BasePage,
 * locators in the constructor (role/label first, .or() fallbacks), every method wrapped in
 * try/catch with the [PageObject:Class.method] prefix. Steps then reach it as `pages.<key>`.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isComponent = args.includes('--component');
const raw = args.find((a) => !a.startsWith('--'));
if (!raw || !/^[A-Za-z][A-Za-z0-9]*$/.test(raw)) {
  console.error('Usage: npm run new:page -- <Name> [--component]   (alphanumeric, e.g. Search)');
  process.exit(1);
}

const base = raw.charAt(0).toUpperCase() + raw.slice(1);
const className = isComponent || base.endsWith('Page') ? base : `${base}Page`;
const key = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const registryKey = key(isComponent ? className : className.replace(/Page$/, ''));
const pagesDir = path.join(__dirname, '..', 'pages');
const file = path.join(pagesDir, isComponent ? 'components' : '', `${className}.js`);
const basePath = isComponent ? '../BasePage' : './BasePage';
const requirePath = isComponent ? `./components/${className}` : `./${className}`;

if (fs.existsSync(file)) {
  console.error(`❌ ${path.relative(process.cwd(), file)} already exists.`);
  process.exit(1);
}

const template = `const { BasePage } = require('${basePath}');

// TODO: describe what this page is and which flows use it.
class ${className} extends BasePage {
  constructor(page) {
    super(page);
    // Locators: getByRole/getByLabel → getByTestId → CSS, with .or() fallbacks for fragile markup.
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async isLoaded() {
    try {
      return await this.isShown(this.heading);
    } catch (e) {
      throw new Error('[PageObject:${className}.isLoaded] ' + e.message);
    }
  }
}

module.exports = { ${className} };
`;
fs.writeFileSync(file, template);

// Register: add the require next to the others and the key to pageRegistry + exports.
const indexFile = path.join(pagesDir, 'index.js');
let index = fs.readFileSync(indexFile, 'utf8');
const lines = index.split('\n');
const lastRequire = lines.reduce((at, line, i) => (/require\(/.test(line) ? i : at), -1);
lines.splice(lastRequire + 1, 0, `const { ${className} } = require('${requirePath}');`);
index = lines.join('\n');
index = index.replace(
  /(const pageRegistry = \{[\s\S]*?)(\n\};)/,
  `$1\n  ${registryKey}: ${className},$2`
);
index = index.replace(/(module\.exports = \{[\s\S]*?)(\n\};)/, `$1\n  ${className},$2`);
fs.writeFileSync(indexFile, index);

console.log(
  `✅ Created ${path.relative(process.cwd(), file)} and registered it as pages.${registryKey}`
);
console.log('   Next: add locators/methods, then use it from a step in steps/<domain>.steps.js.');
