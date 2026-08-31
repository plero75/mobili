const icons = {
  brand: `<svg class="brand-mark" viewBox="0 0 80 80" aria-hidden="true"><path d="M9 13c4-8 12-8 17 0l14 25 14-25c5-8 13-8 17 0 2 4 1 8-1 12L44 69c-2 4-6 4-8 0L10 25c-2-4-3-8-1-12Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 14 40 42 56 14" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  weather: `<svg class="meta-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true"><circle cx="40" cy="21" r="10"/><path d="M40 4v7M40 31v7M23 21h7M50 21h7M28 9l5 5M52 9l-5 5"/><path d="M17 49h30a10 10 0 0 0-1-20 15 15 0 0 0-28-1A11 11 0 0 0 17 49Z" fill="#041326"/></svg>`,
  bike: `<svg class="bike-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="15" cy="45" r="11"/><circle cx="50" cy="45" r="11"/><path d="m15 45 11-21 10 21H15Zm21 0 9-19h8M23 24h9M45 26l5 19"/></svg>`,
  walk: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><path d="m15 11 7 5 4 7M16 13l-5 7M19 17l-2 11M19 19l-8 9"/></svg>`,
  alert: `<svg class="alert-icon" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M40 8 73 68H7L40 8Z"/><path d="M40 29v19M40 58h.1"/></svg>`
};

const query = new URLSearchParams(location.search);
const requestedMode = (query.get('mode') || 'auto').toLowerCase();
let mode = requestedMode;

const brand = () => `<div class="brand">${icons.brand}<div class="brand-copy"><span>HIPPODROME</span><strong>PARIS-VINCENNES</strong></div></div>`;
const header = ({time='15:32', weather='21°C', weatherLabel='Ensoleillé', date='DIMANCHE 15 JUIN', meeting='RÉUNION 1', races='8 COURSES'} = {}) => `
  <header class="header">
    ${brand()}
    <div class="meta">${icons.weather}<div><span class="meta-value">${weather}</span><span class="meta-label">${weatherLabel}</span></div></div>
    <div class="meta"><div><span class="meta-value">${time}</span><span class="meta-label">${date}</span></div></div>
    <div class="meta"><div><span class="meta-value">${meeting}</span><span class="meta-label">${races}</span></div></div>
  </header>`;

const modeId = (kind, line) => kind === 'rer'
  ? `<div class="transport-id"><span class="mode-badge">RER</span><span class="line-badge round rer">${line}</span></div>`
  : `<div class="transport-id"><span class="mode-badge">BUS</span><span class="line-badge bus">${line}</span></div>`;

const walk = (text) => `<div class="walk">${icons.walk}<span>${text}</span></div>`;

const scheduleRows = (active='C4') => [
  ['15:57','C4','PRIX JACQUES DE VAULOGÉ','ATTELÉ'],
  ['16:32','C5','PRIX DE MARSAN','MONTÉ'],
  ['17:07','C6','PRIX DE BELLEVUE','ATTELÉ'],
  ['17:42','C7','PRIX DE MAUROUARD','MONTÉ'],
  ['18:17','C8','PRIX DE L’ÎLE-DE-FRANCE','ATTELÉ'],
  ['18:52','C9','PRIX DE LAVAL','MONTÉ']
].map(r => `<div class="schedule-row ${r[1]===active?'active':''}"><time>${r[0]}</time><span class="race">${r[1]}</span><span>${r[2]}</span><span class="discipline">${r[3]}</span></div>`).join('');

