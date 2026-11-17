# Validation de la refonte IDFM

Date : 17 novembre 2026. Branche : `codex/idfm-afficheurs`.

## Résultat établi

- 18 tests Node réussis : 15 tests existants de données et de scènes, 3 tests nouveaux sur la couverture des lignes par pagination.
- `npm run check:ui` : 2 pages, 27 ressources locales et 12 scripts vérifiés. Le vérificateur parcourt les imports CSS, les images statiques et les fichiers de polices.
- Contrôle négatif : retirer temporairement la police Bold fait échouer le vérificateur avec le nom de la ressource manquante ; fichier restauré ensuite et contrôle positif réussi.
- Tokens régénérés depuis `design/tokens.json`. Trois polices IDF Voyageur WOFF locales ; quatre SVG officiels conservés et attribués dans `assets/idfm/README.md`.
- Revue statique indépendante : défauts de cascade des indices A, contraste des badges et carte routière corrigés. La grille TV alterne par pages de quatre lignes pour préserver deux directions et deux passages ; la pagination pure a été testée avant l'implémentation puis revue.
- La refonte conserve les calculs d'accès, sources et identifiants DOM. Les modifications de `recette-live.js` concernent uniquement le nom complet d'Île-de-France Mobilités dans les textes affichés.

## Vérifications qui restent à faire

Le navigateur intégré n'a pas pu joindre le serveur local. Le repli dans Edge a été interrompu par Computer Use, qui ne pouvait pas déterminer l'URL Windows avec suffisamment de certitude. Aucun autre mécanisme d'automatisation de navigateur n'a été utilisé après cet arrêt.

Par conséquent, les points suivants **ne sont pas validés** :

- Captures de la refonte en 1920 × 1080, 1366 × 768, 768 × 1024 et 390 × 844.
- Rendu des neuf modes avec données chargées, absentes et périmées ; absence de débordement et lisibilité des longues destinations.
- Chargement effectif des polices et des SVG dans un navigateur sur la nouvelle version, contrastes et tailles calculés à l'écran.
- Alternance réelle des pages TV et retour à la liste complète sur mobile.
- Lecture à distance sur le matériel de Paris-Vincennes.
- Fonctionnement actuel de tous les flux tiers sur la nouvelle version et déploiement en production.

Avant l'implémentation, l'écran publié en mode sortie a été observé : horaires théoriques affichés, ligne 101 indisponible et desserte détaillée RER indisponible. Cette observation concerne uniquement l'ancienne version publiée, pas la refonte locale.

## Livraison

La modification est proposée en PR brouillon. Elle ne doit pas être présentée comme une recette visuelle terminée ou une conformité exhaustive aux référentiels. Aucune fusion ni promotion en production n'a été effectuée dans cette session.
