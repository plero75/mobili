# Mobili departures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer une prévisualisation lisible du panneau mobilité avec fraîcheur par source et départs atteignables.

**Architecture:** Préserver les producteurs et leurs IDs de rendu. Une petite couche de statut partage le modèle de fraîcheur et retire les départs devenus inatteignables ; chaque producteur annonce son résultat. Recomposer le HTML et remplacer sa feuille CSS unique.

**Tech Stack:** HTML, CSS, JavaScript natifs ; node:test.

**Spec:** `docs/superpowers/specs/2026-11-03-departures-design.md`

## Global Constraints

- Prévisualisation sur branche distincte, sans promotion de production.
- HTML/CSS/JavaScript natifs, sans framework ni nouvelle dépendance, une feuille CSS.
- Les fréquences existantes sont conservées : transports et Vélib' 60 s, trafic 180 s, courses et actualités 300 s, météo 600 s.
- Les horaires réels, théoriques, annulés, périmés et les pannes ne sont jamais confondus.

## Review Focus

- Panne après une réponse valide : conserver et dater le contenu, sans le marquer en direct.
- Réponse SIRI invalide ou JSON malformé : ne pas vider les horaires comme si le service était vide.
- Passage sous le seuil de marche pendant une panne : retirer le départ sans attendre le réseau.
- Couverture trafic partielle avec une alerte connue : ne pas masquer le défaut de couverture.
- Destinations longues, deux sens et hauteurs TV réduites : conserver une lecture complète et un défilement de secours.

### Task 1: Fraîcheur et état des départs

**Files:** Create `display-state.js`, `display-state.test.cjs`; modify `app.js`, `vhpratp-bus.js`, `layout.js`, `data-hotfix.js`, `traffic-hotfix.js`.

**Interfaces:** `window.MobiliDisplay.markSource(key, ok, options)` ; `sourceState(state, now)` ; `isDepartureReachable(iso, accessMinutes, now)` ; `isStopResponse(data)`.

- [ ] Écrire et exécuter les tests de fraîcheur, cache daté, couverture partielle, réponses invalides et atteignabilité exacte ; constater les échecs avant implémentation.
- [ ] Implémenter le modèle, le statut DOM et le retrait périodique des départs ; rattacher les producteurs et leurs heures ISO.
- [ ] Exécuter `npm test` et `npm run check:ui` ; comparer aux résultats attendus, zéro échec ; consigner et committer.

### Task 2: Composition TV et mobile

**Files:** Modify `index.html`, `mobili-display.css`, `DESIGN.md` ; update related design tokens documentation.

**Interfaces:** Préserver les IDs utilisés par les producteurs ; ajouter `data-source-status` aux légendes et `data-departure-at` aux départs.

- [ ] Remplacer le HTML et le CSS selon la direction validée ; conserver les états et contenus métier.
- [ ] Démarrer un serveur local ; inspecter les dimensions cibles, les absences et les erreurs ; corriger les défauts en un lot.
- [ ] Exécuter les contrôles existants, documenter le résultat et committer.

### Task 3: Revue et prévisualisation

**Files:** Changed files above, documentation and validation evidence.

- [ ] Faire relire le diff et les captures par un contexte indépendant ; corriger les problèmes matériels.
- [ ] Créer un commit distant en préservant l'arbre de base, une branche et une PR en brouillon ; déployer uniquement en prévisualisation.
- [ ] Vérifier l'URL de prévisualisation et remettre le lien avec les résultats et limites des essais.