const arrival = () => `
  <section class="screen">
    ${header({time:'13:18', date:'DIMANCHE 15 JUIN'})}
    <div class="workspace">
      <div class="arrival-layout">
        <article class="panel arrival-countdown">
          <h1 class="section-title">Première course</h1>
          <div class="kicker">Départ dans</div>
          <div class="big-count">42<span class="time-unit">MIN</span></div>
          <div class="race-ref"><strong>C1 · 14:00</strong><br><span class="muted">Prix de la Porte de Vincennes</span></div>
        </article>
        <article class="panel arrival-program">
          <h2 class="section-title white">Programme du jour</h2>
          <div class="schedule">${[
            ['14:00','C1','PRIX DE LA PORTE DE VINCENNES','ATTELÉ'],
            ['14:35','C2','PRIX DE SAINT-MANDÉ','MONTÉ'],
            ['15:10','C3','PRIX DE FONTENAY','ATTELÉ'],
            ['15:45','C4','PRIX JACQUES DE VAULOGÉ','ATTELÉ'],
            ['16:20','C5','PRIX DE MARSAN','MONTÉ'],
            ['18:52','C9','DERNIÈRE COURSE','MONTÉ']
          ].map((r,i)=>`<div class="schedule-row ${i===0?'active':''}"><time>${r[0]}</time><span class="race">${r[1]}</span><span>${r[2]}</span><span class="discipline">${r[3]}</span></div>`).join('')}</div>
        </article>
        <article class="panel arrival-highlights">
          <h2 class="section-title white">Repères visiteurs</h2>
          <div class="visitor-cues">
            <div class="visitor-cue"><span>Courses</span><strong>6 au programme</strong><small>Dernière course à 18:52</small></div>
            <div class="visitor-cue"><span>Retour</span><strong>RER A conseillé</strong><small>Joinville-le-Pont à 12 min</small></div>
            <div class="visitor-cue"><span>Sur site</span><strong>Animations ouvertes</strong><small>Infos pratiques actualisées ici</small></div>
          </div>
        </article>
        <article class="panel arrival-animations">
          <h2 class="section-title">Temps forts</h2>
          <div class="list-compact"><div><time>14:45</time><span>Tirage au sort des jeux concours</span></div><div><time>16:30</time><span>Animation musicale en terrasse</span></div><div><time>17:50</time><span>Photo souvenir à l’arrivée</span></div></div>
        </article>
        <article class="panel arrival-events">
          <div class="event"><div class="event-date">20 SEPT.</div><div><div class="event-name">Grande brocante de Vincennes</div><div class="event-note">Entrée libre · Parvis de l’hippodrome</div></div></div>
          <div class="event"><div class="event-date">27–29 NOV.</div><div><div class="event-name">Mer & Vigne</div><div class="event-note">Producteurs, gastronomie et découvertes</div></div></div>
        </article>
        <article class="panel idfm transport-rail">
          <div class="rail-label"><div><strong class="section-title white">Information voyageurs</strong><span class="status green" style="margin-top:10px">Trafic normal</span></div></div>
          <div class="rail-list">
            <div class="rail-row">${modeId('rer','A')}<div class="rail-main"><strong>Joinville-le-Pont</strong><span>Direction Paris et l’ouest · 12 min à pied</span></div><div class="rail-time">Trafic normal</div></div>
            <div class="rail-row">${modeId('bus','77')}<div class="rail-main"><strong>Hippodrome de Vincennes</strong><span>Direction Gare de Lyon</span></div><div class="rail-time">7 min</div></div>
            <div class="rail-row">${modeId('bus','101')}<div class="rail-main"><strong>École du Breuil</strong><span>Direction Joinville-le-Pont RER</span></div><div class="rail-time">12 min</div></div>
          </div>
        </article>
      </div>
    </div>
    <span class="distance-test-label">MAQUETTE DE RECETTE · 1920 × 1080</span>
  </section>`;

