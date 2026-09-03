(()=>{
const TRANSPORT_CAP=200;
const SHORTLIST=[
{id:'krakow',name:'Cracovie',flag:'🇵🇱',mode:'✈️ direct',stay:{hotel:[105,125],food:[120,140],extras:[30,40]},vibe:'🍺 Kazimierz · pierogi · bars en cave',ease:8,note:'Très forte candidate budget + ambiance.'},
{id:'dublin',name:'Dublin',flag:'🇮🇪',mode:'✈️ direct',stay:{hotel:[170,210],food:[145,175],extras:[35,45]},vibe:'🍻 pubs · musique · gros week-end entre potes',ease:7,note:'Le billet peut être excellent ; le logement reste le poste qui tire le budget vers le haut.'},
{id:'bologna',name:'Bologne',flag:'🇮🇹',mode:'✈️ direct',stay:{hotel:[130,150],food:[125,145],extras:[30,40]},vibe:'🍝 bouffe · arcades · bars · ville compacte',ease:8,note:'Très bon équilibre prix, gastronomie et simplicité.'},
{id:'tirana',name:'Tirana',flag:'🇦🇱',mode:'✈️ direct',transportEstimate:[120,190],stay:{hotel:[90,110],food:[95,115],extras:[25,35]},vibe:'🌶️ dépaysante · très abordable · nightlife',ease:7,note:'Budget sur place bas. Le transport reste une estimation tant que le radar exact ne l’a pas confirmé.'},
{id:'prague',name:'Prague',flag:'🇨🇿',mode:'✈️ direct',stay:{hotel:[115,135],food:[115,135],extras:[30,40]},vibe:'🍺 bière · vieille ville · nightlife',ease:8,note:'Très bonne ville, mais elle disparaît de la sélection si le direct dépasse 200 €.'},
{id:'vienna',name:'Vienne',flag:'🇦🇹',mode:'✈️ direct',transportEstimate:[150,200],stay:{hotel:[145,170],food:[135,155],extras:[35,45]},vibe:'☕ cafés · brasseries · architecture · bars',ease:8,note:'Plus chère sur place, mais logistique simple et week-end très dense.'},
{id:'rotterdam',name:'Rotterdam',flag:'🇳🇱',mode:'🚄 train direct',transportEstimate:[100,180],duration:'≈ 2 h 37 centre-centre',stay:{hotel:[155,180],food:[140,160],extras:[35,45]},vibe:'🏙️ moderne · bars · food halls · zéro aéroport',ease:10,note:'Très simple depuis Paris. Prix exact du 23–25 à verrouiller.'},
{id:'london',name:'Londres',flag:'🇬🇧',mode:'🚄 train direct',transportEstimate:[250,320],duration:'≈ 2 h 17 centre-centre',stay:{hotel:[210,250],food:[170,200],extras:[40,50]},vibe:'🎸 pubs · quartiers · nightlife XXL',ease:10,note:'Excellente logistiquement, mais écartée ici car le trajet estimé dépasse le plafond de 200 €.'},
{id:'bucharest',name:'Bucarest',flag:'🇷🇴',mode:'✈️ direct',transportEstimate:[160,200],stay:{hotel:[95,115],food:[105,125],extras:[25,35]},vibe:'🍸 old town · bars · gros rapport qualité/prix',ease:7,note:'Très bon coût sur place ; à confirmer sous 200 € en direct sur les dates exactes.'},
{id:'munich',name:'Munich',flag:'🇩🇪',mode:'✈️ direct',transportEstimate:[170,200],stay:{hotel:[150,175],food:[140,160],extras:[35,45]},vibe:'🍺 brasseries · centre historique · bière',ease:8,note:'Pas d’Oktoberfest fin octobre ; reste une très bonne ville de week-end.'},
{id:'turin',name:'Turin',flag:'🇮🇹',mode:'🚄 train / ✈️ direct',transportEstimate:[150,200],duration:'train long mais centre-centre',stay:{hotel:[125,150],food:[120,140],extras:[30,40]},vibe:'🍷 aperitivo · cafés · Piémont',ease:7,note:'Intéressante seulement si une option propre reste sous 200 €.'},
{id:'amsterdam',name:'Amsterdam',flag:'🇳🇱',mode:'🚄 train direct',transportEstimate:[120,190],duration:'≈ 3 h 20 centre-centre',stay:{hotel:[180,215],food:[145,170],extras:[35,45]},vibe:'🚲 canaux · bars · quartiers · très simple',ease:10,note:'Ultra simple, mais hôtel plus cher pour un groupe de 11.'},
{id:'malaga',name:'Málaga',flag:'🇪🇸',mode:'✈️ direct',stay:{hotel:[120,145],food:[120,140],extras:[30,40]},vibe:'☀️ tapas · terrasses · mer',ease:7,note:'Billet souvent bon, mais horaires à surveiller car ils peuvent rogner fortement les 48 h.'},
{id:'alicante',name:'Alicante',flag:'🇪🇸',mode:'✈️ direct',stay:{hotel:[110,135],food:[115,135],extras:[30,40]},vibe:'🌴 simple · solaire · tapas',ease:7,note:'Bonne candidate si le direct reste sous 200 € et les horaires sont propres.'}
];
const fmt=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const range=r=>r?`${fmt(r[0])}–${fmt(r[1])}`:'À vérifier';
const hh=s=>s?String(s).slice(11,16):'—';
const addRanges=(...rs)=>[rs.reduce((s,r)=>s+r[0],0),rs.reduce((s,r)=>s+r[1],0)];
function pickFromLive(data,id){
  const c=data?.cities?.[id];
  const rec=c?.options?.find(x=>x.kind==='recommended')||c?.options?.[0];
  if(rec)return {price:rec.price,useful:rec.usefulHours,route:`${rec.outbound.from} ${hh(rec.outbound.departure)} → ${rec.outbound.to} ${hh(rec.outbound.arrival)} · retour ${rec.return.from} ${hh(rec.return.departure)} → ${rec.return.to} ${hh(rec.return.arrival)}`};
  const d=(data?.dealScout?.candidates||[]).find(x=>x.id===id);
  if(d)return {price:d.flightPrice,useful:d.usefulHours,route:`${d.outbound.from} ${hh(d.outbound.departure)} → ${d.outbound.to} ${hh(d.outbound.arrival)} · retour ${d.return.from} ${hh(d.return.departure)} → ${d.return.to} ${hh(d.return.arrival)}`};
  return null;
}
function enrich(data){return SHORTLIST.map(x=>{
  const live=pickFromLive(data,x.id);
  const tr=live?{min:live.price,max:live.price,label:fmt(live.price),kind:'live'}:(x.transportEstimate?{min:x.transportEstimate[0],max:x.transportEstimate[1],label:range(x.transportEstimate),kind:'estimate'}:null);
  const place=addRanges(x.stay.hotel,x.stay.food,x.stay.extras);
  const total=tr?[tr.min+place[0],tr.max+place[1]]:null;
  return {...x,live,transport:tr,place,total};
});}
function eligible(rows){return rows.filter(x=>x.transport&&x.transport.max<=TRANSPORT_CAP);}
function award(rows){
 const withTotal=rows.filter(x=>x.total);
 const cheapestTravel=[...rows].sort((a,b)=>a.transport.min-b.transport.min)[0]||null;
 const cheapestWeekend=[...withTotal].sort((a,b)=>a.total[0]-b.total[0])[0]||null;
 const best48=[...rows].filter(x=>x.live?.useful!=null).sort((a,b)=>b.live.useful-a.live.useful)[0]||null;
 const easiest=[...rows].sort((a,b)=>b.ease-a.ease)[0]||null;
 const bestValue=[...withTotal].map(x=>({...x,valueScore:(x.total[0]+x.total[1])/2+(10-x.ease)*15+Math.max(0,46-(x.live?.useful||46))*5})).sort((a,b)=>a.valueScore-b.valueScore)[0]||null;
 const out={};
 const put=(x,b)=>{if(x)out[x.id]=[...(out[x.id]||[]),b]};
 put(cheapestTravel,'💸 Cheapest Travel');put(cheapestWeekend,'🪙 Cheapest Weekend');put(bestValue,'🏆 Best Value');put(best48,'⏱ Best 48h');put(easiest,'🚄 Easiest');
 return out;
}
function css(){const s=document.createElement('style');s.textContent=`
.shortlist-wrap{margin:24px 0 34px}.shortlist-head{display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap;margin-bottom:14px}.shortlist-head h2{font:900 34px Georgia,serif;margin:0}.shortlist-head p{margin:4px 0 0;max-width:800px;color:#6d655a}.shortlist-legend{font-size:11px;background:#fff4d8;border:1px solid #e1c573;padding:8px 10px;max-width:420px}.shortlist-table{overflow:auto;border:1px solid #d8ccb8;background:#fff}.shortlist-table table{width:100%;border-collapse:collapse;min-width:1160px}.shortlist-table th{background:#173f32;color:#fff;text-align:left;padding:10px;font-size:11px}.shortlist-table td{padding:11px 10px;border-bottom:1px solid #eee4d7;vertical-align:top;font-size:12px}.shortlist-table tr:last-child td{border-bottom:0}.sl-city{font:900 18px Georgia,serif;color:#173f32;white-space:nowrap}.sl-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.sl-badge{font-size:9px;font-weight:950;background:#fff0b7;padding:4px 6px}.sl-live{font-weight:950;color:#173f32}.sl-est{color:#806f58}.sl-total{font-weight:950;font-size:14px}.sl-note{max-width:230px;color:#6d655a;line-height:1.4}.sl-break{font-size:10px;color:#766c5f;line-height:1.45;margin-top:4px}.shortlist-foot{font-size:10px;color:#766c5f;margin-top:8px;line-height:1.5}
`;document.head.appendChild(s)}
function render(rows,excluded){const badges=award(rows);return `<div class="w shortlist-wrap"><div class="shortlist-head"><div><div class="script">La sélection pour ce soir</div><h2>${rows.length} destinations sous 200 € de trajet</h2><p>Règle simple : si le transport A/R direct ou le train dépasse 200 €, la ville sort de cette sélection. Le budget sur place est maintenant construit poste par poste, avec une fourchette resserrée plutôt qu’un énorme « 300–600 € » inutilisable.</p></div><div class="shortlist-legend"><b>Hypothèse commune :</b> 2 nuits en chambre partagée / twin, 2 petits-déj, 2 déjeuners, 2 dîners, bars raisonnables, transports locaux et 1–2 activités. LIVE = prix remonté par le radar ; EST. = estimation à confirmer.</div></div><div class="shortlist-table"><table><thead><tr><th>Ville</th><th>Accès</th><th>Transport A/R</th><th>Hôtel 2 nuits</th><th>Repas + bars</th><th>Local + activités</th><th>Sur place</th><th>Total week-end</th><th>Temps utile</th><th>Lecture rapide</th></tr></thead><tbody>${rows.map(x=>`<tr><td><div class="sl-city">${x.flag} ${x.name}</div><div class="sl-badges">${(badges[x.id]||[]).map(b=>`<span class="sl-badge">${b}</span>`).join('')}</div></td><td><b>${x.mode}</b>${x.duration?`<div>${x.duration}</div>`:''}${x.live?.route?`<div class="sl-est">${x.live.route}</div>`:''}</td><td><span class="${x.transport.kind==='live'?'sl-live':'sl-est'}">${x.transport.label}</span><div>${x.transport.kind==='live'?'LIVE direct':'EST. à confirmer'}</div></td><td><b>${range(x.stay.hotel)}</b></td><td><b>${range(x.stay.food)}</b></td><td><b>${range(x.stay.extras)}</b></td><td><b>${range(x.place)}</b></td><td><span class="sl-total">${range(x.total)}</span></td><td>${x.live?.useful!=null?`<b>≈ ${Math.round(x.live.useful)} h</b>`:'—'}</td><td class="sl-note">${x.vibe}<div class="sl-break">${x.note}</div></td></tr>`).join('')}</tbody></table></div><div class="shortlist-foot">Plafond transport appliqué : <b>200 € A/R par personne</b>. ${excluded.length?`Écartées avec les données actuelles : ${excluded.map(x=>`${x.name} (${x.transport?x.transport.label:'prix inconnu'})`).join(', ')}.`:''} Les estimations de séjour servent à choisir une ville ce soir ; elles ne sont pas présentées comme des devis hôteliers live.</div></div>`}
async function run(){css();let data={};try{const r=await fetch(`flights-live.json?ts=${Date.now()}`,{cache:'no-store'});if(r.ok)data=await r.json()}catch(e){}const all=enrich(data);const rows=eligible(all);const excluded=all.filter(x=>!rows.includes(x));const section=document.createElement('section');section.id='shortlist';section.innerHTML=render(rows,excluded);const anchor=document.querySelector('#destinations');if(anchor)anchor.parentNode.insertBefore(section,anchor)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,70));else setTimeout(run,70);
})();