/* Pure display/data rules. IDFM Bus V2.0, pp. 229–235 and 317. */
(function (root) {
  'use strict';
  const normalize = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const time = v => new Date(v).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
  const cancelled = p => /cancelled|canceled|supprime/.test(normalize(p?.status));
  function label(p, now = Date.now()) {
    if (!p) return 'Information non disponible';
    if (cancelled(p)) return 'Supprimé';
    const remaining = new Date(p.when).getTime() - now;
    if (!Number.isFinite(remaining) || remaining < -30000) return 'Information non disponible';
    const suffix = p.monitored === true ? '' : '*';
    if (remaining < 60000 && p.monitored === true) return 'À l’approche';
    if (remaining >= 3600000) return time(p.when) + suffix;
    return String(Math.max(1, Math.ceil(remaining / 60000))).padStart(2, '0') + suffix + ' min';
  }
  function validDelivery(data, key) {
    const deliveries = data?.Siri?.ServiceDelivery?.[key];
    if (!Array.isArray(deliveries) || !deliveries.length || deliveries.some(d => d.ErrorCondition || d.Status === false || d.Status === 'false')) {
      throw new Error('Flux SIRI indisponible ou invalide');
    }
    return deliveries;
  }
  function fresh(meta, now = Date.now()) {
    return !!meta?.ok && Number.isFinite(meta.at) && now - meta.at < 90000;
  }
  function unique(rows, now = Date.now()) {
    const seen = new Set();
    return rows.filter(p => {
      if (!p.when || !Number.isFinite(new Date(p.when).getTime()) || new Date(p.when).getTime() < now - 30000) return false;
      const key = p.journeyRef || [p.lineRef, p.destination, p.when].join('|');
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).sort((a, b) => new Date(a.when) - new Date(b.when));
  }
  function west(p) {
    return (p.onward || []).some(s => /chatelet|nation|gare de lyon/.test(normalize(s.name))) ||
      /saint.germain|cergy|poissy|la defense|nanterre|rueil|le vesinet/.test(normalize(p.destination));
  }
  function east(p) { return /boissy|sucy|la varenne|saint.maur|creteil/.test(normalize(p.destination)); }
  function reachable(rows, accessMinutes, now = Date.now()) {
    return unique(rows, now).filter(p => !cancelled(p) && new Date(p.when).getTime() >= now + accessMinutes * 60000);
  }
  function onward(p, pattern) {
    return (p?.onward || []).find(s => pattern.test(normalize(s.name)) && Number.isFinite(new Date(s.time).getTime()));
  }
  function pages(text, limit = 280) {
    const result = []; let page = '';
    for (const word of String(text).split(/\s+/)) {
      if (page && page.length + word.length + 1 > limit) { result.push(page); page = ''; }
      page += (page ? ' ' : '') + word;
    }
    if (page) result.push(page);
    return result;
  }
  const api = { normalize, time, cancelled, label, validDelivery, fresh, unique, west, east, reachable, onward, pages };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MobiliData = api;
})(typeof window !== 'undefined' ? window : this);
