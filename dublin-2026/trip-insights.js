(()=>{
const BADGES={
  krakow:[['best','Best Value'],['cheap','Cheapest Travel']],
  dublin:[['time','Max Time in City'],['best','Best Deal']],
  brussels:[['easy','Easy Trip'],['fast','Fastest Route']],
  bologna:[['best','Best Deal']],
  tirana:[['cheap','Budget Pick']],
  barcelona:[['time','Max Time in City']],
  bucharest:[['long','Long Travel']],
  vilnius:[['long','Long Travel']],
  lisbon:[['best','Best Value']],
  porto:[['best','Best Deal']],
  mallorca:[['time','More Time There']],
  tallinn:[['long','Long Travel']],
  riga:[['long','Long Travel']],
  split:[['time','More Time There']],
  prague:[['best','Best Value']],
  vienna:[['easy','Easy Trip']],
  rotterdam:[['easy','Easy Trip'],['time','Max Time in City']],
  amsterdam:[['easy','Easy Trip'],['best','Best Deal']],
  london:[['fast','Fastest Route'],['time','Max Time in City']],
  turin:[['best','Best Value']]
};
const TRAINS={
  brussels:{label:'Paris-Nord → Bruxelles-Midi',url:'https://www.eurostar.com/fr-fr/train/paris-bruxelles',source:'Eurostar',note:'Centre à centre · direct · très peu de temps perdu en transfert.'},
  london:{label:'Paris-Nord → London St Pancras',url:'https://www.eurostar.com/fr-fr/train/paris-londres',source:'Eurostar',note:'Direct · arrivée en plein centre · contrôle tarif conseillé avant réservation.'},
  amsterdam:{label:'Paris-Nord → Amsterdam Centraal',url:'https://www.eurostar.com/fr-fr/train/paris-amsterdam',source:'Eurostar',note:'Centre à centre · direct selon horaire · excellent temps utile sur place.'},
  rotterdam:{label:'Paris-Nord → Rotterdam Centraal',url:'https://www.eurostar.com/fr-fr/train/paris-rotterdam',source:'Eurostar',note:'Direct selon horaire · zéro transfert aéroport.'},
  turin:{label:'Paris → Torino Porta Susa',url:'https://www.sncf-connect.com/',source:'SNCF Connect',note:'Comparer le train au vol : prix, durée totale et heure réelle d’arrivée en ville.'}
};
function cardFor(id){return document.getElementById(`fiche-${id}`)||document.querySelector(`[data-city="${id}"]`)||document.querySelector(`[data-destination="${id}"]`)}
function titleZone(card){return card.querySelector('.selection-title,.card-title,.current-title,.destination-title,h3')?.parentElement||card.querySelector('.selection-main,.current-main,.card-body')||card}
function addBadges(id,card){if(card.querySelector('.trip-badges'))return;const rows=BADGES[id];if(!rows?.length)return;const wrap=document.createElement('div');wrap.className='trip-badges';wrap.setAttribute('aria-label','Distinctions de cette destination');wrap.innerHTML=rows.map(([kind,label])=>`<span class="trip-badge trip-badge--${kind}">${label}</span>`).join('');titleZone(card).appendChild(wrap)}
function addTrainCheck(id,card){const cfg=TRAINS[id];if(!cfg||card.querySelector('.trip-check'))return;const host=card.querySelector('.selection-main,.current-main,.card-body,.destination-copy')||card;const el=document.createElement('div');el.className='trip-check';el.innerHTML=`<div class="trip-check__top"><div><div class="trip-check__title">🚆 Check billets de train</div><div class="trip-check__meta"><b>${cfg.label}</b><br>${cfg.note}<br>Tarif à revérifier pour le 23 → 25 octobre 2026.</div></div><a class="trip-check__link" href="${cfg.url}" target="_blank" rel="noopener">Voir sur ${cfg.source} ↗</a></div>`;host.appendChild(el)}
function addStayPreview(card){if(card.querySelector('.stay-preview'))return;const host=card.querySelector('.selection-main,.current-main,.card-body,.destination-copy')||card;const el=document.createElement('div');el.className='stay-preview';el.innerHTML='<b>🏡 Sélection hébergement — bientôt live</b><span>3 cartes prévues par ville : <strong>Best Value</strong>, <strong>Top Location</strong> et <strong>Coup de cœur</strong>. Aucun faux tarif n’est affiché tant qu’une source live n’est pas branchée.</span>';host.appendChild(el)}
function enhance(){Object.keys(BADGES).forEach(id=>{const card=cardFor(id);if(!card)return;addBadges(id,card);addTrainCheck(id,card);addStayPreview(card)})}
let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(enhance,80)};document.addEventListener('DOMContentLoaded',enhance);new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});setTimeout(enhance,500);setTimeout(enhance,1500)
})();