(() => {
  const mode = new URLSearchParams(location.search).get('fixture') || 'loaded';
  const started = Date.now();
  const at = minutes => new Date(started + minutes * 60000).toISOString();
  let failed = mode === 'offline';
  const response = (body,status=200) => Promise.resolve(new Response(typeof body==='string'?body:JSON.stringify(body),{status}));
  const visit = (line,destination,minutes,status='onTime',theoretical=false) => ({MonitoredVehicleJourney:{LineRef:{value:line},PublishedLineName:[{value:line.includes('C01742')?'A':line.includes('C01219')?'201':'77'}],Monitored:!theoretical,DestinationName:[{value:destination}],MonitoredCall:{AimedDepartureTime:at(minutes-2),...(theoretical?{}:{ExpectedDepartureTime:at(minutes)}),DepartureStatus:status}}});
  window.fetch = async input => {
    if(failed) throw new TypeError('QA: simulated network interruption');
    let url = new URL(String(input),location.href);
    if(url.searchParams.has('url')) url = new URL(url.searchParams.get('url'));
    if(url.pathname.includes('stop-monitoring')){
      const line = url.searchParams.get('LineRef') || (url.searchParams.get('MonitoringRef').includes('43135')?'STIF:Line::C01742:':'STIF:Line::C02251:');
      const rer = line.includes('C01742');
      let rows = rer ? [visit(line,'Cergy le Haut',mode==='stale'?14.05:18),visit(line,'Poissy',27),visit(line,'Boissy-Saint-Léger',20,'delayed'),visit(line,'Boissy-Saint-Léger',31)] : [visit(line,line.includes('C01139')?'Villiers-sur-Marne – Le Plessis-Trévise RER':line.includes('C01219')?'Porte Dorée':line.includes('C01130')?'Camping International':'Gare de Lyon',21),visit(line,'Gare de Lyon',30)];
      if(line.includes('C01141')||(!url.searchParams.get('LineRef')&&!rer)) rows.push(visit(line,'Joinville-le-Pont',26));
      if(line.includes('C01399')) rows=[];
      if(line.includes('C01137')) rows=[visit(line,'Champigny-sur-Marne',24,'onTime',true)];
      return response({Siri:{ServiceDelivery:{StopMonitoringDelivery:[{Status:true,MonitoredStopVisit:rows}]}}});
    }
    if(url.pathname.includes('general-message')){
      if(!String(url.searchParams.get('LineRef')).includes('C01742')) return response({},400);
      return response({Siri:{ServiceDelivery:{GeneralMessageDelivery:[{InfoMessage:[{Content:{Message:[{MessageText:[{value:'Travaux dès 21h50 entre Maisons-Laffitte et Cergy-le-Haut. Bus de remplacement.'}]}]}}]}]}}});
    }
    if(url.hostname.includes('open-meteo'))return response({current_weather:{temperature:12,weathercode:3}});
    if(url.pathname.includes('horaires_export'))return response({});
    if(url.pathname.includes('velib-disponibilite'))return response({results:[{stationcode:'12163',name:'Hippodrome Paris-Vincennes',mechanical:7,ebike:4,numdocksavailable:28,is_installed:'OUI',is_renting:'OUI'},{stationcode:'12128',name:'Pyramide – École du Breuil',mechanical:12,ebike:5,numdocksavailable:16,is_installed:'OUI',is_renting:'OUI'}]});
    if(url.pathname.includes('programme'))return response({programme:{reunions:[{hippodrome:{code:'VIN'},courses:[{heureDepart:started+600000,libelle:'Prix de Maure de Bretagne',numOrdre:8}]}]}});
    if(url.pathname.endsWith('.rss'))return response('<rss><channel><item><title>Jeu de test : actualité illustrative pour vérifier la mise en page</title><description>Test</description></item></channel></rss>');
    return response({});
  };
  document.addEventListener('DOMContentLoaded',()=>{
    const label = document.createElement('div');label.textContent='JEU DE TEST · '+mode.toUpperCase();label.style='position:fixed;bottom:0;left:0;background:#a51d32;color:white;padding:3px 8px;font:11px sans-serif;z-index:99';document.body.append(label);
    if(mode==='stale')setTimeout(()=>{failed=true;refreshPassages();window.refreshVHPRATPBus();window.refreshVelibFixed();window.refreshCoursesFixed();window.refreshTrafficFixed();},6000);
  });
})();
