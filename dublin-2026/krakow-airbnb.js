(()=>{
  const C=window.CARNET||{};
  if(C.id!=='krakow')return;

  const stays=[
    {
      id:'airbnb-heart-kazimierz',
      badge:'🔥 NOTRE CHOIX #1',
      title:'Heart of Kazimierz — Plac Nowy',
      meta:'8 voyageurs · 3 chambres · 4 lits · 1,5 salle de bain',
      rating:'★ 5,0 · 4 avis',
      why:'Le plus “week-end des petits chats” : directement sur Plac Nowy, mais caché dans une cour calme. Salon + cuisine pour être tous ensemble et vieille ville à ≈15 min à pied.',
      note:'Très peu d’avis pour l’instant : emplacement canon, mais on vérifie bien les commentaires avant de réserver.',
      img:'https://a0.muscache.com/im/pictures/hosting/Hosting-1697136121717033902/original/758ce3fb-8238-49db-bc10-6c67241d4f0e.jpeg?im_w=720',
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
      img:'https://a0.muscache.com/im/pictures/miso/Hosting-1043601942861465967/original/93fc7850-ae08-40a0-ac4d-2dcfda6d0cff.jpeg?im_w=720',
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
      img:'https://a0.muscache.com/im/pictures/miso/Hosting-788495756546876558/original/43ba6ee4-bdd5-4989-bd42-f740a9b0e9bb.jpeg?im_w=720',
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
          <p class="lead">Trois annonces qui collent au plan : <b>3 chambres minimum, vraie vie de groupe et Kazimierz à pied</b>. Prix et disponibilité restent à confirmer directement sur Airbnb pour les dates du week-end.</p>
        </div>
        <a class="airbnb-search" href="https://www.airbnb.fr/s/Kazimierz--Krak%C3%B3w--Pologne/homes?checkin=2026-10-23&checkout=2026-10-25&adults=8" target="_blank" rel="noopener">Voir toute la recherche Airbnb ↗</a>
      </div>
      <div class="airbnb-grid">
        ${stays.map((s,i)=>`<article class="airbnb-card ${i===0?'is-pick':''}">
          <a class="airbnb-photo" href="${s.url}" target="_blank" rel="noopener"><img src="${s.img}" alt="${s.title}" loading="lazy"></a>
          <div class="airbnb-card-body">
            <span class="airbnb-badge">${s.badge}</span>
            <h3>${s.title}</h3>
            <div class="airbnb-meta">${s.meta}</div>
            <div class="airbnb-rating">${s.rating}</div>
            <p>${s.why}</p>
            <div class="airbnb-note">${s.note}</div>
            <div class="airbnb-actions">
              <a class="btn" href="${s.url}" target="_blank" rel="noopener">Voir sur Airbnb ↗</a>
              <div class="vote" data-id="${s.id}"><button data-v="oui">❤️ Je vote</button><button data-v="bof">🤔</button><button data-v="non">👎</button></div>
            </div>
          </div>
        </article>`).join('')}
      </div>
      <p class="airbnb-disclaimer">Sélection vérifiée le 05/09/2026 à partir des annonces Airbnb publiques. Les notes, disponibilités et tarifs peuvent évoluer ; le lien ouvre directement les dates du 23 au 25 octobre pour 8 adultes.</p>
    </div>`;

  hotelSection.insertAdjacentElement('afterend',section);

  const nav=document.querySelector('nav .w');
  if(nav&&!nav.querySelector('a[href="#airbnb"]')){
    const a=document.createElement('a');a.href='#airbnb';a.textContent='Airbnb';
    const manger=nav.querySelector('a[href="#manger"]');
    if(manger)nav.insertBefore(a,manger);else nav.appendChild(a);
  }
})();