const meeting = () => `
  <section class="screen">
    ${header()}
    <div class="workspace">
      <div class="meeting-layout">
        <article class="panel next-race">
          <h1 class="section-title">Prochaine course</h1>
          <div class="race-number">C4</div>
          <div class="race-title">PRIX JACQUES DE VAULOGÉ</div>
          <div class="race-detail">2 700 m · Attelé · 14 partants</div>
          <div class="big-time">15:57</div>
          <div class="count-label">Départ dans</div>
          <div class="big-count">24:38</div>
        </article>
        <article class="panel upcoming">
          <h2 class="section-title white">À suivre</h2>
          <div class="schedule">${scheduleRows('C4')}</div>
        </article>
        <article class="panel last-result">
          <h2 class="section-title white">Dernière arrivée · C3</h2>
          <div class="winner"><div class="winner-number">7</div><div class="winner-copy"><div class="place">1er</div><h2>NAT KING COLE</h2><p>Driver · A. Abrivard</p><p>1’12”3 · 2 700 m · Attelé</p></div></div>
          <div class="flash"><strong>À l’instant à Vincennes</strong><p>Très belle victoire de Nat King Cole dans le Prix de Fontenay.</p></div>
        </article>
        <div class="meeting-bottom">
        <article class="panel"><h2 class="section-title">Brèves à l’écran</h2><div class="brief-stack meeting-briefs"><div class="brief-item"><b>À retenir</b><span>La prochaine course devient le repère central de la réunion.</span></div><div class="brief-item"><b>Aussi</b><span>Les infos pratiques restent visibles sans prendre le dessus.</span></div></div></article>
          <article class="panel"><h2 class="section-title">Prochain événement</h2><div class="event" style="margin-top:28px"><div class="event-date">20 SEPT.</div><div><div class="event-name">Grande brocante</div><div class="event-note">Entrée libre · Parvis</div></div></div></article>
          <article class="panel"><h2 class="section-title white">Mobilité · situation normale</h2><div class="mini-transports">
            <div class="mini-transport">${modeId('rer','A')}<div class="mini-copy"><span class="mini-stop">Joinville-le-Pont</span><div class="sub">Vers Paris et l’ouest</div></div><div class="minutes">12 min à pied</div></div>
            <div class="mini-transport">${modeId('bus','77')}<div class="mini-copy"><span class="mini-stop">Hippodrome</span><div class="sub">Direction Gare de Lyon</div></div><div class="minutes">7 min</div></div>
            <div class="mini-transport">${modeId('bus','101')}<div class="mini-copy"><span class="mini-stop">École du Breuil</span><div class="sub">Direction Joinville-le-Pont</div></div><div class="minutes">12 min</div></div>
          </div></article>
        </div>
      </div>
    </div>
    <span class="distance-test-label">MAQUETTE DE RECETTE · 1920 × 1080</span>
  </section>`;

const transition = () => `
  <section class="screen">
    ${header({time:'18:03'})}
    <div class="workspace">
      <div class="transition-title"><h1>Préparez votre retour</h1><div class="last-count">Dernière course dans<strong>49:12</strong></div></div>
      <div class="transition-layout">
        <div class="transition-left">
          <article class="panel last-race-focus"><div><h2 class="section-title">Dernière course à venir</h2><h2>C9 · PRIX DE LAVAL</h2><p class="race-detail">2 850 m · Monté · 12 partants</p></div><div><div class="big-time">18:52</div><p class="muted small">La mobilité prendra tout l’écran au départ de cette course.</p></div></article>
          <article class="panel"><h2 class="section-title white">Fin de programme</h2><div class="remaining-schedule"><div class="remaining-card"><strong>C8 · 18:17</strong><span>Prix de l’Île-de-France · Attelé</span></div><div class="remaining-card"><strong>C9 · 18:52</strong><span>Prix de Laval · Dernière course</span></div></div><div class="flash" style="margin-top:20px"><strong>À retenir</strong><p>Le bus 77 dessert directement Gare de Lyon.</p></div></article>
        </div>
        <div class="transition-right">
          <article class="panel idfm rer-preview"><div class="rer-preview-head"><div><div class="transport-name">RER A · JOINVILLE-LE-PONT</div>${walk('12 min à pied depuis l’hippodrome')}</div><span class="status green">Trafic normal</span></div><div>
            <div class="departure-row"><div class="departure-time">18:42</div><div class="departure-dest"><strong>Direction Saint-Germain-en-Laye</strong><span>Nation · Gare de Lyon · Châtelet · Auber</span></div><div class="reachable">✓ ATTEIGNABLE</div></div>
            <div class="departure-row"><div class="departure-time">18:50</div><div class="departure-dest"><strong>Direction Cergy-le-Haut</strong><span>Nation · Gare de Lyon · Châtelet · La Défense</span></div><div class="reachable">✓ ATTEIGNABLE</div></div>
          </div></article>
          <div class="transition-modes">
            <article class="mode-card">${modeId('bus','77')}<div class="minutes">7 min</div><div class="sub">Gare de Lyon · puis 19 min</div></article>
            <article class="mode-card">${modeId('bus','101')}<div class="minutes">12 min</div><div class="sub">Joinville-le-Pont · puis 26 min</div></article>
            <article class="mode-card">${icons.bike}<div class="minutes">14 vélos</div><div class="sub">Station Hippodrome · 4 min à pied</div></article>
          </div>
        </div>
      </div>
    </div>
    <span class="distance-test-label">MAQUETTE DE RECETTE · 1920 × 1080</span>
  </section>`;

