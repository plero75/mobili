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
      if(window.MobiliAccess?.thresholdMinutes) return window.MobiliAccess.thresholdMinutes(key);
    } catch(_) {}
    return fallback;
  }

  async function fetchLine(line){
    const visits = [];
    for(const ref of line.refs){
      const target = `https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=${encodeURIComponent(ref)}&LineRef=${encodeURIComponent(line.line)}`;
      try{
        const res = await fetch(PROXY_URL + encodeURIComponent(target));
        if(!res.ok) continue;
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
    return visits.filter(v => {
      const k = `${v.destination}|${v.time}`;
      if(seen.has(k)) return false;
      seen.add(k); return true;
    });
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
    return `<div class="line-block vhpratp-line" data-line="${escLocal(line.code)}">
      <div class="line-head"><span class="line-pill" style="background:${line.color}">${escLocal(line.code)}</span><span class="line-name">Ligne ${escLocal(line.code)}</span><span class="mini-source">PRIM</span></div>
      ${body}
    </div>`;
  }

  async function renderJoinville(){
    const el=document.getElementById('joinville-bus-view');
    if(!el) return;
    const entries=await Promise.all(JOINVILLE_LINES.map(async line=>[line,await fetchLine(line)]));
    el.innerHTML=`<div class="access-filter-note">Accès ~12 min • seuls les départs PRIM réellement atteignables sont affichés</div><div class="vhpratp-bus-grid">${entries.map(([line,rows])=>lineHTML(line,rows,'joinvilleBus',14)).join('')}</div>`;
  }

  async function renderBreuil201(){
    const el=document.getElementById('breuil-bus-view');
    if(!el) return;
    const existing77 = el.querySelector('.prim-line')?.outerHTML || '';
    const rows = await fetchLine(BREUIL_201);
    el.innerHTML=`<div class="access-filter-note">Accès ~7 min • seuls les départs PRIM réellement atteignables sont affichés</div>${lineHTML(BREUIL_201,rows,'breuil',9)}${existing77}`;
  }

  async function refreshVHPRATPBus(){
    await Promise.allSettled([renderJoinville(),renderBreuil201()]);
    if(window.refreshTrafficFixed) setTimeout(()=>window.refreshTrafficFixed(),150);
  }

  const style=document.createElement('style');
  style.textContent=`
    @media (min-width:1100px) and (orientation:landscape){
      /* Neutralise les anciennes règles compact-stop-view qui coupaient le contenu */
      #joinville-bus-view.compact-stop-view{height:auto!important;max-height:none!important;overflow:visible!important}
      #joinville-bus-view .vhpratp-bus-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-rows:minmax(86px,auto)!important;gap:6px!important;align-content:start!important;overflow:visible!important}
      #joinville-bus-view .vhpratp-bus-grid .line-block{height:auto!important;min-height:86px!important;max-height:none!important;overflow:visible!important;padding:6px!important;border:1px solid #d3dae3!important;border-radius:5px!important;background:#fff!important;box-sizing:border-box!important}
      #joinville-bus-view .vhpratp-bus-grid .line-head{margin-bottom:4px!important}
      #joinville-bus-view .vhpratp-bus-grid .bus-direction-row{min-width:0!important;overflow:visible!important}
      #joinville-bus-view .vhpratp-bus-grid .direction{font-size:8px!important;margin:4px 0 2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #joinville-bus-view .vhpratp-bus-grid .passages{display:grid!important;grid-template-columns:1fr 1fr!important;border:0!important;gap:3px!important;overflow:visible!important}
      #joinville-bus-view .vhpratp-bus-grid .passage{display:block!important;height:auto!important;min-height:44px!important;padding:5px!important;border:1px solid #d8dee6!important;border-radius:3px!important;background:#fff!important;min-width:0!important;overflow:hidden!important}
      #joinville-bus-view .vhpratp-bus-grid .passage:nth-child(n+3){display:none!important}
      #joinville-bus-view .departure-clock{font-size:15px!important;font-weight:950!important;line-height:1!important;color:#101828!important}
      #joinville-bus-view .departure-wait{margin-top:3px!important;font-size:8px!important;font-weight:800!important;color:#475467!important}
      #joinville-bus-view .reachable-label{margin-bottom:3px!important;font-size:5px!important;font-weight:950!important;letter-spacing:.04em!important;color:#245c7d!important}
      #joinville-bus-view .status{font-size:5.5px!important;margin-top:3px!important}
      #joinville-bus-view .bus-no-reachable{padding:8px 2px 2px!important;font-size:8px!important;color:#667085!important}
      .vhpratp-bus-grid .mobili-line-alert{grid-column:1/-1}
      .panel-breuil .departure-clock,.panel-hippodrome .departure-clock{font-size:18px}
      .panel-breuil .departure-wait,.panel-hippodrome .departure-wait{font-size:9px}
    }
  `;
  document.head.appendChild(style);

  window.refreshVHPRATPBus=refreshVHPRATPBus;
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(refreshVHPRATPBus,2800);
    setInterval(refreshVHPRATPBus,30*1000);
  });
})();