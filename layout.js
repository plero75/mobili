(() => {
  const $id = id => document.getElementById(id);

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
    const visits = parseVisits(data || {});
    return primBusLineHTML(stop, visits);
  }

  async function renderHippodrome() {
    const target = $id("hippodrome-stop-view");
    if (!target) return;
    try {
      target.innerHTML = await loadPrimStop(EXTRA_PRIM_STOPS.HIPPODROME);
    } catch (e) {
      console.error("PRIM Hippodrome", e);
      target.innerHTML = `<div class="error-state">Temps réel PRIM momentanément indisponible</div>`;
    }
  }

  async function renderBreuil77() {
    try {
      return await loadPrimStop(EXTRA_PRIM_STOPS.BREUIL_77);
    } catch (e) {
      console.error("PRIM Breuil 77", e);
      return `<div class="line-block"><div class="error-state">Ligne 77 : temps réel PRIM indisponible</div></div>`;
    }
  }

  async function syncBusViews() {
    const stage = $id("bus-blocks");
    if (!stage) return;
    const blocks = [...stage.children].filter(el => el.classList.contains("stop-block"));

    const joinville = $id("joinville-bus-view");
    if (joinville) {
      joinville.innerHTML = blocks[0]
        ? `<div class="mirrored-stop"><div class="access-filter-note"><strong>Accès ~12 min</strong><span> • seuls les départs PRIM atteignables sont affichés</span></div>${blocks[0].innerHTML}</div>`
        : `<div class="empty-state">Chargement PRIM des bus de Joinville…</div>`;
    }

    const breuil = $id("breuil-bus-view");
    if (breuil) {
      const realtime201 = blocks[1]
        ? `<div class="mirrored-stop realtime-breuil"><div class="access-filter-note"><strong>Accès ~7 min</strong><span> • seuls les départs PRIM atteignables sont affichés</span></div>${blocks[1].innerHTML}</div>`
        : "";
      const realtime77 = await renderBreuil77();
      breuil.innerHTML = `${realtime201}${realtime77}` || `<div class="empty-state">Chargement PRIM de l’École du Breuil…</div>`;
    }
  }

  async function refreshLocationLayout() {
    await Promise.allSettled([syncBusViews(), renderHippodrome()]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const stage = $id("bus-blocks");
    if (stage) new MutationObserver(() => { syncBusViews(); }).observe(stage, { childList: true, subtree: true });
    setTimeout(refreshLocationLayout, 900);
    setInterval(refreshLocationLayout, 30 * 1000);
  });
})();
