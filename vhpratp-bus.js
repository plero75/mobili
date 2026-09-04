(() => {
  const PROXY_URL = 'https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=';

  // Référence bus reprise du dashboard VHPRATP.
  const JOINVILLE_LINES = [
    { code:'77',  line:'STIF:Line::C02251:', refs:['STIF:StopPoint:Q:22452:'], color:'#0071bc' },
    { code:'101', line:'STIF:Line::C01130:', refs:['STIF:StopPoint:Q:21252:'], color:'#f0a500' },
    { code:'106', line:'STIF:Line::C01135:', refs:['STIF:StopPoint:Q:27560:'], color:'#e4002b' },
    { code:'108', line:'STIF:Line::C01137:', refs:['STIF:StopPoint:Q:28032:'], color:'#d10073' },
    { code:'110', line:'STIF:Line::C01139:', refs:['STIF:StopPoint:Q:28032:'], color:'#642580' },
    { code:'112', line:'STIF:Line::C01141:', refs:['STIF:StopPoint:Q:28065:','STIF:StopPoint:Q:39406:'], color:'#ff5a00' },
    { code:'281', line:'STIF:Line::C01260:', refs:['STIF:StopPoint:Q:28033:'], color:'#d9a300' },
    { code:'N33', line:'STIF:Line::C01399:', refs:['STIF:StopPoint:Q:39406:'], color:'#ff5a00' }
  ];

  const BREUIL_201 = { code:'201', line:'STIF:Line::C01219:', refs:['STIF:StopPoint:Q:39406:','STIF:StopPoint:Q:22452:'], color:'#6E491E' };
  const lastGoodLines = new Map();
  let refreshInFlight = false;

  const escLocal = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scalar = v => v == null ? '' : (typeof v === 'object' && 'value' in v ? scalar(v.value) : String(v));
  const txt = v => scalar(v).replace(/\s+/g,' ').trim();
  const hhmm = v => {
    if(!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  };
  const minutesUntil = v => {
    if(!v) return null;
    const d = new Date(v);
    if(Number.isNaN(d.getTime())) return null;
    return Math.round((d.getTime()-Date.now())/60000);
  };

  function thresholdFor(key, fallback){
    try {
      if(window.MobiliAccess?.CONFIG?.stops?.[key] && window.MobiliAccess?.thresholdMinutes) return window.MobiliAccess.thresholdMinutes(key);
    } catch(_) {}
    return fallback;
  }

  async function fetchLine(line){
    const visits = [];
    let successes = 0;
    for(const ref of line.refs){
      const target = `https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=${encodeURIComponent(ref)}&LineRef=${encodeURIComponent(line.line)}`;
      try{
        const res = await fetch(PROXY_URL + encodeURIComponent(target));
        if(!res.ok) continue;
        successes += 1;
        const data = await res.json();
        const rows = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];
        for(const row of rows){
          const mvj = row?.MonitoredVehicleJourney || {};
          const call = mvj?.MonitoredCall || {};
          const refValue = scalar(mvj?.LineRef);
          if(refValue && refValue !== line.line) continue;
          const time = call?.ExpectedDepartureTime || call?.ExpectedArrivalTime || call?.AimedDepartureTime || call?.AimedArrivalTime || null;
          visits.push({
            destination: txt(mvj?.DestinationName?.[0]) || txt(call?.DestinationDisplay?.[0]) || txt(mvj?.DirectionName?.[0]) || 'Destination non communiquée',
            time,
            aimed: call?.AimedDepartureTime || call?.AimedArrivalTime || null,
            expected: call?.ExpectedDepartureTime || call?.ExpectedArrivalTime || null,
            status: String(call?.DepartureStatus || call?.ArrivalStatus || 'onTime').toLowerCase(),
            vehicleAtStop: Boolean(call?.VehicleAtStop)
          });
        }
      }catch(e){ console.error('VHPRATP bus', line.code, e); }
    }
    const seen = new Set();
    const rows = visits.filter(v => {
      const k = `${v.destination}|${v.time}`;
      if(seen.has(k)) return false;
      seen.add(k); return true;
    });
    return { ok: successes > 0, rows };
  }

  function reachable(rows, key, fallback){
    const threshold = thresholdFor(key, fallback);
    return rows.filter(v => {
      const m = minutesUntil(v.time);
      if(m == null) return false;
      return m >= threshold;
    }).sort((a,b)=>new Date(a.time)-new Date(b.time));
  }

  function statusLabel(v){
    if(v.status === 'cancelled') return '<span class="status cancelled">SUPPRIMÉ</span>';
    if(v.status === 'delayed') return '<span class="status delayed">RETARD</span>';
    if(v.vehicleAtStop) return '<span class="status ok">À QUAI</span>';
    return '<span class="status ok">TEMPS RÉEL</span>';
  }

  function passageHTML(v, first){
    const m = minutesUntil(v.time);
    const imminent = m != null && m <= 1 && v.status !== 'cancelled';
    return `<div class="passage ${first?'first-reachable':''} ${imminent?'imminent':''}">
      ${first?'<div class="reachable-label">1ER ATTEIGNABLE</div>':''}
      <div class="departure-clock">${escLocal(hhmm(v.time))}</div>
      <div class="departure-wait">${v.status==='cancelled'?'Supprimé':(imminent?'Imminent':`dans ${Math.max(0,m)} min`)}</div>
      ${statusLabel(v)}
    </div>`;
  }

  function lineHTML(line, rows, key, fallback){
    const filtered = reachable(rows,key,fallback);
    const groups = new Map();
    for(const v of filtered){
      if(!groups.has(v.destination)) groups.set(v.destination,[]);
      groups.get(v.destination).push(v);
    }
    let body='';
    if(!filtered.length){
      body='<div class="bus-no-reachable">Aucun départ atteignable</div>';
    }else{
      body=[...groups.entries()].slice(0,2).map(([dest,items])=>`<div class="bus-direction-row">
        <div class="direction">→ ${escLocal(dest)}</div>
        <div class="passages">${items.slice(0,2).map((v,i)=>passageHTML(v,i===0)).join('')}</div>
      </div>`).join('');
    }
    const directionClass=groups.size>1?' has-multiple-directions':'';
    return `<div class="line-block vhpratp-line${directionClass}" data-line="${escLocal(line.code)}">
      <div class="line-head"><span class="line-pill" style="background:${line.color}">${escLocal(line.code)}</span><span class="line-name">Ligne ${escLocal(line.code)}</span><span class="mini-source">PRIM</span></div>
      ${body}
    </div>`;
  }

  async function renderJoinville(){
    const el=document.getElementById('joinville-bus-view');
    if(!el) return;
    const entries=await Promise.all(JOINVILLE_LINES.map(async line=>[line,await fetchLine(line)]));
    el.classList.toggle('is-stale',entries.some(([,result])=>!result.ok));
    const cards=entries.map(([line,result])=>{
      if(result.ok){
        const html=lineHTML(line,result.rows,'busJoinville',14);
        lastGoodLines.set(`joinville-${line.code}`,html);
        return html;
      }
      return lastGoodLines.get(`joinville-${line.code}`) || `<div class="line-block vhpratp-line data-unavailable" data-line="${escLocal(line.code)}"><div class="line-head"><span class="line-pill" style="background:${line.color}">${escLocal(line.code)}</span><span class="line-name">Ligne ${escLocal(line.code)}</span></div><div class="bus-data-unavailable">Données momentanément indisponibles</div></div>`;
    });
    el.innerHTML=`<div class="access-filter-note">Accès ~12 min + marge 2 min • seuls les départs réellement atteignables sont affichés</div><div class="vhpratp-bus-grid">${cards.join('')}</div>`;
  }

  async function renderBreuil201(){
    const el=document.getElementById('breuil-bus-view');
    if(!el) return;
    const result = await fetchLine(BREUIL_201);
    const existing77 = el.querySelector('[data-live-section="breuil-77"]')?.outerHTML || '';
    el.classList.toggle('is-stale',!result.ok);
    let line201;
    if(result.ok){line201=lineHTML(BREUIL_201,result.rows,'breuil',9);lastGoodLines.set('breuil-201',line201);}
    else line201=lastGoodLines.get('breuil-201') || `<div class="line-block vhpratp-line data-unavailable" data-line="201"><div class="line-head"><span class="line-pill" style="background:${BREUIL_201.color}">201</span><span class="line-name">Ligne 201</span></div><div class="bus-data-unavailable">Données momentanément indisponibles</div></div>`;
    el.innerHTML=`<div class="access-filter-note">Accès ~7 min + marge 2 min • seuls les départs réellement atteignables sont affichés</div>${line201}${existing77}`;
  }

  async function refreshVHPRATPBus(){
    if(refreshInFlight) return;
    refreshInFlight = true;
    try { await Promise.allSettled([renderJoinville(),renderBreuil201()]); }
    finally { refreshInFlight = false; }
  }

  window.refreshVHPRATPBus=refreshVHPRATPBus;
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(refreshVHPRATPBus,2800);
    setInterval(refreshVHPRATPBus,60*1000);
  });
})();
