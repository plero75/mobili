# Mobili : surface recette

Mode : Operate. Direction approuvée le 17 novembre 2026. Système commun : `DESIGN.md` et `design/tokens.json`.

## Composition

Le moteur conserve les neuf modes `arrivee`, `reunion`, `transition`, `sortie`, `incident_rer_a`, `incident_bus`, `no_race_event`, `no_race_idle` et `mobilite`, ainsi que le choix automatique. Les identifiants DOM des données restent inchangés.

Les modes événementiels utilisent un canevas de 1920 × 910 ; mobilité utilise 1920 × 1080 et une présentation verticale défilante sur mobile. Le paramètre `?review=1` expose la navigation de recette existante.

## Composants

- En-tête noir : identité Paris-Vincennes, contexte, météo, date et heure en blanc.
- Panneaux blancs : textes et horaires noirs ; seconds passages de graisse normale.
- Mobilité : liste Bus puis bloc RER, temps d'accès explicites ; volet trafic gris encadré d'anthracite, Vélib' et conseils d'accès distincts.
- Incidents : conséquence sur la ligne, reprise uniquement si connue et alternatives justifiées par les données. Texte et repère visuel se complètent.
- Courses, agenda et actualités : mêmes polices et palette, hiérarchie propre à chaque mode conservée.

## Ressources et styles

`mobili-tokens.css` est généré depuis `design/tokens.json`. `recette.css` importe `idfm-signage.css` et possède la structure et le mode mobilité. `recette-ratp.css` conserve son nom historique mais porte maintenant l'adaptation IDFM des scènes. `recette-themes.css` et `recette-modes-polish.css` possèdent leurs finitions respectives. Les URL des ressources modifiées sont versionnées.

IDF Voyageur Regular, Medium et Bold sont chargées localement. Les SVG officiels préservent leur forme, sans remplacer un indice de ligne par un simple texte coloré.

## Validation

Les tests métier vérifient les départs atteignables, les sens opposés, les données invalides/périmées et l'attribution des arrêts. Leur réussite n'est pas une validation des flux tiers en production. La vérification visuelle locale a été interrompue par l'outil de navigation ; elle reste à effectuer pour tous les modes et dimensions du protocole de `DESIGN.md`.
