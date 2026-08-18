const PROXY = "https://ratp-proxy.hippodrome-proxy42.workers.dev/?url=";
const PRIM = "https://prim.iledefrance-mobilites.fr/marketplace";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=48.835&longitude=2.45&current_weather=true";
const RSS_URL = "https://www.francetvinfo.fr/titres.rss";

const RER_STOP = { name: "Joinville-le-Pont", refs: ["STIF:StopArea:SP:43135:"] };

// Référentiel repris du projet VHPRATP.
const BUS_STOPS = [
  {
    name: "Joinville-le-Pont – Bus",
    lines: [
      { code: "77", color: "#0071bc", refs: ["STIF:StopPoint:Q:22452:"] },
      { code: "101", color: "#f0a500", refs: ["STIF:StopPoint:Q:21252:"] },
      { code: "106", color: "#e4002b", refs: ["STIF:StopPoint:Q:27560:"] },
      { code: "108", color: "#d10073", refs: ["STIF:StopPoint:Q:28032:"] },
      { code: "110", color: "#642580", refs: ["STIF:StopPoint:Q:28032:"] },
      { code: "112", color: "#ff5a00", refs: ["STIF:StopPoint:Q:28065:", "STIF:StopPoint:Q:39406:"] },
      { code: "281", color: "#d9a300", refs: ["STIF:StopPoint:Q:28033:"] },
      { code: "N33", color: "#ff5a00", refs: ["STIF:StopPoint:Q:39406:"] }
    ]
  },
  {
    name: "École du Breuil",
    lines: [
      { code: "201", color: "#6E491E", refs: ["STIF:StopPoint:Q:39406:", "STIF:StopPoint:Q:22452:"] }
    ]
  }
];

const VELIB_STATIONS = {
  VINCENNES: { id: "12163", label: "Hippodrome / Vincennes" },
  BREUIL: { id: "12128", label: "École du Breuil" }
};

const WEATHER_CODES = {
  0:"Ciel dégagé",1:"Principalement clair",2:"Partiellement nuageux",3:"Couvert",45:"Brouillard",48:"Brouillard givrant",
  51:"Bruine faible",53:"Bruine",55:"Bruine forte",61:"Pluie faible",63:"Pluie modérée",65:"Pluie forte",
  80:"Averses faibles",81:"Averses modérées",82:"Fortes averses",95:"Orages",96:"Orages avec grêle",99:"Orages avec grêle"
};

let newsItems = [];
let currentNews = 0;
let tickerIndex = 0;
let tickerData = { weather:"", traffic:"" };
let lastGoodTransportUpdate = null;
let cachedVelib = null;

const $ = id => document.getElementById(id);
function text(v=""){return String(v ?? "").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();}
function valueOf(x){return x?.value ?? x ?? "";}
function fmtTime(iso){if(!iso)return "—";const d=new Date(iso);return Number.isNaN(d.getTime())?"—":d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}
function minUntil(iso){if(!iso)return null;const d=new Date(iso);if(Number.isNaN(d.getTime()))return null;return Math.max(0,Math.round((d-Date.now())/60000));}
function signedMinutes(expected, aimed){if(!expected||!aimed)return null;const a=new Date(aimed),e=new Date(expected);if(Number.isNaN(a)||Number.isNaN(e))return null;return Math.round((e-a)/60000);}
function primUrl(path){return PROXY + encodeURIComponent(PRIM + path);}

async function fetchJSON(url, timeout=12000){
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),timeout);
  try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json();}
  catch(e){console.error("fetchJSON",e);return null;}finally{clearTimeout(timer);}
}
async function fetchText(url, timeout=12000){
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),timeout);
  try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text();}
  catch(e){console.error("fetchText",e);return "";}finally{clearTimeout(timer);}
}

function setClock(){if($("clock")) $("clock").textContent=new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});}
function setLastUpdate(){if(!$("lastUpdate"))return;const base=lastGoodTransportUpdate||new Date();$("lastUpdate").textContent=`Maj ${base.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}`;}

function parseVisits(data){
  const deliveries=data?.Siri?.ServiceDelivery?.StopMonitoringDelivery||[];
  const visits=deliveries.flatMap(d=>Array.isArray(d?.MonitoredStopVisit)?d.MonitoredStopVisit:[]);
  return visits.map(v=>{
    const mv=v?.MonitoredVehicleJourney||{};
    const call=mv?.MonitoredCall||{};
    const expected=call.ExpectedDepartureTime||call.ExpectedArrivalTime||null;
    const aimed=call.AimedDepartureTime||call.AimedArrivalTime||null;
    const status=String(call.DepartureStatus||call.ArrivalStatus||"onTime");
    const destination=text(valueOf(call?.DestinationDisplay?.[0])||valueOf(mv?.DestinationName?.[0])||valueOf(mv?.DirectionName?.[0])||"Destination non communiquée");
    const lineRef=String(valueOf(mv.LineRef)||"");
    const published=text(valueOf(mv?.PublishedLineName?.[0])||"");
    return {
      lineRef,published,destination,expected,aimed,status,
      wait:minUntil(expected||aimed),delay:signedMinutes(expected,aimed),
      vehicleAtStop:Boolean(call.VehicleAtStop)
    };
  }).filter(v=>v.destination||v.expected||v.aimed);
}

