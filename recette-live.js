(() => {
  "use strict";

  const PROXY = "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=";
  const PRIM = "https://prim.iledefrance-mobilites.fr/marketplace";
  const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=48.835&longitude=2.440&current_weather=true&timezone=Europe%2FParis";
  const VELIB_STATUS_URL = "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_status.json";
  const VELIB_INFO_URL = "https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole/station_information.json";
  const VELIB_PROXY = "https://velib-proxy.hippodrome-proxy42.workers.dev/?url=";

  const SOURCES = {
    rer: { line: "A", ref: "STIF:StopArea:SP:43135:", name: "Joinville-le-Pont" },
    bus77: { line: "77", ref: "STIF:StopPoint:Q:22452:", destination: "Gare de Lyon" },
    bus101: { line: "101", ref: "STIF:StopPoint:Q:21252:", destination: "Joinville-le-Pont" }
  };
  const VELIB = {
    hippodrome: { ids: ["1074333296", "12163"], code: "12163", label: "Hippodrome" },
    breuil: { ids: ["508042092", "12128"], code: "12128", label: "École du Breuil" }
  };
  const WEATHER = {
    0: "Ciel dégagé", 1: "Peu nuageux", 2: "Partiellement nuageux", 3: "Couvert",
    45: "Brouillard", 48: "Brouillard givrant", 51: "Bruine faible", 53: "Bruine",
    55: "Bruine forte", 61: "Pluie faible", 63: "Pluie", 65: "Pluie forte",
    71: "Neige faible", 73: "Neige", 75: "Neige forte", 80: "Averses faibles",
    81: "Averses", 82: "Fortes averses", 95: "Orage", 96: "Orage et grêle", 99: "Orage fort"
  };

  const state = {
    weather: null,
    meeting: null,
    rer: [],
    bus77: [],
    bus101: [],
    velib: {},
    incidents: { A: [], 77: [] },
    updatedAt: null,
    pending: true
  };

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
  const scalar = value => value && typeof value === "object" && "value" in value ? scalar(value.value) : (value ?? "");
  const clean = value => String(scalar(value)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const fmtTime = value => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };
  const fmtDate = date => date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const minutesUntil = value => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : Math.max(0, Math.round((date.getTime() - Date.now()) / 60000));
  };
  const countdown = value => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const seconds = Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
    if (seconds >= 3600) return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const compactWait = value => {
    const minutes = minutesUntil(value);
    if (minutes == null) return `—<span class="time-unit">MIN</span>`;
    if (minutes >= 120) return `${Math.floor(minutes / 60)}<span class="time-unit">H</span>${String(minutes % 60).padStart(2, "0")}`;
    return `${minutes}<span class="time-unit">MIN</span>`;
  };
  const lineMatches = (visit, code) => {
    const published = String(visit.published || "").toUpperCase().replace(/\s/g, "");
    const ref = String(visit.lineRef || "").toUpperCase();
    const idfm = { A: "C01742", 77: "C02251", 101: "C01130" }[code];
    return !published || published === code || ref.includes(`::${code}:`) || (idfm && ref.includes(idfm));
  };

  async function fetchJSON(url, timeout = 14000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }
  const primUrl = path => PROXY + encodeURIComponent(PRIM + path);
  const fetchCandidates = async urls => {
    let lastError = null;
    for (const url of urls) {
      try { return await fetchJSON(url); } catch (error) { lastError = { url, error }; }
    }
    if (lastError) console.warn("Mobili live source", lastError.url, lastError.error);
    return null;
  };

  function parseVisits(data) {
    const deliveries = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery || [];
    const rows = deliveries.flatMap(d => Array.isArray(d?.MonitoredStopVisit) ? d.MonitoredStopVisit : []);
    return rows.map(row => {
      const journey = row?.MonitoredVehicleJourney || {};
      const call = journey?.MonitoredCall || {};
      const expected = call.ExpectedDepartureTime || call.ExpectedArrivalTime || null;
      const aimed = call.AimedDepartureTime || call.AimedArrivalTime || null;
      const when = expected || aimed;
      const onwardRaw = [
        ...(Array.isArray(journey?.OnwardCalls?.OnwardCall) ? journey.OnwardCalls.OnwardCall : []),
        ...(Array.isArray(call?.OnwardCalls?.OnwardCall) ? call.OnwardCalls.OnwardCall : [])
      ];
      const onward = onwardRaw.map(stop => ({
        name: clean(stop?.StopPointName?.[0] || stop?.DestinationDisplay?.[0] || stop?.StopPointRef),
        time: stop?.ExpectedArrivalTime || stop?.AimedArrivalTime || stop?.ExpectedDepartureTime || stop?.AimedDepartureTime
      })).filter(stop => stop.name);
      return {
        lineRef: clean(journey.LineRef),
        published: clean(journey?.PublishedLineName?.[0]),
        destination: clean(call?.DestinationDisplay?.[0] || journey?.DestinationName?.[0] || journey?.DirectionName?.[0]) || "Destination non communiquée",
        expected, aimed, when,
        wait: minutesUntil(when),
        status: String(call.DepartureStatus || call.ArrivalStatus || "onTime"),
        monitored: journey?.Monitored !== false,
        vehicleAtStop: Boolean(call.VehicleAtStop),
        onward
      };
    }).filter(row => row.when && new Date(row.when).getTime() >= Date.now() - 90000);
  }

  async function loadPassages(source) {
    const data = await fetchCandidates([primUrl(`/stop-monitoring?MonitoringRef=${encodeURIComponent(source.ref)}`)]);
    return parseVisits(data || {}).filter(row => lineMatches(row, source.line)).sort((a, b) => new Date(a.when) - new Date(b.when)).slice(0, 6);
  }

  function messageText(message) {
    const content = message?.Content || {};
    return clean(content?.Message?.[0]?.MessageText?.[0] || content?.Message?.[0]?.MessageText || content?.Message?.MessageText?.[0] || content?.Message?.MessageText || content?.Description?.[0] || content?.Description || message?.Description?.[0] || message?.Description || message?.Summary?.[0] || message?.Summary);
  }

  async function loadMessages(code) {
    const idfm = { A: "C01742", 77: "C02251" }[code];
    const refs = [`STIF:Line::${idfm}:`];
    const messages = [];
    for (const ref of refs) {
      const data = await fetchCandidates([primUrl(`/general-message?LineRef=${encodeURIComponent(ref)}`)]);
      for (const delivery of data?.Siri?.ServiceDelivery?.GeneralMessageDelivery || []) {
        for (const message of delivery?.InfoMessage || []) {
          const text = messageText(message);
          if (text && !messages.includes(text)) messages.push(text);
        }
      }
      if (messages.length) break;
    }
    return messages;
  }

  function pmuDateKey(date) {
    return `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
  }
  function parsePmuDate(value) {
    if (typeof value === "number") value = value < 1e12 ? value * 1000 : value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function parseResult(course) {
    const raw = course?.ordreArrivee || course?.arrivee || course?.ordreArriveeDefinitif || [];
    const list = Array.isArray(raw) ? raw.flat(Infinity).map(clean).filter(Boolean) : clean(raw).split(/[-,\s]+/).filter(Boolean);
    return list.slice(0, 5);
  }
  function parseMeeting(data, date) {
    const meetings = data?.programme?.reunions || data?.reunions || [];
    const meeting = meetings.find(item => {
      const code = String(item?.hippodrome?.code || item?.hippodrome?.codeHippodrome || "").toUpperCase();
      const name = clean(item?.hippodrome?.libelleCourt || item?.hippodrome?.libelleLong || item?.hippodrome?.nom);
      return code === "VIN" || /VINCENNES/i.test(name);
    });
    if (!meeting) return null;
    const races = (meeting.courses || []).map((course, index) => ({
      number: Number(course?.numOrdre || course?.numero || index + 1),
      title: clean(course?.libelle || course?.libelleCourt || course?.nom) || `Course ${index + 1}`,
      date: parsePmuDate(course?.heureDepart || course?.heureDepartCourse || course?.dateDepart),
      discipline: clean(course?.discipline || course?.specialite || course?.categorieParticularite) || "Course hippique",
      distance: Number(course?.distance || course?.distanceCourse || 0),
      starters: Number(course?.nombreDeclaresPartants || course?.nombrePartants || course?.partants || 0),
      status: clean(course?.statut || course?.status),
      result: parseResult(course)
    })).filter(race => race.date).sort((a, b) => a.date - b.date);
    return {
      date,
      number: Number(meeting?.numOfficiel || meeting?.numero || 1),
      races,
      label: clean(meeting?.libelle || meeting?.nature || meeting?.audience) || "Réunion à Vincennes"
    };
  }
  async function loadMeeting() {
    const dates = state.meeting ? [new Date(state.meeting.date)] : Array.from({ length: 8 }, (_, offset) => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + offset);
      return date;
    });
    for (const date of dates) {
      const key = pmuDateKey(date);
      const targets = [
        `https://online.turfinfo.api.pmu.fr/rest/client/1/programme/${key}?specialisation=INTERNET&meteo=true`,
        `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${key}`,
        `https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${key}?specialisation=INTERNET&meteo=true`
      ];
      const data = await fetchCandidates(targets.map(target => PROXY + encodeURIComponent(target)));
      const meeting = parseMeeting(data, date);
      if (meeting) return meeting;
    }
    return null;
  }

  function bikeCounts(station) {
    const types = Array.isArray(station?.num_bikes_available_types) ? station.num_bikes_available_types : [];
    let mechanical = 0, electric = 0;
    for (const type of types) {
      mechanical += Number(type?.mechanical || 0);
      electric += Number(type?.ebike || type?.electric || 0);
    }
    if (!types.length) {
      mechanical = Number(station?.num_mechanical_bikes_available || 0);
      electric = Number(station?.num_ebikes_available || 0);
    }
    return { mechanical, electric };
  }
  async function loadVelib() {
    const out = {};
    await Promise.all(Object.entries(VELIB).map(async ([key, target]) => {
      const direct = `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/exports/json?lang=fr&qv1=(${target.code})&timezone=Europe%2FParis`;
      const data = await fetchCandidates([direct, PROXY + encodeURIComponent(direct)]);
      const status = Array.isArray(data) ? data[0] : null;
      if (!status) return;
      const mechanical = Number(status?.mechanical ?? status?.numbikesavailable ?? 0);
      const electric = Number(status?.ebike ?? status?.ebikeavailable ?? 0);
      out[key] = {
        name: clean(status?.name) || target.label,
        mechanical,
        electric,
        total: mechanical + electric,
        docks: Number(status?.numdocksavailable ?? status?.numdocks ?? 0),
        active: String(status?.is_renting ?? status?.operative ?? "OUI").toUpperCase() !== "NON"
      };
    }));
    return out;
  }

  async function loadWeather() {
    const data = await fetchCandidates([WEATHER_URL]);
    const current = data?.current_weather;
    return current ? { temp: `${Math.round(current.temperature)}°C`, label: WEATHER[current.weathercode] || "Météo locale" } : null;
  }

  function nextRace() {
    return state.meeting?.races.find(race => race.date.getTime() >= Date.now() - 120000) || null;
  }
  function previousRace() {
    return [...(state.meeting?.races || [])].reverse().find(race => race.date.getTime() < Date.now() - 120000) || null;
  }
  function lastRace() { return state.meeting?.races.at(-1) || null; }
  function passageLabel(passage) {
    if (!passage) return "Donnée indisponible";
    if (String(passage.status).toLowerCase() === "cancelled") return "Supprimé";
    if (passage.vehicleAtStop) return "À quai";
    return passage.wait <= 1 ? "À l’approche" : `${passage.wait} min`;
  }
  function sourceState(messages) {
    if (!messages.length) return { title: "Aucune perturbation majeure", message: "Aucune information active n’est publiée pour cette ligne.", recovery: "—", active: false };
    const message = messages[0];
    const recovery = message.match(/(?:reprise|jusqu(?:'|’)à|fin)[^0-9]{0,25}(\d{1,2}[h:]\d{0,2})/i)?.[1]?.replace(":", "h") || "Non précisée";
    const title = /non desserv/i.test(message) ? "Arrêt non desservi" : /interromp/i.test(message) ? "Trafic interrompu" : /retard|ralenti|perturb/i.test(message) ? "Trafic perturbé" : "Information trafic";
    return { title, message, recovery, active: true };
  }
  function trafficNormal() { return !state.incidents.A.length && !state.incidents[77].length; }

  function renderHeader() {
    const meta = qa(".header .meta");
    if (meta[0]) {
      q(".meta-value", meta[0]).textContent = state.weather?.temp || "—";
      q(".meta-label", meta[0]).textContent = state.weather?.label || "Météo en attente";
    }
    if (meta[1]) {
      q(".meta-value", meta[1]).textContent = fmtTime(new Date());
      q(".meta-label", meta[1]).textContent = fmtDate(new Date());
    }
    if (meta[2]) {
      q(".meta-value", meta[2]).textContent = state.meeting ? `RÉUNION ${state.meeting.number}` : "VINCENNES";
      q(".meta-label", meta[2]).textContent = state.meeting ? `${state.meeting.races.length} COURSES · ${fmtDate(state.meeting.date)}` : "PROGRAMME EN ATTENTE";
    }
    const label = q(".distance-test-label");
    if (label) label.textContent = state.pending ? "DONNÉES TEMPS RÉEL · CHARGEMENT" : `DONNÉES TEMPS RÉEL · MAJ ${fmtTime(state.updatedAt)}`;
  }

  function scheduleHTML(races, active) {
    if (!races.length) return `<div class="live-empty">Programme officiel indisponible</div>`;
    return races.slice(0, 6).map(race => `<div class="schedule-row ${active?.number === race.number ? "active" : ""}"><time>${esc(fmtTime(race.date))}</time><span class="race">C${race.number}</span><span>${esc(race.title)}</span><span class="discipline">${esc(race.discipline)}</span></div>`).join("");
  }
  function liveRailItem(item, value, sub) {
    const strong = q("strong", item);
    const span = q("span:last-child", item.querySelector("div:last-child") || item);
    if (strong) strong.textContent = value;
    if (span) span.textContent = sub;
  }

  function renderArrival() {
    const race = nextRace() || state.meeting?.races[0];
    const count = q(".arrival-countdown .big-count");
    if (count) count.innerHTML = race ? compactWait(race.date) : `—<span class="time-unit">MIN</span>`;
    const ref = q(".arrival-countdown .race-ref");
    if (ref) ref.innerHTML = race ? `<strong>C${race.number} · ${fmtTime(race.date)}</strong><br><span class="muted">${esc(race.title)}</span>` : `<strong>Programme en attente</strong><br><span class="muted">Source PMU indisponible</span>`;
    const schedule = q(".arrival-program .schedule");
    if (schedule) schedule.innerHTML = scheduleHTML(state.meeting?.races || [], race);

    const highlights = q(".arrival-highlights");
    if (highlights) highlights.innerHTML = `<h2 class="section-title white">Prochaines courses</h2>` + (state.meeting?.races.slice(0, 4).map(item => `<div class="highlight-item"><time class="highlight-time">${fmtTime(item.date)}</time><div class="highlight-copy"><strong>C${item.number} · ${esc(item.title)}</strong><span>${esc(item.discipline)}${item.distance ? ` · ${item.distance.toLocaleString("fr-FR")} m` : ""}</span></div></div>`).join("") || `<div class="live-empty">Chargement du programme officiel…</div>`);
    const animations = q(".arrival-animations");
    if (animations) animations.innerHTML = `<h2 class="section-title">Réunion officielle</h2><div class="list-compact"><div><time>${state.meeting ? fmtDate(state.meeting.date).split(" ").slice(1).join(" ") : "—"}</time><span>${state.meeting ? `${state.meeting.races.length} courses programmées` : "Donnée PMU indisponible"}</span></div><div><time>${state.meeting?.races[0] ? fmtTime(state.meeting.races[0].date) : "—"}</time><span>Première course</span></div><div><time>${lastRace() ? fmtTime(lastRace().date) : "—"}</time><span>Dernière course</span></div></div>`;
    const events = q(".arrival-events");
    if (events) events.innerHTML = `<div class="event"><div class="event-date">PMU</div><div><div class="event-name">Programme Vincennes en direct</div><div class="event-note">Horaires et statut actualisés automatiquement</div></div></div><div class="event"><div class="event-date">PRIM</div><div><div class="event-name">Mobilité en temps réel</div><div class="event-note">Passages, perturbations et disponibilité Vélib’</div></div></div>`;

    const rail = qa(".transport-rail .rail-item");
    const rer = state.rer[0], b77 = state.bus77[0], b101 = state.bus101[0];
    if (rail[0]) liveRailItem(rail[0], "RER A", state.incidents.A.length ? "Information trafic active" : passageLabel(rer));
    if (rail[1]) liveRailItem(rail[1], "Gare de Lyon", b77 ? `${passageLabel(b77)} · puis ${passageLabel(state.bus77[1])}` : "Donnée indisponible");
    if (rail[2]) liveRailItem(rail[2], "Joinville-le-Pont", b101 ? `${passageLabel(b101)} · puis ${passageLabel(state.bus101[1])}` : "Donnée indisponible");
    if (rail[3]) liveRailItem(rail[3], "Hippodrome", state.velib.hippodrome ? `${state.velib.hippodrome.total} vélos · ${state.velib.hippodrome.docks} places` : "Donnée indisponible");
    if (rail[4]) liveRailItem(rail[4], "École du Breuil", state.velib.breuil ? `${state.velib.breuil.total} vélos · ${state.velib.breuil.docks} places` : "Donnée indisponible");
    const status = q(".transport-rail .status");
    if (status) status.textContent = trafficNormal() ? "Situation normale" : "Information trafic active";
  }

  function renderMeeting() {
    const race = nextRace();
    const set = (selector, value) => { const node = q(selector); if (node) node.textContent = value; };
    set(".next-race .race-number", race ? `C${race.number}` : "—");
    set(".next-race .race-title", race?.title || "Aucune course à venir");
    set(".next-race .race-detail", race ? `${race.distance ? `${race.distance.toLocaleString("fr-FR")} m · ` : ""}${race.discipline}${race.starters ? ` · ${race.starters} partants` : ""}` : "Programme PMU actualisé");
    set(".next-race .big-time", race ? fmtTime(race.date) : "—");
    set(".next-race .big-count", race ? countdown(race.date) : "—");
    const schedule = q(".upcoming .schedule"); if (schedule) schedule.innerHTML = scheduleHTML((state.meeting?.races || []).filter(item => !race || item.date >= race.date), race);
    const result = q(".last-result");
    const previous = previousRace();
    if (result) result.innerHTML = previous ? `<h2 class="section-title white">Dernière course · C${previous.number}</h2><div class="winner"><div class="winner-number">${previous.result[0] || "—"}</div><div class="winner-copy"><div class="place">${previous.result.length ? "ARRIVÉE PUBLIÉE" : "RÉSULTAT EN ATTENTE"}</div><h2>${esc(previous.title)}</h2><p>${fmtTime(previous.date)} · ${esc(previous.discipline)}</p><p>${previous.result.length ? `Ordre : ${previous.result.join(" – ")}` : "Le résultat officiel n’est pas encore disponible dans le flux."}</p></div></div><div class="flash"><strong>Source officielle</strong><p>Programme et ordre d’arrivée PMU actualisés automatiquement.</p></div>` : `<h2 class="section-title white">Dernière arrivée</h2><div class="live-empty">Aucune course terminée dans la réunion chargée.</div>`;
    const compact = q(".meeting-bottom .list-compact");
    if (compact) compact.innerHTML = (state.meeting?.races.filter(item => !race || item.date >= race.date).slice(0, 3).map(item => `<div><time>${fmtTime(item.date)}</time><span>C${item.number} · ${esc(item.title)}</span></div>`).join("") || `<div><time>—</time><span>Programme indisponible</span></div>`);
    const eventPanel = qa(".meeting-bottom > .panel")[1];
    if (eventPanel) eventPanel.innerHTML = `<h2 class="section-title">Fin de réunion</h2><div class="event" style="margin-top:28px"><div class="event-date">${lastRace() ? fmtTime(lastRace().date) : "—"}</div><div><div class="event-name">Dernière course</div><div class="event-note">${esc(lastRace()?.title || "Programme indisponible")}</div></div></div>`;
    const minis = qa(".mini-transport");
    if (minis[0]) { q(".minutes", minis[0]).textContent = passageLabel(state.rer[0]); q(".sub", minis[0]).textContent = state.rer[0]?.destination || "Joinville-le-Pont"; }
    if (minis[1]) { q(".minutes", minis[1]).textContent = passageLabel(state.bus77[0]); q(".sub", minis[1]).textContent = state.bus77[0]?.destination || "Gare de Lyon"; }
    if (minis[2]) { q(".minutes", minis[2]).textContent = passageLabel(state.bus101[0]); q(".sub", minis[2]).textContent = state.bus101[0]?.destination || "Joinville-le-Pont"; }
  }

  function renderTransportRows(rootSelector) {
    const rows = qa(`${rootSelector} .departure-row`);
    rows.forEach((row, index) => {
      const passage = state.rer[index];
      const time = q(".departure-time", row), dest = q(".departure-dest", row), reach = q(".reachable", row);
      if (time) time.textContent = passage ? fmtTime(passage.when) : "—";
      if (dest) dest.innerHTML = passage ? `<strong>Direction ${esc(passage.destination)}</strong><span>${passage.monitored ? "Horaire temps réel PRIM" : "Horaire théorique PRIM"}</span>` : `<strong>Donnée indisponible</strong><span>Aucun passage exploitable reçu</span>`;
      if (reach) reach.textContent = passage ? (passage.wait >= 12 ? "✓ ATTEIGNABLE" : "DÉPART PROCHE") : "—";
    });
  }

  function renderTransition() {
    const last = lastRace();
    const titleCount = q(".transition-title .last-count strong"); if (titleCount) titleCount.textContent = last ? countdown(last.date) : "—";
    const focus = q(".last-race-focus");
    if (focus) focus.innerHTML = `<div><h2 class="section-title">Dernière course à venir</h2><h2>${last ? `C${last.number} · ${esc(last.title)}` : "Programme indisponible"}</h2><p class="race-detail">${last ? `${last.distance ? `${last.distance.toLocaleString("fr-FR")} m · ` : ""}${esc(last.discipline)}${last.starters ? ` · ${last.starters} partants` : ""}` : "Source PMU"}</p></div><div><div class="big-time">${last ? fmtTime(last.date) : "—"}</div><p class="muted small">Les données mobilité sont actualisées automatiquement.</p></div>`;
    const remaining = q(".remaining-schedule");
    if (remaining) remaining.innerHTML = ((state.meeting?.races || []).filter(item => item.date.getTime() >= Date.now()).slice(-2).map(item => `<div class="remaining-card"><strong>C${item.number} · ${fmtTime(item.date)}</strong><span>${esc(item.title)} · ${esc(item.discipline)}</span></div>`).join("") || `<div class="live-empty">Aucune course restante</div>`);
    renderTransportRows(".rer-preview");
    const rerStatus = q(".rer-preview .status"); if (rerStatus) rerStatus.textContent = state.incidents.A.length ? "Information trafic active" : "Aucune alerte active";
    const cards = qa(".transition-modes .mode-card");
    if (cards[0]) { q(".minutes", cards[0]).textContent = passageLabel(state.bus77[0]); q(".sub", cards[0]).textContent = state.bus77[0]?.destination || "Donnée PRIM indisponible"; }
    if (cards[1]) { q(".minutes", cards[1]).textContent = passageLabel(state.bus101[0]); q(".sub", cards[1]).textContent = state.bus101[0]?.destination || "Donnée PRIM indisponible"; }
    if (cards[2]) { q(".minutes", cards[2]).textContent = state.velib.hippodrome ? `${state.velib.hippodrome.total} vélos` : "— vélos"; q(".sub", cards[2]).textContent = state.velib.hippodrome ? `${state.velib.hippodrome.docks} places disponibles` : "Donnée Vélib’ indisponible"; }
  }

  function renderExit() {
    const head = q(".exit-head p"); if (head) head.textContent = `Départs calculés à ${fmtTime(new Date())} · ${trafficNormal() ? "aucune alerte active" : "information trafic active"}`;
    const departures = qa(".rer-departure");
    departures.forEach((card, index) => {
      const passage = state.rer[index];
      const hour = q(".hour", card), delay = q(".delay", card), h3 = q("h3", card), p = q("p", card);
      if (hour) hour.textContent = passage ? fmtTime(passage.when) : "—";
      if (delay) delay.textContent = passage ? passageLabel(passage) : "indisponible";
      if (h3) h3.textContent = passage ? `Direction ${passage.destination}` : "Destination non communiquée";
      if (p) p.textContent = passage ? (passage.wait >= 12 ? `Atteignable avec environ ${passage.wait - 12} min de marge` : "Départ trop proche à pied") : "Aucun passage reçu";
    });
    const rerStatus = q(".rer-main .status"); if (rerStatus) rerStatus.textContent = state.incidents.A.length ? "Information trafic active" : "Aucune alerte active";
    const stops = q(".stop-line");
    const onward = state.rer[0]?.onward?.slice(0, 5) || [];
    if (stops) stops.innerHTML = onward.length ? onward.map(stop => `<div class="stop"><strong>${esc(stop.name)}</strong><span>${fmtTime(stop.time)}</span></div>`).join("") : `<div class="live-empty">Desserte détaillée non communiquée par PRIM</div>`;
    const buses = qa(".bus-main");
    [[buses[0], state.bus77], [buses[1], state.bus101]].forEach(([card, rows]) => {
      if (!card) return;
      const passages = q(".passages", card);
      if (passages) passages.innerHTML = `<strong>${esc(passageLabel(rows[0]))}</strong><span>puis <b>${esc(passageLabel(rows[1]))}</b></span>`;
      const direction = q(".transport-direction", card); if (direction) direction.textContent = `Direction ${rows[0]?.destination || "non communiquée"}`;
      const route = q(".route", card); if (route) route.textContent = rows[0] ? `Passage ${fmtTime(rows[0].when)} · donnée ${rows[0].monitored ? "temps réel" : "théorique"} PRIM` : "Aucun passage exploitable reçu";
    });
    const stations = qa(".velib-station");
    [[stations[0], state.velib.hippodrome], [stations[1], state.velib.breuil]].forEach(([card, station]) => {
      if (!card) return;
      const numbers = q(".velib-numbers", card);
      if (numbers) numbers.innerHTML = station ? `<strong>${station.total}</strong><span>vélos · ${station.docks} places</span>` : `<strong>—</strong><span>donnée indisponible</span>`;
    });
  }

  function renderIncident(code) {
    const info = sourceState(state.incidents[code]);
    const banner = q(".incident-banner");
    if (banner) banner.classList.toggle("clear", !info.active);
    const heading = q(".incident-banner h1"); if (heading) heading.innerHTML = `${code === "A" ? "RER A" : "BUS 77"}<span>${esc(info.title)}</span>`;
    const timeLabel = q(".incident-time span"); if (timeLabel) timeLabel.textContent = info.active ? "Reprise estimée" : "État du flux";
    const time = q(".incident-time strong"); if (time) time.textContent = info.active ? info.recovery : "À jour";
    const impactTitle = q(".incident-impact h2"); if (impactTitle) impactTitle.textContent = info.active ? "Information voyageurs" : "Situation actuelle";
    const message = q(".impact-message"); if (message) message.textContent = info.message;
    const zone = q(".impact-zone"); if (zone) zone.textContent = info.active ? `Ligne ${code === "A" ? "RER A" : "77"} · message officiel actif` : "Aucun scénario fictif affiché";
    const detail = q(".impact-detail"); if (detail) detail.textContent = info.active ? "Consultez les alternatives calculées à partir des prochains passages réellement publiés." : "Cet écran de recette reste disponible et s’activera avec le texte réellement reçu de la source PRIM.";
    const source = q(".incident-source"); if (source) source.textContent = `Source PRIM · actualisée à ${fmtTime(state.updatedAt || new Date())}`;
    const alternatives = qa(".alternative-card");
    if (code === "A") {
      const rows = [state.bus77, state.bus101];
      alternatives.forEach((card, index) => {
        const passage = rows[index]?.[0];
        const altTime = q(".alt-time", card); if (altTime) altTime.textContent = passageLabel(passage);
        const main = q(".alt-main", card); if (main) main.textContent = passage ? `Direction ${passage.destination}` : "Aucun passage reçu";
        const altDetail = q(".alt-detail", card); if (altDetail) altDetail.innerHTML = passage ? `Passage publié à ${fmtTime(passage.when)}<br>Donnée ${passage.monitored ? "temps réel" : "théorique"} PRIM` : "Information momentanément indisponible";
      });
    } else {
      const first = alternatives[0], second = alternatives[1], rer = state.rer[0], bus = state.bus101[0];
      if (first) { q(".alt-time", first).textContent = rer ? `${passageLabel(rer)}` : "—"; q(".alt-main", first).textContent = rer ? `Direction ${rer.destination}` : "Aucun passage RER reçu"; q(".alt-detail", first).innerHTML = rer ? `Départ à ${fmtTime(rer.when)} depuis Joinville-le-Pont<br>Prévoir 12 min à pied` : "Information momentanément indisponible"; }
      if (second) { q(".alt-time", second).textContent = passageLabel(bus); q(".alt-detail", second).innerHTML = bus ? `Passage à ${fmtTime(bus.when)} · direction ${esc(bus.destination)}` : "Information momentanément indisponible"; }
    }
  }

  function render() {
    renderHeader();
    if (mode === "arrivee") renderArrival();
    else if (mode === "reunion") renderMeeting();
    else if (mode === "transition") renderTransition();
    else if (mode === "sortie") renderExit();
    else if (mode === "incident_rer_a") renderIncident("A");
    else if (mode === "incident_bus") renderIncident(77);
  }

  async function refreshFast() {
    const results = await Promise.allSettled([
      loadPassages(SOURCES.rer), loadPassages(SOURCES.bus77), loadPassages(SOURCES.bus101),
      loadMessages("A"), loadMessages("77")
    ]);
    if (results[0].status === "fulfilled") state.rer = results[0].value;
    if (results[1].status === "fulfilled") state.bus77 = results[1].value;
    if (results[2].status === "fulfilled") state.bus101 = results[2].value;
    if (results[3].status === "fulfilled") state.incidents.A = results[3].value;
    if (results[4].status === "fulfilled") state.incidents[77] = results[4].value;
    state.updatedAt = new Date(); state.pending = false; render();
  }
  async function refreshSlow() {
    const results = await Promise.allSettled([loadWeather(), loadMeeting(), loadVelib()]);
    if (results[0].status === "fulfilled" && results[0].value) state.weather = results[0].value;
    if (results[1].status === "fulfilled") state.meeting = results[1].value;
    if (results[2].status === "fulfilled") state.velib = results[2].value;
    state.updatedAt = new Date(); state.pending = false; render();
  }

  render();
  refreshFast();
  refreshSlow();
  setInterval(() => { renderHeader(); if (["reunion", "transition"].includes(mode)) render(); }, 1000);
  setInterval(refreshFast, 30000);
  setInterval(refreshSlow, 60 * 1000);
})();
