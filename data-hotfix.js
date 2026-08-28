(() => {
  const VELIB_STATUS_URL = "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_status.json";
  const VELIB_INFO_URL = "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_information.json";
  const VELIB_PROXY = "https://velib-proxy.hippodrome-proxy42.workers.dev/?url=";

  // 12163 / 12128 sont les numéros connus côté public ; le GBFS renvoie des station_id propres.
  // On garde les station_id historiques connus et un fallback par nom/localisation.
  const VELIB_TARGETS = {
    VINCENNES: {
      publicCode: "12163",
      gbfsIds: ["1074333296", "12163"],
      label: "Hippodrome / Vincennes",
      nameHints: ["hippodrome", "vincennes"]
    },
    BREUIL: {
      publicCode: "12128",
      gbfsIds: ["508042092", "12128"],
      label: "École du Breuil",
      nameHints: ["breuil", "pyramide"]
    }
  };

  function normalise(v = "") {
    return String(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function proxyUrl(url) {
    return VELIB_PROXY + encodeURIComponent(url);
  }

  function findVelibStation(target, statuses, infos) {
    let status = statuses.find(s => target.gbfsIds.includes(String(s?.station_id)));
    let info = status ? infos.find(i => String(i?.station_id) === String(status.station_id)) : null;
    if (status) return { status, info };

    info = infos.find(i => {
      const name = normalise(i?.name || "");
      return target.nameHints.some(h => name.includes(normalise(h)));
    });
    if (!info) return { status: null, info: null };
    status = statuses.find(s => String(s?.station_id) === String(info.station_id)) || null;
    return { status, info };
  }

  function bikeCounts(st) {
    let mechanical = 0;
    let electric = 0;
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

  window.refreshVelib = async function refreshVelibFixed() {
    const [statusData, infoData] = await Promise.all([
      fetchJSON(proxyUrl(VELIB_STATUS_URL), 12000),
      fetchJSON(proxyUrl(VELIB_INFO_URL), 12000)
    ]);

    const statuses = statusData?.data?.stations || [];
    const infos = infoData?.data?.stations || [];
    const cache = {};

    for (const [key, target] of Object.entries(VELIB_TARGETS)) {
      const el = document.getElementById(`velib-${key.toLowerCase()}`);
      if (!el) continue;

      const { status: st, info } = findVelibStation(target, statuses, infos);
      if (!st) {
        el.innerHTML = `<div class="velib-name">${esc(target.label)}</div><div class="velib-value">Données indisponibles</div><div class="muted">Station ${esc(target.publicCode)}</div>`;
        continue;
      }

      const { mechanical, electric } = bikeCounts(st);
      const docks = Number(st?.num_docks_available ?? st?.numDocksAvailable ?? 0);
      const renting = st?.is_installed !== 0 && st?.is_installed !== false && st?.is_renting !== 0 && st?.is_renting !== false;
      const total = mechanical + electric;
      cache[key] = { mech: mechanical, elec: electric, docks, total };

      const stationName = text(info?.name || target.label);
      el.innerHTML = `
        <div class="velib-name">${esc(stationName)}</div>
        <div class="velib-value">${renting ? `<strong>${total}</strong> vélos` : "Service suspendu"}</div>
        <div class="velib-breakdown"><span>🚲 ${mechanical}</span><span>⚡ ${electric}</span><span>↩ ${docks} places</span></div>
        <div class="muted">Station ${esc(target.publicCode)}</div>`;
    }

    cachedVelib = cache;
  };

  function pmuDateKey(date) {
    return `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
  }

  function pmuDateLabel(date) {
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }

  function parsePmuDate(value) {
    if (value == null) return null;
    if (typeof value === "number") {
      const ms = value < 1e12 ? value * 1000 : value;
      const d = new Date(ms);
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
    const urls = [
      `https://online.turfinfo.api.pmu.fr/rest/client/1/programme/${ds}?specialisation=INTERNET&meteo=true`,
      `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${ds}?specialisation=INTERNET&meteo=true`
    ];
    for (const target of urls) {
      const data = await fetchJSON(PROXY + encodeURIComponent(target), 15000);
      if (data && (data?.programme?.reunions || data?.reunions)) return data;
    }
    return null;
  }

  window.refreshCourses = async function refreshCoursesFixed() {
    const cont = document.getElementById("courses-list");
    if (!cont) return;
    cont.innerHTML = `<div class="empty-state">Recherche de la prochaine réunion à Vincennes…</div>`;

    const now = new Date();
    let selected = null;

    // Aujourd'hui + les 6 jours suivants : suffisant pour que le module reste utile les jours sans courses.
    for (let offset = 0; offset <= 6; offset++) {
      const date = new Date(now);
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + offset);
      const data = await fetchPmuProgramme(date);
      const reunions = vincennesReunions(data);
      if (reunions.length) {
        selected = { date, reunions, offset };
        break;
      }
    }

    if (!selected) {
      cont.innerHTML = emptyHTML("Aucune réunion Vincennes trouvée dans les 7 prochains jours");
      return;
    }

    const rows = [];
    selected.reunions.forEach(r => {
      (r?.courses || []).forEach((c, index) => {
        const dt = parsePmuDate(c?.heureDepart || c?.heureDepartCourse || c?.dateDepart);
        if (!dt) return;
        if (selected.offset === 0 && dt.getTime() < Date.now() - 5 * 60 * 1000) return;
        rows.push({
          date: dt,
          time: dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          name: text(c?.libelle || c?.libelleCourt || c?.nom || `Course ${index + 1}`),
          number: c?.numOrdre || c?.numero || index + 1
        });
      });
    });
    rows.sort((a, b) => a.date - b.date);

    if (!rows.length) {
      cont.innerHTML = emptyHTML(`Réunion détectée ${pmuDateLabel(selected.date)}, horaires indisponibles`);
      return;
    }

    const intro = selected.offset === 0
      ? `<div class="courses-date-label">Aujourd’hui à Vincennes</div>`
      : `<div class="courses-date-label">Prochaine réunion • ${esc(pmuDateLabel(selected.date))}</div>`;

    cont.innerHTML = intro + rows.slice(0, 9).map((r, i) => `
      <div class="course ${i === 0 ? "next-course" : ""}">
        <span class="course-time">${esc(r.time)}</span>
        <span class="course-number">C${esc(r.number)}</span>
        <span class="course-name">${esc(r.name)}</span>
        ${i === 0 ? `<strong class="course-next-label">PROCHAINE</strong>` : ""}
      </div>`).join("");
  };
})();
