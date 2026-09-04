(() => {
  const VELIB_PARIS_URL = "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/records?where=stationcode%20in%20(%2212163%22,%2212128%22)&limit=10";

  const VELIB_TARGETS = {
    VINCENNES: { publicCode: "12163", label: "Hippodrome / Vincennes" },
    BREUIL: { publicCode: "12128", label: "École du Breuil" }
  };
  const lastGoodVelibMarkup = new Map();
  let lastGoodVelibUpdate = null;
  let lastGoodCoursesMarkup = "";
  let lastGoodCoursesUpdate = null;

  const shortTime = date => date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  function setPanelStatus(selector, normalText, ok, lastUpdate) {
    const label = document.querySelector(`${selector} .panel-heading p`);
    if (!label) return;
    label.textContent = ok ? normalText : (lastUpdate ? `${normalText} • dernière donnée ${shortTime(lastUpdate)}` : `${normalText} • données indisponibles`);
    label.classList.toggle("stale-label", !ok);
  }

  async function getJSONCandidates(urls, timeout = 12000) {
    for (const url of urls) {
      try {
        const data = await fetchJSON(url, timeout);
        if (data) return data;
      } catch (_) {}
    }
    return null;
  }

  async function fetchVelibParis() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(VELIB_PARIS_URL, { cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data?.results) ? data.results : [];
    } catch (_) {
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  async function refreshVelibFixed() {
    const stations = await fetchVelibParis();
    const cache = {};
    let updated = 0;
    const updateTime = new Date();

    for (const [key, target] of Object.entries(VELIB_TARGETS)) {
      const el = document.getElementById(`velib-${key.toLowerCase()}`);
      if (!el) continue;
      const st = stations.find(station => String(station?.stationcode) === target.publicCode);
      if (!st) {
        const cached = lastGoodVelibMarkup.get(key);
        if (cached) { el.innerHTML = cached; el.classList.add("is-stale"); }
        else el.innerHTML = `<div class="velib-name">${esc(target.label)}</div><div class="velib-value unavailable">Données momentanément indisponibles</div><div class="muted">Nouvelle tentative automatique</div>`;
        continue;
      }
      const mechanical = Number(st?.mechanical || 0);
      const electric = Number(st?.ebike || 0);
      const docks = Number(st?.numdocksavailable || 0);
      const renting = st?.is_installed === "OUI" && st?.is_renting === "OUI";
      const total = mechanical + electric;
      cache[key] = { mech: mechanical, elec: electric, docks, total };
      const markup = `
        <div class="velib-name">${esc(text(st?.name || target.label))}</div>
        <div class="velib-value">${renting ? `<strong>${total}</strong> vélos disponibles` : "Service suspendu"}</div>
        <div class="velib-breakdown"><span>Classiques <strong>${mechanical}</strong></span><span>Électriques <strong>${electric}</strong></span><span>Places <strong>${docks}</strong></span></div>
        <div class="muted">Station ${esc(target.publicCode)}</div>`;
      lastGoodVelibMarkup.set(key, markup);
      el.classList.remove("is-stale");
      el.innerHTML = markup;
      updated += 1;
    }
    if (updated) {
      cachedVelib = { ...(cachedVelib || {}), ...cache };
      lastGoodVelibUpdate = updateTime;
    }
    setPanelStatus(".panel-velib", "Disponibilités en temps réel", updated === Object.keys(VELIB_TARGETS).length, lastGoodVelibUpdate);
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
    if (!lastGoodCoursesMarkup) cont.innerHTML = `<div class="empty-state">Recherche de la prochaine réunion à Vincennes…</div>`;

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
      if (lastGoodCoursesMarkup) { cont.innerHTML = lastGoodCoursesMarkup; cont.classList.add("is-stale"); }
      else cont.innerHTML = `<div class="empty-state"><strong>Programme momentanément indisponible</strong><span>Nouvelle tentative automatique</span></div>`;
      setPanelStatus(".panel-courses", "Prochaine réunion", false, lastGoodCoursesUpdate);
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
      const markup = `<div class="courses-date-label">${esc(heading)}</div><div class="empty-state">Réunion trouvée, horaires de courses non disponibles.</div>`;
      lastGoodCoursesMarkup = markup;
      lastGoodCoursesUpdate = new Date();
      cont.classList.remove("is-stale");
      cont.innerHTML = markup;
      setPanelStatus(".panel-courses", "Prochaine réunion", true, lastGoodCoursesUpdate);
      return;
    }

    const markup = `<div class="courses-date-label">${esc(heading)}</div>` + rows.slice(0, 8).map((r, i) => `
      <div class="course ${i === 0 ? "next-course" : ""}">
        <span class="course-time">${esc(r.time)}</span>
        <span class="course-number">C${esc(r.number)}</span>
        <span class="course-name">${esc(r.name)}</span>
        ${i === 0 ? `<strong class="course-next-label">PROCHAINE</strong>` : ""}
      </div>`).join("");
    lastGoodCoursesMarkup = markup;
    lastGoodCoursesUpdate = new Date();
    cont.classList.remove("is-stale");
    cont.innerHTML = markup;
    setPanelStatus(".panel-courses", "Prochaine réunion", true, lastGoodCoursesUpdate);
  }

  window.refreshVelibFixed = refreshVelibFixed;
  window.refreshCoursesFixed = refreshCoursesFixed;

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => { refreshVelibFixed(); refreshCoursesFixed(); }, 1800);
    setInterval(refreshVelibFixed, 60 * 1000);
    setInterval(refreshCoursesFixed, 5 * 60 * 1000);
  });
})();
