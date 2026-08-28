(() => {
  const $id = id => document.getElementById(id);

  const EXTRA_PRIM_STOPS = {
    HIPPODROME: {
      name: "Hippodrome de Vincennes",
      ref: "STIF:StopArea:SP:463641:",
      line: "77",
      color: "#0071bc",
      accessKey: "hippodrome"
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
    return `<div class="access-filter-note">Depuis l’hippodrome : ~${esc(access)} min • départs atteignables uniquement (+${esc(threshold)} min avec marge)</div>`;
  }

  function filterReachable(visits, key) {
    const rows = visits.filter(isRelevantPassage);
    if (!window.MobiliAccess || !key) return rows;
    return rows.filter(v => window.MobiliAccess.isReachableVisit(v, key));
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
      body = `<div class="empty-state">Aucun passage PRIM atteignable pour le moment</div>`;
    }

    return `<div class="line-block prim-line">
      <div class="line-head">
        <span class="line-pill" style="background:${stop.color}">${esc(stop.line)}</span>
        <span class="line-name">Ligne ${esc(stop.line)}</span>
        <span class="mini-source">PRIM</span>
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
    target.innerHTML = `<div class="empty-state">Chargement PRIM…</div>`;
    try {
      target.innerHTML = await loadPrimStop(EXTRA_PRIM_STOPS.HIPPODROME);
    } catch (e) {
      console.error("PRIM Hippodrome", e);
      target.innerHTML = `<div class="error-state">Données PRIM momentanément indisponibles</div>`;
    }
  }

  async function renderBreuil77() {
    try {
      return await loadPrimStop(EXTRA_PRIM_STOPS.BREUIL_77);
    } catch (e) {
      console.error("PRIM Breuil 77", e);
      return `<div class="line-block"><div class="error-state">Ligne 77 : données PRIM momentanément indisponibles</div></div>`;
    }
  }

  async function syncBusViews() {
    const stage = $id("bus-blocks");
    if (!stage) return;
    const blocks = [...stage.children].filter(el => el.classList.contains("stop-block"));

    const joinville = $id("joinville-bus-view");
    if (joinville) {
      joinville.innerHTML = blocks[0]
        ? `<div class="mirrored-stop"><div class="access-filter-note">Depuis l’hippodrome : ~12 min • départs PRIM atteignables uniquement</div>${blocks[0].innerHTML}</div>`
        : `<div class="empty-state">Chargement PRIM des bus de Joinville…</div>`;
    }

    const breuil = $id("breuil-bus-view");
    if (breuil) {
      const realtime201 = blocks[1]
        ? `<div class="mirrored-stop realtime-breuil"><div class="access-filter-note">Depuis l’hippodrome : ~7 min • départs PRIM atteignables uniquement</div>${blocks[1].innerHTML}</div>`
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
    if (stage) {
      new MutationObserver(() => { syncBusViews(); }).observe(stage, { childList: true, subtree: true });
    }
    setTimeout(refreshLocationLayout, 800);
    setInterval(refreshLocationLayout, 30 * 1000);
  });
})();