const exit = () => `
  <section class="screen">
    ${header({time:'19:05', races:'RÉUNION TERMINÉE'})}
    <div class="workspace">
      <div class="exit-head"><h1>Votre retour depuis l’hippodrome</h1><p>Départs calculés à 19:05 · situation normale</p></div>
      <div class="exit-layout">
        <article class="panel idfm rer-main">
          <div class="rer-main-head"><div><div class="transport-id">${modeId('rer','A')}<div><div class="transport-name">JOINVILLE-LE-PONT</div><div class="transport-direction">RER A vers Paris et l’ouest</div></div></div></div><div>${walk('12 min à pied')}<span class="status green" style="margin-top:10px">Trafic normal</span></div></div>
          <div class="rer-departures">
            <div class="rer-departure best"><div><span class="hour">19:20</span><span class="delay">dans 15 min</span></div><h3>Direction Saint-Germain-en-Laye</h3><p>✓ Atteignable avec 3 min de marge</p></div>
            <div class="rer-departure"><div><span class="hour">19:28</span><span class="delay">dans 23 min</span></div><h3>Direction Cergy-le-Haut</h3><p>Départ suivant</p></div>
          </div>
          <div class="stops"><div class="stops-title">Principales gares desservies · arrivée estimée</div><div class="stop-line"><div class="stop"><strong>Nation</strong><span>19:28</span></div><div class="stop"><strong>Gare de Lyon</strong><span>19:32</span></div><div class="stop"><strong>Châtelet</strong><span>19:36</span></div><div class="stop"><strong>Auber</strong><span>19:40</span></div><div class="stop"><strong>La Défense</strong><span>19:51</span></div></div></div>
        </article>
        <div class="exit-side">
          <article class="bus-main"><div class="bus-main-head"><div>${modeId('bus','77')}<div class="transport-direction">Direction Gare de Lyon</div></div>${walk('Arrêt Hippodrome · 4 min')}</div><div class="passages"><strong>8 min</strong><span>puis <b>20 min</b></span></div><div class="route">Porte Dorée · Daumesnil · Bercy · Gare de Lyon</div></article>
          <article class="bus-main"><div class="bus-main-head"><div>${modeId('bus','101')}<div class="transport-direction">Direction Joinville-le-Pont</div></div>${walk('Arrêt École du Breuil · 7 min')}</div><div class="passages"><strong>13 min</strong><span>puis <b>27 min</b></span></div><div class="route">École du Breuil · Joinville-le-Pont RER</div></article>
          <article class="velib-main"><div class="velib-station"><h3>VÉLIB’ · HIPPODROME</h3>${walk('4 min à pied')}<div class="velib-numbers"><strong>14</strong><span>vélos · 22 places</span></div></div><div class="velib-station"><h3>VÉLIB’ · ÉCOLE DU BREUIL</h3>${walk('7 min à pied')}<div class="velib-numbers"><strong>19</strong><span>vélos · 11 places</span></div></div></article>
        </div>
      </div>
    </div>
    <span class="distance-test-label">MAQUETTE DE RECETTE · 1920 × 1080</span>
  </section>`;

