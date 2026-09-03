(()=>{
const SHORTLIST=[
{id:'krakow',name:'Cracovie',flag:'🇵🇱',mode:'✈️ direct',place:[220,300],vibe:'🍺 Kazimierz · pierogi · bars en cave',ease:8,note:'Très forte candidate budget + ambiance.'},
{id:'dublin',name:'Dublin',flag:'🇮🇪',mode:'✈️ direct',place:[330,450],vibe:'🍻 pubs · musique · gros week-end entre potes',ease:7,note:'Transport parfois très bon marché, mais logement cher.'},
{id:'bologna',name:'Bologne',flag:'🇮🇹',mode:'✈️ direct',place:[240,320],vibe:'🍝 bouffe · arcades · bars · ville compacte',ease:8,note:'Une des meilleures surprises en rapport plaisir/prix.'},
{id:'tirana',name:'Tirana',flag:'🇦🇱',mode:'✈️ direct',place:[180,260],vibe:'🌶️ dépaysante · très abordable · nightlife',ease:7,note:'Budget sur place très bas ; vol 23–25 à confirmer au prochain scan.'},
{id:'prague',name:'Prague',flag:'🇨🇿',mode:'✈️ direct',place:[220,300],vibe:'🍺 bière · vieille ville · nightlife',ease:8,note:'Valeur sûre de groupe, prix sur place encore raisonnables.'},
{id:'vienna',name:'Vienne',flag:'🇦🇹',mode:'✈️ direct',place:[280,380],vibe:'☕ cafés · brasseries · architecture · bars',ease:8,note:'Plus chic et plus chère sur place, mais logistique simple.'},
{id:'rotterdam',name:'Rotterdam',flag:'🇳🇱',mode:'🚄 train direct',place:[300,420],transportEstimate:[70,180],duration:'≈ 2 h 40 centre-centre',vibe:'🏙️ moderne · bars · food halls · zéro aéroport',ease:10,note:'Très simple depuis Paris. Tarif exact 23–25 à verrouiller.'},
{id:'london',name:'Londres',flag:'🇬🇧',mode:'🚄 train direct',place:[400,550],transportEstimate:[90,220],duration:'≈ 2 h 20 centre-centre',vibe:'🎸 pubs · quartiers · nightlife XXL',ease:10,note:'Logistique parfaite, mais le budget sur place est le vrai sujet.'},
{id:'bucharest',name:'Bucarest',flag:'🇷🇴',mode:'✈️ direct',place:[190,270],vibe:'🍸 old town · bars · gros rapport qualité/prix',ease:7,note:'Très bonne piste Good Value à scanner sur les dates exactes.'},
{id:'munich',name:'Munich',flag:'🇩🇪',mode:'✈️ direct',place:[300,420],vibe:'🍺 brasseries · centre historique · bière',ease:8,note:'Pas d’Oktoberfest fin octobre, mais excellente ville de week-end.'},
{id:'turin',name:'Turin',flag:'🇮🇹',mode:'🚄 train / ✈️ direct',place:[240,330],transportEstimate:[90,190],duration:'train long mais centre-centre',vibe:'🍷 aperitivo · cafés · Piémont',ease:7,note:'À garder si l’option train/vol tombe bien sur les horaires.'},
{id:'amsterdam',name:'Amsterdam',flag:'🇳🇱',mode:'🚄 train direct',place:[360,500],transportEstimate:[100,180],duration:'≈ 3 h 20 centre-centre',vibe:'🚲 canaux · bars · quartiers · très simple',ease:10,note:'Ultra simple, mais hôtels souvent chers pour 11.'}
];
const fmt=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const range=r=>r?`${fmt(r[0])}–${fmt(r[1])}`:'À vérifier';
const hh=s=>s?String(s).slice(11,16):'—';
function pickFromLive(data,id){
  const c=data?.cities?.[id];
  const rec=c?.options?.find(x=>x.kind==='recommended')||c?.options?.[0];
  if(rec)return {price:rec.price,useful:rec.usefulHours,route:`${rec.outbound.from} ${hh(rec.outbound.departure)} → ${rec.outbound.to} ${hh(rec.outbound.arrival)} · retour ${rec.return.from} ${hh(rec.return.departure)} → ${rec.return.to} ${hh(rec.return.arrival)}`,source:'prix direct actualisé'};
  const deals=data?.dealScout?.candidates||[];
  const d=deals.find(x=>x.id===id);
  if(d)return {price:d.flightPrice,useful:d.usefulHours,route:`${d.outbound.from} ${hh(d.outbound.departure)} → ${d.outbound.to} ${hh(d.outbound.arrival)} · retour ${d.return.from} ${hh(d.return.departure)} → ${d.return.to} ${hh(d.return.arrival)}`,source:'prix direct actualisé'};
  return null;
}
function enrich(data){return SHORTLIST.map(x=>{const live=pickFromLive(data,x.id);const tr=live?{min:live.price,max:live.price,label:fmt(live.price),kind:'live'}:(x.transportEstimate?{min:x.transportEstimate[0],max:x.transportEstimate[1],label:range(x.transportEstimate),kind:'estimate'}:null);const total=tr?[tr.min+x.place[0],tr.max+x.place[1]]:null;return {...x,live,transport:tr,total};});}
function award(rows){
 const withTransport=rows.filter(x=>x.transport);
 const withTotal=rows.filter(x=>x.total);
 const cheapestTravel=withTransport.length?[...withTransport].sort((a,b)=>a.transport.min-b.transport.min)[0]:null;
 const cheapestWeekend=withTotal.length?[...withTotal].sort((a,b)=>a.total[0]-b.total[0])[0]:null;
 const best48=[...rows].filter(x=>x.live?.useful!=null).sort((a,b)=>b.live.useful-a.live.useful)[0]||null;
 const easiest=[...rows].sort((a,b)=>b.ease-a.ease)[0]||null;
 const scored=withTotal.map(x=>({...x,valueScore:x.total[0]+(10-x.ease)*18+Math.max(0,46-(x.live?.useful||46))*5})).sort((a,b)=>a.valueScore-b.valueScore);
 const bestValue=scored[0]||null;
 const out={};
 if(cheapestTravel)out[cheapestTravel.id]=[...(out[cheapestTravel.id]||[]),'💸 Cheapest Travel'];
 if(cheapestWeekend)out[cheapestWeekend.id]=[...(out[cheapestWeekend.id]||[]),'🪙 Cheapest Weekend'];
 if(bestValue)out[bestValue.id]=[...(out[bestValue.id]||[]),'🏆 Best Value'];
 if(best48)out[best48.id]=[...(out[best48.id]||[]),'⏱ Best 48h'];
 if(easiest)out[easiest.id]=[...(out[easiest.id]||[]),'🚄 Easiest'];
 return out;
}
function css(){const s=document.createElement('style');s.textContent=`
.shortlist-wrap{margin:24px 0 34px}.shortlist-head{display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap;margin-bottom:14px}.shortlist-head h2{font:900 34px Georgia,serif;margin:0}.shortlist-head p{margin:4px 0 0;max-width:760px;color:#6d655a}.shortlist-legend{font-size:11px;background:#fff4d8;border:1px solid #e1c573;padding:8px 10px}.shortlist-table{overflow:auto;border:1px solid #d8ccb8;background:#fff}.shortlist-table table{width:100%;border-collapse:collapse;min-width:1080px}.shortlist-table th{background:#173f32;color:#fff;text-align:left;padding:10px;font-size:11px}.shortlist-table td{padding:11px 10px;border-bottom:1px solid #eee4d7;vertical-align:top;font-size:12px}.shortlist-table tr:last-child td{border-bottom:0}.sl-city{font:900 18px Georgia,serif;color:#173f32;white-space:nowrap}.sl-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.sl-badge{font-size:9px;font-weight:950;background:#fff0b7;padding:4px 6px}.sl-live{font-weight:950;color:#173f32}.sl-est{color:#806f58}.sl-warn{color:#9a4c2d;font-weight:850}.sl-total{font-weight:950;font-size:14px}.sl-note{max-width:240px;color:#6d655a;line-height:1.4}.shortlist-foot{font-size:10px;color:#766c5f;margin-top:8px;line-height:1.45}
`;document.head.appendChild(s)}
function render(rows){const badges=award(rows);return `<div class="w shortlist-wrap"><div class="shortlist-head"><div><div class="script">La sélection pour ce soir</div><h2>12 villes, toutes les données séparées</h2><p>Le prix du trajet n’est plus confondu avec le coût du séjour. On compare le transport, le budget sur place, le total réaliste, le temps utile et la simplicité.</p></div><div class="shortlist-legend">LIVE = prix direct remonté par le radar · EST. = estimation non live · « à vérifier » = on n’invente rien</div></div><div class="shortlist-table"><table><thead><tr><th>Ville</th><th>Accès</th><th>Transport A/R</th><th>Budget sur place</th><th>Total réaliste</th><th>Temps utile</th><th>Ambiance</th><th>Lecture rapide</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="sl-city">${x.flag} ${x.name}</div><div class="sl-badges">${(badges[x.id]||[]).map(b=>`<span class="sl-badge">${b}</span>`).join('')}</div></td><td><b>${x.mode}</b>${x.duration?`<div>${x.duration}</div>`:''}${x.live?.route?`<div class="sl-est">${x.live.route}</div>`:''}</td><td>${x.transport?`<span class="${x.transport.kind==='live'?'sl-live':'sl-est'}">${x.transport.label}</span><div>${x.transport.kind==='live'?'LIVE direct':'EST. non live'}</div>`:'<span class="sl-warn">À vérifier</span>'}</td><td><b>${range(x.place)}</b><div class="sl-est">2 nuits + repas + bars + local + activités</div></td><td>${x.total?`<span class="sl-total">${range(x.total)}</span>`:'<span class="sl-warn">Transport à ajouter</span>'}</td><td>${x.live?.useful!=null?`<b>≈ ${Math.round(x.live.useful)} h</b>`:'—'}</td><td>${x.vibe}</td><td class="sl-note">${x.note}</td></tr>`).join('')}</tbody></table></div><div class="shortlist-foot">Les budgets sur place sont des enveloppes de sélection, pas des devis. Les vols sont uniquement directs. Les lignes train sont centre-centre ; leur tarif exact du 23 au 25 octobre doit encore être verrouillé avant réservation. Les badges se recalculent automatiquement à partir des données disponibles.</div></div>`}
async function run(){css();let data={};try{const r=await fetch(`flights-live.json?ts=${Date.now()}`,{cache:'no-store'});if(r.ok)data=await r.json()}catch(e){}const rows=enrich(data);const section=document.createElement('section');section.id='shortlist';section.innerHTML=render(rows);const anchor=document.querySelector('#destinations');if(anchor)anchor.parentNode.insertBefore(section,anchor)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,70));else setTimeout(run,70);
})();