# Audit Impeccable — Mobili

**Date :** 16 octobre 2026  
**Périmètre :** `index.html` (afficheur historique), `recette.html` (écrans contextuels + vue mobile), appels PMU/PRIM et chaîne de contrôle de qualité.  
**Méthode :** audit statique des fichiers du dépôt et lecture de `DESIGN.md`. Pas de Lighthouse, de données terrain ni de captures sur le matériel de diffusion : aucun résultat de performance en production n'est prétendu.

## Synthèse

Mobili possède deux familles d'interface : une grille fixe par lieu (`index.html`) et une interface contextuelle (`recette.html`) comportant arrivée, réunion, transition, sortie, incident et mobilité. Le projet dispose déjà de garde-fous utiles (temps d'accès, horaires théoriques, distinction entre incidents et données absentes). Il reste cependant fragmenté entre plusieurs couches CSS et correctifs JavaScript.

**Santé initiale estimée sur le code : 9/20 (faible), à confirmer en navigateur.**

| Dimension | Note /4 | Preuve vérifiable |
|---|---:|---|
| Accessibilité | 2 | Typographie trop compacte sur l'afficheur historique ; plusieurs états d'information dépendent de très petites mentions. |
| Performance | 1 | Recherche PMU séquentielle sur plusieurs jours ; interrogation trafic séquentielle ; nombreux scripts et CSS chargés simultanément. |
| Responsive | 2 | Les styles d'actualités et météo de l'afficheur historique manquaient sous 1 100 px ; les écrans recette disposaient de deux stratégies de mise à l'échelle concurrentes. |
| Thématisation | 2 | Palette documentée, mais 525 déclarations `!important` dans `mobili-2026.css`. |
| Cohérence technique | 2 | Deux interfaces et plusieurs couches de « hotfix », avec des conventions de chargement et de mise en page différentes. |

### Points forts à conserver

- Priorité aux départs **réellement atteignables**, pas seulement aux prochains horaires théoriques.
- Gestion explicite des perturbations, annulations, derniers passages et fins de service.
- Modes contextuels adaptés au rythme des courses et aux incidents.
- Tests métier existants dans `mobility-data.test.cjs`.
- Gestion d'un dernier état connu pour certaines sources.

## Correctifs livrés sur cette branche

**P1 — Affichage trompeur lors du chargement (recette).** Le mode automatique pouvait présenter une journée sans courses avant vérification du programme du jour. La page conserve désormais une présentation « programme en attente » tant que les données PMU de ce jour n'ont pas été vérifiées. Elle n'interprète plus systématiquement une défaillance de l'API comme l'absence de courses.

**P1 — Recherche du programme PMU.** `recette-live.js` recherche à nouveau les prochaines dates lorsque la réunion mémorisée n'est plus celle d'aujourd'hui : une réunion de la veille ne bloque plus la découverte. Les consultations sont groupées par deux jours et les réponses valides sont mises en cache. `data-hotfix.js` applique également une recherche PMU par lots limités, avec cache des réponses et verrou anti-chevauchement.

**P1 — Moteur de mise à l'échelle en conflit (recette).** La double gestion de la mise à l'échelle entre `recette.js` et le script inline de `recette.html` est supprimée : une seule source calcule maintenant 1 920 × 910 pour les écrans contextuels, et 1 920 × 1 080 pour la vue Mobilité.

**P1 — Lecture mobile.** Sans paramètre d'URL, les petits écrans (< 900 px de largeur au chargement) ouvrent la vue Mobilité responsive. L'afficheur historique reçoit une feuille complémentaire corrigeant l'en-tête météo et le bandeau France Info sous 1 100 px.

**P2 — Finition et exploitation.** Renforcement ciblé de la lisibilité du bandeau trafic, des brèves et de mentions secondaires en TV ; chiffres tabulaires ; état accessible du bouton de plein écran ; raccourcis numériques désactivés dans les champs éditables ou avec des modificateurs.

**P2 — Vérification automatique.** `npm test` exécute les tests métier, `npm run check:ui` vérifie la présence des ressources HTML locales et la syntaxe de tous les scripts référencés. Un workflow GitHub Actions contrôle les changements de PR et de `main`.

## Dette restante, priorisée

### P1 — Vérification visuelle et fonctionnelle sur écrans réels
Tester les vues `recette.html?mode=auto`, `?mode=arrivee`, `?mode=reunion`, `?mode=transition`, `?mode=sortie`, `?mode=incident_rer_a`, `?mode=incident_bus` et `?mode=mobilite` sur 1920×1080, 1366×768, 768×1024 et 390×844. Vérifier le contraste, les recouvrements, la taille effective des caractères à distance et les cas de coupure de réseau. Ces cas ne sont pas couverts par les tests statiques.

### P1 — Fluidifier la remontée d'information trafic historique
`traffic-hotfix.js` interroge actuellement dix lignes successivement et peut réessayer deux variantes par ligne, y compris lorsque la première requête a répondu sans alerte. Il faut conserver la distinction trafic normal / source indisponible tout en arrêtant les requêtes après une réponse valide et en utilisant une concurrence bornée. Cette modification n'a **pas** été intégrée à cette branche.

### P1 — Lisibilité TV à distance
Dans `mobili-2026.css`, **35 des 54** valeurs `font-size` exprimées en pixels sont inférieures à 12 px. Les retouches apportées ne suffisent pas à réviser toute la grille sans nouvelle maquette et contrôle des 8 lignes de bus affichées. Il faut hiérarchiser davantage les données visibles plutôt que comprimer leurs légendes.

### P2 — Dette CSS et unification
`styles.css`, `tv.css`, `mobili-2026.css` et `display-polish.css` forment provisoirement quatre couches sur l'afficheur historique. Le remplacement structurel par les modes V2 devrait permettre de supprimer ces redéfinitions et de consolider les tokens sans perte d'information. Éviter une bascule automatique de `index.html` vers `recette.html` avant recette métier.

### P2 — Observabilité du temps réel
Instrumenter (sans exposer de secrets) la réussite des flux PMU, SIRI/PRIM, météo, Vélib' et actualités, avec mesure de latence, âge de dernière réponse et couverture des lignes. La couleur « trafic normal » ne doit jamais masquer un défaut de collecte.

### P2 — Validation des performances
Exécuter Lighthouse et des captures comparées avant/après sur les cibles prévues. Vérifier LCP, INP, CLS, consommation mémoire sur écran allumé pendant plusieurs heures et fréquence des requêtes. Aucune amélioration chiffrée non mesurée n'est revendiquée ici.

## Validation

Commandes : `npm test` et `npm run check:ui`.

La chaîne CI vérifie la syntaxe et les dépendances locales ; elle ne simule pas les APIs externes, les vrais incidents ni un écran de diffusion. Le contrôle visuel et l'accord d'exploitation restent requis avant fusion en production.
