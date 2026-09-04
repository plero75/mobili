(()=>{
const PARTICIPANTS=['Benjamin Potey','Damien Prigent','Francois Enouf','Gabriel Jamet','Guillaume','Loic Anne','Nicolas Richard','Judeau Pascal','Papy fontaine','Tintin','Vincent Jobert'];
const VOTE_TARGET=6;
const SNAPSHOT_URL='flights-live.json';
const REFRESH_URL='https://github.com/plero75/mobili/actions/workflows/update-trip-flights.yml';
const DESTINATION_VISUALS={
  krakow:{src:'images/destinations/krakow.jpg',alt:'Vue sur le centre historique de Cracovie',focus:'center 58%',source:'https://commons.wikimedia.org/wiki/File:Krakow_2024_105_Old_Town_Hall_Tower_View.jpg'},
  dublin:{src:'images/destinations/dublin.jpg',alt:'La Liffey et la skyline de Dublin',focus:'center 54%',source:'https://commons.wikimedia.org/wiki/File:Dublin_skyline_and_River_Liffey_from_ferry_arriving_at_Dublin_Port_-_geograph.org.uk_-_5167299.jpg'},
  bologna:{src:'images/destinations/bologna.jpg',alt:'Plusieurs vues emblématiques de Bologne',focus:'center 50%',source:'https://commons.wikimedia.org/wiki/File:Collage_Bologna.jpg'},
  tirana:{src:'images/destinations/tirana.jpg',alt:'La place Skanderbeg à Tirana',focus:'center 52%',source:'https://commons.wikimedia.org/wiki/File:Tirana_-_Skanderbeg_Square_(Sheshi_Sk%C3%ABnderbej)_-_by_Pudelek.jpg'},
  prague:{src:'images/destinations/prague.jpg',alt:'Le pont Charles et les toits de Prague',focus:'center 46%',source:'https://commons.wikimedia.org/wiki/File:Praha_1,_Karl%C5%AFv_most_20170810_014.jpg'},
  vienna:{src:'images/destinations/vienna.jpg',alt:'La cathédrale Saint-Étienne à Vienne',focus:'center 52%',source:'https://commons.wikimedia.org/wiki/File:Stephansdom-Vienna-Austria.jpg'},
  rotterdam:{src:'images/destinations/rotterdam.jpg',alt:'La skyline de Rotterdam avec le pont Érasme',focus:'center 50%',source:'https://commons.wikimedia.org/wiki/File:Rotterdam-Skyline.jpg'},
  london:{src:'images/destinations/london.jpg',alt:'La skyline de Londres et Westminster',focus:'center 48%',source:'https://commons.wikimedia.org/wiki/File:London_Skyline_(125508655).jpeg'}
};

const SHORTLIST=[
  {id:'krakow',flag:'🇵🇱',name:'Cracovie',label:'La meilleure affaire complète',mode:'flight',duration:'≈ 2 h 10 en vol direct',simplicity:7,logistics:'Direct, mais Beauvais peut ajouter navette et marge.',onSite:[255,305],breakdown:[['2 nuits',105,125],['Repas',75,85],['Bars',45,55],['Transports locaux',10,15],['Activités',20,25]],summary:'Kazimierz, pierogi, bars en caves et un niveau de prix qui reste doux une fois les sacs posés.',highlights:['Kazimierz + Plac Nowy','Stary Kleparz et cuisine locale','Wawel ou Wieliczka','Bars en caves sans planning militaire'],plus:'Le meilleur ratio coût total, ambiance et dépaysement.',minus:'Beauvais et la foire du livre peuvent rogner l’avantage.',scores:['Fête 8/10','Bouffe 8/10','Dépaysement 8/10','Logistique 7/10'],booking:'https://www.google.com/travel/flights?q=Flights%20from%20Paris%20to%20Krakow%20on%202026-10-23%20returning%202026-10-25&hl=fr&gl=FR&curr=EUR',legacy:'krakow.html?v=phase1'},
  {id:'dublin',flag:'🇮🇪',name:'Dublin',label:'Le maximum de week-end',mode:'flight',duration:'≈ 1 h 40 en vol direct',simplicity:7,logistics:'Beaucoup de directs ; transfert et marathon à anticiper.',onSite:[350,430],breakdown:[['2 nuits',170,210],['Repas',85,100],['Bars',60,75],['Transports locaux',15,20],['Activités',20,25]],summary:'Pubs, musique trad et quartiers vivants : l’ambiance démarre dès la sortie de l’hôtel.',highlights:['Stoneybatter + The Cobblestone','Guinness ou Teeling','George’s Street Arcade','Howth si les horaires le permettent'],plus:'Le snapshot actuel protège vendredi et dimanche.',minus:'Le logement est cher et le marathon complique le retour.',scores:['Fête 9/10','Bouffe 7/10','Dépaysement 7/10','Logistique 7/10'],booking:'https://www.google.com/travel/flights?q=Flights%20from%20Paris%20to%20Dublin%20on%202026-10-23%20returning%202026-10-25&hl=fr&gl=FR&curr=EUR',legacy:'dublin.html?v=phase1'},
  {id:'bologna',flag:'🇮🇹',name:'Bologne',label:'L’outsider gourmand',mode:'flight',duration:'≈ 1 h 40 en vol direct',simplicity:8,logistics:'Ville compacte et transfert aéroport court.',onSite:[285,335],breakdown:[['2 nuits',130,150],['Repas',80,90],['Bars',45,55],['Transports locaux',10,15],['Activités',20,25]],summary:'Portiques, trattorias et centre compact : beaucoup de week-end pour peu de logistique.',highlights:['Quadrilatero et marchés','Trattoria longue durée','Portiques jusqu’à San Luca','Bars autour de Via del Pratello'],plus:'Une expérience très forte malgré un budget total contenu.',minus:'Le meilleur direct actuel passe par Beauvais.',scores:['Fête 8/10','Bouffe 10/10','Dépaysement 7/10','Logistique 8/10'],booking:'https://www.google.com/travel/flights?q=Flights%20from%20Paris%20to%20Bologna%20on%202026-10-23%20returning%202026-10-25&hl=fr&gl=FR&curr=EUR'},
  {id:'tirana',flag:'🇦🇱',name:'Tirana',label:'La vraie carte différente',mode:'flight',duration:'≈ 2 h 30–3 h en direct',simplicity:7,logistics:'Directs possibles ; horaires et tarif 23→25 à confirmer.',onSite:[210,260],breakdown:[['2 nuits',90,110],['Repas',60,70],['Bars',35,45],['Transports locaux',10,15],['Activités',15,20]],summary:'Blloku, cafés, cuisine albanaise et vrai changement d’univers sans exploser le budget local.',highlights:['Blloku le soir','Bunk’Art ou House of Leaves','Marché Pazari i Ri','Mont Dajti si le timing tient'],plus:'Le budget sur place le plus bas de la shortlist.',minus:'Sans snapshot direct complet, le total reste à vérifier.',scores:['Fête 8/10','Bouffe 8/10','Dépaysement 10/10','Logistique 7/10'],booking:'https://www.google.com/travel/flights?q=Flights%20from%20Paris%20to%20Tirana%20on%202026-10-23%20returning%202026-10-25&hl=fr&gl=FR&curr=EUR'},
  {id:'prague',flag:'🇨🇿',name:'Prague',label:'La grosse valeur sûre',mode:'flight',duration:'≈ 1 h 45 en vol direct',simplicity:8,logistics:'Direct et réseau local simple ; centre très dense.',onSite:[260,310],breakdown:[['2 nuits',110,130],['Repas',70,80],['Bars',45,55],['Transports locaux',10,15],['Activités',25,30]],summary:'Vieille ville, bière, architecture et nightlife : très facile à vendre à un groupe de six.',highlights:['Malá Strana tôt le matin','Brasseries tchèques','Letná et les quais','Une soirée Žižkov ou Vinohrady'],plus:'Près de 49 h utiles dans le snapshot disponible.',minus:'Le billet direct actuel réduit fortement l’avantage local.',scores:['Fête 9/10','Bouffe 8/10','Dépaysement 8/10','Logistique 8/10'],booking:'https://www.google.com/travel/flights?q=Flights%20from%20Paris%20to%20Prague%20on%202026-10-23%20returning%202026-10-25&hl=fr&gl=FR&curr=EUR'},
  {id:'vienna',flag:'🇦🇹',name:'Vienne',label:'La version plus chic',mode:'flight',duration:'≈ 2 h en vol direct',simplicity:8,logistics:'Aéroport et transports efficaces ; tarif 23→25 à confirmer.',onSite:[315,370],breakdown:[['2 nuits',145,170],['Repas',90,100],['Bars',45,55],['Transports locaux',15,20],['Activités',20,25]],summary:'Cafés, grandes brasseries, architecture et transports impeccables pour un week-end dense.',highlights:['Naschmarkt','Cafés historiques','Prater ou canal du Danube','Grande brasserie viennoise'],plus:'Une expérience complète et très simple à organiser.',minus:'Le budget local est plus élevé et le vol manque encore.',scores:['Fête 7/10','Bouffe 8/10','Dépaysement 7/10','Logistique 8/10'],booking:'https://www.google.com/travel/flights?q=Flights%20from%20Paris%20to%20Vienna%20on%202026-10-23%20returning%202026-10-25&hl=fr&gl=FR&curr=EUR'},
  {id:'rotterdam',flag:'🇳🇱',name:'Rotterdam',label:'Zéro galère',mode:'train',duration:'≈ 2 h 37 en Eurostar direct',simplicity:10,logistics:'Paris-Nord → centre, sans aéroport ni transfert.',onSite:[330,385],breakdown:[['2 nuits',155,180],['Repas',90,100],['Bars',50,60],['Transports locaux',15,20],['Activités',20,25]],summary:'Architecture, food halls, bars et arrivée centre-centre : la candidate la plus facile à exécuter.',highlights:['Markthal et Oude Haven','Witte de Withstraat','Architecture du port','Katendrecht et Fenix'],plus:'La simplicité centre-centre gagne des heures et de l’énergie.',minus:'Le prix réel des trains et des hôtels doit être verrouillé.',scores:['Fête 8/10','Bouffe 8/10','Dépaysement 6/10','Logistique 10/10'],booking:'https://www.eurostar.com/fr-fr/train/paris-rotterdam'},
  {id:'london',flag:'🇬🇧',name:'Londres',label:'La XXL en train',mode:'train',duration:'≈ 2 h 17 en Eurostar direct',simplicity:9,logistics:'Centre-centre, mais passeport, ETA et contrôle frontière.',onSite:[420,500],breakdown:[['2 nuits',220,260],['Repas',100,115],['Bars',55,65],['Transports locaux',20,25],['Activités',25,35]],summary:'Un choix immense de quartiers, restos, pubs et sorties avec le trajet le plus court sur le papier.',highlights:['Un quartier plutôt qu’une checklist','Pub + live music','Marché gourmand','Retour tardif depuis St Pancras'],plus:'Le train rend les 48 h réellement exploitables.',minus:'Le séjour le plus cher, avant même de connaître le train.',scores:['Fête 10/10','Bouffe 9/10','Dépaysement 6/10','Logistique 9/10'],booking:'https://www.eurostar.com/fr-fr/train/paris-londres'}
];

const RADAR=[
  {id:'liverpool',flag:'🇬🇧',name:'Liverpool',mode:'flight',onSite:[295,445],note:'Direct vérifié, mais le transport actuel est trop cher pour la shortlist.'},
  {id:'valencia',flag:'🇪🇸',name:'Valence',mode:'flight',onSite:[270,385],note:'Bon temps utile ; le total n’est plus une option cheap.'},
  {id:'belgrade',flag:'🇷🇸',name:'Belgrade',mode:'flight',onSite:[203,310],note:'Vie locale accessible, mais le vol direct pèse lourd.'},
  {id:'sarajevo',flag:'🇧🇦',name:'Sarajevo',mode:'flight',onSite:[178,280],note:'Aller séduisant, retour direct du dimanche non confirmé.'},
  {id:'amsterdam',flag:'🇳🇱',name:'Amsterdam',mode:'train',onSite:[375,545],note:'Très simple en train, rarement économique à onze.'},
  {id:'porto',flag:'🇵🇹',name:'Porto',mode:'flight',onSite:[200,280],note:'Bon budget local, mais le snapshot actuel mange le vendredi.'},
  {id:'budapest',flag:'🇭🇺',name:'Budapest',mode:'flight',onSite:[185,265],note:'Très bon séjour sur place ; billet direct à surveiller.'},
  {id:'naples',flag:'🇮🇹',name:'Naples',mode:'flight',onSite:[215,305],note:'Expérience très forte, total actuel au-dessus de Bologne.'},
  {id:'lisbon',flag:'🇵🇹',name:'Lisbonne',mode:'flight',onSite:[245,355],note:'Valeur sûre, mais ni trajet ni séjour vraiment bon marché.'},
  {id:'malaga',flag:'🇪🇸',name:'Málaga',mode:'flight',onSite:[215,305],note:'Billet bas, mais seulement ~36 h utiles dans le snapshot.'},
  {id:'alicante',flag:'🇪🇸',name:'Alicante',mode:'flight',onSite:[205,285],note:'Équilibre correct et environ 50 h utiles.'},
  {id:'seville',flag:'🇪🇸',name:'Séville',mode:'flight',onSite:[225,315],note:'Très belle option, mais total actuel élevé.'},
  {id:'bucharest',flag:'🇷🇴',name:'Bucarest',mode:'flight',onSite:[180,260],note:'Budget local prometteur ; transport direct à vérifier.'},
  {id:'munich',flag:'🇩🇪',name:'Munich',mode:'flight',onSite:[300,420],note:'Brasseries oui, Oktoberfest non sur ce week-end.'},
  {id:'milan',flag:'🇮🇹',name:'Milan',mode:'flight',onSite:[300,420],note:'Beaucoup de directs ; prix du 23→25 à vérifier.'},
  {id:'bilbao',flag:'🇪🇸',name:'Bilbao',mode:'flight',onSite:[250,340],note:'Compacte et excellente côté bouffe ; direct à vérifier.'},
  {id:'turin',flag:'🇮🇹',name:'Turin',mode:'train',onSite:[240,330],note:'Alternative italienne ; trajet réellement exploitable à vérifier.'}
];

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
const fmtMoney=value=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);
const fmtRange=range=>`${fmtMoney(range[0])}–${fmtMoney(range[1])}`;
const fmtHours=value=>{if(value==null)return'À vérifier';const hours=Math.floor(value),minutes=Math.round((value-hours)*60);return `${hours} h${minutes?` ${String(minutes).padStart(2,'0')}`:''}`};
const hhmm=value=>value?String(value).slice(11,16):'—';
const typeLabel=city=>city.mode==='train'?'Train A/R direct':'Vols A/R directs';
const mid=range=>(range[0]+range[1])/2;
let snapshot=null;
let current=localStorage.getItem('petitschats-name')||'';
let serverVotes=[];
let ideas=JSON.parse(localStorage.getItem('petitschats-ideas')||'[]');

function liveOption(id){
  const main=snapshot?.cities?.[id];
  const option=main?.options?.find(item=>item.kind==='recommended')||main?.options?.[0];
  if(option&&option.totalStops===0)return {...option,stale:Boolean(main.stale),source:'main'};
  const deal=snapshot?.dealScout?.candidates?.find(item=>item.id===id);
  if(deal?.flightPrice!=null)return {price:Number(deal.flightPrice),usefulHours:Number(deal.usefulHours),outbound:deal.outbound,return:deal.return,centerArrival:deal.centerArrival,leaveCenter:deal.leaveCenter,totalStops:0,stale:Boolean(snapshot?.dealScout?.stale),source:'radar'};
  return null;
}

function cityMetrics(city){const live=liveOption(city.id),transport=live?.price??null;return {city,live,transport,total:transport==null?null:[Math.round(transport+city.onSite[0]),Math.round(transport+city.onSite[1])],usefulHours:live?.usefulHours??null}}

function awardPicks(){
  const metrics=SHORTLIST.map(cityMetrics),verified=metrics.filter(item=>item.transport!=null);
  const cheapestTravel=[...verified].sort((a,b)=>a.transport-b.transport)[0];
  const cheapestWeekend=[...verified].sort((a,b)=>mid(a.total)-mid(b.total))[0];
  const best48=[...verified].filter(item=>item.usefulHours!=null).sort((a,b)=>b.usefulHours-a.usefulHours)[0];
  const easiest=[...metrics].sort((a,b)=>b.city.simplicity-a.city.simplicity)[0];
  const bologna=verified.find(item=>item.city.id==='bologna');
  const bestValue=bologna||[...verified].sort((a,b)=>(mid(a.total)/(a.city.simplicity+6))-(mid(b.total)/(b.city.simplicity+6)))[0];
  return [
    {key:'cheapest-travel',label:'Cheapest Travel',icon:'💸',pick:cheapestTravel,why:'Le transport direct vérifié le moins cher, sans prétendre que le séjour l’est aussi.'},
    {key:'cheapest-weekend',label:'Cheapest Weekend',icon:'🪙',pick:cheapestWeekend,why:'Le total trajet + budget sur place estimé le plus bas parmi les prix vérifiés.'},
    {key:'best-value',label:'Best Value',icon:'🏆',pick:bestValue,why:'Le meilleur équilibre actuel entre coût total, expérience et ville compacte.'},
    {key:'best-48h',label:'Best 48h',icon:'⏱️',pick:best48,why:'Le plus de temps réellement utilisable avec les horaires directs vérifiés.'},
    {key:'easiest',label:'Easiest',icon:'🚄',pick:easiest,why:'Le trajet le plus simple depuis Paris, centre à centre et sans aéroport.'}
  ];
}

function badgesFor(id){return awardPicks().filter(award=>award.pick?.city.id===id)}
function routeHtml({city,live}){if(!live)return `<div class="route-copy"><b>${esc(city.duration)}</b><span>${esc(city.logistics)}</span><strong class="verify">Horaires et prix : à vérifier</strong></div>`;const out=live.outbound||{},back=live.return||{};return `<div class="route-copy"><b>Ven. ${esc(out.from)} ${hhmm(out.departure)} → ${esc(out.to)} ${hhmm(out.arrival)} · ${esc(out.carrier||'Compagnie')}</b><span>Dim. ${esc(back.from)} ${hhmm(back.departure)} → ${esc(back.to)} ${hhmm(back.arrival)} · ${esc(back.carrier||'Compagnie')}</span><strong>Centre ven. ${hhmm(live.centerArrival)} · quitter le centre dim. ${hhmm(live.leaveCenter)}</strong></div>`}
function budgetRows(city){const icons={'2 nuits':'🛏️','Repas':'🍽️','Bars':'🍻','Transports locaux':'🚌','Activités':'🎟️'};return city.breakdown.map(([label,minValue,maxValue])=>`<tr><td><span class="budget-icon" aria-hidden="true">${icons[label]||'•'}</span>${esc(label)}</td><td>${fmtRange([minValue,maxValue])}</td></tr>`).join('')}

function cityCard(city){
  const metrics=cityMetrics(city),badges=badgesFor(city.id),transport=metrics.transport==null?'À vérifier':`${fmtMoney(metrics.transport)}*`,total=metrics.total?fmtRange(metrics.total):`À vérifier + ${fmtRange(city.onSite)}`,visual=DESTINATION_VISUALS[city.id];
  return `<article class="selection-card" id="fiche-${city.id}" data-city="${city.id}">
    <figure class="destination-visual">
      <img src="${visual.src}" alt="${esc(visual.alt)}" loading="lazy" referrerpolicy="no-referrer" style="object-position:${visual.focus}" onerror="this.closest('figure').classList.add('photo-missing')">
      <figcaption><span>${city.flag} Fiche destination</span><h3>${esc(city.name)}</h3><small>${city.mode==='train'?'🚄 Train direct':'✈️ Vol direct uniquement'}</small></figcaption><a class="photo-source" href="${visual.source}" target="_blank" rel="noopener" aria-label="Source de la photo de ${esc(city.name)}">Photo Wikimedia ↗</a>
    </figure>
    <header class="selection-card-head"><div><span class="city-label">${esc(city.label)}</span></div><div class="card-badges">${badges.map(item=>`<span>${item.icon} ${item.label}</span>`).join('')}</div></header>
    <p class="selection-summary">${esc(city.summary)}</p>
    <div class="decision-metrics">
      <div><small>${city.mode==='train'?'🚄':'✈️'} ${typeLabel(city)}</small><b class="${metrics.transport==null?'verify':''}">${transport}</b></div>
      <div><small>🧾 Budget sur place</small><b>${fmtRange(city.onSite)}</b></div>
      <div><small>💰 Total réaliste</small><b class="${metrics.total?'':'verify'}">${total}</b></div>
      <div><small>⏱️ Temps utile</small><b class="${metrics.usefulHours==null?'verify':''}">${fmtHours(metrics.usefulHours)}</b></div>
      <div><small>🧭 Simplicité / logistique</small><b>${city.simplicity}/10</b><span class="simplicity-track"><i style="width:${city.simplicity*10}%"></i></span><span>${esc(city.logistics)}</span></div>
    </div>
    <div class="route-panel"><div><small>🗺️ Le trajet qu’on compare</small>${routeHtml(metrics)}</div><a href="${city.booking}" target="_blank" rel="noopener">Vérifier ${city.mode==='train'?'le train':'les directs'} ↗</a></div>
    <div class="selection-detail"><div class="onsite-budget"><h4>🧾 Budget sur place · 2 nuits</h4><table>${budgetRows(city)}<tr class="total"><td>Total sur place</td><td>${fmtRange(city.onSite)}</td></tr></table></div><div class="weekend-plan"><h4>📍 Ce qu’on ferait vraiment</h4><div class="highlight-grid">${city.highlights.map((item,index)=>`<div class="hi"><b>${index+1}.</b> ${esc(item)}</div>`).join('')}</div><div class="plusminus"><div class="plus"><b>✨ Le +</b><br>${esc(city.plus)}</div><div class="minus"><b>⚠️ Le –</b><br>${esc(city.minus)}</div></div><div class="scores">${city.scores.map(score=>`<span class="score">${esc(score)}</span>`).join('')}</div></div></div>
    <footer class="card-footer"><div>${city.legacy?`<a href="${city.legacy}">Voir le carnet exploratoire →</a>`:''}</div><div class="actions"><button class="vote-btn" data-vote="${city.id}">❤️ Je vote ${esc(city.name)}</button><button class="idea-btn" data-idea="${city.id}">💡 Ajouter mon idée</button></div></footer><div class="ideas" id="ideas-${city.id}"></div>
  </article>`;
}

function renderCities(){$('#destinationJump').innerHTML=SHORTLIST.map(city=>`<a href="#fiche-${city.id}"><span>${city.flag}</span>${esc(city.name)}</a>`).join('');$('#cityList').innerHTML=SHORTLIST.map(cityCard).join('');document.querySelectorAll('[data-vote]').forEach(button=>button.onclick=()=>vote(button.dataset.vote));document.querySelectorAll('[data-idea]').forEach(button=>button.onclick=()=>openIdea(button.dataset.idea));renderIdeas();paintVotes()}

function renderAwards(){$('#awardGrid').innerHTML=awardPicks().map(award=>{const metrics=award.pick;if(!metrics)return `<article class="award-card"><span class="award-name">${award.icon} ${award.label}</span><h3>À vérifier</h3><p>${esc(award.why)}</p></article>`;const total=metrics.total?fmtRange(metrics.total):`À vérifier + ${fmtRange(metrics.city.onSite)}`;return `<article class="award-card award-${award.key}"><span class="award-name">${award.icon} ${award.label}</span><h3>${metrics.city.flag} ${esc(metrics.city.name)}</h3><div class="award-numbers"><span>Trajet <b>${metrics.transport==null?'À vérifier':fmtMoney(metrics.transport)}</b></span><span>Sur place <b>${fmtRange(metrics.city.onSite)}</b></span><span>Total <b>${total}</b></span></div><p>${esc(award.why)}</p></article>`}).join('')}

function renderComparison(){$('#compareBody').innerHTML=SHORTLIST.map(city=>{const metrics=cityMetrics(city),badges=badgesFor(city.id);return `<tr><td><b>${city.flag} ${esc(city.name)}</b><small>${esc(city.label)}</small></td><td class="price ${metrics.transport==null?'verify':''}">${metrics.transport==null?'À vérifier':`${fmtMoney(metrics.transport)}*`}<small>${typeLabel(city)}</small></td><td class="price">${fmtRange(city.onSite)}<small>2 nuits + vie locale</small></td><td class="price ${metrics.total?'':'verify'}">${metrics.total?fmtRange(metrics.total):'À vérifier'}<small>${metrics.total?'transport inclus':'transport manquant'}</small></td><td>${fmtHours(metrics.usefulHours)}</td><td><b>${city.simplicity}/10</b><small>${esc(city.logistics)}</small></td><td><div class="table-badges">${badges.map(item=>`<span>${item.icon} ${item.label}</span>`).join('')||'—'}</div></td><td><a class="book-link" href="${city.booking}" target="_blank" rel="noopener">Vérifier ↗</a></td></tr>`}).join('')}

function renderRadar(){const rows=RADAR.map(cityMetrics).sort((a,b)=>{if(a.total&&b.total)return mid(a.total)-mid(b.total);if(a.total)return -1;if(b.total)return 1;return a.city.name.localeCompare(b.city.name,'fr')});$('#radarBody').innerHTML=rows.map(({city,transport,total,usefulHours})=>`<tr><td><b>${city.flag} ${esc(city.name)}</b></td><td class="${transport==null?'verify':''}">${transport==null?'À vérifier':`${fmtMoney(transport)}*`}<small>${typeLabel(city)}</small></td><td>${fmtRange(city.onSite)}</td><td class="${total?'':'verify'}">${total?fmtRange(total):'À vérifier'}</td><td>${fmtHours(usefulHours)}</td><td>${esc(city.note)}</td></tr>`).join('')}

function renderSnapshotHead(){const verified=[...SHORTLIST,...RADAR].filter(city=>liveOption(city.id)).length;if(!snapshot){$('#snapshotHead').innerHTML='<b>Prix directs temporairement indisponibles.</b><span>Les budgets sur place restent visibles et les transports manquants sont à vérifier.</span>';return}const when=snapshot.generatedAt?new Date(snapshot.generatedAt).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}):'date inconnue';$('#snapshotHead').innerHTML=`<div><b>Snapshot direct du ${when}</b><span>${verified} destinations avec un prix réutilisable · vols avec escale exclus.</span><small>* ${esc(snapshot.priceDisclaimer||'Tarifs à revérifier avant achat.')}</small></div><a href="${REFRESH_URL}" target="_blank" rel="noopener">↻ Actualiser maintenant</a>`}
function renderSelection(){renderAwards();renderCities();renderRadar();renderComparison();renderSnapshotHead()}
async function loadSnapshot(){try{const response=await fetch(`${SNAPSHOT_URL}?ts=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(data.directOnly!==true)throw new Error('Snapshot non direct-only');snapshot=data}catch(error){snapshot=null}renderSelection()}

function ensureName(){if(current)return true;$('#who').scrollIntoView({behavior:'smooth'});alert('Choisis d’abord ton prénom — sinon la démocratie devient vite compliquée.');return false}
async function vote(city){if(!ensureName())return;localStorage.setItem(`petitschats-destination-${current}`,city);try{await fetch('/api/votes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({participant:current,city,category:'destination',choiceId:'phase1-destination',vote:'oui'})})}catch(error){}await loadVotes();paintVotes()}
function localChoice(name){return localStorage.getItem(`petitschats-destination-${name}`)||''}
function choiceFor(name){const rows=serverVotes.filter(row=>row.participant===name&&row.category==='destination'&&row.choice_id==='phase1-destination'&&row.vote==='oui').sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at));return rows[0]?.city||localChoice(name)}
function paintVotes(){document.querySelectorAll('[data-vote]').forEach(button=>button.classList.toggle('on',choiceFor(current)===button.dataset.vote));renderPeople()}
async function loadVotes(){try{const response=await fetch('/api/votes?phase=1',{cache:'no-store'});const data=await response.json();if(data.ok)serverVotes=data.votes||[]}catch(error){}renderPeople()}
function renderPeople(){const done=PARTICIPANTS.filter(choiceFor);$('#people').innerHTML=PARTICIPANTS.map(person=>`<span class="person ${choiceFor(person)?'done':''}">${choiceFor(person)?'✓ ':''}${esc(person)}</span>`).join('');$('#progressBar').style.width=`${Math.min(100,done.length/VOTE_TARGET*100)}%`;$('#progressCopy').textContent=`${done.length} vote${done.length>1?'s':''} reçu${done.length>1?'s':''} · résultat révélé à ${VOTE_TARGET}`;const selected=SHORTLIST.find(city=>city.id===choiceFor(current));$('#voteStatus').innerHTML=current?(selected?`<b>${esc(current)}</b>, ton vote est enregistré : ${selected.flag} ${esc(selected.name)}. Tu peux encore changer.`:`<b>${esc(current)}</b>, à toi de choisir. Une ville. Pas huit « ça dépend ».`):'Choisis ton prénom pour voter.';if(done.length>=VOTE_TARGET)showWinner();else $('#winner').classList.add('hidden')}
function showWinner(){const counts={};PARTICIPANTS.forEach(person=>{const city=choiceFor(person);if(city)counts[city]=(counts[city]||0)+1});const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);if(!sorted.length)return;const max=sorted[0][1],winners=sorted.filter(item=>item[1]===max),city=SHORTLIST.find(item=>item.id===winners[0][0]);$('#winner').textContent=winners.length===1?`🏆 ${city?.name||winners[0][0]} arrive en tête avec ${max} vote${max>1?'s':''}.`:'⚖️ Égalité parfaite. Il va falloir inventer une constitution.';$('#winner').classList.remove('hidden')}

function openIdea(city){if(!ensureName())return;$('#ideaCity').value=city;$('#ideaTitle').value='';$('#ideaWhy').value='';$('#ideaLink').value='';$('#ideaModal').classList.remove('hidden');$('#ideaTitle').focus()}
function closeIdea(){$('#ideaModal').classList.add('hidden')}
async function saveIdea(){const city=$('#ideaCity').value,title=$('#ideaTitle').value.trim(),why=$('#ideaWhy').value.trim(),link=$('#ideaLink').value.trim();if(!title)return alert('Il faut au moins un nom.');const item={id:`i${Date.now()}`,city,title,why,link,by:current,hearts:[]};ideas.unshift(item);localStorage.setItem('petitschats-ideas',JSON.stringify(ideas));try{await fetch('/api/suggestions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)})}catch(error){}closeIdea();renderIdeas()}
async function loadIdeas(){try{const response=await fetch('/api/suggestions',{cache:'no-store'});const data=await response.json();if(data.ok&&data.suggestions?.length)ideas=data.suggestions}catch(error){}renderIdeas()}
function heartIdea(id){if(!ensureName())return;const idea=ideas.find(item=>String(item.id)===String(id));if(!idea)return;idea.hearts=Array.isArray(idea.hearts)?idea.hearts:[];idea.hearts=idea.hearts.includes(current)?idea.hearts.filter(name=>name!==current):[...idea.hearts,current];localStorage.setItem('petitschats-ideas',JSON.stringify(ideas));renderIdeas()}
function renderIdeas(){SHORTLIST.forEach(city=>{const box=$(`#ideas-${city.id}`);if(!box)return;const list=ideas.filter(item=>item.city===city.id);box.innerHTML=list.length?`<b>💡 Les idées des petits chats</b>${list.slice(0,6).map(item=>`<div class="idea"><div><b>${esc(item.title)}</b> <span>— ${esc(item.by)}</span>${item.why?`<br><small>${esc(item.why)}</small>`:''}${item.link?` <a href="${esc(item.link)}" target="_blank" rel="noopener">↗</a>`:''}</div><button data-heart="${esc(item.id)}">❤️ ${(item.hearts||[]).length}</button></div>`).join('')}`:''});document.querySelectorAll('[data-heart]').forEach(button=>button.onclick=()=>heartIdea(button.dataset.heart))}

function initNames(){const select=$('#whoSelect');select.innerHTML='<option value="">— Choisir mon prénom —</option>'+PARTICIPANTS.map(person=>`<option ${person===current?'selected':''}>${esc(person)}</option>`).join('');select.onchange=()=>{current=select.value;localStorage.setItem('petitschats-name',current);paintVotes()}}
function initRadarToggle(){const button=$('#radarToggle'),table=$('#radarTable');button.onclick=()=>{const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));table.hidden=expanded;button.textContent=expanded?'Afficher le radar':'Masquer le radar'}}
function initModal(){$('#cancelIdea').onclick=closeIdea;$('#saveIdea').onclick=saveIdea;$('#ideaModal').onclick=event=>{if(event.target.id==='ideaModal')closeIdea()}}

renderSelection();
initNames();
initRadarToggle();
initModal();
loadVotes();
loadIdeas();
loadSnapshot();
})();
