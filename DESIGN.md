# Mobili — Design actuel

## Statut

Ce document décrit l’interface actuellement implémentée dans le dépôt `plero75/mobili`. Il documente l’existant ; il ne constitue pas encore la direction graphique cible du cahier des charges V2.

## Surface principale

- Application web d’affichage public.
- Cible paysage grand écran / TV.
- Interface sans interaction visiteur.
- HTML principal : `index.html`.
- CSS chargé dans cet ordre : `styles.css`, `tv.css`, puis `mobili-2026.css`.
- Le dernier fichier joue actuellement le rôle de couche de redéfinition prioritaire pour la version 16:9.

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

La version `mobili-2026.css` cherche à imposer une hiérarchie :

`situation > prochain départ > destination > alternatives`

Sur grand écran, Joinville occupe la colonne principale. Les blocs Hippodrome, Breuil, Vélib’ et Courses sont empilés dans une colonne secondaire.

## Palette actuelle

### Base historique

`styles.css` utilise :

- fond bleu nuit `#07111f` ;
- panneaux `#10213d` / `#132947` ;
- texte clair `#f8fafc` ;
- accent or `#f5a623` ;
- RER rouge `#e41e26` ;
- états vert / ambre / rouge.

### Couche Mobili 2026

`mobili-2026.css` remplace en grande partie ce système par :

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
- Plusieurs métadonnées restent très petites sur TV (souvent 6 à 10 px).

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

Trois couches se superposent :

1. `styles.css` contient les règles génériques et responsive jusqu’au mobile.
2. `tv.css` définit une composition TV pour paysage >= 1200 px.
3. `mobili-2026.css` définit une autre composition paysage >= 1100 px et surcharge largement `tv.css`.

Le comportement final dépend donc fortement de l’ordre de chargement et de nombreuses règles `!important`.

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

La prochaine évolution ne doit pas simplement « embellir » cette grille. Le cahier des charges V2 demande un changement structurel : l’interface doit devenir contextuelle et changer de fonction selon la journée.

L’existant reste néanmoins une source utile pour :

- la logique PRIM ;
- la gestion des statuts ;
- les calculs de départ atteignable ;
- la résilience ;
- les données RER / bus / Vélib’ ;
- les traitements de fin de service.

## Principe pour la suite

Toute refonte doit préserver la vérité fonctionnelle et les comportements transport déjà utiles, mais remplacer la composition fixe par lieux par des surfaces adaptées aux modes du cahier des charges.
