(() => {
  const $id = id => document.getElementById(id);

  function scheduledPassageHTML(row, dateKey) {
    const dt = gtfsTimeToDate(dateKey, row.time);
    const wait = dt ? Math.max(0, Math.round((dt.getTime() - Date.now()) / 60000)) : null;
    const waitText = wait == null ? "—" : wait <= 1 ? "À l’approche" : `${wait} min`;
    return `<div class="passage theoretical-passage">
      <div class="wait">${waitText}</div>
      <div class="exact">${esc(displayGtfsTime(row.time))}</div>
      <div class="status na">THÉORIQUE</div>
    </div>`;
  }

  function theoreticalLineHTML(stopName, lineCode, color = "#0071bc") {
    if (!window.fetch || typeof timetableRows !== "function") return "";
    const dateKey = localDateKey();
    const rows = timetableRows(stopName, lineCode, dateKey);
    if (!rows.length) {
      return `<div class="line-block theoretical-line">
        <div class="line-head"><span class="line-pill" style="background:${color}">${esc(lineCode)}</span><span class="line-name">Ligne ${esc(lineCode)}</span><span class="mini-source">THÉORIQUE</span></div>
        ${emptyHTML("Horaires GTFS indisponibles")}
      </div>`;
    }

    const grouped = new Map();
    rows.forEach(row => {
      const dest = text(row.destination || "Direction non communiquée");
      if (!grouped.has(dest)) grouped.set(dest, []);
      grouped.get(dest).push(row);
    });

    const directions = [...grouped.entries()].map(([dest, destRows]) => {
      const future = destRows.filter(row => {
        const dt = gtfsTimeToDate(dateKey, row.time);
        return dt && dt.getTime() >= Date.now() - 5000;
      });
      const body = future.length
        ? `<div class="passages">${future.slice(0, 2).map(row => scheduledPassageHTML(row, dateKey)).join("")}</div>`
        : serviceEndedHTML(stopName, lineCode, dest);
      return `<div class="theoretical-direction">
        <div class="direction">→ ${esc(dest)}</div>
        ${serviceMetaHTML(stopName, lineCode, dest)}
        ${body}
      </div>`;
    }).join("");

    return `<div class="line-block theoretical-line">
      <div class="line-head"><span class="line-pill" style="background:${color}">${esc(lineCode)}</span><span class="line-name">Ligne ${esc(lineCode)}</span><span class="mini-source">THÉORIQUE</span></div>
      <div class="direction-grid">${directions}</div>
    </div>`;
  }

  function renderHippodrome() {
    const target = $id("hippodrome-stop-view");
    if (!target) return;
    target.innerHTML = theoreticalLineHTML("Hippodrome de Vincennes", "77", "#0071bc");
  }

  function syncBusViews() {
    const stage = $id("bus-blocks");
    if (!stage) return;
    const blocks = [...stage.children].filter(el => el.classList.contains("stop-block"));

    const joinville = $id("joinville-bus-view");
    if (joinville) {
      joinville.innerHTML = blocks[0]
        ? `<div class="mirrored-stop">${blocks[0].innerHTML}</div>`
        : `<div class="empty-state">Chargement des bus de Joinville…</div>`;
    }

    const breuil = $id("breuil-bus-view");
    if (breuil) {
      const realtime = blocks[1]
        ? `<div class="mirrored-stop realtime-breuil">${blocks[1].innerHTML}</div>`
        : "";
      breuil.innerHTML = `${realtime}${theoreticalLineHTML("École du Breuil", "77", "#0071bc")}` || `<div class="empty-state">Chargement de l’École du Breuil…</div>`;
    }
  }

  function refreshLocationLayout() {
    syncBusViews();
    renderHippodrome();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const stage = $id("bus-blocks");
    if (stage) {
      new MutationObserver(syncBusViews).observe(stage, { childList: true, subtree: true });
    }
    setTimeout(refreshLocationLayout, 800);
    setInterval(refreshLocationLayout, 30 * 1000);
  });
})();
