(() => {
  const VELIB_STATUS_URL = "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_status.json";
  const VELIB_INFO_URL = "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_information.json";
  const VELIB_PROXY = "https://velib-proxy.hippodrome-proxy42.workers.dev/?url=";

  const VELIB_TARGETS = {
    VINCENNES: { publicCode: "12163", gbfsIds: ["1074333296", "12163"], label: "Hippodrome / Vincennes", nameHints: ["hippodrome", "vincennes"] },
    BREUIL: { publicCode: "12128", gbfsIds: ["508042092", "12128"], label: "École du Breuil", nameHints: ["breuil", "pyramide"] }
  };

  const normalise = v => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const proxyUrl = url => VELIB_PROXY + encodeURIComponent(url);

  async function getJSONCandidates(urls, timeout = 12000) {
    for (const url of urls) {
      try {
        const data = await fetchJSON(url, timeout);
        if (data) return data;
      } catch (_) {}
    }
    return null;
  }

  function findVelibStation(target, statuses, infos) {
    let status = statuses.find(s => target.gbfsIds.includes(String(s?.station_id)));
    let info = status ? infos.find(i => String(i?.station_id) === String(status.station_id)) : null;
    if (status) return { status, info };

    info = infos.find(i => {
      const name = normalise(i?.name);
      return target.nameHints.some(h => name.includes(normalise(h)));
    });
    if (!info) return { status: null, info: null };
    status = statuses.find(s => String(s?.station_id) === String(info.station_id)) || null;
    return { status, info };
  }

  function bikeCounts(st) {
    let mechanical = 0, electric = 0;
    const types = Array.isArray(st?.num_bikes_available_types) ? st.num_bikes_available_types : [];
    for (const t of types) {
      mechanical += Number(t?.mechanical || 0);
      electric += Number(t?.ebike || t?.electric || 0);
    }
    if (!types.length) {
      mechanical = Number(st?.num_mechanical_bikes_available || 0);
      electric = Number(st?.num_ebikes_available || 0);
    }
    return { mechanical, electric };
  }

  async function refreshVelibFixed() {
    const [statusData, infoData] = await Promise.all([
      getJSONCandidates([VELIB_STATUS_URL, proxyUrl(VELIB_STATUS_URL)]),
      getJSONCandidates([VELIB_INFO_URL, proxyUrl(VELIB_INFO_URL)])
    ]);

    const statuses = statusData?.data?.stations || [];
    const infos = infoData?.data?.stations || [];
    const cache = {};

    for (const [key, target] of Object.entries(VELIB_TARGETS)) {
      const el = document.getElementById(`velib-${key.toLowerCase()}`);
      if (!el) continue;
      const { status: st, info } = findVelibStation(target, statuses, infos);
      if (!st) {
        el.innerHTML = `<div class="velib-name">${esc(target.label)}</div><div class="velib-value unavailable">Données indisponibles</div><div class="muted">Station ${esc(target.publicCode)}</div>`;
        continue;
      }
      const { mechanical, electric } = bikeCounts(st);
      const docks = Number(st?.num_docks_available ?? 0);
      const renting = st?.is_installed !== 0 && st?.is_installed !== false && st?.is_renting !== 0 && st?.is_renting !== false;
      const total = mechanical + electric;
      cache[key] = { mech: mechanical, elec: electric, docks, total };
      el.innerHTML = `
        <div class="velib-name">${esc(text(info?.name || target.label))}</div>
        <div class="velib-value">${renting ? `<strong>${total}</strong> vélos disponibles` : "Service suspendu"}</div>
        <div class="velib-breakdown"><span>Classiques <strong>${mechanical}</strong></span><span>Électriques <strong>${electric}</strong></span><span>Places <strong>${docks}</strong></span></div>
        <div class="muted">Station ${esc(target.publicCode)}</div>`;
    }
    cachedVelib = cache;
  }

  const pmuDateKey = date => `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
  const pmuDateLabel = date => date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  function parsePmuDate(value) {
    if (value == null) return null;
    if (typeof value === "number") {
      const d = new Date(value < 1e12 ? value * 1000 : value);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function vincennesReunions(data) {
    const reunions = data?.programme?.reunions || data?.reunions || [];
    return reunions.filter(r => {
      const code = String(r?.hippodrome?.code || r?.hippodrome?.codeHippodrome || "").toUpperCase();
      const name = text(r?.hippodrome?.libelleCourt || r?.hippodrome?.libelleLong || r?.hippodrome?.nom || "");
      return code === "VIN" || /VINCENNES/i.test(name);
    });
  }

  async function fetchPmuProgramme(date) {
    const ds = pmuDateKey(date);
    const targets = [
      `https://online.turfinfo.api.pmu.fr/rest/client/1/programme/${ds}?specialisation=INTERNET&meteo=true`,
      `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${ds}`,
      `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${ds}?specialisation=INTERNET&meteo=true`
    ];
    for (const target of targets) {
      const data = await getJSONCandidates([target, PROXY + encodeURIComponent(target)], 15000);
      if (data && (data?.programme?.reunions || data?.reunions)) return data;
    }
    return null;
  }

  async function refreshCoursesFixed() {
    const cont = document.getElementById("courses-list");
    if (!cont) return;
    cont.innerHTML = `<div class="empty-state">Recherche de la prochaine réunion à Vincennes…</div>`;

    const now = new Date();
    let selected = null;
    for (let offset = 0; offset <= 10; offset++) {
      const date = new Date(now);
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + offset);
      const data = await fetchPmuProgramme(date);
      const reunions = vincennesReunions(data);
      if (reunions.length) { selected = { date, reunions, offset }; break; }
    }

    if (!selected) {
      cont.innerHTML = `<div class="empty-state"><strong>Programme momentanément indisponible</strong><span>Impossible de récupérer la prochaine réunion Vincennes.</span></div>`;
      return;
    }

    const rows = [];
    selected.reunions.forEach(r => {
      (r?.courses || []).forEach((c, index) => {
        const dt = parsePmuDate(c?.heureDepart || c?.heureDepartCourse || c?.dateDepart);
        if (!dt) return;
        if (selected.offset === 0 && dt.getTime() < Date.now() - 5 * 60 * 1000) return;
        rows.push({ date: dt, time: dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), name: text(c?.libelle || c?.libelleCourt || c?.nom || `Course ${index + 1}`), number: c?.numOrdre || c?.numero || index + 1 });
      });
    });
    rows.sort((a, b) => a.date - b.date);

    const heading = selected.offset === 0 ? "Aujourd’hui à Vincennes" : `Prochaine réunion • ${pmuDateLabel(selected.date)}`;
    if (!rows.length) {
      cont.innerHTML = `<div class="courses-date-label">${esc(heading)}</div><div class="empty-state">Réunion trouvée, horaires de courses non disponibles.</div>`;
      return;
    }

    cont.innerHTML = `<div class="courses-date-label">${esc(heading)}</div>` + rows.slice(0, 8).map((r, i) => `
      <div class="course ${i === 0 ? "next-course" : ""}">
        <span class="course-time">${esc(r.time)}</span>
        <span class="course-number">C${esc(r.number)}</span>
        <span class="course-name">${esc(r.name)}</span>
        ${i === 0 ? `<strong class="course-next-label">PROCHAINE</strong>` : ""}
      </div>`).join("");
  }

  window.refreshVelibFixed = refreshVelibFixed;
  window.refreshCoursesFixed = refreshCoursesFixed;

  document.addEventListener("DOMContentLoaded", () => {
    // app.js possède encore ses anciennes routines lexicales : on exécute donc
    // explicitement les versions corrigées après son premier rafraîchissement.
    setTimeout(() => { refreshVelibFixed(); refreshCoursesFixed(); }, 1800);
    setInterval(refreshVelibFixed, 60 * 1000);
    setInterval(refreshCoursesFixed, 5 * 60 * 1000);
  });
})();
