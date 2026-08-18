(() => {
  const SERVICE_DAY_CUTOFF_HOUR = 4;

  function calendarKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }

  localDateKey = function(date = new Date()) {
    const d = new Date(date);
    if (d.getHours() < SERVICE_DAY_CUTOFF_HOUR) d.setDate(d.getDate() - 1);
    return calendarKey(d);
  };

  nextDateKey = function(date = new Date(), days = 1) {
    const serviceBase = new Date(date);
    if (serviceBase.getHours() < SERVICE_DAY_CUTOFF_HOUR) serviceBase.setDate(serviceBase.getDate() - 1);
    serviceBase.setDate(serviceBase.getDate() + days);
    return calendarKey(serviceBase);
  };
})();
