(() => {
  const sources = new Map();
  const cadences = { traffic: 180000, courses: 300000, news: 300000, weather: 600000 };
  const timeLabel = value => new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

  function updateSource(previous, ok, options = {}, now = Date.now()) {
    const state = { cadence: 60000, ...previous, ...options, ok, attemptedAt: now };
    if (ok) state.updatedAt = now;
    return state;
  }

  function sourceState(state, now = Date.now()) {
    if (!state) return { kind: 'loading', label: 'Chargement…' };
    if (!Number.isFinite(state.updatedAt)) return { kind: 'unavailable', label: 'Données indisponibles' };
    const time = timeLabel(state.updatedAt);
    if (!state.ok || now - state.updatedAt > state.cadence * 2) {
      return { kind: 'stale', label: `Dernier relevé ${time}${state.partial ? ' · partiel' : ''}` };
    }
    if (state.partial) return { kind: 'partial', label: `Partiel · ${state.coverage || 'certaines données manquent'} · ${time}` };
    return { kind: 'live', label: `Relevé ${time}` };
  }

  function isDepartureReachable(iso, accessMinutes = 0, now = Date.now()) {
    const at = Date.parse(iso);
    return Number.isFinite(at) && at >= now + Number(accessMinutes) * 60000;
  }

  function isStopResponse(data) {
    const service = data?.Siri?.ServiceDelivery;
    const deliveries = service?.StopMonitoringDelivery;
    return service?.Status !== false && !service?.ErrorCondition && Array.isArray(deliveries)
      && deliveries.some(item => validDelivery(item, 'MonitoredStopVisit'));
  }

  function validDelivery(item, collection) {
    return Boolean(item && item.Status !== false && !item.ErrorCondition
      && (item[collection] === undefined || Array.isArray(item[collection]))
      && (item.Status === true || Array.isArray(item[collection])));
  }

  function isMessageResponse(data) {
    const service = data?.Siri?.ServiceDelivery;
    return service?.Status !== false && !service?.ErrorCondition
      && Array.isArray(service?.GeneralMessageDelivery)
      && service.GeneralMessageDelivery.some(item => validDelivery(item, 'InfoMessage'));
  }

  function paint() {
    document.querySelectorAll('[data-source-status]').forEach(el => {
      const key = el.dataset.sourceStatus;
      const state = sources.get(key);
      const view = sourceState(state);
      if (el.textContent !== view.label) el.textContent = view.label;
      el.dataset.state = view.kind;
      if (state?.updatedAt) el.dataset.updatedAt = new Date(state.updatedAt).toISOString();
      el.title = `Actualisation toutes les ${Math.round((state?.cadence || cadences[key] || 60000) / 1000)} s`;
      const region = el.closest('[data-source-region]');
      if (region) region.dataset.freshness = view.kind;
    });
  }

  function pruneDepartures() {
    const now = Date.now();
    document.querySelectorAll('[data-departure-at]').forEach(el => {
      const minutes = Number(el.closest('[data-access-minutes]')?.dataset.accessMinutes || 0);
      el.hidden = !isDepartureReachable(el.dataset.departureAt, minutes, now);
      if (el.dataset.cancelled === 'true') return;
      const wait = el.querySelector('.departure-wait,.wait');
      if (wait && !el.hidden) {
        const remaining = Math.max(0, Math.ceil((Date.parse(el.dataset.departureAt) - now) / 60000));
        const value = `dans ${remaining} min`;
        if (wait.textContent !== value) wait.textContent = value;
      }
    });
    document.querySelectorAll('.train-list,.passages').forEach(list => {
      const departures = [...list.querySelectorAll('[data-departure-at]')];
      if (!departures.length) return;
      let empty = list.querySelector('.expired-departures');
      const exhausted = departures.every(el => el.hidden);
      if (exhausted && !empty) {
        empty = document.createElement('p');
        empty.className = 'expired-departures';
        empty.textContent = 'Aucun départ encore atteignable. Actualisation automatique.';
        list.appendChild(empty);
      } else if (!exhausted && empty) empty.remove();
    });
  }

  function tick() {
    if (document.hidden) return;
    pruneDepartures();
    paint();
    const connection = document.getElementById('connection-status');
    if (connection) connection.textContent = navigator.onLine === false ? 'Connexion interrompue · dernières données conservées' : 'Actualisation automatique';
  }

  function markSource(key, ok, options = {}) {
    sources.set(key, updateSource(sources.get(key), ok, { cadence: cadences[key] || 60000, ...options }));
    if (typeof document !== 'undefined') tick();
  }

  function resume() {
    tick();
    if (document.hidden) return;
    const refreshers = {
      rer: 'refreshPassages', joinville: 'refreshVHPRATPBus', breuil201: 'refreshVHPRATPBus',
      hippodrome: 'refreshLocationLayout', breuil77: 'refreshLocationLayout',
      velib: 'refreshVelibFixed', courses: 'refreshCoursesFixed', traffic: 'refreshTrafficFixed',
      news: 'refreshNews', weather: 'refreshWeather'
    };
    const pending = new Set();
    for (const [key, name] of Object.entries(refreshers)) {
      if (sourceState(sources.get(key)).kind !== 'live' && typeof window[name] === 'function') pending.add(name);
    }
    pending.forEach(name => { Promise.resolve(window[name]()).catch(() => {}); });
  }

  window.MobiliDisplay = { updateSource, sourceState, isDepartureReachable, isStopResponse, isMessageResponse, validDelivery, markSource };
  if (typeof document === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    tick();
    setInterval(tick, 15000);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', tick);
  });
})();
