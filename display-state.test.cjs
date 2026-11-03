const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { join } = require('node:path');
const context = { window: {} };
const path = join(__dirname, 'display-state.js');
if (existsSync(path)) runInNewContext(readFileSync(path, 'utf8'), context);
const display = context.window.MobiliDisplay || {};
const now = Date.parse('2026-11-03T17:00:00Z');

test('un relevé ne reste pas en direct après deux cycles sans données', () => {
  assert.equal(typeof display.sourceState, 'function');
  assert.equal(display.sourceState({ updatedAt: now - 30_000, cadence: 60_000, ok: true }, now).kind, 'live');
  assert.equal(display.sourceState({ updatedAt: now - 120_001, cadence: 60_000, ok: true }, now).kind, 'stale');
});

test('une panne conserve la date du dernier relevé valide et annonce le cache', () => {
  assert.equal(typeof display.updateSource, 'function');
  const good = display.updateSource(null, true, { cadence: 60_000 }, now);
  const failed = display.updateSource(good, false, {}, now + 40_000);
  assert.equal(failed.updatedAt, now);
  const state = display.sourceState(failed, now + 40_000);
  assert.equal(state.kind, 'stale');
  assert.match(state.label, /Dernier relevé/);
  assert.equal(display.sourceState(display.updateSource(null, false, {}, now), now).kind, 'unavailable');
});

test('une couverture partielle reste distincte du direct et de la panne totale', () => {
  assert.equal(typeof display.updateSource, 'function');
  const partial = display.updateSource(null, true, { partial: true, coverage: '1/10 lignes' }, now);
  assert.equal(display.sourceState(partial, now).kind, 'partial');
  assert.match(display.sourceState(partial, now).label, /1\/10 lignes/);
  const recovered = display.updateSource(partial, true, { partial: false }, now + 60_000);
  assert.equal(display.sourceState(recovered, now + 60_000).kind, 'live');
});

test('un départ doit rester atteignable à la seconde près, y compris après minuit', () => {
  assert.equal(typeof display.isDepartureReachable, 'function');
  assert.equal(display.isDepartureReachable(new Date(now + 14 * 60_000).toISOString(), 14, now), true);
  assert.equal(display.isDepartureReachable(new Date(now + 14 * 60_000 - 1).toISOString(), 14, now), false);
  assert.equal(display.isDepartureReachable('invalide', 14, now), false);
  const midnight = Date.parse('2026-11-03T23:58:00+01:00');
  assert.equal(display.isDepartureReachable('2026-11-04T00:15:00+01:00', 14, midnight), true);
});

test('une réponse SIRI invalide ne devient jamais une liste vide réussie', () => {
  assert.equal(typeof display.isStopResponse, 'function');
  assert.equal(display.isStopResponse({}), false);
  assert.equal(display.isStopResponse({ Siri: { ServiceDelivery: { StopMonitoringDelivery: [{}] } } }), false);
  assert.equal(display.isStopResponse({ Siri: { ServiceDelivery: { StopMonitoringDelivery: [{ Status: false, MonitoredStopVisit: [] }] } } }), false);
  assert.equal(display.isStopResponse({ Siri: { ServiceDelivery: { StopMonitoringDelivery: [{ Status: true, MonitoredStopVisit: [] }] } } }), true);
  assert.equal(display.isStopResponse({ Siri: { ServiceDelivery: { StopMonitoringDelivery: [{ Status: true, MonitoredStopVisit: { bad: true } }] } } }), false);
});

test('une réponse trafic invalide ne signifie pas que le trafic est normal', () => {
  assert.equal(typeof display.isMessageResponse, 'function');
  assert.equal(display.isMessageResponse({}), false);
  assert.equal(display.isMessageResponse({ Siri: { ServiceDelivery: { GeneralMessageDelivery: [{ Status: false }] } } }), false);
  assert.equal(display.isMessageResponse({ Siri: { ServiceDelivery: { GeneralMessageDelivery: [{ Status: true, InfoMessage: {} }] } } }), false);
  assert.equal(display.isMessageResponse({ Siri: { ServiceDelivery: { GeneralMessageDelivery: [{ Status: true, InfoMessage: [] }] } } }), true);
});

function busContext(fetch) {
  const ctx = { window: { MobiliDisplay: display }, document: { addEventListener() {} }, fetch, console, Date, AbortSignal };
  const source = readFileSync(join(__dirname, 'vhpratp-bus.js'), 'utf8').replace('window.refreshVHPRATPBus=refreshVHPRATPBus;', 'window.__bus={fetchLine,statusLabel,reachable}; window.refreshVHPRATPBus=refreshVHPRATPBus;');
  runInNewContext(source, ctx);
  return ctx.window.__bus;
}

test('les bus conservent leur cache sur un JSON invalide ou une erreur SIRI', async () => {
  const bus = busContext(async () => ({ ok: true, json: async () => ({ message: 'invalid monitoring ref' }) }));
  const result = await bus.fetchLine({ refs: ['test'], line: 'test', code: '77' });
  assert.equal(result.ok, false);
});

test('les bus lisent toutes les livraisons SIRI valides et refusent les collections invalides', async () => {
  const row = { MonitoredVehicleJourney: { LineRef: 'test', DestinationName: ['Paris'], MonitoredCall: { ExpectedDepartureTime: new Date(Date.now()+3600000).toISOString() } } };
  const good = busContext(async () => ({ ok: true, json: async () => ({ Siri: { ServiceDelivery: { StopMonitoringDelivery: [{ Status: false }, { Status: true, MonitoredStopVisit: [row] }] } } }) }));
  const result = await good.fetchLine({refs:['test'],line:'test',code:'77'});
  assert.equal(result.ok, true);
  assert.equal(result.rows.length, 1);
  const bad = busContext(async () => ({ ok: true, json: async () => ({ Siri: { ServiceDelivery: { StopMonitoringDelivery: [{ Status: true, MonitoredStopVisit: {} }] } } }) }));
  assert.equal((await bad.fetchLine({refs:['test'],line:'test',code:'77'})).ok, false);
});

test('un horaire bus non suivi ne porte jamais la mention temps réel', () => {
  const bus = busContext(null);
  assert.match(bus.statusLabel({ aimed: '2026-11-03T17:30:00Z', expected: null, status: 'ontime' }), /THÉORIQUE/);
  assert.doesNotMatch(bus.statusLabel({ aimed: '2026-11-03T17:30:00Z', expected: null, status: 'ontime' }), /TEMPS RÉEL/);
});

test('le panneau RER conserve les deux sens quand un seul annonce des départs', async () => {
  const target = { dataset: {}, classList: { add() {}, remove() {} }, innerHTML: '' };
  const ctx = { document: { addEventListener() {}, getElementById: () => target }, window: {} };
  const fixture = { Siri: { ServiceDelivery: { StopMonitoringDelivery: [{ MonitoredStopVisit: [{ MonitoredVehicleJourney: { PublishedLineName: ['A'], DestinationName: ['Poissy'], MonitoredCall: { ExpectedDepartureTime: new Date(Date.now() + 30 * 60000).toISOString() } } }] }] } } };
  ctx.fixture = fixture;
  runInNewContext(readFileSync(join(__dirname, 'app.js'), 'utf8') + '\nfetchStop=async()=>fixture; this.renderRerForTest=renderRer;', ctx);
  await ctx.renderRerForTest();
  assert.match(target.innerHTML, /Vers Paris/);
  assert.match(target.innerHTML, /Vers Boissy \/ Est/);
  assert.match(target.innerHTML, /Aucun départ atteignable annoncé/);
});
