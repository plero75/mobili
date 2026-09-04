(()=>{
const COPY=[
  'Le spot à mettre en tout premier dans le week-end.',
  'L’étape qui donne le ton : manger, flâner ou sentir la ville.',
  'Le bon plan pour finir la journée avec une vraie ambiance.'
];
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const tidy=value=>String(value||'').replace(/^\s*\d+\.\s*/,'').trim();
const shortArea=value=>String(value||'').split('—')[0].trim();
const CITY_NAMES={krakow:'Kraków',dublin:'Dublin',brussels:'Brussels',bologna:'Bologna',tirana:'Tirana',barcelona:'Barcelona',bucharest:'Bucharest',vilnius:'Vilnius',lisbon:'Lisbon',porto:'Porto',mallorca:'Palma Mallorca',tallinn:'Tallinn',riga:'Riga',split:'Split Croatia',prague:'Prague',vienna:'Vienna',rotterdam:'Rotterdam',london:'London',amsterdam:'Amsterdam',turin:'Turin'};
const SEARCH={
  krakow:['Kazimierz Krakow','Stary Kleparz Krakow market','Wawel Castle Krakow'],
  dublin:['Temple Bar Dublin street','Guinness Storehouse Dublin','River Liffey Dublin'],
  brussels:['Grand Place Brussels','Marolles Brussels','Sainte Catherine Brussels'],
  bologna:['Quadrilatero Bologna market','Bologna trattoria food','San Luca Bologna portico'],
  tirana:['Skanderbeg Square Tirana','Blloku Tirana','Pazari i Ri Tirana'],
  barcelona:['Gracia Barcelona','Montjuic Barcelona','Barcelona beach waterfront'],
  bucharest:['Calea Victoriei Bucharest','Old Town Bucharest','Therme Bucuresti'],
  vilnius:['Vilnius Old Town','Uzupis Vilnius','Hales Market Vilnius'],
  lisbon:['Alfama Lisbon','Lisbon miradouro','Cais do Sodre Lisbon'],
  porto:['Ribeira Porto','Bolhao Market Porto','Vila Nova de Gaia Porto'],
  mallorca:['Palma Cathedral Mallorca','Santa Catalina Palma Mallorca','Portixol Palma Mallorca'],
  tallinn:['Tallinn Old Town','Telliskivi Tallinn','Kalamaja Tallinn'],
  riga:['Riga Central Market','Riga Art Nouveau','Riga Old Town'],
  split:['Diocletian Palace Split','Riva Split Croatia','Marjan Split Croatia'],
  prague:['Charles Bridge Prague','Letna Prague','Prague brewery'],
  vienna:['Naschmarkt Vienna','Vienna historic cafe','Prater Vienna'],
  rotterdam:['Markthal Rotterdam','Oude Haven Rotterdam','Katendrecht Rotterdam'],
  london:['Borough Market London','Shoreditch London','London pub street'],
  amsterdam:['Amsterdam canals Jordaan','De Pijp Amsterdam','Amsterdam brown cafe'],
  turin:['Porta Palazzo Turin market','San Salvario Turin','Turin baroque centre']
};
function photo(card){
  const img=card.querySelector('.destination-visual img');
  return {src:img?.getAttribute('src')||'',alt:img?.getAttribute('alt')||''};
}
function highlights(card){
  const primary=[...card.querySelectorAll('.highlight-grid .hi')].map(el=>tidy(el.textContent)).filter(Boolean);
  const areas=[...card.querySelectorAll('.city-guide .area-pills span')].map(el=>shortArea(el.textContent)).filter(Boolean);
  return [...new Set([...primary,...areas])].slice(0,3);
}
function commonsSearch(query,used){
  const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|mime',iiurlwidth:'1000',format:'json',origin:'*'});
  return fetch(`https://commons.wikimedia.org/w/api.php?${params}`,{mode:'cors'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
    const pages=Object.values(data.query?.pages||{});
    const hit=pages.find(page=>{
      const info=page.imageinfo?.[0];
      const url=info?.thumburl||info?.url||'';
      return url&&/^image\/(jpeg|png|webp)$/i.test(info?.mime||'')&&!used.has(url);
    });
    if(!hit)return null;
    const info=hit.imageinfo[0],url=info.thumburl||info.url;
    used.add(url);
    return {url,file:`https://commons.wikimedia.org/wiki/${encodeURIComponent(hit.title.replace(/ /g,'_'))}`,title:hit.title.replace(/^File:/,'')};
  }).catch(()=>null);
}
async function hydrateImages(card,id,titles){
  const used=new Set();
  const city=CITY_NAMES[id]||id;
  const cards=[...card.querySelectorAll('.spot-v2')];
  const queries=SEARCH[id]||titles.map(title=>`${title} ${city}`);
  for(let i=0;i<cards.length;i++){
    const result=await commonsSearch(queries[i]||`${titles[i]||city} ${city}`,used);
    if(!result)continue;
    const img=cards[i].querySelector('img');
    if(img){img.src=result.url;img.style.objectPosition='center';img.alt=titles[i]||result.title;}
    cards[i].dataset.photoSource=result.file;
  }
  const food=card.querySelector('.guide-v2--food img');
  const night=card.querySelector('.guide-v2--night img');
  const foodResult=await commonsSearch(`${city} food market restaurant`,used);
  if(food&&foodResult){food.src=foodResult.url;food.style.objectPosition='center';}
  const nightResult=await commonsSearch(`${city} nightlife bar street evening`,used);
  if(night&&nightResult){night.src=nightResult.url;night.style.objectPosition='center';}
}
function makeSpots(card){
  if(card.querySelector('.city-spots-v2'))return;
  const titles=highlights(card); if(!titles.length)return;
  const p=photo(card),id=(card.dataset.city||'').trim();
  const section=document.createElement('section');
  section.className='city-spots-v2';
  section.innerHTML=`<div class="city-spots-v2__head"><h4>✨ Les 3 incontournables</h4><span>Les immanquables pour se projeter en 10 secondes.</span></div><div class="city-spots-v2__grid">${titles.map((title,i)=>`<article class="spot-v2"><figure><img src="${p.src}" alt="${esc(p.alt||title)}" loading="lazy"></figure><div><small>📍 Incontournable ${i+1}</small><b>${esc(title)}</b><p>${esc(COPY[i]||COPY[2])}</p></div></article>`).join('')}</div>`;
  const guide=card.querySelector('.city-guide');
  if(guide)guide.before(section); else card.querySelector('.card-footer')?.before(section);
  requestAnimationFrame(()=>hydrateImages(card,id,titles));
}
function extractGuide(guide){
  const blocks=[...guide.querySelectorAll('.city-guide__block')];
  const areas=[...guide.querySelectorAll('.area-pills span')].map(el=>el.textContent.trim());
  const textAfter=label=>{const block=blocks.find(b=>b.querySelector('small')?.textContent.includes(label));return block?.querySelector('p')?.textContent.trim()||'';};
  return {areas,food:textAfter('À manger'),night:textAfter('Pour sortir'),must:textAfter('Programme signature'),watch:textAfter('À surveiller')};
}
function visualGuide(card){
  const old=card.querySelector('.city-guide:not(.city-guide-v2)');
  if(!old||card.querySelector('.city-guide-v2'))return;
  const data=extractGuide(old),p=photo(card),id=(card.dataset.city||'').trim();
  const airbnb=old.querySelector('a[href*="airbnb"]')?.href||'#',booking=old.querySelector('a[href*="booking"]')?.href||'#';
  const areas=data.areas.slice(0,3).map(shortArea);
  const guide=document.createElement('section');
  guide.className='city-guide-v2';
  guide.innerHTML=`<div class="city-guide-v2__head"><div><span>Le mini-guide utile</span><h4>🗺️ Les essentiels pour un week-end réussi</h4></div><em>Plus visuel, plus concret, plus simple à lire.</em></div><div class="city-guide-v2__grid"><article class="guide-v2 guide-v2--zones"><div class="guide-v2__title"><strong>📍 Zones à viser</strong><span>Les quartiers les plus simples pour poser le week-end.</span></div><div class="guide-v2__pills">${areas.map(a=>`<span>${esc(a)}</span>`).join('')}</div><div class="guide-v2__map"><i></i><i></i><i></i><b>${esc(areas[0]||'Centre')}</b><span>${esc(areas[1]||'Quartier food')}</span><small>${esc(areas[2]||'Quartier sortie')}</small></div><div class="guide-v2__links"><a href="${airbnb}" target="_blank" rel="noopener">Airbnb ↗</a><a href="${booking}" target="_blank" rel="noopener">Booking ↗</a></div></article><article class="guide-v2 guide-v2--food"><div><div class="guide-v2__title"><strong>🍽️ À manger</strong><span>${esc(data.food)}</span></div><a class="guide-v2__chip" href="https://www.google.com/search?q=${encodeURIComponent('restaurants '+id)}" target="_blank" rel="noopener">Bonnes adresses ↗</a></div><figure><img src="${p.src}" alt="${esc(p.alt)}" loading="lazy"></figure></article><article class="guide-v2 guide-v2--night"><div><div class="guide-v2__title"><strong>🍸 Pour sortir</strong><span>${esc(data.night)}</span></div><a class="guide-v2__chip" href="https://www.google.com/search?q=${encodeURIComponent('bars '+id)}" target="_blank" rel="noopener">Spots soirée ↗</a></div><figure><img src="${p.src}" alt="${esc(p.alt)}" loading="lazy"></figure></article><article class="guide-v2 guide-v2--plan"><div class="guide-v2__title"><strong>⭐ Programme signature</strong><span>${esc(data.must)}</span></div><div class="guide-v2__steps"><span><b>Matin</b>${esc(areas[0]||'Centre')}</span><span><b>Midi</b>${esc(areas[1]||'Bon spot food')}</span><span><b>Soir</b>${esc(areas[2]||'Quartier vivant')}</span></div></article><article class="guide-v2 guide-v2--watch"><div class="guide-v2__title"><strong>⚠️ À surveiller</strong><span>${esc(data.watch)}</span></div><p>À garder en tête avant le vote ou la réservation.</p></article></div>`;
  old.replaceWith(guide);
}
function polish(card){
  if(!card||card.dataset.visualDetailV2==='1')return false;
  card.dataset.visualDetailV2='1';
  card.querySelectorAll('.trip-check').forEach(el=>el.remove());
  visualGuide(card);makeSpots(card);return true;
}
function run(){
  let fresh=false;
  document.querySelectorAll('#cityModalContent .selection-card').forEach(card=>{if(polish(card))fresh=true;});
  if(fresh){const panel=document.querySelector('.city-modal.is-open .city-modal__panel');if(panel)requestAnimationFrame(()=>{panel.scrollTop=0;});}
}
const obs=new MutationObserver(()=>setTimeout(run,0));
obs.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('DOMContentLoaded',run);setTimeout(run,800);setTimeout(run,1600);
})();