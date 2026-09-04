(()=>{
const META={
  dublin:{flag:'🇮🇪',code:'IE',vibe:'Pubs & musique',note:'Pintes, live et vraie ambiance',doodle:'🍺'},
  krakow:{flag:'🇵🇱',code:'PL',vibe:'Culture & nuits',note:'Pierogi, caves et vieille ville',doodle:'🏰'},
  bologna:{flag:'🇮🇹',code:'IT',vibe:'Gastronomie',note:'Portiques, pasta et grandes tablées',doodle:'🍝'},
  tirana:{flag:'🇦🇱',code:'AL',vibe:'Dépaysement',note:'Blloku, cafés et énergie brute',doodle:'⛰️'},
  barcelona:{flag:'🇪🇸',code:'ES',vibe:'Soleil & fiesta',note:'Tapas, quartiers et Méditerranée',doodle:'🌴'},
  bucharest:{flag:'🇷🇴',code:'RO',vibe:'Fête & petit prix',note:'Capitale vivante et nuits longues',doodle:'✨'},
  vilnius:{flag:'🇱🇹',code:'LT',vibe:'Culture & histoire',note:'Charmante et authentique',doodle:'⛪'},
  lisbon:{flag:'🇵🇹',code:'PT',vibe:'Soleil & saveurs',note:'Miradouros, azulejos et soleil',doodle:'🚋'},
  porto:{flag:'🇵🇹',code:'PT',vibe:'Gastronomie & ambiance',note:'Soleil, bonnes tables et azulejos',doodle:'🌉'},
  mallorca:{flag:'🇪🇸',code:'ES',vibe:'Mer & grand air',note:'Plages, criques et soleil',doodle:'🌴'},
  tallinn:{flag:'🇪🇪',code:'EE',vibe:'Nord & médiéval',note:'Vieille ville et design nordique',doodle:'🏰'},
  riga:{flag:'🇱🇻',code:'LV',vibe:'Art nouveau',note:'Architecture, marchés et bars',doodle:'🏛️'},
  split:{flag:'🇭🇷',code:'HR',vibe:'Mer & vieille ville',note:'Adriatique, pierre et terrasses',doodle:'🌊'},
  prague:{flag:'🇨🇿',code:'CZ',vibe:'Culture & bière',note:'Ponts, ruelles et grandes soirées',doodle:'🍺'},
  vienna:{flag:'🇦🇹',code:'AT',vibe:'Élégance & culture',note:'Cafés, palais et grand style',doodle:'🎻'},
  brussels:{flag:'🇧🇪',code:'BE',vibe:'Bières & gourmandise',note:'Centre-à-centre, zéro friction',doodle:'🍟'},
  rotterdam:{flag:'🇳🇱',code:'NL',vibe:'Architecture & moderne',note:'Design, art et vie urbaine',doodle:'🌉'},
  london:{flag:'🇬🇧',code:'GB',vibe:'XXL & nightlife',note:'Une ville qui ne dort jamais',doodle:'🎡'},
  amsterdam:{flag:'🇳🇱',code:'NL',vibe:'Canaux & nuits',note:'Canaux, bars et centre compact',doodle:'🚲'},
  porto:{flag:'🇵🇹',code:'PT',vibe:'Gastronomie & ambiance',note:'Soleil, bonnes tables et azulejos',doodle:'🌉'}
};
function patchCard(card){
  const id=card.dataset.openCity;if(!id||card.dataset.visualReady==='1')return;
  const meta=META[id]||{};
  const photo=card.querySelector('.destination-card-photo');
  const kicker=card.querySelector('.destination-card-kicker');
  if(!photo)return;
  card.dataset.visualReady='1';
  card.dataset.mode=(kicker?.textContent||'').toLowerCase().includes('train')?'train':'flight';
  if(meta.flag){
    const flag=document.createElement('span');flag.className='visual-flag-chip';flag.innerHTML=`<span>${meta.flag}</span><b>${meta.code||''}</b>`;photo.appendChild(flag);
  }
  if(meta.vibe){const vibe=document.createElement('span');vibe.className='visual-vibe-chip';vibe.textContent=meta.vibe;photo.appendChild(vibe)}
  if(meta.note){const note=document.createElement('span');note.className='visual-photo-note';note.textContent=meta.note;photo.appendChild(note)}
  if(meta.doodle){const d=document.createElement('span');d.className='visual-city-doodle';d.textContent=meta.doodle;card.appendChild(d)}
}
function patchAll(){document.querySelectorAll('.destination-card[data-open-city]').forEach(patchCard)}
const target=document.querySelector('#destinationJump');
if(target)new MutationObserver(patchAll).observe(target,{childList:true,subtree:true});
window.addEventListener('load',()=>{patchAll();setTimeout(patchAll,500);setTimeout(patchAll,1500)});
document.addEventListener('click',()=>setTimeout(patchAll,50));
})();
