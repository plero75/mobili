(()=>{
const TARGET=6;
const CITY_NAMES={dublin:'Dublin',krakow:'Cracovie',bologna:'Bologne',tirana:'Tirana',vienna:'Vienne',rotterdam:'Rotterdam',bucharest:'Bucarest',munich:'Munich',turin:'Turin',amsterdam:'Amsterdam',malaga:'Málaga',alicante:'Alicante',brussels:'Bruxelles'};
async function refresh(){
  let votes=[];
  try{
    const r=await fetch('/api/votes?phase=1',{cache:'no-store'});
    const d=await r.json();
    if(d.ok)votes=d.votes||[];
  }catch(e){}
  const latest={};
  votes.filter(v=>v.category==='destination'&&v.choice_id==='phase1-destination'&&v.vote==='oui').forEach(v=>{
    const old=latest[v.participant];
    if(!old||new Date(v.updated_at)>new Date(old.updated_at))latest[v.participant]=v;
  });
  const done=Object.values(latest);
  const count=done.length;
  const copy=document.querySelector('#progressCopy');
  if(copy)copy.textContent=`${count} vote${count>1?'s':''} reçu${count>1?'s':''} · résultat révélé à ${TARGET}`;
  const bar=document.querySelector('#progressBar');
  if(bar)bar.style.width=Math.min(100,count/TARGET*100)+'%';
  const winner=document.querySelector('#winner');
  if(winner){
    if(count>=TARGET){
      const counts={};done.forEach(v=>counts[v.city]=(counts[v.city]||0)+1);
      const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
      if(sorted.length){
        const max=sorted[0][1],w=sorted.filter(x=>x[1]===max);
        winner.textContent=w.length===1?`🏆 ${CITY_NAMES[w[0][0]]||w[0][0]} arrive en tête avec ${max} vote${max>1?'s':''}.`:'⚖️ Égalité parfaite. Il va falloir inventer une constitution.';
        winner.classList.remove('hidden');
      }
    }else{
      winner.textContent=`Résultats cachés jusqu’au ${TARGET}e vote.`;
      winner.classList.remove('hidden');
    }
  }
}
function patchCopy(){
  document.querySelectorAll('[data-group-size-copy]').forEach(el=>el.textContent=TARGET);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{patchCopy();setTimeout(refresh,300);setInterval(refresh,5000)});else{patchCopy();setTimeout(refresh,300);setInterval(refresh,5000)}
})();