function statusInfo(v){
  const s=(v.status||"").toLowerCase();
  if(s==="cancelled") return {label:"ANNULÉ",cls:"cancelled"};
  if(s==="missed") return {label:"ARRÊT NON DESSERVI",cls:"missed"};
  if(s==="delayed" || (v.delay!=null&&v.delay>=2)) return {label:v.delay!=null?`RETARD +${v.delay} min`:"RETARD",cls:"delayed"};
  if(s==="early" || (v.delay!=null&&v.delay<=-2)) return {label:v.delay!=null?`AVANCE ${v.delay} min`:"EN AVANCE",cls:"early"};
  if(!v.expected && v.aimed) return {label:"HORAIRE THÉORIQUE",cls:"na"};
  return {label:v.vehicleAtStop?"À QUAI":"TEMPS RÉEL",cls:"ok"};
}

function passageHTML(v){
  const st=statusInfo(v);
  const wait=v.wait==null?"—":v.wait<=1?"À l’approche":`${v.wait} min`;
  const exact=fmtTime(v.expected||v.aimed);
  return `<div class="passage ${v.wait!=null&&v.wait<=1?"imminent":""}"><div class="wait">${wait}</div><div class="exact">${exact}</div><div class="status ${st.cls}">${st.label}</div></div>`;
}

function emptyHTML(label="Information indisponible"){return `<div class="empty-state">— ${label}</div>`;}

function groupByDirection(visits){
  const map=new Map();
  visits.forEach(v=>{const k=v.destination||"Destination non communiquée";if(!map.has(k))map.set(k,[]);map.get(k).push(v);});
  for(const rows of map.values()) rows.sort((a,b)=>new Date(a.expected||a.aimed)-new Date(b.expected||b.aimed));
  return map;
}

async function fetchStop(ref){return fetchJSON(primUrl(`/stop-monitoring?MonitoringRef=${encodeURIComponent(ref)}`),15000);}

async function renderRer(){
  const cont=$("rer-body");if(!cont)return false;
  const all=[];
  for(const ref of RER_STOP.refs){const d=await fetchStop(ref);if(d)all.push(...parseVisits(d));}
  const rer=all.filter(v=>!v.published || /(^|\s)A($|\s)/i.test(v.published) || /C01742|Line::A/i.test(v.lineRef));
  if(!rer.length){cont.innerHTML=emptyHTML("Aucun passage RER A reçu de PRIM");return false;}
  const dirs=groupByDirection(rer);
  cont.innerHTML=`<div class="stop-block"><div class="stop-title">📍 ${RER_STOP.name}</div><div class="line-block"><div class="line-head"><span class="line-pill" style="background:#e41e26">A</span><span class="line-name">RER A</span></div>${[...dirs.entries()].map(([dest,rows])=>`<div class="direction">→ ${dest}</div><div class="passages">${rows.slice(0,4).map(passageHTML).join("")}</div>`).join("")}</div></div>`;
  return true;
}

function matchesLine(v, code){
  const p=(v.published||"").toUpperCase().replace(/\s/g,"");
  const lr=(v.lineRef||"").toUpperCase();
  return p===code.toUpperCase() || lr.includes(`::${code.toUpperCase()}:`) || lr.endsWith(`:${code.toUpperCase()}:`);
}

async function renderBus(){
  const cont=$("bus-blocks");if(!cont)return false;
  let any=false;const stopHtml=[];
  for(const stop of BUS_STOPS){
    const linesHtml=[];
    for(const line of stop.lines){
      const merged=[];
      for(const ref of line.refs){const d=await fetchStop(ref);if(d)merged.push(...parseVisits(d));}
      let visits=merged.filter(v=>matchesLine(v,line.code));
      // Certains flux PRIM omettent PublishedLineName : si la référence est dédiée à la ligne, on garde la réponse.
      if(!visits.length && merged.length && stop.lines.length===1) visits=merged;
      if(visits.length) any=true;
      const dirs=groupByDirection(visits);
      linesHtml.push(`<div class="line-block"><div class="line-head"><span class="line-pill" style="background:${line.color}">${line.code}</span><span class="line-name">Ligne ${line.code}</span></div>${visits.length?[...dirs.entries()].map(([dest,rows])=>`<div class="direction">→ ${dest}</div><div class="passages">${rows.slice(0,3).map(passageHTML).join("")}</div>`).join(""):emptyHTML("Aucun passage communiqué")}</div>`);
    }
    stopHtml.push(`<div class="stop-block"><div class="stop-title">🚏 ${stop.name}</div>${linesHtml.join("")}</div>`);
  }
  cont.innerHTML=stopHtml.join("");
  return any;
}

