# Mobili : identité des afficheurs

Mise à jour : 17 novembre 2026. Direction approuvée pour les deux entrées, implémentée sur la branche dédiée ; contrôle visuel local encore à effectuer avant promotion en production.

## Usage

Information voyageurs depuis Paris-Vincennes : comprendre le point d'accès, la direction et les deux prochains départs, en tenant compte des temps de marche. La logique d'accès, les flux et les états de fraîcheur sont conservés.

## Références et palette

Les trois archives fournies par le demandeur guident cette adaptation : prescriptions signalétiques V3.1, afficheurs digitaux Bus V2.0 et Tramway V1.0, information voyageurs circonstancielle Bus V1.0. Voir la conception détaillée dans `docs/superpowers/specs/2026-11-17-idfm-design.md`.

- Encadrement et bandeau supérieur : noir #000000 ; titres et horloge blancs #FFFFFF.
- Contenu des départs : blanc #FFFFFF, texte noir #000000.
- En-têtes de panneaux et contexte : anthracite #25303B.
- Information trafic : gris IdFM #D9D9D6, dans un cadre anthracite.
- Information et focus : bleu IdFM #64B5E5.
- Les couleurs de lignes issues des données historiques restent distinctes. En l'absence de couleur vérifiée, les composants de recette utilisent un indice Bus neutre noir sur blanc. Le SVG officiel identifie le RER A.

La palette est définie par `design/tokens.json`, puis générée par `node scripts/build-tokens.mjs`. Les identifiants historiques de tokens sont conservés pour compatibilité ; les variantes événementielle et mobilité partagent désormais la même palette.

## Typographie et objets graphiques

IDF Voyageur Regular (400), Medium (500) et Bold (700), auto-hébergées dans `fonts/idfm/`. Conversion des TTF fournis en WOFF, sans dépendance à un fournisseur de polices distant. Le deuxième passage utilise une graisse normale.

Les symboles Bus, RER, RER A et information trafic proviennent de la bibliothèque fournie. Leur provenance est consignée dans `assets/idfm/README.md`. Le mode et l'indice de ligne restent deux informations différentes. Conserver les noms accessibles et les textes de secours.

## index.html : tableau permanent

Une seule feuille liée, `mobili-display.css`, importe les tokens et les objets graphiques communs. Sections conservées : en-tête, actualités, trafic, Joinville (RER puis bus), Hippodrome, École du Breuil, Vélib' et courses.

Les panneaux de données sont blancs avec en-têtes anthracite. L'heure atteignable reste dominante, puis la destination, l'attente et le statut. Le premier passage est gras, le second en graisse normale. Les deux sens de circulation et les alertes restent consultables.

Sur TV, les huit lignes de Joinville alternent sur deux pages de quatre lignes, en grille de deux colonnes et deux rangées. Un indicateur expose les lignes et la page en cours ; chaque page reste 12 secondes, sans transition décorative. Chaque ligne conserve ses deux directions et ses deux passages. Mobile : liste complète, lecture verticale et défilement.

## recette.html : écrans contextuels

Voir `DESIGN-recette.md`. Les modes événementiels conservent leur canevas 1920 × 910 ; la mobilité utilise 1920 × 1080. Les sources et le moteur de sélection automatique sont conservés.

## États, limites et vérification

Les données théoriques, absentes, périmées, annulées et les destinations inconnues conservent leur qualification. Une réponse manquante ne devient jamais un trafic normal. Ne pas inventer une reprise de service, une desserte, une durée ou une alternative.

Commandes : `npm test`, `npm run check:ui`. La seconde vérifie aussi les imports CSS, images statiques et polices locales. Les vérifications automatiques ne démontrent pas la lisibilité à distance ni l'absence de débordement.

Recette visuelle requise : 1920 × 1080, 1366 × 768, 768 × 1024 et 390 × 844, données disponibles, absentes et périmées. Les résultats et le blocage du navigateur sont consignés dans `docs/idfm-validation-2026-11-17.md`. Aucune conformité exhaustive à un équipement homologué n'est revendiquée.
