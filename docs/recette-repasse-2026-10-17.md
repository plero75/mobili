# Mobili — repasse transversale des affichages
17 octobre 2026 · Branche de revue `impeccable/audit-optimisation-2026-10`

## Couverture

Neuf vues événementielles / voyageurs de `recette.html` : Arrivée, Réunion, Transition, Sortie, Incident RER A, Incident bus (77/101), Événement sans courses, Sans courses / actualités, Mobilité. Plus l'afficheur fixe `index.html`.

Le site public utilise des données PRIM, PMU, Vélib’ et une météo externe ; toute absence de réseau ou de programme doit être annoncée, jamais remplacée par une fausse certitude.

## Constats prioritaires issus du code et de la capture fournie

- **P1 — écrans sans courses coupés** : les grilles `no-race-event` et `no-race-idle` allouaient chacune 908 px de rangées et espacement alors que l’espace intérieur utilisable de la scène 1920×910 n’était que de 766 px (hauteur de la zone de travail 808 px, moins les marges). Deux rangées devaient déborder.
- **P1 — source / arrêt du bus 101** : les références PRIM configurées correspondent au pôle Joinville-le-Pont, mais plusieurs écrans annonçaient l’École du Breuil. Les mentions et la durée de marche ont été corrigées sans changer les références de flux.
- **P1 — trains inatteignables** : des vues « retour » prenaient `state.rer[index]` sans filtrer les trains vers Paris et la marche jusqu’à Joinville. Le départ affiché est maintenant sélectionné parmi les passages vers Paris atteignables après environ 12 min à pied et 2 min de marge.
- **P1 — erreur de ligne en incident bus** : le titre dynamique annonçait toujours Bus 77 même lorsque le déclencheur concernait le bus 101.
- **P1 — panneau TV tronqué** : sur la capture 1648×928 fournie par l’utilisateur, les cases du RER étaient partiellement recouvertes/coupées en présence d’une alerte. La hauteur de cette zone et celle réservée aux bus du Breuil ont été réallouées.
- **P2 — huit lignes de bus trop compactes** : raccourcissement du badge du premier départ (« 1ER DÉPART » au lieu de « 1ER ATTEIGNABLE »).
- **P2 — repasse difficile** : les modes n'avaient pas de navigation directe. Une barre de recette `?review=1` permet d’accéder aux dix états, sans être visible en affichage normal.

## Corrections

- `recette-modes-polish.css` : adaptation des grilles 19:9, tailles, gestion des titres longs et états vides, cadres de sortie et incidents, harmonisation des panneaux et navigation de revue. Il est chargé après les trois feuilles historiques pour limiter les régressions fonctionnelles.
- `recette.js` : sélecteur de vues de revue et copies cohérentes de l'arrêt du 101.
- `recette-live.js` : sélection des prochains départs RER atteignables vers Paris, meilleure cohérence des bus et titre des incidents.
- `mobili-display.css` : nouvelle répartition des surfaces Joinville, RER et Breuil sur téléviseur ; `vhpratp-bus.js` : badge plus court.
- `recette-scenes.test.cjs` : tests de structure, chargement CSS et invariants d’information voyageurs.

## Ce qui reste à faire avant fusion

Recette **visuelle** sur de vrais rendus et données, non prouvée par le test statique : 1920×1080 (vue Mobilité), 1920×910 (scènes), 1366×768, 1648×928 et 390×844. Contrôler particulièrement les longues perturbations, les titres de courses >80 caractères, 0 départ, 0 réunion, source indisponible et une journée complète sans courses.

Vérifier en situation réelle que les messages PRIM décrivent bien le sens et l'arrêt affichés et que les estimations de marche sont justes depuis la porte C. L'écran à huit lignes est très dense sur une petite TV ; une simplification métier ou une alternance d’écrans serait préférable à une police microscopique.

**Statut de vérification :** revue de source + capture de l’ancienne version. Prévisualisation Vercel souvent protégée par authentification ; les captures multi-modes et les métriques Lighthouse ne sont pas revendiquées.

**Publication :** ne pas fusionner les retouches de cette repasse sans la validation visuelle des dix modes.
