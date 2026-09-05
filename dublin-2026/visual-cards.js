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
  amsterdam:{flag:'🇳🇱',code:'NL',vibe:'Canaux & nuits',note:'Canaux, bars et centre compact',doodle:'🚲'}
};
function currentName(){return document.querySelector('#whoSelect')?.value||localStorage.getItem('petitschats-name')||''}
async function voteFromCard(card,id,button){
  const participant=currentName();
  if(!participant){document.querySelector('#who')?.scrollIntoView({behavior:'smooth'});alert('Choisis d’abord ton prénom pour voter.');return}
  const old=button.textContent;button.disabled=true;button.textContent='Enregistrement…';
  try{
    const r=await fetch('/api/votes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({participant,city:id,category:'destination',choiceId:'phase1-destination',vote:'oui'})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok)throw new Error(d.error||`HTTP ${r.status}`);
    localStorage.setItem(`petitschats-destination-${participant}`,id);
    document.querySelectorAll('.destination-card-vote').forEach(b=>{b.classList.toggle('is-voted',b.dataset.city===id);b.textContent=b.dataset.city===id?'✓ Mon vote':'❤️ Voter';});
    document.dispatchEvent(new CustomEvent('petitschats:vote-saved',{detail:{participant,city:id}}));
  }catch(e){alert(`Le vote n’a pas pu être enregistré en ligne : ${e.message||e}`);button.textContent=old}
  finally{button.disabled=false}
}
function patchCard(card){
  const id=card.dataset.openCity;if(!id||card.dataset.visualReady==='1')return;
  const meta=META[id]||{};
  const photo=card.querySelector('.destination-card-photo');
  const kicker=card.querySelector('.destination-card-kicker');
  if(!photo)return;
  card.dataset.visualReady='1';
  card.dataset.mode=(kicker?.textContent||'').toLowerCase().includes('train')?'train':'flight';
  if(meta.flag){const flag=document.createElement('span');flag.className='visual-flag-chip';flag.innerHTML=`<span>${meta.flag}</span><b>${meta.code||''}</b>`;photo.appendChild(flag)}
  if(meta.vibe){const vibe=document.createElement('span');vibe.className='visual-vibe-chip';vibe.textContent=meta.vibe;photo.appendChild(vibe)}
  if(meta.note){const note=document.createElement('span');note.className='visual-photo-note';note.textContent=meta.note;photo.appendChild(note)}
  if(meta.doodle){const d=document.createElement('span');d.className='visual-city-doodle';d.textContent=meta.doodle;card.appendChild(d)}
  const open=card.querySelector('.destination-card-open');
  if(open&&!card.querySelector('.destination-card-actions')){
    const actions=document.createElement('div');actions.className='destination-card-actions';
    const vote=document.createElement('button');vote.type='button';vote.className='destination-card-vote';vote.dataset.city=id;vote.textContent='❤️ Voter';
    const participant=currentName();if(participant&&localStorage.getItem(`petitschats-destination-${participant}`)===id){vote.classList.add('is-voted');vote.textContent='✓ Mon vote'}
    vote.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();voteFromCard(card,id,vote)});
    open.parentNode.insertBefore(actions,open);actions.appendChild(vote);actions.appendChild(open);
  }
}
function patchAll(){document.querySelectorAll('.destination-card[data-open-city]').forEach(patchCard)}
const target=document.querySelector('#destinationJump');
if(target)new MutationObserver(patchAll).observe(target,{childList:true,subtree:true});
window.addEventListener('load',()=>{patchAll();setTimeout(patchAll,500);setTimeout(patchAll,1500)});
document.addEventListener('change',e=>{if(e.target?.id==='whoSelect'){setTimeout(()=>{document.querySelectorAll('.destination-card-vote').forEach(b=>{const p=currentName(),on=p&&localStorage.getItem(`petitschats-destination-${p}`)===b.dataset.city;b.classList.toggle('is-voted',!!on);b.textContent=on?'✓ Mon vote':'❤️ Voter'})},0)}});
document.addEventListener('click',()=>setTimeout(patchAll,50));
})();
