(() => {
  const LINES = {
    A: "C01742",
    77: "C02251",
    101: "C01130",
    106: "C01135",
    108: "C01137",
    110: "C01139",
    112: "C01141",
    201: "C01219",
    281: "C01260",
    N33: "C01399"
  };

  const state = new Map();

  function scalar(v) {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object" && "value" in v) return scalar(v.value);
    return "";
  }

  function clean(v) {
    return scalar(v).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function messageText(msg) {
    const c = msg?.Content || {};
    const candidates = [
      c?.Message?.[0]?.MessageText?.[0],
      c?.Message?.[0]?.MessageText,
      c?.Message?.MessageText?.[0],
      c?.Message?.MessageText,
      c?.Description?.[0],
      c?.Description,
      msg?.Description?.[0],
      msg?.Description,
      msg?.Summary?.[0],
      msg?.Summary
    ];
    for (const candidate of candidates) {
      const t = clean(candidate);
      if (t) return t;
    }
    return "";
  }

  function parseMessages(data) {
    const out = [];
    const deliveries = data?.Siri?.ServiceDelivery?.GeneralMessageDelivery || [];
    for (const delivery of deliveries) {
      for (const msg of (delivery?.InfoMessage || [])) {
        const t = messageText(msg);
        if (t && !out.includes(t)) out.push(t);
      }
    }
    return out;
  }

  async function fetchLineMessages(code, idfmCode) {
    const refs = [
      `STIF:Line::${idfmCode}:`,
      `STIF:Line::${idfmCode}`
    ];
    for (const ref of refs) {
      try {
        const data = await fetchJSON(primUrl(`/general-message?LineRef=${encodeURIComponent(ref)}`), 12000);
        const msgs = parseMessages(data);
        if (msgs.length) return msgs;
      } catch (_) {}
    }
    return [];
  }

  function alertClass(text) {
    return /(interrompu|interruption|non desserv|supprim|incident|accident|arrêté|fermée|fermé)/i.test(text) ? "critical" : "info";
  }

  function desiredAlertHTML(code, messages) {
    return `<strong>INFO TRAFIC ${esc(code === "A" ? "RER A" : `LIGNE ${code}`)}</strong><span>${esc(messages[0])}</span>`;
  }

  // Important : ne pas supprimer/réinsérer toutes les alertes à chaque mutation DOM.
  // Cela déclenchait le MutationObserver en boucle et pouvait figer / casser l'écran.
  function applyInlineAlerts() {
    document.querySelectorAll(".line-block").forEach(block => {
      const pill = block.querySelector(".line-pill");
      const head = block.querySelector(".line-head");
      if (!pill || !head) return;

      const code = pill.textContent.trim().toUpperCase();
      const messages = state.get(code) || [];
      let alert = block.querySelector(":scope > .mobili-line-alert");

      if (!messages.length) {
        if (alert) alert.remove();
        return;
      }

      const cls = `mobili-line-alert ${alertClass(messages.join(" "))}`;
      const html = desiredAlertHTML(code, messages);

      if (!alert) {
        alert = document.createElement("div");
        alert.className = cls;
        alert.innerHTML = html;
        head.insertAdjacentElement("afterend", alert);
        return;
      }

      // Aucun changement DOM si le contenu est déjà correct : l'observer reste stable.
      if (alert.className !== cls) alert.className = cls;
      if (alert.innerHTML !== html) alert.innerHTML = html;
      if (alert.previousElementSibling !== head) head.insertAdjacentElement("afterend", alert);
    });
  }

  function renderBanner() {
    const banner = document.getElementById("traffic-banner");
    if (!banner) return;
    const active = [...state.entries()].filter(([, msgs]) => msgs.length);
    if (!active.length) {
      banner.className = "traffic-banner ok";
      banner.textContent = "✅ Aucune information trafic PRIM active détectée sur les lignes suivies.";
      return;
    }
    const critical = active.some(([, msgs]) => alertClass(msgs.join(" ")) === "critical");
    banner.className = `traffic-banner ${critical ? "alert" : "warn"}`;
    banner.textContent = `⚠️ ${active.slice(0, 3).map(([code, msgs]) => `${code === "A" ? "RER A" : code} : ${msgs[0]}`).join(" • ")}`;
  }

  async function refreshTrafficFixed() {
    await Promise.all(Object.entries(LINES).map(async ([code, idfmCode]) => {
      state.set(code, await fetchLineMessages(code, idfmCode));
    }));
    renderBanner();
    applyInlineAlerts();
  }

  const style = document.createElement("style");
  style.textContent = `
    .mobili-line-alert{margin:5px 0 7px;padding:6px 8px;border-left:4px solid #d97706;background:#fff6df;color:#6b4300;font-size:9px;line-height:1.25}
    .mobili-line-alert.critical{border-left-color:#c9252d;background:#fdebed;color:#86181f}
    .mobili-line-alert strong{display:block;margin-bottom:2px;font-size:7px;letter-spacing:.05em}
    .mobili-line-alert span{display:block;font-weight:750}
  `;
  document.head.appendChild(style);

  window.refreshTrafficFixed = refreshTrafficFixed;
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(refreshTrafficFixed, 2200);
    setInterval(refreshTrafficFixed, 90 * 1000);

    const root = document.querySelector(".location-dashboard");
    if (root) {
      let timer = null;
      new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(applyInlineAlerts, 80);
      }).observe(root, { childList: true, subtree: true });
    }
  });
})();