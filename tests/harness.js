// Minimal shared test harness. Pure ES module: no DOM, no Node-only APIs.
// Both tests/run.mjs (Node) and tests/index.html (browser) use it.

const registered = [];

/** Runner-provided environment. `loadJSON(repoRelativePath)` must be set by the runner. */
export const env = { loadJSON: null };

export function test(id, fn) {
  registered.push({ id, fn });
}

export class AssertionError extends Error {}

function show(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

export function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new AssertionError(`${msg} expected ${show(expected)} but got ${show(actual)}`.trim());
  }
}

export function assertTrue(value, msg = 'expected truthy') {
  if (!value) throw new AssertionError(msg);
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

export function assertDeepEqual(actual, expected, msg = '') {
  if (!deepEqual(actual, expected)) {
    throw new AssertionError(`${msg} expected ${show(expected)} but got ${show(actual)}`.trim());
  }
}

export function assertIncludes(text, fragment, msg = '') {
  if (typeof text !== 'string' || !text.includes(fragment)) {
    throw new AssertionError(`${msg} expected text to include ${show(fragment)}; got ${show(text)}`.trim());
  }
}

/** Runs every registered test. Zero discovered tests is reported as a failure. */
export async function runAll() {
  const results = [];
  for (const { id, fn } of registered) {
    try {
      await fn();
      results.push({ id, ok: true });
    } catch (err) {
      results.push({ id, ok: false, error: err && err.message ? err.message : String(err) });
    }
  }
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const zero = results.length === 0;
  return { results, passed, failed, zero, ok: !zero && failed === 0 };
}
