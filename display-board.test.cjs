const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

const source = readFileSync(join(__dirname, 'app.js'), 'utf8');
const ctx = { document: { addEventListener() {} } };
runInNewContext(source + '\n;globalThis.__rer = {rerCorridor, groupRerCorridors}', ctx);
const {rerCorridor, groupRerCorridors} = ctx.__rer;
const departure = (destination, minutes, onward = []) => ({
  destination, expected: new Date(Date.UTC(2026,9,16,17,minutes)).toISOString(),
  onward: onward.map(name=>({name}))
});

test('RER A : regrouper Cergy et Poissy vers Paris, pas par terminus', () => {
  const groups = groupRerCorridors([
    departure('Boissy-Saint-Léger', 28),
    departure('Cergy-le-Haut', 14),
    departure('Poissy', 23),
    departure('Boissy-Saint-Léger', 40)
  ]);
  assert.deepEqual(Array.from(groups.keys()), ['Vers Paris', 'Vers Boissy / Est']);
  assert.equal(groups.get('Vers Paris').length, 2);
  assert.equal(groups.get('Vers Paris')[0].destination, 'Cergy-le-Haut');
});
test('RER A : reconnaître l’axe Paris avec les prochains arrêts', () => {
  assert.equal(rerCorridor(departure('Destination non communiquée', 12, ['Nation','Gare de Lyon'])), 'Vers Paris');
  assert.equal(rerCorridor(departure('Boissy-Saint-Léger', 12, ['Saint-Maur-Créteil'])), 'Vers Boissy / Est');
});
test('RER A : conserver une destination inconnue plutôt que mal orienter', () => {
  assert.equal(rerCorridor(departure('Terminūs inconnu', 15)), 'Terminūs inconnu');
});
