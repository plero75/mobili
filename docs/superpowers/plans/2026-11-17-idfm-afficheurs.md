# Refonte des afficheurs Mobili : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Appliquer la conception approuvée aux deux afficheurs.

**Architecture:** Conserver les entrées et les scripts de données. Partager les tokens et ressources de signalétique ; modifier les feuilles propriétaires des composants existants.

**Tech Stack:** HTML, CSS, JavaScript natif, générateur Node et ressources SVG/polices locales.

**Spec:** `docs/superpowers/specs/2026-11-17-idfm-design.md`, approuvée le 17 novembre 2026.

## Global Constraints

- Cadre noir #000000, panneaux blancs #FFFFFF, texte noir, contexte anthracite #25303B et gris #D9D9D6.
- IDF Voyageur locale ; garder la provenance et ne copier que les ressources utilisées.
- Deux passages visibles, directions et états dégradés lisibles, calcul des départs atteignables conservé.
- Un seul lien de feuille CSS pour index.html ; tokens générés depuis leur JSON.
- Aucun changement des sources, des secrets, des seuils d'accès ou du déploiement.

## Review Focus

- Longue destination et deux horaires dans un arrêt proche : contrôle de débordement visuel.
- Donnée absente ou périmée : aucun remplacement par un état normal, contrôle des messages.
- Sens opposés du même bus : conserver destinations, indices et passages.
- Polices réellement chargées : contrôle des ressources et de la graisse du deuxième passage.
- Petit écran : contenu consultable par défilement sans débordement horizontal.

### Task 1 : Ressources et palette partagées

**Files:** `fonts/idfm/*`, `assets/idfm/*`, `design/tokens.json`, `scripts/build-tokens.mjs`, `mobili-tokens.css`, `idfm-signage.css`.

**Interfaces:** tokens CSS existants conservés ; fichiers de police locaux et symboles officiels via URL relative.

- [ ] Extraire les trois polices IDF Voyageur et les objets graphiques utilisés ; documenter leur origine.
- [ ] Modifier les couleurs des deux thèmes et les piles de polices dans le JSON ; adapter les formats de police du générateur si nécessaire ; régénérer.
- [ ] Vérifier les références des ressources et la reproductibilité de la génération.

### Task 2 : Deux afficheurs et modes contextuels

**Files:** `index.html`, `mobili-display.css`, `recette.html`, `recette.css`, `recette-ratp.css`, `recette-themes.css`, `recette-modes-polish.css`, `recette.js`, `recette-live.js`, `display-pages.js`, `display-pages.test.cjs`, éventuellement `vhpratp-bus.js` pour l'indice officiel.

**Interfaces:** consomme Task 1 ; préserve les identifiants DOM et les fonctions de données existantes.

- [ ] Adapter les composants de l'entrée principale : en-tête noir, panneaux anthracite/blanc, horaires noirs, second passage distinct, directions lisibles.
- [ ] Adapter les propriétaires des styles de recette, notamment son mode mobilité et les incidents ; introduire les symboles officiels sans modifier les calculs.
- [ ] Incrémenter les URL des ressources modifiées et conserver les assertions de contrat pertinentes.
- [ ] Exécuter `npm test` et `npm run check:ui` ; attendu : aucun échec.

### Task 3 : Vérification et livraison

**Files:** `DESIGN.md`, `DESIGN-recette.md`, `docs/idfm-validation-2026-11-17.md` et captures de validation hors dépôt si volumineuses.

**Interfaces:** les deux entrées construites par Task 2.

- [ ] Inspecter une fois les deux entrées et les neuf modes, aux tailles pertinentes, avec états chargés, absents et périmés. Réserver les données de test au contrôle local.
- [ ] Corriger les défauts constatés en une passe puis confirmer ; consigner ce qui reste à vérifier sur la TV réelle et les flux externes.
- [ ] Mettre les documents en accord avec les styles livrés, relire le diff et faire une relecture indépendante de la branche.
- [ ] Livrer les fichiers et un aperçu vérifié ; distinguer branche locale, PR éventuelle et production.

## Journal

- Conception approuvée explicitement ; revue indépendante : aucun point essentiel manquant.
- Réalisation dans un clone dédié sur branche `codex/idfm-afficheurs`, hors du checkout de travail habituel du demandeur.
- Règle de réalisation : pas de tests qui recopient des déclarations CSS ; conserver les tests métier existants et vérifier la présentation dans le navigateur.

- Tâches 1 et 2 réalisées. Revue statique : corrections des SVG A, contrastes et carte routière ; les pages TV de quatre lignes remplacent la grille trop dense. Tests de pagination écrits et vus en échec avant implémentation.
- Tâche 3 : contrôle visuel bloqué par Computer Use (URL Windows non identifiable), aucun contournement ; livraison prévue en PR brouillon, sans promotion en production.
