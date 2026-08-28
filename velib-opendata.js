(() => {
  const STATIONS = {
    VINCENNES: { code: "12163", label: "Hippodrome / Vincennes" },
    BREUIL: { code: "12128", label: "École du Breuil" }
  };

  function urlFor(code) {
    return `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json?lang=fr&qv1=(${encodeURIComponent(code)})&timezone=Europe%2FParis`;
  }

  async function loadStation(code) {
    const direct = urlFor(code);
    const candidates = [direct, PROXY + encodeURIComponent(direct)];
    for (const url of candidates) {
      try {
        const data = await fetchJSON(url, 12000);
        if (Array.isArray(data) && data.length) return data[0];
      } catch (_) {}
    }
    return null;
  }

  async function refreshVelibOpenData() {
    const cache = {};
    for (const [key, station] of Object.entries(STATIONS)) {
      const el = document.getElementById(`velib-${key.toLowerCase()}`);
      if (!el) continue;
      const s = await loadStation(station.code);
      if (!s) {
        el.innerHTML = `<div class="velib-name">${esc(station.label)}</div><div class="velib-value unavailable">Données indisponibles</div><div class="muted">Station ${esc(station.code)}</div>`;
        continue;
      }

      const mechanical = Number(s.numbikesavailable ?? s.mechanical ?? 0);
      const electric = Number(s.ebike ?? s.ebikeavailable ?? 0);
      const docks = Number(s.numdocksavailable ?? s.numdocks ?? 0);
      const total = mechanical + electric;
      cache[key] = { mech: mechanical, elec: electric, docks, total };

      el.innerHTML = `
        <div class="velib-name">${esc(text(s.name || station.label))}</div>
        <div class="velib-value"><strong>${total}</strong> vélos disponibles</div>
        <div class="velib-breakdown"><span>Classiques <strong>${mechanical}</strong></span><span>Électriques <strong>${electric}</strong></span><span>Places <strong>${docks}</strong></span></div>
        <div class="muted">Station ${esc(station.code)} • OpenData Paris</div>`;
    }
    cachedVelib = cache;
  }

  window.refreshVelibOpenData = refreshVelibOpenData;
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(refreshVelibOpenData, 2600);
    setInterval(refreshVelibOpenData, 60 * 1000);
  });
})();