---
name: Mobili — écran mobilité Paris-Vincennes
description: Panneau voyageur en direct pour les départs réellement atteignables depuis l'hippodrome.
colors:
  pv-navy: "#041326"
  pv-navy-2: "#081a31"
  pv-panel: "#0b2038"
  pv-panel-soft: "#102741"
  pv-gold: "#f2b625"
  pv-gold-soft: "#d89e17"
  white: "#f7f9fc"
  muted: "#aebdcd"
  line: "#34506b"
  idfm: "#25303b"
  idfm-white: "#f0f0f0"
  green: "#75c043"
  cyan: "#22c6b7"
  rer-a: "#e3051b"
  bus-blue: "#1674a5"
  alert: "#d6413a"
  alert-soft: "#4a191c"
  warning: "#f39a2e"
  ratp-blue: "#050f73"
  ratp-cyan: "#77cfe5"
  ratp-ink: "#170d10"
  ratp-paper: "#ffffff"
  ratp-yellow: "#d7cf32"
  ratp-green: "#159447"
  ratp-grey: "#d7d7d7"
typography:
  display:
    fontFamily: "Inter, DejaVu Sans, Arial, sans-serif"
    fontSize: "128px"
    fontWeight: 850
    lineHeight: ".95"
    letterSpacing: "-.055em"
  headline:
    fontFamily: "Inter, DejaVu Sans, Arial, sans-serif"
    fontSize: "49px"
    fontWeight: 800
    lineHeight: "1.05"
  title:
    fontFamily: "Inter, DejaVu Sans, Arial, sans-serif"
    fontSize: "31px"
    fontWeight: 780
    lineHeight: "1.2"
  body:
    fontFamily: "Inter, DejaVu Sans, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "1.35"
  label:
    fontFamily: "Inter, DejaVu Sans, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: "1.1"
    letterSpacing: ".055em"
rounded:
  none: "0"
  sm: "2px"
  md: "4px"
  panel: "3px"
  lg: "24px"
  hero: "30px 92px 30px 30px"
spacing:
  xs: "8px"
  sm: "13px"
  md: "15px"
  lg: "22px"
  xl: "28px"
components:
  panel:
    backgroundColor: "{colors.pv-panel}"
    textColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "24px 28px"
  panel-ratp:
    backgroundColor: "{colors.ratp-paper}"
    textColor: "{colors.ratp-blue}"
    rounded: "{rounded.panel}"
    padding: "17px 22px"
  line-badge:
    backgroundColor: "{colors.bus-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    height: "56px"
  status:
    backgroundColor: "{colors.green}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    size: "12px"
---

# Design System: Mobili

## Overview

**Creative North Star: "Le terminal de course en direct"**

Mobili se comporte comme un terminal de transport public enrichi par l'énergie d'un hippodrome. La hiérarchie est conçue pour une lecture debout et à distance : un temps ou une destination doit émerger immédiatement, puis les détails de desserte, d'accès et de statut viennent confirmer la décision.

Le système combine une signalétique robuste avec une densité d'information assumée. Le monde principal est sombre, profond et événementiel; la variante RATP passe en blanc, bleu signalétique et jaune d'alerte pour évoquer un affichage de quai plus normé. Les deux variantes partagent la même exigence de précision, de statut explicite et de lecture rapide.

Le header de la variante recette affiche désormais une hiérarchie explicite : nom du lieu, titre de l'écran, sous-titre de contexte, météo, heure et réunion. Les écrans d'incident suivent la même logique de lecture, avec impact, statut de ligne, consigne et horodatage.

**Key Characteristics:**
- Signalétique publique à forte lisibilité.
- Densité opérationnelle adaptée à un écran 1920 × 910.
- Accent jaune pour l'attention, rouge pour le RER A, vert pour l'atteignabilité et le temps réel.
- Couches de panneaux et ombres dans le monde sombre; aplats nets dans la variante RATP.

## Colors

La palette associe un bleu nuit institutionnel, des accents de service très codés et des neutres froids. Le jaune est rare et sert à orienter le regard vers les temps, les prochaines courses et les informations importantes.