const incidentRer = () => `
  <section class="screen incident-workspace">
    ${header({time:'18:47'})}
    <div class="workspace">
      <div class="incident-banner"><div class="incident-symbol">${icons.alert}${modeId('rer','A')}</div><h1>RER A<span>Trafic interrompu</span></h1><div class="incident-time"><span>Reprise estimée</span><strong>19:30</strong></div></div>
      <div class="incident-layout">
        <article class="incident-impact"><h2>Ce qui est interrompu</h2><div class="impact-message">Aucun train entre Joinville-le-Pont et Nation.</div><div class="impact-zone">Incident affectant votre trajet vers Paris</div><div class="impact-detail">Le départ depuis Joinville-le-Pont n’est pas recommandé jusqu’à la reprise. Les bus 77 et 101 circulent normalement.</div><div class="incident-source">Information voyageurs actualisée à 18:47</div></article>
        <article class="incident-alt"><h2>Alternative conseillée</h2><div class="alternative-card primary"><div class="alt-head"><div>${modeId('bus','77')}<div class="transport-direction">Direction Gare de Lyon</div></div><div class="alt-time">8 min</div></div><div class="alt-main">Rejoignez directement Paris</div><div class="alt-detail">Arrêt Hippodrome de Vincennes · 4 min à pied<br>Prochain passage : 18:55 · puis 19:07</div></div><div class="alternative-card"><div class="alt-head"><div>${modeId('bus','101')}<div class="transport-direction">Direction Joinville-le-Pont</div></div><div class="alt-time">13 min</div></div><div class="alt-detail">Solution locale uniquement · évitez ensuite le RER A vers Paris tant que le trafic reste interrompu.</div></div></article>
      </div>
    </div>
    <span class="distance-test-label">MAQUETTE DE RECETTE · 1920 × 1080</span>
  </section>`;

const incidentBus = () => `
  <section class="screen incident-workspace">
    ${header({time:'18:47'})}
    <div class="workspace">
      <div class="incident-banner"><div class="incident-symbol">${icons.alert}${modeId('bus','77')}</div><h1>BUS 77<span>Arrêt Hippodrome non desservi</span></h1><div class="incident-time"><span>Reprise estimée</span><strong>20:00</strong></div></div>
      <div class="incident-layout">
        <article class="incident-impact"><h2>Ce qui change</h2><div class="impact-message">La ligne 77 est déviée dans le secteur de l’hippodrome.</div><div class="impact-zone">Arrêt « Hippodrome de Vincennes » non desservi</div><div class="impact-detail">Ne restez pas à l’arrêt habituel. La ligne 101 et le RER A circulent normalement.</div><div class="incident-source">Information voyageurs actualisée à 18:47</div></article>
        <article class="incident-alt"><h2>Vos solutions</h2><div class="alternative-card primary"><div class="alt-head"><div>${modeId('rer','A')}<div class="transport-direction">Depuis Joinville-le-Pont</div></div><div class="alt-time">12 min à pied</div></div><div class="alt-main">Vers Nation et Gare de Lyon</div><div class="alt-detail">Prochain départ atteignable : 19:04<br>Nation 19:12 · Gare de Lyon 19:16</div></div><div class="alternative-card"><div class="alt-head"><div>${modeId('bus','101')}<div class="transport-direction">Direction Joinville-le-Pont</div></div><div class="alt-time">11 min</div></div><div class="alt-detail">Arrêt École du Breuil · 7 min à pied<br>Passage suivant : 19:12</div></div></article>
      </div>
    </div>
    <span class="distance-test-label">MAQUETTE DE RECETTE · 1920 × 1080</span>
  </section>`;

