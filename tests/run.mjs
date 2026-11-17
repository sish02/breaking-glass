// Node test runner: `node tests/run.mjs` from the repository root (or anywhere).
// Exit code is non-zero on any failure OR when zero tests are discovered.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env, runAll } from './harness.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
env.loadJSON = async (rel) => JSON.parse(await readFile(path.join(root, rel), 'utf8'));

await import('./suites.js');
const { results, passed, failed, zero, ok } = await runAll();

for (const r of results.filter((x) => !x.ok)) {
  console.log(`FAIL ${r.id}\n     ${r.error}`);
}
if (zero) console.log('FAIL: zero tests discovered');
console.log(`${passed} passed, ${failed} failed${ok ? '' : ' — FAIL'}`);
process.exit(ok ? 0 : 1);
