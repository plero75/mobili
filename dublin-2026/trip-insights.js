(()=>{
const BADGES={
  krakow:[['best','Best Value'],['cheap','Cheapest Travel']],
  dublin:[['time','Max Time in City'],['best','Best Deal']],
  brussels:[['easy','Easy Trip'],['fast','Fastest Route']],
  bologna:[['best','Best Deal'],['food','Food Lover']],
  tirana:[['cheap','Budget Pick'],['different','Most Different']],
  barcelona:[['time','Max Time in City'],['easy','Easy Trip']],
  bucharest:[['cheap','Budget Pick'],['long','Long Travel']],
  vilnius:[['different','Hidden Gem'],['long','Long Travel']],
  lisbon:[['best','Best Value'],['food','Food Lover']],
  porto:[['best','Best Deal'],['food','Food Lover']],
  mallorca:[['sun','Sun Escape'],['time','More Time There']],
  tallinn:[['different','Hidden Gem'],['long','Long Travel']],
  riga:[['different','Hidden Gem'],['long','Long Travel']],
  split:[['sun','Sea Escape'],['different','Most Different']],
  prague:[['best','Best Value'],['easy','Easy Trip']],
  vienna:[['easy','Easy Trip'],['style','City Break Chic']],
  rotterdam:[['easy','Easy Trip'],['time','Max Time in City']],
  amsterdam:[['easy','Easy Trip'],['best','Best Deal']],
  london:[['fast','Fastest Route'],['time','Max Time in City']],
  turin:[['best','Best Value'],['food','Food Lover']],
  bilbao:[['best','Best Value'],['time','Max Time in City']],
  milan:[['cheap','Cheapest Travel'],['best','Best Deal']],
  malaga:[['cheap','Cheapest Travel'],['sun','Sun Escape']],
  naples:[['best','Best Deal'],['food','Food Lover']],
  budapest:[['best','Best Value'],['night','Nightlife Pick']],
  liverpool:[['night','Nightlife Pick'],['music','Music City']],
  valencia:[['sun','Sun Escape'],['food','Food Lover']],
  belgrade:[['night','Nightlife Pick'],['different','Most Different']],
  sarajevo:[['different','Hidden Gem'],['cheap','Budget Pick']],
  alicante:[['sun','Sun Escape'],['cheap','Budget Pick']],
  seville:[['food','Food Lover'],['sun','Sun Escape']],
  munich:[['easy','Easy Trip'],['food','Food Lover']]
};

const TRAINS={
  brussels:{label:'Paris-Nord → Bruxelles-Midi',url:'https://www.eurostar.com/fr-fr/train/paris-bruxelles',source:'Eurostar',note:'Centre à centre · direct · très peu de temps perdu en transfert.'},
  london:{label:'Paris-Nord → London St Pancras',url:'https://www.eurostar.com/fr-fr/train/paris-londres',source:'Eurostar',note:'Direct · arrivée en plein centre · contrôle frontière à intégrer.'},
  amsterdam:{label:'Paris-Nord → Amsterdam Centraal',url:'https://www.eurostar.com/fr-fr/train/paris-amsterdam',source:'Eurostar',note:'Centre à centre · direct selon horaire · excellent temps utile sur place.'},
  rotterdam:{label:'Paris-Nord → Rotterdam Centraal',url:'https://www.eurostar.com/fr-fr/train/paris-rotterdam',source:'Eurostar',note:'Direct selon horaire · zéro transfert aéroport.'},
  turin:{label:'Paris → Torino Porta Susa',url:'https://www.sncf-connect.com/',source:'SNCF Connect',note:'Comparer le train au vol : prix, durée totale et heure réelle d’arrivée en ville.'}
};

const CITY_GUIDES={
  krakow:{areas:['Kazimierz — vivant, bars et restos','Stare Miasto — ultra central','Podgórze — plus calme, bon rapport qualité/prix'],food:'Pierogi, obwarzanek, bars à lait et cuisine polonaise moderne.',night:'Kazimierz puis bars en caves autour de la vieille ville.',must:'Wawel + Kazimierz ; Wieliczka seulement si le timing reste confortable.',watch:'Beauvais peut ajouter beaucoup de temps porte-à-porte.'},
  dublin:{areas:['Smithfield — pratique et vivant','Stoneybatter — pubs et vraie vie de quartier','Portobello — central sans être Temple Bar'],food:'Pubs avec vraie cuisine, seafood, brunchs et coffee shops.',night:'Stoneybatter, Camden Street ou George’s Street plutôt que Temple Bar toute la soirée.',must:'Une grosse soirée pub + une visite Guinness/Teeling + balade Liffey.',watch:'Logements chers et week-end marathon : réserver tôt.'},
  brussels:{areas:['Sainte-Catherine — central et gourmand','Saint-Gilles — plus local et animé','Marolles — brocante, cafés et caractère'],food:'Frites, croquettes, gueuze, chocolatiers et très bonnes tables.',night:'Saint-Gilles, Flagey et centre selon l’ambiance recherchée.',must:'Grand-Place tôt, Marolles, une brasserie et un dîner solide.',watch:'Le train est génial si le tarif A/R reste sous le plafond.'},
  bologna:{areas:['Centro Storico — tout à pied','Santo Stefano — joli et plus calme','Via del Pratello — parfait pour sortir'],food:'Tagliatelle al ragù, tortellini, mortadelle, marchés et trattorias.',night:'Via del Pratello et zone universitaire.',must:'Quadrilatero + grande trattoria + portiques + San Luca si météo correcte.',watch:'Le vol cheap peut impliquer Beauvais.'},
  tirana:{areas:['Blloku — le plus vivant','Pazari i Ri — marché et restos','Centre / Skanderbeg — ultra pratique'],food:'Byrek, grillades, cuisine albanaise et cafés très abordables.',night:'Blloku concentre bars, rooftops et clubs.',must:'Bunk’Art ou House of Leaves + Blloku + Pazari i Ri.',watch:'Transfert aéroport et horaires directs à surveiller.'},
  barcelona:{areas:['Gràcia — vivant et agréable','Sant Antoni — gourmand et central','El Born — très pratique mais plus touristique'],food:'Tapas, marchés, vermouth, cuisine catalane et seafood.',night:'Gràcia, Poble-sec, El Born selon le niveau de fête.',must:'Un marché + Montjuïc ou front de mer + longue soirée tapas.',watch:'Le logement peut faire exploser le budget total.'},
  bucharest:{areas:['Universitate — central','Calea Victoriei — pratique et élégant','Old Town — seulement si priorité à la fête'],food:'Cuisine roumaine, grands cafés, marchés et restaurants très abordables.',night:'Old Town pour la densité ; Control/Universitate pour une ambiance plus locale.',must:'Calea Victoriei + vieille ville + éventuellement Therme București.',watch:'Temps de transfert et horaire retour peuvent réduire le week-end utile.'},
  vilnius:{areas:['Old Town — compact et pratique','Užupis — bohème','Naujamiestis — bars et bonnes adresses'],food:'Cepelinai, cuisine balte moderne, marchés et coffee shops.',night:'Vilniaus gatvė, Naujamiestis et petites cours du centre.',must:'Vieille ville + Užupis + marché Halės.',watch:'Peu de directs : il faut protéger les bons horaires.'},
  lisbon:{areas:['Graça — superbe et vivant','Príncipe Real — central et agréable','Estrela — plus calme mais très bien placé'],food:'Petiscos, poissons, bifana, pâtisseries et marchés.',night:'Bairro Alto pour démarrer, puis Cais do Sodré ou Intendente.',must:'Miradouros + Alfama + grande soirée + un vrai dîner portugais.',watch:'Relief + hébergement : choisir le quartier compte beaucoup.'},
  porto:{areas:['Baixa — pratique','Cedofeita — restos et bars','Bonfim — plus local et souvent meilleur rapport qualité/prix'],food:'Francesinha, poissons, petiscos, caves et marchés.',night:'Galerias de Paris puis Cedofeita.',must:'Ribeira + Gaia + Bolhão + une grosse table.',watch:'Ville pentue : éviter un logement trop excentré.'},
  mallorca:{areas:['Santa Catalina — vivant','Old Town Palma — très pratique','Portixol — bord de mer'],food:'Tapas majorquines, poissons, ensaïmada et marchés.',night:'Santa Catalina puis Paseo Marítimo selon l’envie.',must:'Vieille ville de Palma + marché + front de mer.',watch:'Fin octobre : météo douce possible mais pas garantie plage.'},
  tallinn:{areas:['Old Town — magique et central','Kalamaja — local et créatif','Telliskivi — bars, food et design'],food:'Cuisine estonienne moderne, marchés, cafés nordiques.',night:'Telliskivi et Kalamaja.',must:'Toompea + vieille ville + Telliskivi.',watch:'Vols directs limités : les horaires font toute la différence.'},
  riga:{areas:['Old Riga — central','Centrs — art nouveau et restos','Miera iela — plus local'],food:'Marché central, cuisine lettone, boulangeries et bars à bières.',night:'Old Riga puis Miera iela pour quelque chose de plus local.',must:'Marché central + quartier Art nouveau + vieille ville.',watch:'Le direct peut être cher ou peu fréquent.'},
  split:{areas:['Old Town — immersion totale','Veli Varoš — joli et plus calme','Bačvice — plage et soirée'],food:'Poissons, grillades dalmates, marchés et konobas.',night:'Vieille ville puis Bačvice.',must:'Palais de Dioclétien + Riva + Marjan.',watch:'Vol très saisonnier fin octobre.'},
  prague:{areas:['Vinohrady — meilleur équilibre','Žižkov — bars et prix doux','Malá Strana — très beau mais plus touristique'],food:'Brasseries, cuisine tchèque, marchés et cafés.',night:'Žižkov, Vinohrady, Holešovice.',must:'Malá Strana tôt + Letná + une vraie brasserie.',watch:'Éviter de sacrifier tout le dimanche pour un billet moins cher.'},
  vienna:{areas:['Neubau — central et vivant','Wieden — pratique et joli','Leopoldstadt — bon rapport qualité/prix'],food:'Cafés, schnitzel, pâtisseries, Naschmarkt et cuisine moderne.',night:'Gürtel, Donaukanal, Neubau.',must:'Naschmarkt + café historique + Prater ou canal.',watch:'Budget sur place sensiblement plus élevé.'},
  rotterdam:{areas:['Centrum — ultra pratique','Witte de With — bars et restos','Katendrecht — food et architecture'],food:'Markthal, food halls, cuisines du monde et bonnes tables modernes.',night:'Witte de Withstraat et Katendrecht.',must:'Architecture + Oude Haven + Katendrecht/Fenix.',watch:'Le train doit être réservé au bon moment pour rester intéressant.'},
  london:{areas:['King’s Cross — efficacité maximale','Shoreditch — sortie et food','Southwark — central et agréable'],food:'Marchés, pubs, cuisines du monde et très bonnes tables.',night:'Soho, Shoreditch, Dalston selon le style.',must:'Un quartier bien choisi + pub + marché gourmand + live music.',watch:'Passeport + ETA + prix du logement.'},
  bilbao:{areas:['Casco Viejo — pintxos et ambiance','Abando — très central','Indautxu — restos et bars'],food:'Pintxos, txakoli, marchés et cuisine basque.',night:'Casco Viejo puis Indautxu.',must:'Guggenheim + Casco Viejo + tournée de pintxos.',watch:'Très bon temps utile : ne pas gâcher l’avantage avec un logement loin.'},
  milan:{areas:['Navigli — parfait pour l’aperitivo','Porta Venezia — vivant et central','Isola — plus local et design'],food:'Aperitivo, risotto, cotoletta et très bonnes adresses modernes.',night:'Navigli, Isola et Porta Venezia.',must:'Duomo tôt + Brera + gros aperitivo.',watch:'MXP peut ajouter 50–60 min de transfert.'},
  malaga:{areas:['Centro Histórico — tout à pied','Soho — arty et central','La Malagueta — mer'],food:'Espetos, tapas, marchés et poisson.',night:'Centro Histórico puis Muelle Uno.',must:'Alcazaba + marché Atarazanas + tapas + mer.',watch:'Le billet peut être très bas mais les horaires peuvent rogner fortement le dimanche.'},
  naples:{areas:['Centro Storico — immersion totale','Chiaia — plus chic et pratique','Materdei — local et bon rapport qualité/prix'],food:'Pizza, fritures, sfogliatella, espresso et trattorias.',night:'Centro Storico, Piazza Bellini puis Chiaia.',must:'Spaccanapoli + pizza + bord de mer + éventuellement Pompéi si horaires parfaits.',watch:'Ville intense : privilégier un logement central et simple d’accès.'},
  budapest:{areas:['District VII — nightlife','District V — central','District IX — plus local et food'],food:'Marchés, goulash, pâtisseries, cuisine hongroise moderne.',night:'Ruin bars du VII puis clubs ou bars du Danube.',must:'Bains + Danube + ruin bar + grand marché.',watch:'Le vol peut dépasser le plafond malgré un séjour peu cher.'},
  liverpool:{areas:['Ropewalks — sortie','Baltic Triangle — créatif','Georgian Quarter — joli et calme'],food:'Pubs, food halls et cuisine britannique moderne.',night:'Ropewalks et Baltic Triangle.',must:'Waterfront + musique live + pub crawl raisonnable.',watch:'Vol direct parfois cher pour un week-end court.'},
  valencia:{areas:['Ruzafa — meilleur quartier pour sortir','Ciutat Vella — central','Cabanyal — mer et caractère'],food:'Paella, marchés, tapas et horchata.',night:'Ruzafa puis El Carmen.',must:'Mercado Central + Turia + dîner paella.',watch:'Aéroport simple, mais vérifier les horaires directs du dimanche.'},
  belgrade:{areas:['Dorćol — cafés et restos','Stari Grad — central','Savamala — sortie'],food:'Grillades, burek, kafanas et très bon rapport qualité/prix.',night:'Dorćol, Cetinjska et clubs selon saison.',must:'Kalemegdan + kafana + soirée Cetinjska.',watch:'Temps de vol et transfert réduisent un peu l’efficacité.'},
  sarajevo:{areas:['Baščaršija — cœur historique','Marijin Dvor — pratique','Skenderija — central et vivant'],food:'Ćevapi, burek, café bosnien et pâtisseries.',night:'Baščaršija puis bars du centre.',must:'Baščaršija + Yellow Fortress + dîner bosnien.',watch:'Le retour direct du dimanche est le point critique.'},
  alicante:{areas:['Centro — pratique','Santa Cruz — charme','Postiguet — mer'],food:'Riz, tapas, poissons et marchés.',night:'Centro et Barrio.',must:'Château Santa Bárbara + marché + bord de mer.',watch:'Très dépendant des horaires low-cost.'},
  seville:{areas:['Alameda — sortie et restos','Santa Cruz — magnifique mais touristique','Triana — tapas et vraie vie locale'],food:'Tapas, jambon, marchés, cuisine andalouse.',night:'Alameda puis Triana.',must:'Alcázar + Triana + longue soirée tapas.',watch:'Si le vol direct est cher, l’excellent budget local ne compense plus.'},
  munich:{areas:['Maxvorstadt — central et vivant','Glockenbach — bars et restos','Haidhausen — joli et local'],food:'Brasseries, cuisine bavaroise, marchés et très bonnes tables.',night:'Glockenbach, Maxvorstadt et grandes brasseries.',must:'Viktualienmarkt + vieille ville + brasserie.',watch:'Budget sur place élevé ; Oktoberfest est terminé à ces dates.'},
  amsterdam:{areas:['De Pijp — meilleur équilibre','Jordaan — très joli','Oost — plus local et souvent plus abordable'],food:'Food halls, brunch, cuisine indonésienne et cafés bruns.',night:'De Pijp, Jordaan, Leidseplein selon le style.',must:'Canaux + marché + quartier choisi plutôt qu’une checklist.',watch:'Logement très cher ; le train doit rester compétitif.'},
  turin:{areas:['San Salvario — sortie et food','Quadrilatero Romano — central','Vanchiglia — local et vivant'],food:'Aperitivo, chocolat, cuisine piémontaise et marchés.',night:'San Salvario puis Quadrilatero.',must:'Marché Porta Palazzo + aperitivo + centre baroque.',watch:'Trajet train long : vérifier si le temps utile reste suffisant.'}
};

function cityIdFromCard(card){return card?.dataset?.openCity||card?.dataset?.radarCity||card?.dataset?.city||card?.id?.replace(/^fiche-/,'')||''}
function cardFor(id){return document.getElementById(`fiche-${id}`)||document.querySelector(`[data-city="${id}"]`)||document.querySelector(`[data-open-city="${id}"]`)||document.querySelector(`[data-radar-city="${id}"]`)}
function badgeHtml(id,card=false){const rows=BADGES[id]?.slice(0,2)||[];if(!rows.length)return'';return `<div class="trip-badges${card?' trip-badges--card':''}" aria-label="Distinctions de cette destination">${rows.map(([kind,label])=>`<span class="trip-badge trip-badge--${kind}">${label}</span>`).join('')}</div>`}
function addCardBadges(card){const id=cityIdFromCard(card);if(!id||card.querySelector('.trip-badges--card'))return;const html=badgeHtml(id,true);if(!html)return;const body=card.querySelector('.destination-card-body')||card;const status=body.querySelector('.destination-card-status');if(status)status.insertAdjacentHTML('afterend',html);else body.insertAdjacentHTML('afterbegin',html)}
function addDetailBadges(id,card){if(card.querySelector('.trip-badges:not(.trip-badges--card)'))return;const html=badgeHtml(id,false);if(!html)return;const head=card.querySelector('.selection-card-head')||card.querySelector('.route-panel')||card;head.insertAdjacentHTML('afterend',html)}
function addTrainCheck(id,card){const cfg=TRAINS[id];if(!cfg||card.querySelector('.trip-check'))return;const host=card.querySelector('.route-panel')?.parentElement||card;const el=document.createElement('div');el.className='trip-check';el.innerHTML=`<div class="trip-check__top"><div><div class="trip-check__title">🚆 Check billets de train</div><div class="trip-check__meta"><b>${cfg.label}</b><br>${cfg.note}<br>Tarif A/R à revérifier pour le 23 → 25 octobre 2026.</div></div><a class="trip-check__link" href="${cfg.url}" target="_blank" rel="noopener">Voir sur ${cfg.source} ↗</a></div>`;host.appendChild(el)}
function guideHtml(id){const g=CITY_GUIDES[id];if(!g)return'';return `<section class="city-guide"><div class="city-guide__head"><span>Le mini-guide utile</span><h4>📍 Où dormir, manger et sortir</h4></div><div class="city-guide__grid"><div class="city-guide__block city-guide__block--wide"><small>🏡 Les quartiers à viser</small><div class="area-pills">${g.areas.map(x=>`<span>${x}</span>`).join('')}</div></div><div class="city-guide__block"><small>🍽️ À manger</small><p>${g.food}</p></div><div class="city-guide__block"><small>🍸 Pour sortir</small><p>${g.night}</p></div><div class="city-guide__block"><small>⭐ Le programme signature</small><p>${g.must}</p></div><div class="city-guide__block city-guide__block--watch"><small>👀 À surveiller</small><p>${g.watch}</p></div></div></section>`}
function addGuide(id,card){if(card.querySelector('.city-guide'))return;const html=guideHtml(id);if(!html)return;const footer=card.querySelector('.card-footer');if(footer)footer.insertAdjacentHTML('beforebegin',html);else card.insertAdjacentHTML('beforeend',html)}
function enrichArticle(article,id){if(!article||!id)return;addDetailBadges(id,article);addTrainCheck(id,article);addGuide(id,article)}

function ensureModal(){let modal=document.getElementById('cityModal');if(modal)return modal;modal=document.createElement('div');modal.id='cityModal';modal.className='city-modal';modal.setAttribute('aria-hidden','true');modal.innerHTML=`<div class="city-modal__backdrop" data-close-city-modal></div><section class="city-modal__panel" role="dialog" aria-modal="true" aria-label="Fiche destination"><button class="city-modal__close" type="button" data-close-city-modal aria-label="Fermer">×</button><div class="city-modal__content" id="cityModalContent"></div></section>`;document.body.appendChild(modal);modal.addEventListener('click',event=>{
  if(event.target.closest('[data-close-city-modal]')){closeModal();return}
  const action=event.target.closest('[data-origin-id],[data-vote],[data-idea]');if(!action)return;
  const originId=action.dataset.originId;
  if(originId){document.getElementById(originId)?.click();return}
  if(action.dataset.vote){document.querySelector(`#cityList [data-vote="${CSS.escape(action.dataset.vote)}"]`)?.click();action.classList.add('on');action.textContent='Vote enregistré';return}
  if(action.dataset.idea){document.querySelector(`#cityList [data-idea="${CSS.escape(action.dataset.idea)}"]`)?.click();return}
});
return modal}
function cleanClone(clone){clone.querySelectorAll('[id]').forEach(el=>{el.dataset.originId=el.id;el.removeAttribute('id')});clone.querySelectorAll('[aria-controls]').forEach(el=>el.removeAttribute('aria-controls'));return clone}
function openModal(article,id){const modal=ensureModal(),content=modal.querySelector('#cityModalContent'),clone=cleanClone(article.cloneNode(true));enrichArticle(clone,id);content.replaceChildren(clone);modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('city-modal-open');history.replaceState(null,'',`#fiche-${id}`);setTimeout(()=>modal.querySelector('.city-modal__close')?.focus(),30)}
function closeModal(){const modal=document.getElementById('cityModal');if(!modal)return;modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('city-modal-open');if(location.hash.startsWith('#fiche-'))history.replaceState(null,'',location.pathname+location.search)}
function openFromStaging(id){const article=document.querySelector(`#cityList #fiche-${CSS.escape(id)}`)||document.querySelector(`#cityList [data-city="${CSS.escape(id)}"]`)||document.querySelector('#cityList article');if(!article)return false;openModal(article,id);return true}

function wrapCard(card){if(card.dataset.modalWrapped==='1')return;card.dataset.modalWrapped='1';const id=cityIdFromCard(card),original=card.onclick;card.onclick=function(event){if(typeof original==='function')original.call(this,event);setTimeout(()=>openFromStaging(id),0)};addCardBadges(card)}
function enhanceCards(){document.querySelectorAll('.destination-card[data-open-city],.destination-card[data-radar-city]').forEach(wrapCard);document.querySelectorAll('#cityList article').forEach(article=>enrichArticle(article,cityIdFromCard(article)))}
function hookPicker(){const picker=document.getElementById('cityPicker');if(!picker||picker.dataset.modalHooked==='1')return;picker.dataset.modalHooked='1';picker.addEventListener('change',()=>{const id=picker.value;setTimeout(()=>{if(openFromStaging(id))return;const card=document.querySelector(`[data-open-city="${CSS.escape(id)}"],[data-radar-city="${CSS.escape(id)}"]`);card?.click()},0)})}
function openHashIfNeeded(){const id=location.hash.match(/^#fiche-([a-z-]+)$/)?.[1];if(!id)return;if(openFromStaging(id))return;const card=document.querySelector(`[data-open-city="${CSS.escape(id)}"],[data-radar-city="${CSS.escape(id)}"]`);card?.click()}

document.addEventListener('keydown',event=>{if(event.key==='Escape')closeModal()});
let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>{enhanceCards();hookPicker()},80)};
document.addEventListener('DOMContentLoaded',()=>{ensureModal();enhanceCards();hookPicker()});
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{enhanceCards();hookPicker();openHashIfNeeded()},700);
setTimeout(()=>{enhanceCards();hookPicker();openHashIfNeeded()},1600);
})();