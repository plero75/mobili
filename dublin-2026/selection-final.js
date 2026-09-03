(()=>{
const TRANSPORT_CAP=200;
const SHORTLIST=[
{id:'krakow',name:'Cracovie',flag:'🇵🇱',mode:'✈️ direct',stay:{hotel:[105,125],food:[120,140],extras:[30,40]}},
{id:'dublin',name:'Dublin',flag:'🇮🇪',mode:'✈️ direct',stay:{hotel:[170,210],food:[145,175],extras:[35,45]}},
{id:'bologna',name:'Bologne',flag:'🇮🇹',mode:'✈️ direct',stay:{hotel:[130,150],food:[125,145],extras:[30,40]}},
{id:'tirana',name:'Tirana',flag:'🇦🇱',mode:'✈️ direct',transportEstimate:[120,190],stay:{hotel:[90,110],food:[95,115],extras:[25,35]}},
{id:'prague',name:'Prague',flag:'🇨🇿',mode:'✈️ direct',stay:{hotel:[115,135],food:[115,135],extras:[30,40]}},
{id:'vienna',name:'Vienne',flag:'🇦🇹',mode:'✈️ direct',transportEstimate:[150,200],stay:{hotel:[145,170],food:[135,155],extras:[35,45]}},
{id:'rotterdam',name:'Rotterdam',flag:'🇳🇱',mode:'🚄 direct',transportEstimate:[100,180],stay:{hotel:[155,180],food:[140,160],extras:[35,45]}},
{id:'london',name:'Londres',flag:'🇬🇧',mode:'🚄 direct',transportEstimate:[250,320],stay:{hotel:[210,250],food:[170,200],extras:[40,50]}},
{id:'bucharest',name:'Bucarest',flag:'🇷🇴',mode:'✈️ direct',transportEstimate:[160,200],stay:{hotel:[95,115],food:[105,125],extras:[25,35]}},
{id:'munich',name:'Munich',flag:'🇩🇪',mode:'✈️ direct',transportEstimate:[170,200],stay:{hotel:[150,175],food:[140,160],extras:[35,45]}},
{id:'turin',name:'Turin',flag:'🇮🇹',mode:'🚄 / ✈️ direct',transportEstimate:[150,200],stay:{hotel:[125,150],food:[120,140],extras:[30,40]}},
{id:'amsterdam',name:'Amsterdam',flag:'🇳🇱',mode:'🚄 direct',transportEstimate:[120,190],stay:{hotel:[180,215],food:[145,170],extras:[35,45]}},
{id:'malaga',name:'Málaga',flag:'🇪🇸',mode:'✈️ direct',stay:{hotel:[120,145],food:[120,140],extras:[30,40]}},
{id:'alicante',name:'Alicante',flag:'🇪🇸',mode:'✈️ direct',stay:{hotel:[110,135],food:[115,135],extras:[30,40]}}
];
const fmt=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const hh=s=>s?String(s).slice(11,16):'—';
const sumRange=(...rs)=>[rs.reduce((s,r)=>s+r[0],0),rs.reduce((s,r)=>s+r[1],0)];
const mid=r=>Math.round((r[0]+r[1])/2/5)*5;
const spread=r=>`${fmt(r[0])}–${fmt(r[1])}`;
function pickFromLive(data,id){
 const c=data?.cities?.[id];
 const rec=c?.options?.find(x=>x.kind==='recommended')||c?.options?.[0];
 if(rec)return {price:rec.price,useful:rec.usefulHours,route:`${rec.outbound.from} ${hh(rec.outbound.departure)} → ${rec.outbound.to} ${hh(rec.outbound.arrival)} · retour ${hh(rec.return.departure)}`};
 const d=(data?.dealScout?.candidates||[]).find(x=>x.id===id);
 if(d)return {price:d.flightPrice,useful:d.usefulHours,route:`${d.outbound.from} ${hh(d.outbound.departure)} → ${d.outbound.to} ${hh(d.outbound.arrival)} · retour ${hh(d.return.departure)}`};
 return null;
}
function enrich(data){return SHORTLIST.map(x=>{
 const live=pickFromLive(data,x.id);
 const transport=live?{min:live.price,max:live.price,label:fmt(live.price),kind:'live'}:(x.transportEstimate?{min:x.transportEstimate[0],max:x.transportEstimate[1],label:`≈ ${fmt(mid(x.transportEstimate))}`,kind:'estimate'}:null);
 const place=sumRange(x.stay.hotel,x.stay.food,x.stay.extras);
 const total=transport?[transport.min+place[0],transport.max+place[1]]:null;
 return {...x,live,transport,place,total};
});}
function eligible(rows){return rows.filter(x=>x.transport&&x.transport.max<=TRANSPORT_CAP);}
function badges(rows){
 const out={}; const put=(x,t)=>{if(x)out[x.id]=[...(out[x.id]||[]),t]};
 put([...rows].sort((a,b)=>a.transport.min-b.transport.min)[0],'💸 transport');
 put([...rows].filter(x=>x.total).sort((a,b)=>mid(a.total)-mid(b.total))[0],'💰 budget global');
 put([...rows].filter(x=>x.live?.useful!=null).sort((a,b)=>b.live.useful-a.live.useful)[0],'⏱ temps sur place');
 return out;
}
function css(){const s=document.createElement('style');s.textContent=`
.shortlist-wrap{margin:24px 0 34px}.shortlist-head{margin-bottom:14px}.shortlist-head h2{font:900 34px Georgia,serif;margin:0}.shortlist-head p{max-width:760px;color:#6d655a;margin:6px 0 0}.decision-table{overflow:auto;border:1px solid #d8ccb8;background:#fff}.decision-table table{width:100%;border-collapse:collapse;min-width:760px}.decision-table th{background:#173f32;color:#fff;text-align:left;padding:11px 14px;font-size:12px}.decision-table td{padding:15px 14px;border-bottom:1px solid #eee4d7;vertical-align:middle}.decision-table tr:last-child td{border-bottom:0}.decision-city{font:900 19px Georgia,serif;color:#173f32;white-space:nowrap}.decision-mode{font-size:11px;color:#756b5e;margin-top:3px}.decision-main{font-weight:950;font-size:19px;color:#173f32}.decision-sub{font-size:10px;color:#7d7163;margin-top:3px}.decision-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.decision-badge{font-size:9px;font-weight:950;background:#fff0b7;padding:4px 6px}.decision-missing{color:#9a4c2d;font-weight:850}.decision-foot{font-size:10px;color:#766c5f;margin-top:9px;line-height:1.45}.decision-excluded{margin-top:8px;color:#8a5e45}
`;document.head.appendChild(s)}
function render(rows,excluded){const b=badges(rows);return `<div class="w shortlist-wrap"><div class="shortlist-head"><div class="script">La sélection pour ce soir</div><h2>3 chiffres. Pas 50.</h2><p>Pour décider : <b>prix du trajet</b>, <b>budget global par personne</b> et <b>temps réellement exploitable sur place</b>. Tout trajet au-dessus de 200 € A/R est écarté.</p></div><div class="decision-table"><table><thead><tr><th>Destination</th><th>Transport A/R</th><th>Budget global / pers.</th><th>Temps exploitable</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="decision-city">${x.flag} ${x.name}</div><div class="decision-mode">${x.mode}</div><div class="decision-badges">${(b[x.id]||[]).map(t=>`<span class="decision-badge">${t}</span>`).join('')}</div></td><td><div class="decision-main">${x.transport.label}</div><div class="decision-sub">${x.transport.kind==='live'?'LIVE sur les dates':'estimation à confirmer'}${x.live?.route?` · ${x.live.route}`:''}</div></td><td><div class="decision-main">≈ ${fmt(mid(x.total))}</div><div class="decision-sub">fourchette de travail ${spread(x.total)}</div></td><td>${x.live?.useful!=null?`<div class="decision-main">≈ ${Math.round(x.live.useful)} h</div><div class="decision-sub">arrivée centre → départ du centre</div>`:`<div class="decision-missing">À calculer</div><div class="decision-sub">dès que les horaires exacts sont verrouillés</div>`}</td></tr>`).join('')}</tbody></table></div><div class="decision-foot">Le budget global inclut transport + 2 nuits + repas/bars + transports locaux + 1–2 activités. Les détails poste par poste ne sont plus affichés ici pour éviter de noyer la décision.${excluded.length?`<div class="decision-excluded">Hors sélection (> 200 € ou tarif non exploitable) : ${excluded.map(x=>`${x.name}${x.transport?` ${x.transport.label}`:''}`).join(' · ')}</div>`:''}</div></div>`}
async function run(){css();let data={};try{const r=await fetch(`flights-live.json?ts=${Date.now()}`,{cache:'no-store'});if(r.ok)data=await r.json()}catch(e){}const all=enrich(data);const rows=eligible(all);const excluded=all.filter(x=>!rows.includes(x));const section=document.createElement('section');section.id='shortlist';section.innerHTML=render(rows,excluded);const anchor=document.querySelector('#destinations');if(anchor)anchor.parentNode.insertBefore(section,anchor)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,70));else setTimeout(run,70);
})();