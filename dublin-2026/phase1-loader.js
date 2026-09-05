(()=>{
  const xhr=new XMLHttpRequest();
  xhr.open('GET',`phase1.js?source=${Date.now()}`,false);
  xhr.send(null);
  if(xhr.status<200||xhr.status>=300)throw new Error(`Impossible de charger phase1.js (${xhr.status})`);
  let src=xhr.responseText;

  src=src.replace(
    "function trainOption(id){const train=TRAIN_CHECKS[id];return train?{price:train.price,usefulHours:null,train}:null}",
    "function trainOption(id){const train=TRAIN_CHECKS[id];return train?{price:train.price??train.fareFrom??null,usefulHours:null,train}:null}"
  );

  src=src.replaceAll('panier exact à confirmer avant vote','tarif à revérifier avant achat');
  src=src.replaceAll("Le prix A/R exact du train doit être vérifié avant de l’ouvrir au vote.","Le tarif d’appel A/R est utilisé pour la règle des 250 € ; à revérifier avant achat.");
  src=src.replaceAll("Train à confirmer","Tarif train à vérifier");
  src=src.replaceAll("dans le module train","dans les fiches train");

  const oldVote="async function vote(city){const selected=SHORTLIST.find(item=>item.id===city);if(!selected||!voteEligibility(selected).eligible)return;if(!ensureName())return;localStorage.setItem(`petitschats-destination-${current}`,city);try{await fetch('/api/votes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({participant:current,city,category:'destination',choiceId:'phase1-destination',vote:'oui'})})}catch(error){}await loadVotes();paintVotes()}";
  const newVote="async function vote(city){const selected=SHORTLIST.find(item=>item.id===city);if(!selected||!voteEligibility(selected).eligible)return;if(!ensureName())return;const status=$('#voteStatus');try{const response=await fetch('/api/votes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({participant:current,city,category:'destination',choiceId:'phase1-destination',vote:'oui'})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.error||`HTTP ${response.status}`);localStorage.setItem(`petitschats-destination-${current}`,city);await loadVotes();paintVotes();document.dispatchEvent(new CustomEvent('petitschats:vote-saved',{detail:{participant:current,city}}));}catch(error){if(status)status.innerHTML=`<b>Vote non enregistré en ligne.</b> ${esc(String(error.message||error))}`;alert('Le vote n’a pas pu être enregistré en ligne. Réessaie dans un instant.');}}";
  src=src.replace(oldVote,newVote);

  (0,eval)(src);

  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href=`live-results.css?v=1`;
  document.head.appendChild(css);
  const js=document.createElement('script');
  js.src=`live-results.js?v=1`;
  js.defer=true;
  document.head.appendChild(js);
})();
