(() => {
  const LINES = {
    A: "C01742", 77: "C02251", 101: "C01130", 106: "C01135", 108: "C01137",
    110: "C01139", 112: "C01141", 201: "C01219", 281: "C01260", N33: "C01399"
  };
  const state = new Map();
  let lastSuccessfulRefresh = null;
  let lastRefreshCoverage = 0;
  let refreshInFlight = false;
  function scalar(v){if(v==null)return"";if(typeof v==="string"||typeof v==="number")return String(v);if(typeof v==="object"&&"value" in v)return scalar(v.value);return"";}
  function clean(v){return scalar(v).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();}
  function messageText(msg){const c=msg?.Content||{};const candidates=[c?.Message?.[0]?.MessageText?.[0],c?.Message?.[0]?.MessageText,c?.Message?.MessageText?.[0],c?.Message?.MessageText,c?.Description?.[0],c?.Description,msg?.Description?.[0],msg?.Description,msg?.Summary?.[0],msg?.Summary];for(const candidate of candidates){const t=clean(candidate);if(t)return t;}return"";}
  const MONTHS={janvier:0,fevrier:1,mars:2,avril:3,mai:4,juin:5,juillet:6,aout:7,septembre:8,octobre:9,novembre:10,decembre:11};
  function startsInFuture(t,now=new Date()){
    const cleanText=clean(t).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    const match=cleanText.match(/(?:du|a partir du)\s+(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)(?:\s+(\d{4}))?/i);
    if(!match)return false;
    let year=Number(match[3]||now.getFullYear());
    const start=new Date(year,MONTHS[match[2]],Number(match[1]),0,0,0,0);
    if(!match[3]&&start.getTime()<now.getTime()-180*24*60*60*1000){year+=1;start.setFullYear(year);}
    return start.getTime()>now.getTime()+6*60*60*1000;
  }
  function parseMessages(data){const out=[];for(const delivery of (data?.Siri?.ServiceDelivery?.GeneralMessageDelivery||[])){for(const msg of (delivery?.InfoMessage||[])){const t=messageText(msg);if(t&&!startsInFuture(t)&&!out.includes(t))out.push(t);}}return out;}
  async function fetchLineMessages(code,idfmCode){let received=false;for(const ref of [`STIF:Line::${idfmCode}:`,`STIF:Line::${idfmCode}`]){const data=await fetchJSON(primUrl(`/general-message?LineRef=${encodeURIComponent(ref)}`),12000);if(!data)continue;received=true;const msgs=parseMessages(data);if(msgs.length)return{ok:true,messages:msgs};}return{ok:received,messages:[]};}
  function alertClass(text){return /(interrompu|interruption|non desserv|supprim|incident|accident|arrêté|fermée|fermé)/i.test(text)?"critical":"info";}
  function lineLabel(code){return code==="A"?"RER A":`Ligne ${code}`;}
  function desiredAlertHTML(code,messages){return `<strong>INFO TRAFIC ${esc(lineLabel(code).toUpperCase())}</strong><span>${esc(messages[0])}</span>`;}
  function compactSummary(code,text){
    const label=lineLabel(code);
    const lower=text.toLowerCase();
    let type="Information trafic";
    if(/travaux/.test(lower)) type="Travaux";
    else if(/interromp|interruption/.test(lower)) type="Trafic interrompu";
    else if(/non desserv/.test(lower)) type="Arrêt non desservi";
    else if(/incident/.test(lower)) type="Incident";
    const time=text.match(/(?:dès|à partir de)\s*(\d{1,2}[h:][0-5]\d|\d{1,2}h)/i)?.[1]?.replace(":","h");
    const evening=time?` dès ${time}`:"";
    let area="";
    if(/cergy/i.test(text)&&/poissy/i.test(text)) area=" vers Cergy / Poissy";
    else if(/cergy/i.test(text)) area=" vers Cergy";
    else if(/poissy/i.test(text)) area=" vers Poissy";
    return `${label} · ${type}${evening}${area}`;
  }
  function applyInlineAlerts(){
    document.querySelectorAll(".line-block").forEach(block=>{
      const pill=block.querySelector(".line-pill"),head=block.querySelector(".line-head");if(!pill||!head)return;
      const code=pill.textContent.trim().toUpperCase(),messages=state.get(code)||[];let alert=block.querySelector(":scope > .mobili-line-alert");
      if(!messages.length){if(alert)alert.remove();return;}
      const cls=`mobili-line-alert ${alertClass(messages.join(" "))}`,html=desiredAlertHTML(code,messages);
      if(!alert){alert=document.createElement("div");alert.className=cls;alert.innerHTML=html;head.insertAdjacentElement("afterend",alert);return;}
      if(alert.className!==cls)alert.className=cls;if(alert.innerHTML!==html)alert.innerHTML=html;if(alert.previousElementSibling!==head)head.insertAdjacentElement("afterend",alert);
    });
  }
  function renderBanner(){
    const banner=document.getElementById("traffic-banner");if(!banner)return;
    const active=[...state.entries()].filter(([,msgs])=>msgs.length);
    if(!active.length){
      if(!lastSuccessfulRefresh){banner.className="traffic-banner neutral";banner.textContent="Information trafic momentanément indisponible";return;}
      if(lastRefreshCoverage<Object.keys(LINES).length){banner.className="traffic-banner neutral";banner.textContent=`Information trafic partielle • ${lastRefreshCoverage}/${Object.keys(LINES).length} lignes actualisées`;return;}
      banner.className="traffic-banner ok";banner.textContent="✓ Trafic normal sur les lignes suivies";return;
    }
    if(lastRefreshCoverage===0){banner.className="traffic-banner warn";banner.textContent=`Dernière information connue • ${active.slice(0,2).map(([code,msgs])=>compactSummary(code,msgs[0])).join("   •   ")}`;return;}
    const critical=active.some(([,msgs])=>alertClass(msgs.join(" "))==="critical");
    banner.className=`traffic-banner ${critical?"alert":"warn"}`;
    banner.textContent=`⚠ ${active.slice(0,3).map(([code,msgs])=>compactSummary(code,msgs[0])).join("   •   ")}`;
  }
  async function refreshTrafficFixed(){
    if(refreshInFlight)return;
    refreshInFlight=true;
    let successes=0;
    try{
      for(const [code,idfmCode] of Object.entries(LINES)){
        const result=await fetchLineMessages(code,idfmCode);
        if(result.ok){state.set(code,result.messages);successes+=1;}
      }
      lastRefreshCoverage=successes;
      if(successes)lastSuccessfulRefresh=new Date();
      renderBanner();applyInlineAlerts();
    }finally{refreshInFlight=false;}
  }
  window.refreshTrafficFixed=refreshTrafficFixed;
  document.addEventListener("DOMContentLoaded",()=>{
    setTimeout(refreshTrafficFixed,2200);setInterval(refreshTrafficFixed,3*60*1000);
    const root=document.querySelector(".location-dashboard");if(root){let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(applyInlineAlerts,100);}).observe(root,{childList:true,subtree:true});}
  });
})();