### Primary
- **Jaune hippodrome** (#f2b625): temps forts, compteurs, prochains départs, courses et repères d'attention dans le monde principal.
- **Bleu RATP** (#050f73): identité et texte principal de la variante d'affichage RATP.

### Secondary
- **Cyan signalétique** (#22c6b7): Vélib', bande de bas d'écran et repères de mobilité.
- **Vert atteignable** (#75c043): départs accessibles, disponibilité et états positifs.
- **Rouge RER A** (#e3051b): ligne RER A et continuité de parcours.
- **Bleu bus** (#1674a5): badges et repères des lignes de bus.

### Tertiary
- **Jaune RATP** (#d7cf32): temps mis en avant dans la variante RATP.
- **Rouge alerte** (#d6413a): incidents et états dégradés.

### Neutral
- **Nuit principale** (#041326): arrière-plan du terminal et espace de lecture.
- **Panneau bleu nuit** (#0b2038): surface principale des panneaux.
- **Panneau doux** (#102741): sous-surfaces et regroupements de données.
- **Blanc signalétique** (#f7f9fc): texte principal sur fond sombre.
- **Gris muet** (#aebdcd): informations secondaires et explications.
- **Ligne bleue** (#34506b): séparateurs et contours discrets.
- **Papier RATP** (#ffffff): surfaces de la variante claire.

### Named Rules
**The Signal First Rule.** Une couleur d'accent doit renforcer une décision ou un statut; elle ne doit pas décorer une surface déjà dense.

## Typography

**Display Font:** Inter (avec DejaVu Sans et Arial en secours)
**Body Font:** Inter (avec DejaVu Sans et Arial en secours)
**Label/Mono Font:** Arial dans la variante RATP; les données restent tabulaires et fortement pondérées.

**Character:** La typographie est compacte, technique et lisible à distance. Les très grands chiffres et les titres courts donnent un point d'ancrage, tandis que les labels en capitales et espacés codent les catégories et statuts.

### Hierarchy
- **Display** (850, 128 px, .95): compte à rebours, heure principale et valeur de premier niveau.
- **Headline** (800, 49 px, 1.05): titres de vues événementielles et de transitions.
- **Title** (780, 31 px, 1.2): nom de course, destination ou bloc important.
- **Body** (400, 18 px, 1.35): contexte, itinéraire et détails lisibles à distance.
- **Label** (800, 15 px, 1.1, espacement .055em): métadonnées, catégories, états et repères de service.

### Named Rules
**The Countdown Rule.** Les chiffres dominants doivent rester courts, lourds et immédiatement interprétables; les unités sont secondaires mais toujours visibles.

## Layout

La surface de référence est un canvas fixe de 1920 × 910, centré et ajusté à la fenêtre. Les layouts principaux utilisent des grilles explicites en pixels pour stabiliser l'affichage sur écran public: par exemple 590 / 706 / 550 px pour la vue des arrivées et 585 / 472 / 789 px pour la vue de réunion. Les motifs décoratifs restent contenus dans ce canvas afin de ne pas créer de débordement horizontal sur viewport étroit.

Les panneaux sont organisés en zones fonctionnelles plutôt qu'en flux éditorial : compte à rebours ou départ principal, programme, faits saillants, événements et rail transport. Les espaces courants sont de 8, 13, 15, 22 et 28 px. Les lignes de programme et de départ utilisent des séparateurs horizontaux fins pour maintenir la densité sans transformer chaque information en carte indépendante.

La variante RATP resserre la hauteur utile à 910 px, réduit les gaps jusqu'à 8 px et remplace les layouts sombres par des panneaux blancs à bordure nette. Les mises en page mobiles ne sont pas une cible primaire de cette surface.

## Elevation & Depth

Le système principal est étagé et immersif : le fond bleu nuit, les panneaux bleu profond et les sous-surfaces créent une hiérarchie tonale, complétée par des ombres noires neutres comme `0 8px 28px rgba(0, 0, 0, .18)`. Les halos colorés et les bandes incrustées ont été retirés pour éviter une profondeur décorative trop forte. La variante RATP est volontairement plus plate : `box-shadow: none` ou ombres neutres, bordures claires et contraste bleu/blanc font le travail de profondeur.

### Shadow Vocabulary
- **Panel ambient** (`0 8px 28px rgba(0, 0, 0, .18)`): séparation douce des panneaux dans le monde sombre.
- **Immersive panel** (`0 22px 55px rgba(0, 7, 19, .31)`): profondeur renforcée dans les compositions événementielles.
- **RATP flat** (`none`): affichage public net, sans effet de flottement.

## Shapes

La géométrie alterne entre la rigueur du quai et quelques silhouettes événementielles. Les panneaux RATP utilisent des angles presque carrés de 2 à 3 px; les badges de bus utilisent 4 px; les cues du monde principal peuvent atteindre 24 px et certains héros utilisent `30px 92px 30px 30px`. Les cercles sont réservés aux badges RER, modes et points de parcours. Les bordures et séparateurs restent fins et fonctionnels.

## Components

### Buttons and Links
- **Shape:** Les actions héritent de la géométrie de la variante: carrée et signalétique en RATP, plus douce dans les surfaces événementielles.
- **Primary:** Utiliser le bleu RATP ou le jaune hippodrome avec un texte très contrasté; réserver les grandes surfaces colorées aux actions ou statuts prioritaires.
- **Hover / Focus:** Le focus doit rester visible par contraste et contour; aucune interaction ne doit dépendre uniquement d'un changement de couleur.

### Chips and Badges
- **Style:** Les badges de ligne sont compacts, fortement pondérés et codés par mode: cercle pour le RER, rectangle bleu pour les bus.
- **State:** Les statuts utilisent vert, jaune, rouge ou gris avec un libellé explicite, jamais la couleur seule.

### Cards / Containers
- **Corner Style:** 2 à 4 px en variante RATP; jusqu'à 24 px pour les cues et surfaces événementielles.
- **Background:** Panneaux `#0b2038` et `#102741` sur nuit; blanc ou gris clair dans la variante RATP.
- **Shadow Strategy:** Se reporter à Elevation & Depth; les ombres sont structurelles dans le monde sombre et absentes en RATP.
- **Border:** Bordures bleues discrètes sur fond sombre, bordures grises ou blanches en RATP.
- **Internal Padding:** 17 à 30 px selon la densité et la taille du panneau.

### Navigation

La navigation est contextuelle à chaque écran et prend la forme de titres de vue, métadonnées, rails transport et repères de dernière mise à jour. Elle doit rester secondaire par rapport au prochain départ ou au compte à rebours.

### Signature Component: Transport Rail

Le rail transport résume plusieurs modes dans une bande commune. Il associe badge de mode et de ligne, destination, contexte d'accès et heure ou délai à droite. Il doit être stable, scannable et capable de signaler l'atteignabilité sans nécessiter l'ouverture d'une vue détaillée.

### Signature Component: Incident Banner

La bannière incident expose d'abord la ligne et le type d'événement, puis sépare l'impact sur le trajet, le statut de la source, la consigne et l'heure de mise à jour. Quand le flux est indisponible, elle doit dire « statut non confirmé » et ne jamais laisser entendre un retour à la normale.

## Do's and Don'ts

### Do:
- **Do** conserver le canvas public 1920 × 910 et des dimensions stables pour les grilles principales.
- **Do** utiliser le jaune hippodrome pour guider l'attention vers le prochain événement, pas comme remplissage général.
- **Do** afficher les libellés de statut avec les couleurs : « à l'approche », « supprimé », « atteignable », « indisponible ».
- **Do** préserver la distinction visuelle RER / bus / Vélib' par badges et modes explicites.
- **Do** utiliser les couches tonales et les séparateurs pour organiser la densité avant d'ajouter des décorations.

### Don't:
- **Don't** réduire un écran public à une liste brute de données temps réel sans contexte d'accès.
- **Don't** utiliser la couleur seule pour indiquer une perturbation, une disponibilité ou une atteignabilité.
- **Don't** mélanger la variante RATP blanche avec les ombres et effets immersifs du monde sombre sans intention explicite.
- **Don't** agrandir les textes secondaires au point de concurrencer le prochain départ ou le compte à rebours.
- **Don't** remplacer les grilles stabilisées par une composition fluide qui ferait varier la position des informations en direct.
## Source des tokens dans le code

Le design system publié est la référence. Sa copie `design/tokens.json` génère `mobili-tokens.css` avec `node scripts/build-tokens.mjs` (thème `dark` par défaut, `light` sous `[data-theme="light"]`). Ne modifiez pas `mobili-tokens.css` à la main : changez `design/tokens.json`, puis relancez le script.

- `porte-c.css` n'utilise que ces tokens.
- `recette-ratp.css` tire sa palette `--ratp-*` des tokens ; `recette.css` garde ses quatre blocs `:root` historiques, à consolider.
- `mobili-components.css` fournit les classes `mb-*` (LineBadge, ModeBadge, RouteCard, TransportRail…) pour les nouveaux écrans.