async function fetchTrafficMessages(){
  const lineCodes=["A","77","101","106","108","110","112","201","281","N33"];
  const messages=[];
  for(const code of lineCodes){
    const refs=[`STIF:Line::${code}:`];
    for(const ref of refs){
      const data=await fetchJSON(primUrl(`/general-message?LineRef=${encodeURIComponent(ref)}`),12000);
      const deliveries=data?.Siri?.ServiceDelivery?.GeneralMessageDelivery||[];
      deliveries.forEach(del=>(del?.InfoMessage||[]).forEach(msg=>{
        const content=msg?.Content||{};
        const candidate=valueOf(content?.Message?.[0]?.MessageText?.[0])||valueOf(content?.Message?.MessageText)||valueOf(msg?.Description);
        const t=text(candidate);if(t&&!messages.some(x=>x.text===t))messages.push({line:code,text:t});
      }));
    }
  }
  const banner=$("traffic-banner");if(!banner)return;
  if(messages.length){banner.className="traffic-banner alert";banner.textContent=`⚠️ ${messages.slice(0,3).map(m=>`${m.line} : ${m.text}`).join(" • ")}`;tickerData.traffic=`⚠️ ${messages[0].line} : ${messages[0].text}`;}
  else{banner.className="traffic-banner ok";banner.textContent="✅ Aucun message de perturbation PRIM reçu sur les lignes suivies.";tickerData.traffic="✅ Trafic : aucun message de perturbation reçu";}
}

async function refreshVelib(){
  const cache={};
  for(const [key,station] of Object.entries(VELIB_STATIONS)){
    const el=$(`velib-${key.toLowerCase()}`);if(!el)continue;
    const url=`https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel/records?where=stationcode%3D${station.id}&limit=1`;
    const d=await fetchJSON(url,10000);const st=d?.results?.[0];
    if(!st){el.innerHTML=`<div class="velib-name">${station.label}</div><div class="velib-value">— indisponible</div>`;continue;}
    const mech=Number(st.mechanical_bikes||0), elec=Number(st.ebike_bikes||0), docks=Number(st.numdocksavailable||0);
    cache[key]={mech,elec,docks};el.innerHTML=`<div class="velib-name">${station.label}</div><div class="velib-value">🚲 ${mech} &nbsp; ⚡ ${elec}</div><div class="muted">${docks} place${docks>1?"s":""}</div>`;
  }
  cachedVelib=cache;
}

function weatherEmoji(code){if([0,1].includes(code))return"☀️";if([2,3].includes(code))return"⛅";if([45,48].includes(code))return"🌫️";if([61,63,65,80,81,82].includes(code))return"🌧️";if([95,96,99].includes(code))return"⛈️";return"🌤️";}
async function refreshWeather(){
  const d=await fetchJSON(WEATHER_URL,10000);const cw=d?.current_weather;if(!cw)return;
  const temp=`${Math.round(cw.temperature)}°C`,desc=WEATHER_CODES[cw.weathercode]||"Météo",ico=weatherEmoji(cw.weathercode);
  if($("weather-temp"))$("weather-temp").textContent=temp;if($("weather-desc"))$("weather-desc").textContent=desc;if($("weather-emoji"))$("weather-emoji").textContent=ico;
  tickerData.weather=`${ico} ${temp} • ${desc}`;
}

async function computeRoute(){
  const el=$("best-route");if(!el)return;
  const d=await fetchStop("STIF:StopPoint:Q:22452:");const visits=parseVisits(d||{});
  const bus=visits.filter(v=>matchesLine(v,"77")||matchesLine(v,"201")).sort((a,b)=>(a.wait??999)-(b.wait??999))[0];
  const wait=bus?.wait;const bikes=cachedVelib?.VINCENNES?(cachedVelib.VINCENNES.mech+cachedVelib.VINCENNES.elec):0;
  const opts=[
    {name:"🚶 À pied",time:15,detail:"environ 15 min",available:true},
    {name:"🚲 Vélib’",time:bikes>0?6:Infinity,detail:bikes>0?`${bikes} vélo${bikes>1?"s":""} disponible${bikes>1?"s":""}`:"aucun vélo disponible",available:bikes>0},
    {name:"🚌 Bus",time:wait==null?Infinity:wait+5,detail:wait==null?"pas de passage exploitable":`prochain passage ~${wait} min + trajet ~5 min`,available:wait!=null}
  ];
  const finite=opts.filter(o=>Number.isFinite(o.time)).sort((a,b)=>a.time-b.time);const best=finite[0];
  el.innerHTML=opts.map(o=>`<div class="route-option ${o===best?"best":""}"><div class="route-name">${o.name}</div><div class="route-time">${Number.isFinite(o.time)?`~${o.time} min`:"—"}</div><div class="route-detail">${o.detail}</div></div>`).join("");
}

