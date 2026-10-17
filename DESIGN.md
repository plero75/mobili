# Mobili — Design de l'afficheur TV

## Statut

Ce document décrit désormais la direction implémentée sur l'afficheur historique `index.html` en octobre 2026. Les écrans contextuels de `recette.html` restent une surface distincte ; leur bascule en production nécessite une recette métier et visuelle dédiée.

## Surface principale

- Application web d’affichage public.
- Cible paysage grand écran / TV.
- Interface sans interaction visiteur.
- HTML principal : `index.html`.
- CSS chargé : **une seule feuille**, `mobili-display.css` ; les anciennes feuilles sont conservées dans le dépôt uniquement comme historique de référence, sans être chargées dans l'afficheur.
- Sur TV 16:9 : lecture immédiate des départs atteignables et séparation nette entre transport principal et autres services.
- Sur écran étroit : défilement et colonnes adaptées, sans reproduction rétrécie de la grille TV.

## Structure actuelle

L’interface est organisée par lieux et blocs fonctionnels :

1. En-tête marque / météo / heure.
2. Bandeau d’actualité France Info.
3. Bandeau global d’état trafic.
4. Grand bloc Joinville-le-Pont : RER A puis bus.
5. Bloc Hippodrome de Vincennes.
6. Bloc École du Breuil.
7. Bloc Vélib’.
8. Bloc Courses à Vincennes.

Cette structure est essentiellement fixe et spatiale. Elle ne correspond pas encore au moteur de modes contextuels ARRIVÉE / RÉUNION / TRANSITION / SORTIE / INCIDENT demandé par le cahier des charges.

## Hiérarchie visuelle actuelle

La feuille `mobili-display.css` met en place une hiérarchie explicite :

`situation > prochain départ > destination > alternatives`

Sur grand écran, Joinville occupe la colonne principale. Les blocs Hippodrome, Breuil, Vélib’ et Courses sont empilés dans une colonne secondaire.

## Palette actuelle

### Base historique

La palette historique `styles.css` utilise :

- fond bleu nuit `#07111f` ;
- panneaux `#10213d` / `#132947` ;
- texte clair `#f8fafc` ;
- accent or `#f5a623` ;
- RER rouge `#e41e26` ;
- états vert / ambre / rouge.

### Couche Mobili 2026

La nouvelle feuille `mobili-display.css` conserve cette orientation avec :

- navy `#071729` ;
- navy secondaire `#10243d` ;
- encre `#102033` ;
- fond général clair `#edf1f5` ;
- lignes `#d7dee7` ;
- vert `#087a4d` ;
- ambre `#a85b00` ;
- rouge `#b4232d` ;
- bleu `#1677b8` ;
- bleu pâle `#eef7fc`.

Les panneaux deviennent majoritairement blancs avec en-têtes anthracite / bleu nuit.

## Typographie actuelle

- Base : Inter / system UI dans `styles.css`.
- La couche `mobili-2026.css` force Arial / Helvetica Neue sur le body.
- Poids très forts (`900` / `950`) utilisés fréquemment pour l’information prioritaire.
- Horaires et temps d’attente sont les éléments les plus grands.
- La lecture TV prioritaire distingue une heure de départ entre environ 22 et 44 px selon l'écran ; les noms de direction et les états importants restent lisibles et les micro-légendes historiques de 6–7 px ne sont plus utilisées. Quelques annotations de faible priorité restent plus petites et doivent être vérifiées à distance.

## Composants principaux

### En-tête

- marque `VH` dans un carré or ;
- titre « Mobilité – Hippodrome Paris-Vincennes » ;
- sous-titre ;
- météo ;
- heure ;
- dernière mise à jour.

### Bandeau actualités

- label France Info ;
- une actualité affichée à la fois ;
- description masquée en paysage.

### Bandeau trafic

États visuels :

- `ok` ;
- `neutral` ;
- `warn` ;
- `alert`.

### Panneaux transport

- indice de ligne ;
- direction ;
- horaires ;
- temps d’attente ;
- statut ;
- gestion des derniers passages ;
- filtre d’accessibilité / départ atteignable ;
- fallback si le temps réel est indisponible.

### RER A

- bloc Joinville-le-Pont ;
- deux directions possibles ;
- heure absolue dominante ;
- premier départ visuellement mis en avant ;
- statut et attente en second niveau.

### Bus

- cartes par ligne ;
- deux passages maximum dans plusieurs variantes de mise en page ;
- informations de direction et statut.

### Vélib’

- deux stations ;
- données de disponibilité présentées sous forme de gros indicateurs.

### Courses

- bloc compact de prochaine réunion / courses ;
- rôle aujourd’hui secondaire dans la grille générale.

## Responsive actuel

Une seule feuille dédiée à l'afficheur actif :

1. **Base fluide** : sections verticales à lecture continue pour mobile et tailles intermédiaires.
2. **Grille TV** : à partir de 1 200 px de large et 680 px de haut, colonnes principale/secondaire (Joinville à gauche, hippodrome, Breuil, Vélib' et courses à droite).
3. **TV compacte** : à hauteur de 850 px et moins, densité recalibrée sans texte à 6–7 px.
4. **Petits écrans** : RER et lignes de bus en colonnes adaptées avec leur deuxième passage conservé.

Le nouveau CSS utilise les tokens du projet, limite les exceptions et évite la cascade de centaines de `!important`.

## États et résilience déjà présents

L’implémentation actuelle prévoit notamment :

- cache du dernier état valide pour certains blocs ;
- état « temps réel momentanément indisponible » ;
- nouvelle tentative automatique ;
- détection du service terminé / non commencé ;
- horaires théoriques de secours ;
- passages annulés / manqués / retardés / en avance ;
- dernier passage ;
- départs atteignables selon temps d’accès.

## Dette de design à préserver comme contexte

Cette refonte améliore la lisibilité de la grille fixe sans se substituer au cahier des charges V2 : le moteur contextuel ARRIVÉE / RÉUNION / TRANSITION / SORTIE / INCIDENT reste à valider avant de devenir l'entrée de production.

L’existant reste néanmoins une source utile pour :

- la logique PRIM ;
- la gestion des statuts ;
- les calculs de départ atteignable ;
- la résilience ;
- les données RER / bus / Vélib’ ;
- les traitements de fin de service.

## Principe pour la suite

Toute refonte doit préserver la vérité fonctionnelle et les comportements transport déjà utiles, mais remplacer la composition fixe par lieux par des surfaces adaptées aux modes du cahier des charges.

## Règles de finition et de publication (octobre 2026)

- Affichage principal pour un visiteur qui cherche **un départ atteignable**, pas un tableau des seules prochaines arrivées.
- Première donnée visuelle : heure absolue ; ensuite direction, temps d'attente et statut. Les annulations, perturbations et états dégradés restent visibles.
- La grille TV à huit lignes ne doit jamais masquer les directions ou les libellés « dernière donnée connue » pour gagner de la place.
- Les petites écrans conservent le défilement, sans couper des données métier.
- L'afficheur ne doit charger qu'une feuille CSS. Les changements de couche visuelle doivent incrémenter la version de l'URL CSS.
- Vérification avant fusion : `npm test` et `npm run check:ui` ; captures comparées en 1920×1080, 1366×768, 768×1024, 390×844, avec données chargées, absentes et périmées.
