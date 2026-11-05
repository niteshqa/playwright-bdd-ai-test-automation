const { test } = require('@playwright/test');

// ── Safe argument summariser ────────────────────────────────────────────────
// Build a SHORT, human-readable data hint for a step label from a method's args, using a strict
// WHITELIST so secrets can never leak: we only ever read known-safe fields (username, email, sku,
// product name, search term,
// payment brand/type, address state/zip, quantity) — never password / cvv / cardNumber / pin. An
// unrecognised object contributes nothing rather than risk dumping sensitive fields.
function summarizeArg(arg) {
  if (arg === null || arg === undefined) return '';
  if (typeof arg === 'string') return `"${arg.slice(0, 40)}"`;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (typeof arg !== 'object') return '';

  // { product, fulfillment }
  if (arg.product) {
    const inner = summarizeArg(arg.product);
    const pickup = arg.fulfillment && arg.fulfillment.pickup ? ' · pickup' : '';
    return inner + pickup;
  }
  if (arg.sku) return `sku ${arg.sku}`;
  if (arg.name && typeof arg.name === 'string') return `"${arg.name.slice(0, 40)}"`; // product
  if (arg.searchTerm) return `"${arg.searchTerm}"`;
  if (arg.username) return arg.username; // user
  if (arg.email) return arg.email; // user
  if (arg.brand || arg.type) return arg.brand || arg.type; // payment: brand/type only, never PAN/cvv/pin
  if (arg.state || arg.zip) return [arg.state, arg.zip].filter(Boolean).join(' '); // address
  if (arg.quantity !== undefined) return `qty ${arg.quantity}`;
  return '';
}

function describeArgs(args = []) {
  const parts = args.map(summarizeArg).filter(Boolean);
  return parts.length ? ` (${parts.join(', ')})` : '';
}

// ── Step-wrapping proxy ──────────────────────────────────────────────────────
// Wrap a page object so every PUBLIC async method call becomes a
// named Playwright test.step — giving the report a business-readable tree
// (e.g. "LoginPage.login (standard_user)") that groups the nested locator clicks/fills. Non-method
// properties (locators, getters, `page`, `baseUrl`) pass through untouched, and private (`_`) methods
// are not wrapped. `this` inside a method stays the real instance, so internal calls behave normally.
//
//   labelMap: optional { methodName: (args) => 'friendly label' } for business-level naming.
function withSteps(instance, className, labelMap = {}) {
  return new Proxy(instance, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function' || typeof prop !== 'string' || prop.startsWith('_')) {
        return value;
      }
      return (...args) => {
        const label =
          (labelMap[prop] && labelMap[prop](args)) || `${className}.${prop}${describeArgs(args)}`;
        const call = () => {
          const result = value.apply(target, args);
          // Preserve `return this` chaining through the proxy so chained calls stay wrapped.
          return result === target ? receiver : result;
        };
        // test.step only works inside a running test; outside one (rare), call through directly.
        let inTest = false;
        try {
          inTest = !!test.info();
        } catch {
          inTest = false;
        }
        return inTest ? test.step(label, call) : call();
      };
    },
  });
}

module.exports = { withSteps, describeArgs, summarizeArg };