const noRaceEvent = () => `
  <section class="screen">
    ${header({meeting:'AUJOURD’HUI', races:'PAS DE COURSES'})}
    <div class="workspace">
      <div class="no-race-event-layout">
        <article class="panel no-race-event-main">
          <div class="eyeline">Aujourd’hui à Paris-Vincennes</div>
          <h1>Événement du jour</h1>
          <div class="no-race-event-date">Agenda officiel en cours de chargement</div>
          <p class="no-race-event-copy">Les informations de l’événement sont récupérées automatiquement.</p>
          <div class="no-race-event-access"></div>
          <div class="no-race-secondary">Pas de courses aujourd’hui</div>
        </article>
        <aside class="no-race-side">
          <article class="panel next-meeting-card"><h2 class="section-title">Prochaine réunion</h2><div class="no-race-big">—</div><p>Programme en cours de chargement</p></article>
          <article class="panel idfm no-race-mobility"><h2 class="section-title white">Venir à Paris-Vincennes</h2><div class="no-race-mobility-list"></div></article>
        </aside>
        <article class="panel no-race-footer"><h2 class="section-title">Prochain rendez-vous</h2><div class="no-race-next-event">Agenda officiel en cours de chargement</div></article>
      </div>
    </div>
    <span class="distance-test-label">DONNÉES TEMPS RÉEL · CHARGEMENT</span>
  </section>`;

const noRaceIdle = () => `
  <section class="screen">
    ${header({meeting:'PARIS-VINCENNES', races:'PAS DE COURSES'})}
    <div class="workspace">
      <div class="no-race-idle-layout">
        <article class="panel no-race-news-main">
          <div class="no-race-status">Pas de courses aujourd’hui</div>
          <div class="editorial-label">Les brèves du moment</div>
          <h1 class="no-race-news-title">Actualités en cours de chargement</h1>
          <p class="no-race-news-summary">Les principaux titres de la journée vont s’afficher automatiquement.</p>
          <div class="no-race-news-meta"><span>FRANCEINFO</span><time>À L’INSTANT</time></div>
          <div class="no-race-news-strip" aria-label="Autres titres"></div>
        </article>
        <article class="panel no-race-horoscope">
          <div class="horoscope-heading"><h2>Pause horoscope</h2><span>Divertissement</span></div>
          <div class="horoscope-grid"></div>
          <div class="horoscope-progress" aria-hidden="true"><i></i><i></i><i></i></div>
        </article>
        <article class="panel no-race-agenda">
          <div class="next-meeting-focus"><span>Prochaine réunion</span><strong>Chargement…</strong><small>Programme officiel</small></div>
          <div class="no-race-next-event"><span>Prochain rendez-vous</span><strong>Agenda en cours de chargement</strong></div>
        </article>
        <article class="panel idfm no-race-access"><h2 class="section-title white">Venir à Paris-Vincennes</h2><div class="no-race-access-grid"></div></article>
      </div>
    </div>
    <span class="distance-test-label">DONNÉES TEMPS RÉEL · CHARGEMENT</span>
  </section>`;

const renderers = { arrivee: arrival, reunion: meeting, transition, sortie: exit, incident_rer_a: incidentRer, incident_bus: incidentBus, no_race_event: noRaceEvent, no_race_idle: noRaceIdle };
document.getElementById('app').innerHTML = (renderers[mode] || arrival)();

function fitRecipeScreen() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  app.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

window.addEventListener('resize', fitRecipeScreen);
fitRecipeScreen();

const keyboardModes = {
  '1': 'arrivee',
  '2': 'reunion',
  '3': 'transition',
  '4': 'sortie',
  '5': 'incident_rer_a',
  '6': 'incident_bus',
  '7': 'no_race_event',
  '8': 'no_race_idle',
  '0': 'auto'
};

window.addEventListener('keydown', (event) => {
  const nextMode = keyboardModes[event.key];
  if (!nextMode) return;
  const url = new URL(window.location.href);
  if (nextMode === 'auto') url.searchParams.delete('mode');
  else url.searchParams.set('mode', nextMode);
  window.location.href = url.toString();
});
