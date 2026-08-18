const PROXY = "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=";
const PRIM = "https://prim.iledefrance-mobilites.fr/marketplace";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=48.835&longitude=2.440&current_weather=true&timezone=Europe%2FParis";
const RSS_URL = "https://www.francetvinfo.fr/titres.rss";
const GTFS_TIMETABLE_URL = "https://raw.githubusercontent.com/plero75/VHPRATP/main/static/horaires_export.json";

const RER_STOP = { name: "Joinville-le-Pont", refs: ["STIF:StopArea:SP:43135:"] };
const BUS_STOPS = [
  { name: "Joinville-le-Pont – Bus", scheduleName: "Joinville-le-Pont", lines: [
    { code: "77", color: "#0071bc", refs: ["STIF:StopPoint:Q:22452:"] },
    { code: "101", color: "#f0a500", refs: ["STIF:StopPoint:Q:21252:"] },
    { code: "106", color: "#e4002b", refs: ["STIF:StopPoint:Q:27560:"] },
    { code: "108", color: "#d10073", refs: ["STIF:StopPoint:Q:28032:"] },
    { code: "110", color: "#642580", refs: ["STIF:StopPoint:Q:28032:"] },
    { code: "112", color: "#ff5a00", refs: ["STIF:StopPoint:Q:28065:", "STIF:StopPoint:Q:39406:"] },
    { code: "281", color: "#d9a300", refs: ["STIF:StopPoint:Q:28033:"] },
    { code: "N33", color: "#ff5a00", refs: ["STIF:StopPoint:Q:39406:"] }
  ]},
  { name: "École du Breuil", scheduleName: "École du Breuil", lines: [
    { code: "201", color: "#6E491E", refs: ["STIF:StopPoint:Q:39406:", "STIF:StopPoint:Q:22452:"] }
  ]}
];
const TRACKED_LINES = ["A","77","101","106","108","110","112","201","281","N33"];
const VELIB_STATIONS = {
  VINCENNES: { id: "12163", label: "Hippodrome / Vincennes" },
  BREUIL: { id: "12128", label: "École du Breuil" }
};
const WEATHER_CODES = {0:"Ciel dégagé",1:"Principalement clair",2:"Partiellement nuageux",3:"Couvert",45:"Brouillard",48:"Brouillard givrant",51:"Bruine faible",53:"Bruine",55:"Bruine forte",61:"Pluie faible",63:"Pluie modérée",65:"Pluie forte",80:"Averses faibles",81:"Averses modérées",82:"Fortes averses",95:"Orages",96:"Orages avec grêle",99:"Orages avec grêle"};

let newsItems=[];
let currentNews=0;
let tickerIndex=0;
let tickerData={weather:"",traffic:""};
let lastGoodTransportUpdate=null;
let cachedVelib=null;
let timetableCache=null;

