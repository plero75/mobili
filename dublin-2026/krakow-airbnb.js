(()=>{
  const C=window.CARNET||{};
  if(C.id!=='krakow')return;

  const placNowy='https://s.inyourpocket.com/gallery/96943.jpg';
  const zapiekanki='https://estaticos-cdn.prensaiberica.es/clip/44ab2115-4137-4f29-8d55-e55390e20a0e_original-libre-aspect-ratio_default_0.jpg';
  const city='images/destinations/krakow.jpg';

  const stays=[
    {
      id:'airbnb-heart-kazimierz',
      badge:'🔥 NOTRE CHOIX #1',
      title:'Heart of Kazimierz — Plac Nowy',
      meta:'8 voyageurs · 3 chambres · 4 lits · 1,5 salle de bain',
      rating:'★ 5,0 · 4 avis',
      why:'Le plus “week-end des petits chats” : directement sur Plac Nowy, mais caché dans une cour calme. Salon + cuisine pour être tous ensemble et vieille ville à ≈15 min à pied.',
      note:'Très peu d’avis pour l’instant : emplacement canon, mais on vérifie bien les commentaires avant de réserver.',
      sleeping:'3 chambres pour éviter le dortoir improvisé, 4 lits au total et une vraie pièce commune pour l’apéro / petit-déj.',
      location:'Plac Nowy : bars, cafés, zapiekanki et Józefa quasiment sous les fenêtres.',
      best:'Le choix “on vit vraiment Kazimierz” : zéro transport le soir et tout le groupe reste ensemble.',
      watch:'Seulement 4 avis : on sécurise avec une lecture complète des commentaires + règles de la maison.',
      facts:['3 chambres','4 lits','1,5 SDB','Cuisine + salon'],
      gallery:[
        {src:'https://a0.muscache.com/im/pictures/hosting/Hosting-1697136121717033902/original/758ce3fb-8238-49db-bc10-6c67241d4f0e.jpeg?im_w=960',label:'Le logement'},
        {src:placNowy,label:'Plac Nowy'},
        {src:zapiekanki,label:'À 2 pas'}
      ],
      url:'https://www.airbnb.fr/rooms/1697136121717033902?check_in=2026-10-23&check_out=2026-10-25&guests=8&adults=8'
    },
    {
      id:'airbnb-wolnica',
      badge:'💚 MEILLEUR ÉQUILIBRE',
      title:'3 chambres — Plac Wolnica 12a',
      meta:'8 voyageurs · 3 chambres · 4 lits · 2 salles de bain',
      rating:'★ 4,79 · 121 avis · Superhôte',
      why:'En plein Kazimierz, avec 2 salles de bain — détail pas sexy mais extrêmement stratégique à 8. Le logement annonce aussi une baignoire + une douche/sauna.',
      note:'Très bon compromis emplacement / nombre d’avis / confort pour un groupe.',
      sleeping:'3 chambres, 4 lits et surtout 2 salles de bain : à 8 le matin, c’est probablement le meilleur ratio paix sociale / confort.',
      location:'Plac Wolnica, au sud de Kazimierz : plus calme que Plac Nowy mais toujours à quelques minutes à pied des bars.',
      best:'Le plus rationnel pour 8 : assez central pour sortir à pied, assez confortable pour ne pas se marcher dessus.',
      watch:'À contrôler : configuration exacte du 4e lit, règles concernant les groupes et éventuels frais additionnels.',
      facts:['3 chambres','4 lits','2 SDB','Superhôte'],
      gallery:[
        {src:'https://a0.muscache.com/im/pictures/miso/Hosting-1043601942861465967/original/93fc7850-ae08-40a0-ac4d-2dcfda6d0cff.jpeg?im_w=960',label:'Le logement'},
        {src:city,label:'Le quartier'},
        {src:placNowy,label:'Sorties à pied'}
      ],
      url:'https://www.airbnb.fr/rooms/1043601942861465967?check_in=2026-10-23&check_out=2026-10-25&guests=8&adults=8'
    },
    {
      id:'airbnb-cashmere',
      badge:'⭐ VALEUR SÛRE',
      title:'Cashmere Apt. — 3BR + balcon',
      meta:'8 voyageurs · 3 chambres · 4 lits · 2 salles de bain',
      rating:'★ 4,86 · 228 avis · Coup de cœur voyageurs',
      why:'Le plus rassurant côté historique d’avis. 3 vraies chambres, 2 salles de bain, balcon et Kazimierz à environ 10 min à pied.',
      note:'Un peu moins “au pied des bars” que Plac Nowy, mais plus de recul et beaucoup plus d’avis.',
      sleeping:'3 chambres + 4 lits + 2 salles de bain : une configuration qui fonctionne bien pour une bande sans transformer le salon en dortoir.',
      location:'Rejtana : juste de l’autre côté de la Vistule, avec Kazimierz rapidement accessible à pied.',
      best:'La valeur sûre : beaucoup d’avis, configuration groupe solide et un peu plus de calme pour dormir.',
      watch:'Moins central pour les retours très tardifs : compter une petite marche de plus par rapport aux deux autres.',
      facts:['3 chambres','4 lits','2 SDB','Balcon'],
      gallery:[
        {src:'https://a0.muscache.com/im/pictures/miso/Hosting-788495756546876558/original/43ba6ee4-bdd5-4989-bd42-f740a9b0e9bb.jpeg?im_w=960',label:'Le logement'},
        {src:city,label:'Cracovie'},
        {src:placNowy,label:'Kazimierz proche'}
      ],
      url:'https://www.airbnb.fr/rooms/788495756546876558?check_in=2026-10-23&check_out=2026-10-25&guests=8&adults=8'
    }
  ];

  const hotelSection=document.getElementById('hotels');
  if(!hotelSection||document.getElementById('airbnb'))return;

  const section=document.createElement('section');
  section.id='airbnb';
  section.className='airbnb-picks';
  section.innerHTML=`
    <div class="w">
      <div class="airbnb-head">
        <div>
          <div class="section-note">Sélection repérée pour 8 · 23 → 25 octobre 2026</div>
          <h2>🏠 Les Airbnb qu’on regarderait vraiment</h2>
          <p class="lead">Trois options avec une vraie logique de groupe. On regarde ici <b>où on dort, combien de salles de bain, l’ambiance du quartier et le niveau de tranquillité</b> — pas juste une jolie photo.</p>
        </div>
        <a class="airbnb-search" href="https://www.airbnb.fr/s/Kazimierz--Krak%C3%B3w--Pologne/homes?checkin=2026-10-23&checkout=2026-10-25&adults=8" target="_blank" rel="noopener">Voir toute la recherche Airbnb ↗</a>
      </div>
      <div class="airbnb-grid">
        ${stays.map((s,i)=>`<article class="airbnb-card ${i===0?'is-pick':''}">
          <div class="airbnb-gallery">
            <a class="airbnb-gallery-main" href="${s.url}" target="_blank" rel="noopener">
              <img src="${s.gallery[0].src}" alt="${s.title}" loading="lazy">
              <span>${s.gallery[0].label}</span>
            </a>
            <div class="airbnb-gallery-side">
              ${s.gallery.slice(1).map(g=>`<a href="${s.url}" target="_blank" rel="noopener"><img src="${g.src}" alt="${g.label}" loading="lazy"><span>${g.label}</span></a>`).join('')}
            </div>
          </div>
          <div class="airbnb-card-body">
            <div class="airbnb-title-row"><span class="airbnb-badge">${s.badge}</span><div class="airbnb-rating">${s.rating}</div></div>
            <h3>${s.title}</h3>
            <div class="airbnb-meta">${s.meta}</div>
            <div class="airbnb-facts">${s.facts.map(f=>`<span>${f}</span>`).join('')}</div>
            <p class="airbnb-summary">${s.why}</p>
            <div class="airbnb-detail-grid">
              <div><small>🛏️ Côté couchage</small><p>${s.sleeping}</p></div>
              <div><small>📍 Emplacement</small><p>${s.location}</p></div>
              <div class="is-good"><small>✅ Pourquoi on le garde</small><p>${s.best}</p></div>
              <div class="is-watch"><small>⚠️ À vérifier</small><p>${s.watch}</p></div>
            </div>
            <div class="airbnb-note">${s.note}</div>
            <div class="airbnb-actions">
              <a class="btn" href="${s.url}" target="_blank" rel="noopener">Voir l’annonce + toutes les photos ↗</a>
              <div class="vote" data-id="${s.id}"><button data-v="oui">❤️ Je vote</button><button data-v="bof">🤔</button><button data-v="non">👎</button></div>
            </div>
          </div>
        </article>`).join('')}
      </div>
      <p class="airbnb-disclaimer">La première image de chaque carte vient de l’annonce ; les petites images servent à montrer le quartier / l’ambiance autour. Disponibilité, prix, nombre d’avis et règles peuvent évoluer : Airbnb reste la source à vérifier avant réservation.</p>
    </div>`;

  hotelSection.insertAdjacentElement('afterend',section);

  const nav=document.querySelector('nav .w');
  if(nav&&!nav.querySelector('a[href="#airbnb"]')){
    const a=document.createElement('a');a.href='#airbnb';a.textContent='Airbnb';
    const manger=nav.querySelector('a[href="#manger"]');
    if(manger)nav.insertBefore(a,manger);else nav.appendChild(a);
  }
})();
