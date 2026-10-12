// Tiny benchmark: graphemely vs native code unit operations.
// Run `npm run build` first. Numbers are only meaningful relative to each other.
import { graphemes, length, truncate } from '../dist/index.js';

const family = String.fromCodePoint(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467);
const samples = {
  ascii: 'The quick brown fox jumps over the lazy dog. '.repeat(4),
  accents: 'Café crème brûlée, sil vous plaît. '.repeat(4),
  emoji: `Hello ${family} world ${String.fromCodePoint(0x1f1e7, 0x1f1f7)} ok `.repeat(4),
};

function bench(name, fn, iterations = 20000) {
  for (let i = 0; i < 1000; i++) fn();
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const ms = performance.now() - start;
  console.log(`${name.padEnd(34)} ${((iterations / ms) * 1000).toFixed(0).padStart(10)} ops/s`);
}

for (const [label, text] of Object.entries(samples)) {
  console.log(`\n${label} (${text.length} code units)`);
  bench('native str.length', () => text.length);
  bench('graphemely length(str)', () => length(text));
  bench('native [...str]', () => [...text]);
  bench('graphemely graphemes(str)', () => graphemes(text));
  bench('graphemely truncate(str, 40)', () => truncate(text, 40));
}
