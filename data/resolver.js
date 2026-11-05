const testData = require('./testdata');

// Maps the plain-string keys Examples tables are limited to (Gherkin cells can't hold objects) back
// onto the rich fixtures in testdata.js — the single source of test data, never duplicated into
// feature files. Unknown keys fail loudly so a typo in a feature can't silently test nothing.

function lookup(group, key, label) {
  const value = testData[group][key];
  if (!value) {
    throw new Error(
      `[resolver] Unknown ${label} key "${key}". Known: ${Object.keys(testData[group]).join(', ')}`
    );
  }
  return value;
}

// "<key>.name" resolves to the bare product name (e.g. for search/assertion steps that need text).
function resolveProduct(key) {
  if (key.endsWith('.name'))
    return lookup('products', key.slice(0, -'.name'.length), 'product').name;
  return lookup('products', key, 'product');
}

const resolveUser = (key) => lookup('users', key, 'user');
const resolveContact = (key) => lookup('contacts', key, 'contact');

// A comma-separated list of product keys ("backpack, bikeLight") → product objects.
function resolveProducts(keys) {
  return String(keys)
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map(resolveProduct);
}

module.exports = { resolveProduct, resolveProducts, resolveUser, resolveContact };
