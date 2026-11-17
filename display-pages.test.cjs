const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

const window = {};
runInNewContext(readFileSync(join(__dirname, 'display-pages.js'), 'utf8'), {
  window, document: { addEventListener() {} }
});
const { pageState } = window.MobiliBoardPages;
const state = (...args) => JSON.parse(JSON.stringify(pageState(...args)));

test('les huit lignes sont toutes exposées sur deux pages, sans page vide', () => {
  assert.deepEqual(state(8, 4, 0), { index:0, pages:2, start:0, end:4 });
  assert.deepEqual(state(8, 4, 12000), { index:1, pages:2, start:4, end:8 });
  assert.deepEqual(state(8, 4, 24000), { index:0, pages:2, start:0, end:4 });
});

test('la dernière page incomplète conserve toutes ses lignes', () => {
  assert.deepEqual(state(5, 4, 12000), { index:1, pages:2, start:4, end:5 });
});

test('mobile et petite liste affichent tous les éléments sans alternance', () => {
  assert.deepEqual(state(8, 8, 12000), { index:0, pages:1, start:0, end:8 });
  assert.deepEqual(state(3, 4, 12000), { index:0, pages:1, start:0, end:3 });
  assert.deepEqual(state(0, 4, 12000), { index:0, pages:0, start:0, end:0 });
});
