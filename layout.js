(() => {
  const $id = id => document.getElementById(id);
  const lastGood = new Map();

  const EXTRA_PRIM_STOPS = {
    HIPPODROME: {
      name: "Hippodrome de Vincennes",
      ref: "STIF:StopArea:SP:463641:",
      line: "77",
      color: "#0071bc",
      accessKey: "hippodrome77"
    },
    BREUIL_77: {
      name: "École du Breuil",
      ref: "STIF:StopArea:SP:463644:",
      line: "77",
      color: "#0071bc",
      accessKey: "breuil"
    }
  };

  function accessInfoHTML(key, minutesLabel) {
    if (!key || !window.MobiliAccess) return "";
    const cfg = window.MobiliAccess.stopConfig(key);
    const threshold = window.MobiliAccess.thresholdMinutes(key);
    const access = Number.isFinite(cfg?.accessMinutes) ? cfg.accessMinutes : minutesLabel;
    const margin = Math.max(0, threshold - access);
    return `<div class="access-filter-note"><strong>Accès ~${esc(access)} min</strong><span> • marge ${esc(margin)} min • seuls les départs atteignables sont affichés</span></div>`;
  }

  function filterReachable(visits, key) {
    if (!window.MobiliAccess || !key) return visits.filter(isRelevantPassage);
    return visits.filter(v => window.MobiliAccess.isReachableVisit(v, key));
  }

  function primBusLineHTML(stop, visits) {
    const lineVisits = filterReachable(visits.filter(v => matchesLine(v, stop.line)), stop.accessKey);
    const dirs = groupByDirection(lineVisits);
    let body = "";

    if (lineVisits.length) {
      body = [...dirs.entries()].map(([dest, rows]) => `
        <div class="direction">→ ${esc(dest)}</div>
        <div class="passages">${rows.slice(0, 4).map(v => busPassageHTML(v, stop.name, stop.line)).join("")}</div>
      `).join("");
    } else {
      body = `<div class="empty-state">Aucun départ PRIM atteignable actuellement</div>`;
    }

    return `<div class="line-block prim-line">
      <div class="line-head">
        <span class="line-pill" style="background:${stop.color}">${esc(stop.line)}</span>
        <span class="line-name">Ligne ${esc(stop.line)}</span>
        <span class="mini-source">TEMPS RÉEL PRIM</span>
      </div>
      ${accessInfoHTML(stop.accessKey)}
      ${body}
    </div>`;
  }

  async function loadPrimStop(stop) {
    const data = await fetchStop(stop.ref);
    if (!data) return null;
    const visits = parseVisits(data);
    return primBusLineHTML(stop, visits);
  }

  function keepOrShowError(target, key, label) {
    const cached = lastGood.get(key);
    if (cached) {
      target.innerHTML = cached;
      target.classList.add("is-stale");
      return;
    }
    target.innerHTML = `<div class="error-state"><strong>${esc(label)}</strong><span>Nouvelle tentative automatique</span></div>`;
  }

  async function renderHippodrome() {
    const target = $id("hippodrome-stop-view");
    if (!target) return;
    const html = await loadPrimStop(EXTRA_PRIM_STOPS.HIPPODROME);
    if (!html) { keepOrShowError(target, "hippodrome", "Temps réel momentanément indisponible"); return; }
    lastGood.set("hippodrome", html);
    target.classList.remove("is-stale");
    target.innerHTML = html;
  }

  async function renderBreuil77() {
    const target = $id("breuil-bus-view");
    if (!target) return;
    let slot = target.querySelector('[data-live-section="breuil-77"]');
    if (!slot) {
      target.textContent = "";
      slot = document.createElement("div");
      slot.dataset.liveSection = "breuil-77";
      target.appendChild(slot);
    }
    const html = await loadPrimStop(EXTRA_PRIM_STOPS.BREUIL_77);
    if (!html) {
      const cached = lastGood.get("breuil77");
      if (cached) { slot.innerHTML = cached; slot.classList.add("is-stale"); }
      else slot.innerHTML = `<div class="line-block"><div class="error-state">Ligne 77 : temps réel momentanément indisponible</div></div>`;
      return;
    }
    lastGood.set("breuil77", html);
    slot.classList.remove("is-stale");
    slot.innerHTML = html;
  }

  async function refreshLocationLayout() {
    await Promise.allSettled([renderBreuil77(), renderHippodrome()]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(refreshLocationLayout, 900);
    setInterval(refreshLocationLayout, 60 * 1000);
  });
})();
