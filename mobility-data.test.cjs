const {test} = require('node:test');
const assert = require('node:assert/strict');
const data = require('./mobility-data.js');
const now = Date.parse('2026-09-17T12:00:00Z');
const passage = (minutes, extra = {}) => ({when: new Date(now + minutes * 60000).toISOString(), monitored:true, ...extra});
test('IDFM countdown, theoretical and cancelled states', () => {
  assert.equal(data.label(passage(0.5), now), 'À l’approche');
  assert.equal(data.label(passage(2), now), '02 min');
  assert.equal(data.label(passage(65), now), '15:05');
  assert.equal(data.label(passage(2,{monitored:false}), now), '02* min');
  assert.equal(data.label(passage(2,{status:'cancelled'}), now), 'Supprimé');
  assert.equal(data.label(passage(-2), now), 'Information non disponible');
});
test('Failed or malformed SIRI never becomes an empty successful response', () => {
  assert.throws(() => data.validDelivery({}, 'StopMonitoringDelivery'));
  assert.throws(() => data.validDelivery({Siri:{ServiceDelivery:{StopMonitoringDelivery:[{Status:'false'}]}}}, 'StopMonitoringDelivery'));
  assert.equal(data.validDelivery({Siri:{ServiceDelivery:{StopMonitoringDelivery:[{Status:'true', MonitoredStopVisit:[]}]}}}, 'StopMonitoringDelivery').length,1);
});
test('Reachability excludes missed trains and cancellations; freshness expires', () => {
  assert.equal(data.reachable([passage(5),passage(15),passage(18,{status:'cancelled'})],14,now).length,1);
  assert.equal(data.fresh({ok:true,at:now-91000},now),false);
  assert.equal(data.fresh({ok:false,at:now},now),false);
  assert.equal(data.fresh({ok:true,at:now},now),true);
});
test('Opposite RER directions are not conflated', () => {
  assert.equal(data.west({destination:'Boissy-Saint-Léger'}),false);
  assert.equal(data.east({destination:'Boissy-Saint-Léger'}),true);
  assert.equal(data.west({destination:'Saint-Germain-en-Laye'}),true);
  assert.equal(data.west({destination:'Destination non communiquée'}),false);
});
test('Invalid times are discarded and duplicate journeys appear once', () => {
  assert.equal(data.unique([{when:'invalid'}, passage(5,{journeyRef:'one'}), passage(5,{journeyRef:'one'})],now).length,1);
});
test('Traffic pagination preserves every word and limits ordinary text pages', () => {
  const source = 'Une perturbation est annoncée sur votre ligne. '.repeat(20).trim();
  const pages = data.pages(source);
  assert.ok(pages.length > 1);
  assert.ok(pages.every(page => page.length <= 280));
  assert.equal(pages.join(' '), source);
});