const $=id=>document.getElementById(id);
function text(v=""){return String(v??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();}
function esc(v=""){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function valueOf(x){return x?.value??x??"";}
function fmtTime(iso){if(!iso)return"—";const d=new Date(iso);return Number.isNaN(d.getTime())?"—":d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}
function minUntil(iso){if(!iso)return null;const d=new Date(iso);if(Number.isNaN(d.getTime()))return null;return Math.round((d.getTime()-Date.now())/60000);}
function signedMinutes(expected,aimed){if(!expected||!aimed)return null;const a=new Date(aimed),e=new Date(expected);if(Number.isNaN(a.getTime())||Number.isNaN(e.getTime()))return null;return Math.round((e-a)/60000);}
function primUrl(path){return PROXY+encodeURIComponent(PRIM+path);}
function uniqueBy(arr,keyFn){const seen=new Set();return arr.filter(x=>{const k=keyFn(x);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function normaliseName(v=""){return text(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
function nextDateKey(date=new Date(),days=1){const d=new Date(date);d.setDate(d.getDate()+days);return localDateKey(d);}
function gtfsTimeToDate(dateKey,time){
  if(!dateKey||!time)return null;
  const [rawH,rawM]=String(time).split(":").map(Number);
  if(!Number.isFinite(rawH)||!Number.isFinite(rawM))return null;
  const [y,m,d]=dateKey.split("-").map(Number);
  const dt=new Date(y,m-1,d,rawH%24,rawM,0,0);
  if(rawH>=24)dt.setDate(dt.getDate()+Math.floor(rawH/24));
  return dt;
}
function displayGtfsTime(time){
  if(!time)return"—";
  const [h,m]=String(time).split(":").map(Number);
  if(!Number.isFinite(h)||!Number.isFinite(m))return time;
  return `${String(h%24).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

async function fetchJSON(url,timeout=12000){const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}catch(e){console.error("fetchJSON",url,e);return null;}finally{clearTimeout(timer);}}
async function fetchText(url,timeout=12000){const c=new AbortController(),timer=setTimeout(()=>c.abort(),timeout);try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text();}catch(e){console.error("fetchText",url,e);return"";}finally{clearTimeout(timer);}}
function setClock(){if($("clock"))$("clock").textContent=new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}
function setLastUpdate(){if(!$("lastUpdate"))return;const base=lastGoodTransportUpdate||new Date();$("lastUpdate").textContent=`Maj ${base.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}`;}

async function loadTimetable(){
  const data=await fetchJSON(GTFS_TIMETABLE_URL,15000);
  if(data)timetableCache=data;
  return timetableCache;
}
function timetableRows(stopName,lineCode,dateKey){
  if(!timetableCache)return[];
  const lineKey=lineCode==="A"?"RER A":lineCode;
  return timetableCache?.[stopName]?.[lineKey]?.[dateKey]||[];
}
function rowsForDestination(rows,destination){
  const target=normaliseName(destination);
  const exact=rows.filter(r=>normaliseName(r.destination)===target);
  if(exact.length)return exact;
  return rows.filter(r=>{const d=normaliseName(r.destination);return d&&target&&(d.includes(target)||target.includes(d));});
}
function serviceSummary(stopName,lineCode,destination,dateKey=localDateKey()){
  const rows=timetableRows(stopName,lineCode,dateKey);
  if(!rows.length)return null;
  const selected=destination?rowsForDestination(rows,destination):rows;
  const list=selected.length?selected:rows;
  if(!list.length)return null;
  return {first:list[0],last:list[list.length-1],dateKey};
}
function nextServiceStart(stopName,lineCode,destination){
  for(let offset=1;offset<=2;offset++){
    const dateKey=nextDateKey(new Date(),offset);
    const summary=serviceSummary(stopName,lineCode,destination,dateKey);
    if(summary?.first)return {dateKey,time:summary.first.time};
  }
  return null;
}
function serviceMetaHTML(stopName,lineCode,destination){
  const summary=serviceSummary(stopName,lineCode,destination);
  if(!summary)return"";
  return `<div class="service-meta"><span>Premier <strong>${esc(displayGtfsTime(summary.first.time))}</strong></span><span>Dernier <strong>${esc(displayGtfsTime(summary.last.time))}</strong></span></div>`;
}
function serviceEndedHTML(stopName,lineCode,destination){
  const today=serviceSummary(stopName,lineCode,destination);
  if(!today)return emptyHTML("Aucun horaire théorique disponible");
  const lastDt=gtfsTimeToDate(today.dateKey,today.last.time);
  const firstDt=gtfsTimeToDate(today.dateKey,today.first.time);
  const now=Date.now();
  if(firstDt&&now<firstDt.getTime())return `<div class="service-ended"><strong>SERVICE NON COMMENCÉ</strong><span>Premier passage prévu à ${esc(displayGtfsTime(today.first.time))}</span></div>`;
  if(lastDt&&now>lastDt.getTime()){
    const next=nextServiceStart(stopName,lineCode,destination);
    return `<div class="service-ended"><strong>SERVICE TERMINÉ</strong><span>${next?`Reprise prévue à ${esc(displayGtfsTime(next.time))}`:"Heure de reprise indisponible"}</span></div>`;
  }
  return emptyHTML("Aucun passage temps réel reçu de PRIM");
}
function isLastScheduledPassage(v,stopName,lineCode){
  const summary=serviceSummary(stopName,lineCode,v.destination);
  if(!summary?.last)return false;
  const lastDt=gtfsTimeToDate(summary.dateKey,summary.last.time);
  const liveDt=new Date(v.aimed||v.expected||0);
  if(!lastDt||Number.isNaN(liveDt.getTime()))return false;
  return Math.abs(liveDt.getTime()-lastDt.getTime())<=10*60*1000;
}

function parseOnward(mv,call){
  const raw=[...(Array.isArray(mv?.OnwardCalls?.OnwardCall)?mv.OnwardCalls.OnwardCall:[]),...(Array.isArray(call?.OnwardCalls?.OnwardCall)?call.OnwardCalls.OnwardCall:[])];
  return uniqueBy(raw.map(c=>({name:text(valueOf(c?.StopPointName?.[0])||valueOf(c?.DestinationDisplay?.[0])||valueOf(c?.StopPointRef)),expected:c?.ExpectedDepartureTime||c?.ExpectedArrivalTime||null,aimed:c?.AimedDepartureTime||c?.AimedArrivalTime||null})).filter(x=>x.name),x=>x.name).slice(0,14);
}
function parseVisits(data){
  const deliveries=data?.Siri?.ServiceDelivery?.StopMonitoringDelivery||[];
  const visits=deliveries.flatMap(d=>Array.isArray(d?.MonitoredStopVisit)?d.MonitoredStopVisit:[]);
  return visits.map(v=>{
    const mv=v?.MonitoredVehicleJourney||{},call=mv?.MonitoredCall||{};
    const expected=call.ExpectedDepartureTime||call.ExpectedArrivalTime||null;
    const aimed=call.AimedDepartureTime||call.AimedArrivalTime||null;
    return {lineRef:String(valueOf(mv.LineRef)||""),published:text(valueOf(mv?.PublishedLineName?.[0])||""),destination:text(valueOf(call?.DestinationDisplay?.[0])||valueOf(mv?.DestinationName?.[0])||valueOf(mv?.DirectionName?.[0])||"Destination non communiquée"),expected,aimed,status:String(call.DepartureStatus||call.ArrivalStatus||"onTime"),monitored:mv?.Monitored!==false,wait:minUntil(expected||aimed),delay:signedMinutes(expected,aimed),vehicleAtStop:Boolean(call.VehicleAtStop),onward:parseOnward(mv,call)};
  }).filter(v=>v.destination||v.expected||v.aimed);
}
function isRelevantPassage(v){const t=new Date(v.expected||v.aimed||0).getTime();if(!Number.isFinite(t))return false;if(v.vehicleAtStop)return t>=Date.now()-90000;return t>=Date.now()-5000;}
function statusInfo(v){
  const s=(v.status||"").toLowerCase();
  if(s==="cancelled")return{label:"SUPPRIMÉ",cls:"cancelled"};
  if(s==="missed")return{label:"ARRÊT NON DESSERVI",cls:"missed"};
  if(s==="departed"||s==="arrived")return{label:s==="departed"?"PARTI":"ARRIVÉ",cls:"na"};
  if(s==="notexpected")return{label:"NON PRÉVU",cls:"na"};
  if(!v.monitored&&v.aimed)return{label:"HORAIRE THÉORIQUE",cls:"na"};
  if(s==="delayed"||(v.delay!=null&&v.delay>=2))return{label:v.delay!=null?`RETARD +${v.delay} min`:"RETARD",cls:"delayed"};
  if(s==="early"||(v.delay!=null&&v.delay<=-2))return{label:v.delay!=null?`AVANCE ${Math.abs(v.delay)} min`:"EN AVANCE",cls:"early"};
  if(!v.expected&&v.aimed)return{label:"HORAIRE THÉORIQUE",cls:"na"};
  return{label:v.vehicleAtStop?"À QUAI":"TEMPS RÉEL",cls:"ok"};
}
function waitLabel(v){if(v.wait==null)return"—";if(v.wait<0)return v.vehicleAtStop?"À quai":"—";if(v.wait<=1)return"À l’approche";return`${v.wait} min`;}
function routeDiagramHTML(v){
  if(!v.onward?.length)return`<div class="route-unavailable">Desserte non communiquée par PRIM</div>`;
  const stops=[{name:RER_STOP.name,current:true},...v.onward.map((s,i)=>({...s,terminus:i===v.onward.length-1}))];
  return `<div class="route-diagram" aria-label="Gares desservies"><div class="route-track">${stops.map(s=>`<div class="route-stop ${s.current?"current":""} ${s.terminus?"terminus":""}"><span class="route-dot"></span><span class="route-stop-name">${esc(s.name)}</span></div>`).join("")}</div></div>`;
}
function rerPassageHTML(v){
  const st=statusInfo(v),cancelled=st.cls==="cancelled",last=isLastScheduledPassage(v,"Joinville-le-Pont","A");
  return `<article class="train-card ${v.wait!=null&&v.wait<=1&&!cancelled?"imminent":""}">
    ${last?'<div class="last-passage-badge">DERNIER PASSAGE</div>':''}
    <div class="train-main"><div><div class="wait">${cancelled?"—":waitLabel(v)}</div><div class="train-destination">→ ${esc(v.destination)}</div></div><div class="train-time"><div class="exact">${esc(fmtTime(cancelled?v.aimed:(v.expected||v.aimed)))}</div><div class="status ${st.cls}">${esc(st.label)}</div></div></div>
    ${routeDiagramHTML(v)}
  </article>`;
}
function busPassageHTML(v,stopName,lineCode){
  const st=statusInfo(v),cancelled=st.cls==="cancelled",last=isLastScheduledPassage(v,stopName,lineCode);
  const onward=v.onward?.length?`<div class="bus-onward">Puis : ${v.onward.slice(0,5).map(s=>esc(s.name)).join(" • ")}</div>`:"";
  return `<div class="passage ${v.wait!=null&&v.wait<=1&&!cancelled?"imminent":""}">${last?'<div class="last-passage-badge">DERNIER PASSAGE</div>':''}<div class="wait">${cancelled?"—":waitLabel(v)}</div><div class="exact">${esc(fmtTime(cancelled?v.aimed:(v.expected||v.aimed)))}</div><div class="status ${st.cls}">${esc(st.label)}</div>${onward}</div>`;
}
function emptyHTML(label="Information indisponible"){return`<div class="empty-state">— ${esc(label)}</div>`;}
function groupByDirection(visits){const map=new Map();visits.forEach(v=>{const k=v.destination||"Destination non communiquée";if(!map.has(k))map.set(k,[]);map.get(k).push(v);});for(const rows of map.values())rows.sort((a,b)=>new Date(a.expected||a.aimed)-new Date(b.expected||b.aimed));return map;}
async function fetchStop(ref){return fetchJSON(primUrl(`/stop-monitoring?MonitoringRef=${encodeURIComponent(ref)}`),15000);}

async function renderRer(){
  const cont=$("rer-body");if(!cont)return false;const all=[];
  for(const ref of RER_STOP.refs){const d=await fetchStop(ref);if(d)all.push(...parseVisits(d));}
  const rer=all.filter(v=>(!v.published||/(^|\s)A($|\s)/i.test(v.published)||/C01742|Line::A/i.test(v.lineRef))&&isRelevantPassage(v));
  if(!rer.length){cont.innerHTML=`<div class="stop-block rer-stop"><div class="stop-title">📍 ${esc(RER_STOP.name)}</div><div class="line-block"><div class="line-head"><span class="line-pill" style="background:#e41e26">A</span><span class="line-name">RER A</span></div>${serviceEndedHTML("Joinville-le-Pont","A",null)}</div></div>`;return false;}
  const dirs=groupByDirection(rer);
  cont.innerHTML=`<div class="stop-block rer-stop"><div class="stop-title">📍 ${esc(RER_STOP.name)}</div><div class="line-block"><div class="line-head"><span class="line-pill" style="background:#e41e26">A</span><span class="line-name">RER A</span></div>${[...dirs.entries()].map(([dest,rows])=>`<div class="direction">→ ${esc(dest)}</div>${serviceMetaHTML("Joinville-le-Pont","A",dest)}<div class="train-list">${rows.slice(0,4).map(rerPassageHTML).join("")}</div>`).join("")}</div></div>`;
  return true;
}
function matchesLine(v,code){const p=(v.published||"").toUpperCase().replace(/\s/g,"");const lr=(v.lineRef||"").toUpperCase();return p===code.toUpperCase()||lr.includes(`::${code.toUpperCase()}:`)||lr.endsWith(`:${code.toUpperCase()}:`);}
async function renderBus(){
  const cont=$("bus-blocks");if(!cont)return false;let any=false;const stopHtml=[];
  for(const stop of BUS_STOPS){
    const linesHtml=[];
    for(const line of stop.lines){
      const merged=[];
      for(const ref of line.refs){const d=await fetchStop(ref);if(d)merged.push(...parseVisits(d));}
      let visits=merged.filter(v=>matchesLine(v,line.code)&&isRelevantPassage(v));
      if(!visits.length&&merged.length&&stop.lines.length===1)visits=merged.filter(isRelevantPassage);
      if(visits.length)any=true;
      const dirs=groupByDirection(visits);
      let body="";
      if(visits.length){body=[...dirs.entries()].map(([dest,rows])=>`<div class="direction">→ ${esc(dest)}</div>${serviceMetaHTML(stop.scheduleName,line.code,dest)}<div class="passages">${rows.slice(0,4).map(v=>busPassageHTML(v,stop.scheduleName,line.code)).join("")}</div>`).join("");}
      else{body=serviceEndedHTML(stop.scheduleName,line.code,null);}
      linesHtml.push(`<div class="line-block"><div class="line-head"><span class="line-pill" style="background:${line.color}">${esc(line.code)}</span><span class="line-name">Ligne ${esc(line.code)}</span></div>${body}</div>`);
    }
    stopHtml.push(`<div class="stop-block"><div class="stop-title">🚏 ${esc(stop.name)}</div>${linesHtml.join("")}</div>`);
  }
  cont.innerHTML=stopHtml.join("");return any;
}

function disruptionText(d){const messages=Array.isArray(d?.messages)?d.messages:[];const msg=messages.find(m=>/title|titre/i.test(m?.channel?.name||m?.channel?.content_type||""))||messages[0];return text(msg?.text||d?.title||d?.cause||d?.severity?.name||"Perturbation en cours");}
function disruptionEffect(d){return String(d?.severity?.effect||d?.effect||"").toUpperCase();}
function collectDisruptionLines(data){const map=new Map();(data?.lines||[]).forEach(l=>{const code=text(l?.shortName||l?.code||l?.name).toUpperCase();(l?.disruptionIds||[]).forEach(id=>{if(!map.has(id))map.set(id,new Set());if(code)map.get(id).add(code);});});return map;}
function impactedCodes(d,lineMap){const codes=new Set(lineMap.get(d?.id)||[]);(d?.impactedObjects||[]).forEach(o=>{[o?.shortName,o?.name,o?.id].forEach(c=>{const s=text(c).toUpperCase();TRACKED_LINES.forEach(code=>{if(s===code||s.endsWith(`:${code}`)||s.includes(` ${code} `))codes.add(code);});});});return[...codes].filter(c=>TRACKED_LINES.includes(c));}
async function fetchBulkDisruptions(){const data=await fetchJSON(primUrl("/traffic-disruptions"),15000);if(!data)return[];const lineMap=collectDisruptionLines(data),out=[];(data?.disruptions||[]).forEach(d=>{if(disruptionEffect(d)==="NO_EFFECT")return;const lines=impactedCodes(d,lineMap);if(!lines.length)return;const t=disruptionText(d);if(t)out.push({lines,text:t,source:"traffic-disruptions"});});return out;}
function parseGeneralMessages(data,lines){const out=[];const deliveries=data?.Siri?.ServiceDelivery?.GeneralMessageDelivery||[];deliveries.forEach(del=>(del?.InfoMessage||[]).forEach(msg=>{const content=msg?.Content||{};const candidate=valueOf(content?.Message?.[0]?.MessageText?.[0])||valueOf(content?.Message?.MessageText)||valueOf(msg?.Description);const t=text(candidate);if(t)out.push({lines,text:t,source:"general-message"});}));return out;}
async function fetchGeneralMessages(){const out=[];for(const code of TRACKED_LINES){const data=await fetchJSON(primUrl(`/general-message?LineRef=${encodeURIComponent(`STIF:Line::${code}:`)}`),10000);out.push(...parseGeneralMessages(data,[code]));}for(const ref of RER_STOP.refs){const data=await fetchJSON(primUrl(`/general-message?StopPointRef=${encodeURIComponent(ref)}`),10000);out.push(...parseGeneralMessages(data,["A"]));}return out;}
async function refreshTraffic(){const banner=$("traffic-banner");if(!banner)return;const [d,g]=await Promise.all([fetchBulkDisruptions(),fetchGeneralMessages()]);const messages=uniqueBy([...d,...g],m=>`${m.lines.join("/")}|${m.text}`);if(messages.length){banner.className="traffic-banner alert";banner.textContent=`⚠️ ${messages.slice(0,4).map(m=>`${m.lines.join("/")} : ${m.text}`).join(" • ")}`;tickerData.traffic=`⚠️ ${messages[0].lines.join("/")} : ${messages[0].text}`;}else{banner.className="traffic-banner ok";banner.textContent="✅ Aucune perturbation ou information voyageur active détectée sur les lignes suivies.";tickerData.traffic="✅ Trafic : aucune information active détectée";}}

function parseBikeTypes(st){let mech=0,elec=0;const types=Array.isArray(st?.num_bikes_available_types)?st.num_bikes_available_types:[];types.forEach(x=>{mech+=Number(x?.mechanical||0);elec+=Number(x?.ebike||x?.electric||0);});if(!types.length){mech=Number(st?.num_mechanical_bikes_available||0);elec=Number(st?.num_ebikes_available||0);}return{mech,elec};}
async function refreshVelib(){const cache={};const status=await fetchJSON(primUrl("/station_status/"),12000);const stations=status?.data?.stations||status?.stations||[];for(const [key,station] of Object.entries(VELIB_STATIONS)){const el=$(`velib-${key.toLowerCase()}`);if(!el)continue;const st=stations.find(s=>String(s?.station_id)===station.id);if(!st){el.innerHTML=`<div class="velib-name">${esc(station.label)}</div><div class="velib-value">— indisponible</div>`;continue;}const {mech,elec}=parseBikeTypes(st),docks=Number(st?.num_docks_available||0),renting=st?.is_renting!==0&&st?.is_renting!==false;cache[key]={mech,elec,docks};el.innerHTML=`<div class="velib-name">${esc(station.label)}</div><div class="velib-value">${renting?`🚲 ${mech} &nbsp; ⚡ ${elec}`:"Service suspendu"}</div><div class="muted">${docks} place${docks>1?"s":""}</div>`;}cachedVelib=cache;}
function weatherEmoji(code){if([0,1].includes(code))return"☀️";if([2,3].includes(code))return"⛅";if([45,48].includes(code))return"🌫️";if([61,63,65,80,81,82].includes(code))return"🌧️";if([95,96,99].includes(code))return"⛈️";return"🌤️";}
async function refreshWeather(){const d=await fetchJSON(WEATHER_URL,10000),cw=d?.current_weather;if(!cw)return;const temp=`${Math.round(cw.temperature)}°C`,desc=WEATHER_CODES[cw.weathercode]||"Météo",ico=weatherEmoji(cw.weathercode);if($("weather-temp"))$("weather-temp").textContent=temp;if($("weather-desc"))$("weather-desc").textContent=desc;if($("weather-emoji"))$("weather-emoji").textContent=ico;tickerData.weather=`${ico} ${temp} • ${desc}`;}
async function computeRoute(){const el=$("best-route");if(!el)return;const d=await fetchStop("STIF:StopPoint:Q:22452:"),visits=parseVisits(d||{}).filter(isRelevantPassage);const bus=visits.filter(v=>matchesLine(v,"77")||matchesLine(v,"201")).sort((a,b)=>(a.wait??999)-(b.wait??999))[0],wait=bus?.wait,bikes=cachedVelib?.VINCENNES?(cachedVelib.VINCENNES.mech+cachedVelib.VINCENNES.elec):0;const opts=[{name:"🚶 À pied",time:15,detail:"environ 15 min"},{name:"🚲 Vélib’",time:bikes>0?6:Infinity,detail:bikes>0?`${bikes} vélo${bikes>1?"s":""} disponible${bikes>1?"s":""}`:"aucun vélo disponible"},{name:"🚌 Bus",time:wait==null?Infinity:wait+5,detail:wait==null?"pas de passage exploitable":`prochain passage ~${wait} min + trajet ~5 min`}];const finite=opts.filter(o=>Number.isFinite(o.time)).sort((a,b)=>a.time-b.time),best=finite[0];el.innerHTML=opts.map(o=>`<div class="route-option ${o===best?"best":""}"><div class="route-name">${esc(o.name)}</div><div class="route-time">${Number.isFinite(o.time)?`~${o.time} min`:"—"}</div><div class="route-detail">${esc(o.detail)}</div></div>`).join("");}
async function refreshCourses(){const cont=$("courses-list");if(!cont)return;const d=new Date(),ds=`${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${d.getFullYear()}`,target=`https://online.turfinfo.api.pmu.fr/rest/client/61/programme/${ds}?specialisation=INTERNET&meteo=true`,data=await fetchJSON(PROXY+encodeURIComponent(target),15000),rows=[];(data?.programme?.reunions||[]).forEach(r=>{const code=String(r?.hippodrome?.code||"").toUpperCase(),name=text(r?.hippodrome?.libelleCourt||r?.hippodrome?.libelleLong||"");if(code!=="VIN"&&!/VINCENNES/i.test(name))return;(r.courses||[]).forEach(c=>{const dt=new Date(c.heureDepart);if(!Number.isNaN(dt.getTime())&&dt>=new Date(Date.now()-5*60000))rows.push({date:dt,time:fmtTime(c.heureDepart),name:text(c.libelle||"Course")});});});rows.sort((a,b)=>a.date-b.date);cont.innerHTML=rows.length?rows.slice(0,6).map((r,i)=>`<div class="course ${i===0?"next-course":""}"><span class="course-time">${esc(r.time)}</span>${esc(r.name)}${i===0?" <strong>• prochaine</strong>":""}</div>`).join(""):emptyHTML("Pas de course à venir à Vincennes aujourd’hui");}
async function refreshNews(){const cont=$("news-carousel");if(!cont)return;const xml=await fetchText(PROXY+encodeURIComponent(RSS_URL),15000);let items=[];if(xml){try{const doc=new DOMParser().parseFromString(xml,"application/xml");items=[...doc.querySelectorAll("item")].slice(0,6).map(n=>({title:text(n.querySelector("title")?.textContent),desc:text(n.querySelector("description")?.textContent)}));}catch(e){console.error(e);}}if(items.length)newsItems=items;if(!newsItems.length){cont.innerHTML=emptyHTML("Actualités indisponibles");return;}renderNews();}
function renderNews(){const cont=$("news-carousel");if(!cont)return;cont.innerHTML=newsItems.map((n,i)=>`<div class="news-card ${i===currentNews?"active":""}"><div class="news-title">${esc(n.title)}</div><div class="news-desc">${esc(n.desc)}</div></div>`).join("");}
function nextNews(){if(newsItems.length){currentNews=(currentNews+1)%newsItems.length;renderNews();}}
async function refreshRoad(){const cont=$("road-list");if(!cont)return;const url=PROXY+encodeURIComponent("https://opendata.paris.fr/api/records/1.0/search/?dataset=comptages-routiers-permanents&sort=-horodate&rows=5"),d=await fetchJSON(url,15000);if(!d?.records?.length){cont.innerHTML=emptyHTML("Trafic routier indisponible");return;}cont.innerHTML=d.records.map(r=>{const f=r.fields||{};return`<div class="road"><strong>${esc(text(f.libelle||"Point de comptage"))}</strong><br><span class="muted">Débit ${f.debit??"—"} véh/h • occupation ${f.taux_occupation??f.taux_occupation_htps??"—"}%</span></div>`;}).join("");}
function updateTicker(){const el=$("ticker-slot");if(!el)return;const pool=[tickerData.weather,tickerData.traffic].filter(Boolean);el.textContent=pool.length?pool[tickerIndex++%pool.length]:"Informations mobilité en cours de chargement…";}
async function refreshPassages(){const results=await Promise.allSettled([renderRer(),renderBus()]);const ok=results.some(r=>r.status==="fulfilled"&&r.value===true);if(ok)lastGoodTransportUpdate=new Date();setLastUpdate();}
async function init(){setClock();await loadTimetable();await Promise.allSettled([refreshPassages(),refreshTraffic(),refreshVelib(),refreshWeather(),refreshCourses(),refreshNews(),refreshRoad()]);await computeRoute();updateTicker();setLastUpdate();setInterval(setClock,1000);setInterval(refreshPassages,30*1000);setInterval(refreshTraffic,90*1000);setInterval(refreshVelib,60*1000);setInterval(computeRoute,2*60*1000);setInterval(refreshWeather,10*60*1000);setInterval(refreshCourses,60*1000);setInterval(refreshNews,5*60*1000);setInterval(nextNews,12*1000);setInterval(refreshRoad,5*60*1000);setInterval(updateTicker,10*1000);setInterval(loadTimetable,60*60*1000);}
document.addEventListener("DOMContentLoaded",init);
