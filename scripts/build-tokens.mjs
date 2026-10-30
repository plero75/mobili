// Generates mobili-tokens.css from design/tokens.json (the Mobili design system).
// Usage: node scripts/build-tokens.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(root, 'design/tokens.json'), 'utf8'));

const [first, ...otherThemes] = tokens.color.themes.map((t) => t.id);
const isAlias = (v) => typeof v === 'string' && /^\{[^}]+\}$/.test(v);
const css = (v) => (isAlias(v) ? `var(--${v.slice(1, -1)})` : v);
const valueFor = (tok, theme) =>
  typeof tok.value === 'string' ? tok.value : tok.value[theme] ?? tok.value[first];

const themed = [...tokens.color.tokens, ...(tokens.shadow?.tokens ?? [])];
const line = (name, value) => `  --${name}: ${css(value)};`;

const out = ['/* Mobili — généré depuis design/tokens.json par scripts/build-tokens.mjs. Ne pas modifier à la main. */', ''];

out.push(`:root, [data-theme="${first}"] {`);
for (const tok of themed) out.push(line(tok.name, valueFor(tok, first)));
out.push('}', '');

for (const theme of otherThemes) {
  out.push(`[data-theme="${theme}"] {`);
  for (const tok of themed) {
    const v = valueFor(tok, theme);
    // Re-declare aliases too, so they resolve against this theme's values.
    if (typeof tok.value !== 'string' || isAlias(v)) out.push(line(tok.name, v));
  }
  out.push('  color-scheme: light;', '}', '');
}

for (const font of tokens.type.fonts ?? []) {
  out.push(`@font-face { font-family: "${font.family}"; src: url("${font.file}") format("woff2"); font-weight: ${font.weight}; font-style: ${font.style ?? 'normal'}; font-display: swap; }`);
}
if (tokens.type.fonts?.length) out.push('');

out.push(':root {');
for (const [key, stack] of Object.entries(tokens.type.families)) out.push(`  --font-${key}: ${stack};`);
const skip = new Set(['name', 'version', 'meta', 'color', 'type', 'shadow']);
for (const family of Object.keys(tokens).filter((k) => !skip.has(k) && Array.isArray(tokens[k]?.tokens))) {
  for (const tok of tokens[family]?.tokens ?? []) out.push(line(tok.name, tok.value));
}
out.push('}', '');

writeFileSync(join(root, 'mobili-tokens.css'), out.join('\n'));
console.log(`mobili-tokens.css : ${themed.length} couleurs, thèmes ${[first, ...otherThemes].join(', ')}`);