async function refreshCourses(){
  const cont=$("courses-list");if(!cont)return;
  const d=new Date();const ds=`${String(d.getDate()).padStart(2,"0")}${String(d.getMonth()+1).padStart(2,"0")}${d.getFullYear()}`;
  const data=await fetchJSON(PROXY+encodeURIComponent(`https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${ds}`),15000);
  const rows=[];(data?.programme?.reunions||[]).forEach(r=>{if(r?.hippodrome?.code!=="VIN")return;(r.courses||[]).forEach(c=>rows.push({time:fmtTime(c.heureDepart),name:text(c.libelle||"Course")}));});
  cont.innerHTML=rows.length?rows.map(r=>`<div class="course"><span class="course-time">${r.time}</span>${r.name}</div>`).join(""):emptyHTML("Pas de réunion à Vincennes aujourd’hui");
}

async function refreshNews(){
  const cont=$("news-carousel");if(!cont)return;const xml=await fetchText(PROXY+encodeURIComponent(RSS_URL),15000);let items=[];
  if(xml){try{const doc=new DOMParser().parseFromString(xml,"application/xml");items=[...doc.querySelectorAll("item")].slice(0,6).map(n=>({title:text(n.querySelector("title")?.textContent),desc:text(n.querySelector("description")?.textContent)}));}catch(e){console.error(e);}}
  if(items.length)newsItems=items;if(!newsItems.length){cont.innerHTML=emptyHTML("Actualités indisponibles");return;}renderNews();
}
function renderNews(){const cont=$("news-carousel");if(!cont)return;cont.innerHTML=newsItems.map((n,i)=>`<div class="news-card ${i===currentNews?"active":""}"><div class="news-title">${n.title}</div><div class="news-desc">${n.desc}</div></div>`).join("");}
function nextNews(){if(newsItems.length){currentNews=(currentNews+1)%newsItems.length;renderNews();}}

async function refreshRoad(){
  const cont=$("road-list");if(!cont)return;const url=PROXY+encodeURIComponent("https://opendata.paris.fr/api/records/1.0/search/?dataset=comptages-routiers-permanents&sort=-horodate&rows=5");const d=await fetchJSON(url,15000);
  if(!d?.records?.length){cont.innerHTML=emptyHTML("Trafic routier indisponible");return;}
  cont.innerHTML=d.records.map(r=>{const f=r.fields||{};return `<div class="road"><strong>${text(f.libelle||"Point de comptage")}</strong><br><span class="muted">Débit ${f.debit??"—"} véh/h • occupation ${f.taux_occupation??f.taux_occupation_htps??"—"}%</span></div>`;}).join("");
}

function updateTicker(){const el=$("ticker-slot");if(!el)return;const pool=[tickerData.weather,tickerData.traffic].filter(Boolean);el.textContent=pool.length?pool[tickerIndex++%pool.length]:"Informations mobilité en cours de chargement…";}

async function refreshTransport(){
  const results=await Promise.allSettled([renderRer(),renderBus(),fetchTrafficMessages()]);
  const ok=results.some(r=>r.status==="fulfilled"&&r.value===true);
  if(ok)lastGoodTransportUpdate=new Date();setLastUpdate();
}

async function init(){
  setClock();
  await Promise.allSettled([refreshTransport(),refreshVelib(),refreshWeather(),refreshCourses(),refreshNews(),refreshRoad()]);
  await computeRoute();updateTicker();setLastUpdate();
  setInterval(setClock,1000);
  setInterval(refreshTransport,60*1000);
  setInterval(refreshVelib,2*60*1000);
  setInterval(computeRoute,2*60*1000);
  setInterval(refreshWeather,10*60*1000);
  setInterval(refreshCourses,5*60*1000);
  setInterval(refreshNews,15*60*1000);
  setInterval(nextNews,12*1000);
  setInterval(refreshRoad,5*60*1000);
  setInterval(updateTicker,10*1000);
}

document.addEventListener("DOMContentLoaded",init);
