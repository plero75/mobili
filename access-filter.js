(() => {
  const CONFIG = {
    safetyMarginMinutes: 2,
    stops: {
      rerJoinville: { label: "RER A • Joinville-le-Pont", accessMinutes: 12 },
      busJoinville: { label: "Bus • Joinville-le-Pont", accessMinutes: 12 },
      hippodrome77: { label: "Bus 77 • Hippodrome de Vincennes", accessMinutes: 4, safetyMarginMinutes: 1 },
      breuil: { label: "École du Breuil", accessMinutes: 7 }
    }
  };

  function stopConfig(key) {
    return CONFIG.stops[key] || { accessMinutes: 0 };
  }

  function thresholdMinutes(key) {
    const cfg = stopConfig(key);
    return Number(cfg.accessMinutes || 0) + Number(cfg.safetyMarginMinutes ?? CONFIG.safetyMarginMinutes);
  }

  function thresholdDate(key, now = Date.now()) {
    return new Date(now + thresholdMinutes(key) * 60 * 1000);
  }

  function isReachableDate(date, key, now = Date.now()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
    return date.getTime() >= thresholdDate(key, now).getTime();
  }

  function isReachableVisit(v, key, now = Date.now()) {
    const raw = v?.expected || v?.aimed;
    if (!raw) return false;
    return isReachableDate(new Date(raw), key, now);
  }

  function keyForRealtimeVisit(v) {
    const published = String(v?.published || "").toUpperCase().replace(/\s/g, "");
    const lineRef = String(v?.lineRef || "").toUpperCase();
    const isRerA = published === "A" || /C01742|LINE::A/.test(lineRef);
    if (isRerA) return "rerJoinville";

    const is201 = published === "201" || lineRef.includes("::201:") || lineRef.endsWith(":201:");
    if (is201) return "breuil";

    // Les autres passages temps réel de app.js sont ceux de Joinville.
    return "busJoinville";
  }

  function keyForScheduledStop(stopName, lineCode) {
    const n = String(stopName || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const line = String(lineCode || "").toUpperCase();
    if (line === "A" && n.includes("joinville")) return "rerJoinville";
    if (n.includes("hippodrome")) return "hippodrome77";
    if (n.includes("breuil")) return "breuil";
    if (n.includes("joinville")) return "busJoinville";
    return null;
  }

  window.MobiliAccess = {
    CONFIG,
    stopConfig,
    thresholdMinutes,
    thresholdDate,
    isReachableDate,
    isReachableVisit,
    keyForRealtimeVisit,
    keyForScheduledStop
  };

  // app.js appelle cette fonction au moment du rendu : la remplacer ici suffit
  // pour filtrer tous les passages PRIM sans dupliquer le moteur existant.
  if (typeof window.isRelevantPassage === "function") {
    window.isRelevantPassage = function(v) {
      const raw = v?.expected || v?.aimed;
      const t = raw ? new Date(raw).getTime() : NaN;
      if (!Number.isFinite(t)) return false;
      const key = keyForRealtimeVisit(v);
      return isReachableVisit(v, key);
    };
  }
})();
