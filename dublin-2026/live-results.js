(()=>{
const NAMES={krakow:'Cracovie',dublin:'Dublin',brussels:'Bruxelles',bologna:'Bologne',tirana:'Tirana',barcelona:'Barcelone',bucharest:'Bucarest',vilnius:'Vilnius',lisbon:'Lisbonne',porto:'Porto',mallorca:'Majorque',tallinn:'Tallinn',riga:'Riga',split:'Split',prague:'Prague',vienna:'Vienne',rotterdam:'Rotterdam',london:'Londres',amsterdam:'Amsterdam',turin:'Turin',malaga:'Málaga',alicante:'Alicante',munich:'Munich'};
const FLAGS={krakow:'🇵🇱',dublin:'🇮🇪',brussels:'🇧🇪',bologna:'🇮🇹',tirana:'🇦🇱',barcelona:'🇪🇸',bucharest:'🇷🇴',vilnius:'🇱🇹',lisbon:'🇵🇹',porto:'🇵🇹',mallorca:'🇪🇸',tallinn:'🇪🇪',riga:'🇱🇻',split:'🇭🇷',prague:'🇨🇿',vienna:'🇦🇹',rotterdam:'🇳🇱',london:'🇬🇧',amsterdam:'🇳🇱',turin:'🇮🇹',malaga:'🇪🇸',alicante:'🇪🇸',munich:'🇩🇪'};
function ensureBox(){
  let box=document.getElementById('liveResults');
  if(box)return box;
  const vote=document.getElementById('vote');
  if(!vote)return null;
  box=document.createElement('div');
  box.id='liveResults';
  box.className='live-results';
  box.innerHTML='<div class="live-results__head"><div><span>● EN DIRECT</span><h3>Résultats du vote</h3></div><small>Mise à jour automatique</small></div><div class="live-results__body"><p>Chargement des votes…</p></div>';
  vote.querySelector('.w')?.appendChild(box);
  return box;
}
function latestVotes(rows){
  const latest={};
  rows.filter(v=>v.category==='destination'&&v.choice_id==='phase1-destination'&&v.vote==='oui').forEach(v=>{
    const prev=latest[v.participant];
    if(!prev||new Date(v.updated_at)>new Date(prev.updated_at))latest[v.participant]=v;
  });
  return Object.values(latest);
}
function render(rows){
  const box=ensureBox();if(!box)return;
  const votes=latestVotes(rows),total=votes.length,counts={};
  votes.forEach(v=>counts[v.city]=(counts[v.city]||0)+1);
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]||String(NAMES[a[0]]||a[0]).localeCompare(String(NAMES[b[0]]||b[0])));
  const body=box.querySelector('.live-results__body');
  if(!total){body.innerHTML='<div class="live-results__empty">Aucun vote enregistré pour le moment.</div>';return;}
  body.innerHTML=`<div class="live-results__summary"><b>${total}</b> vote${total>1?'s':''} enregistré${total>1?'s':''}</div><div class="live-results__ranking">${sorted.map(([city,count],i)=>{const pct=Math.round(count/total*100);return `<article class="live-result ${i===0?'is-leader':''}"><div class="live-result__rank">${i===0?'🏆':`#${i+1}`}</div><div class="live-result__main"><div><b>${FLAGS[city]||'📍'} ${NAMES[city]||city}</b><span>${count} vote${count>1?'s':''} · ${pct}%</span></div><div class="live-result__bar"><i style="width:${pct}%"></i></div></div></article>`}).join('')}</div>`;
  const winner=document.getElementById('winner');
  if(winner){winner.classList.remove('hidden');winner.textContent=sorted.length?`${FLAGS[sorted[0][0]]||''} ${NAMES[sorted[0][0]]||sorted[0][0]} est en tête avec ${sorted[0][1]} vote${sorted[0][1]>1?'s':''}.`:'Aucun vote pour le moment.';}
  const copy=document.getElementById('progressCopy');if(copy)copy.textContent=`${total} vote${total>1?'s':''} reçu${total>1?'s':''} · résultats en direct`;
}
async function refresh(){
  const box=ensureBox();if(!box)return;
  try{
    const r=await fetch(`/api/votes?phase=1&ts=${Date.now()}`,{cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.ok)throw new Error(d.error||`HTTP ${r.status}`);
    render(d.votes||[]);
    box.classList.remove('has-error');
  }catch(e){
    box.classList.add('has-error');
    const body=box.querySelector('.live-results__body');
    if(body)body.innerHTML=`<div class="live-results__error"><b>Votes en ligne indisponibles</b><span>${String(e.message||e)}</span></div>`;
  }
}
document.addEventListener('DOMContentLoaded',()=>{ensureBox();refresh();setInterval(refresh,3000);document.addEventListener('click',e=>{if(e.target.closest('[data-vote]'))setTimeout(refresh,600);});});
})();