(()=>{
const COPY=[
  'Le spot à mettre en tout premier dans le week-end.',
  'L’étape qui donne le ton : manger, flâner ou sentir la ville.',
  'Le bon plan pour finir la journée avec une vraie ambiance.'
];
const FOCUS=['center 32%','center 54%','center 76%'];
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const tidy=value=>String(value||'').replace(/^\s*\d+\.\s*/,'').trim();
const shortArea=value=>String(value||'').split('—')[0].trim();
function photo(card){
  const img=card.querySelector('.destination-visual img');
  return {src:img?.getAttribute('src')||'',alt:img?.getAttribute('alt')||'',focus:img?.style?.objectPosition||'center'};
}
function highlights(card){
  const primary=[...card.querySelectorAll('.highlight-grid .hi')].map(el=>tidy(el.textContent)).filter(Boolean);
  const areas=[...card.querySelectorAll('.city-guide .area-pills span')].map(el=>shortArea(el.textContent)).filter(Boolean);
  return [...new Set([...primary,...areas])].slice(0,3);
}
function makeSpots(card){
  if(card.querySelector('.city-spots-v2'))return;
  const titles=highlights(card); if(!titles.length)return;
  const p=photo(card);
  const section=document.createElement('section');
  section.className='city-spots-v2';
  section.innerHTML=`<div class="city-spots-v2__head"><h4>✨ Les 3 incontournables</h4><span>Les immanquables pour se projeter en 10 secondes.</span></div><div class="city-spots-v2__grid">${titles.map((title,i)=>`<article class="spot-v2"><figure><img src="${p.src}" alt="${esc(p.alt||title)}" loading="lazy" style="object-position:${FOCUS[i]||p.focus}"></figure><div><small>📍 Incontournable ${i+1}</small><b>${esc(title)}</b><p>${esc(COPY[i]||COPY[2])}</p></div></article>`).join('')}</div>`;
  const guide=card.querySelector('.city-guide');
  if(guide)guide.before(section);
  else card.querySelector('.card-footer')?.before(section);
}
function extractGuide(guide){
  const blocks=[...guide.querySelectorAll('.city-guide__block')];
  const areas=[...guide.querySelectorAll('.area-pills span')].map(el=>el.textContent.trim());
  const textAfter=label=>{
    const block=blocks.find(b=>b.querySelector('small')?.textContent.includes(label));
    return block?.querySelector('p')?.textContent.trim()||'';
  };
  return {areas,food:textAfter('À manger'),night:textAfter('Pour sortir'),must:textAfter('Programme signature'),watch:textAfter('À surveiller')};
}
function visualGuide(card){
  const old=card.querySelector('.city-guide:not(.city-guide-v2)');
  if(!old||card.querySelector('.city-guide-v2'))return;
  const data=extractGuide(old),p=photo(card),id=(card.dataset.city||'').trim();
  const airbnb=old.querySelector('a[href*="airbnb"]')?.href||'#';
  const booking=old.querySelector('a[href*="booking"]')?.href||'#';
  const areas=data.areas.slice(0,3).map(shortArea);
  const guide=document.createElement('section');
  guide.className='city-guide-v2';
  guide.innerHTML=`<div class="city-guide-v2__head"><div><span>Le mini-guide utile</span><h4>🗺️ Les essentiels pour un week-end réussi</h4></div><em>Plus visuel, plus concret, plus simple à lire.</em></div><div class="city-guide-v2__grid"><article class="guide-v2 guide-v2--zones"><div class="guide-v2__title"><strong>📍 Zones à viser</strong><span>Les quartiers les plus simples pour poser le week-end.</span></div><div class="guide-v2__pills">${areas.map(a=>`<span>${esc(a)}</span>`).join('')}</div><div class="guide-v2__map"><i></i><i></i><i></i><b>${esc(areas[0]||'Centre')}</b><span>${esc(areas[1]||'Quartier food')}</span><small>${esc(areas[2]||'Quartier sortie')}</small></div><div class="guide-v2__links"><a href="${airbnb}" target="_blank" rel="noopener">Airbnb ↗</a><a href="${booking}" target="_blank" rel="noopener">Booking ↗</a></div></article><article class="guide-v2 guide-v2--food"><div><div class="guide-v2__title"><strong>🍽️ À manger</strong><span>${esc(data.food)}</span></div><a class="guide-v2__chip" href="https://www.google.com/search?q=${encodeURIComponent('restaurants '+id)}" target="_blank" rel="noopener">Bonnes adresses ↗</a></div><figure><img src="${p.src}" alt="${esc(p.alt)}" loading="lazy" style="object-position:center 40%"></figure></article><article class="guide-v2 guide-v2--night"><div><div class="guide-v2__title"><strong>🍸 Pour sortir</strong><span>${esc(data.night)}</span></div><a class="guide-v2__chip" href="https://www.google.com/search?q=${encodeURIComponent('bars '+id)}" target="_blank" rel="noopener">Spots soirée ↗</a></div><figure><img src="${p.src}" alt="${esc(p.alt)}" loading="lazy" style="object-position:center 72%"></figure></article><article class="guide-v2 guide-v2--plan"><div class="guide-v2__title"><strong>⭐ Programme signature</strong><span>${esc(data.must)}</span></div><div class="guide-v2__steps"><span><b>Matin</b>${esc(areas[0]||'Centre')}</span><span><b>Midi</b>${esc(areas[1]||'Bon spot food')}</span><span><b>Soir</b>${esc(areas[2]||'Quartier vivant')}</span></div></article><article class="guide-v2 guide-v2--watch"><div class="guide-v2__title"><strong>⚠️ À surveiller</strong><span>${esc(data.watch)}</span></div><p>À garder en tête avant le vote ou la réservation.</p></article></div>`;
  old.replaceWith(guide);
}
function polish(card){
  if(!card||card.dataset.visualDetailV2==='1')return;
  card.dataset.visualDetailV2='1';
  card.querySelectorAll('.trip-check').forEach(el=>el.remove());
  makeSpots(card);
  visualGuide(card);
}
function run(){
  document.querySelectorAll('#cityModalContent .selection-card').forEach(card=>{
    card.dataset.visualDetailV2='';
    polish(card);
  });
}
const obs=new MutationObserver(()=>setTimeout(run,0));
obs.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('DOMContentLoaded',run);
setTimeout(run,800);setTimeout(run,1600);
})();