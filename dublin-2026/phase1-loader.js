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

  (0,eval)(src);
})();
