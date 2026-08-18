(() => {
  if (typeof statusInfo !== "function") return;
  const baseStatusInfo = statusInfo;
  statusInfo = function(v) {
    const info = baseStatusInfo(v);
    if (info?.label === "TEMPS RÉEL") return { ...info, label: "À L’HEURE" };
    return info;
  };
})();
