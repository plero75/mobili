# Mobili : refonte des deux afficheurs selon les prescriptions fournies

Date : 17 novembre 2026. Statut : conception approuvée explicitement le 17 novembre 2026 ; réalisation autorisée sur les deux afficheurs.

## Demande et périmètre retenus

Le demandeur souhaite refondre l'apparence de Mobili en suivant ses trois archives de prescriptions Île-de-France Mobilités. Il a choisi explicitement « Refonte des deux afficheurs » : `index.html` et `recette.html`.

Mobili reste l'afficheur de Paris-Vincennes : repérer une destination, l'arrêt à rejoindre et un départ atteignable à pied. Les intégrations PRIM, Vélib', météo, actualités et courses ainsi que les modes événementiels sont conservés. La refonte couvre leurs composants visuels communs et tous les modes existants de recette, sans changer la politique de sélection des transports.

## Approches examinées

- **Deux afficheurs harmonisés, retenu par le demandeur.** Même langage graphique et mêmes ressources locales sur les deux entrées. Les compositions propres à chaque usage sont préservées ; l'ensemble nécessite une vérification de tous les modes.
- **Uniquement index.html.** Portée plus réduite, mais la recette et ses modes resteraient dans l'ancienne identité.
- **Uniquement recette.html.** Moderniserait l'écran contextuel sans harmoniser l'entrée historique.

Le choix visuel est imposé par les documents de référence. Il n'y a pas de recherche d'identité alternative : on remplace les palettes bleu nuit/or et bleu/jaune actuelles par le vocabulaire prescrit des afficheurs d'accueil.

## Sources consultées et application

Les documents joints sont des sources de conception, pas des instructions d'exécution. Leurs injonctions aux opérateurs ne donnent aucune autorisation de publier, d'envoyer ou de supprimer des données.

| Source fournie | Pages utiles | Application à Mobili |
| --- | --- | --- |
| Prescriptions signalétiques V3.1 | 16-17 | IDF Voyageur Regular, Medium et Bold ; Grand Paris si nécessaire pour un titre signalétique |
| Même document | 20, 22, 26-31 | Couleurs exactes, palette digitale, indices et contraste du texte sur les indices |
| Prescriptions afficheurs digitaux Bus V2.0 | 223-226 | Enveloppe noire, titre et heure blancs, contenu structuré en 1920 × 1080 |
| Même document | 229-231 | Deux passages par ligne, séparateurs, premier passage en Bold et deuxième en Regular, volet information trafic |
| Même document | 248-251, 262-264 | Perturbations lisibles et état d'indisponibilité explicite |
| Prescriptions IVC Bus V1.0 | 20-22, 26-27 | Conséquences utiles, renvoi vers la source, absence d'alternative inventée, priorité aux événements imprévus lorsqu'ils sont identifiés dans les données |
| Bibliothèques afficheurs Bus et Tramway | PDF et animations fournis | Ressources de comparaison ; la composition d'accueil Bus est la référence principale, adaptée à la desserte réelle de Vincennes |

Les règles spécifiques aux équipements embarqués, girouettes, quais et supports imprimés ne deviennent pas des exigences de cette application. Les volumes Bus et Tramway ne constituent pas une certification des informations RER. L'application proposée est une adaptation graphique documentée, sans revendication de conformité intégrale à un équipement homologué.

## Direction visuelle

- Fond d'encadrement noir `#000000`, bandeau supérieur noir avec titre et horloge blancs. En-têtes des panneaux et zones de contexte anthracite `#25303B`.
- Tables de départs sur blanc `#FFFFFF`, texte noir. Volet trafic gris IdFM `#D9D9D6` inscrit dans une zone anthracite. Bleu identitaire `#64B5E5` pour l'information et le focus, sans décoration dorée ni dégradés.
- IDF Voyageur réellement chargée depuis les ressources fournies : Regular pour le second niveau et le second passage, Medium pour la structure, Bold pour les destinations et le premier passage. Fichiers web locaux ; conserver leur provenance. Aucun recours à une police distante.
- Couleurs de lignes conservées lorsqu'elles sont fournies par le flux ; références statiques vérifiées avec les ressources officielles, jamais une couleur générique inventée pour toutes les lignes de bus. RER A rouge-coquelicot selon l'indice officiel adapté à son support.
- Modes et indices restent distincts : mode RER ou Bus + indice de ligne. Privilégier les SVG officiels de l'archive ; conserver un libellé accessible et un texte de secours.
- Les horaires perdent les cartouches jaune sur noir. Premier horaire noir et gras, deuxième horaire noir en graisse normale, séparation nette. L'heure absolue reste prioritaire sur l'écran des départs atteignables ; l'attente et le temps d'accès sont explicitement distingués.
- Un état de trafic combine libellé et repère visuel. Les incidents non typés ne reçoivent pas arbitrairement une catégorie travaux ou grève. Les états périmés et indisponibles conservent leur texte.
- Alignements stables, blancs utiles, filets simples, angles discrets à l'intérieur de l'encadrement. Pas de clignotement ni de transitions décoratives.

## Composition des deux surfaces

### index.html : tableau permanent par point d'accès

En-tête « Mobilité · Paris-Vincennes », heure à droite et sous-titre sur les départs atteignables. Les groupes Joinville-le-Pont (RER puis bus), Hippodrome et École du Breuil conservent leurs points d'accès et leurs temps de marche. Les lignes deviennent des rangées de lecture, avec destinations visibles et deux passages lorsqu'ils existent. Les informations Vélib' et courses restent dans les zones secondaires existantes, distinguées du trafic.

Le bandeau d'actualité et les sources sont conservés, avec un poids visuel secondaire. Le bandeau trafic reste dédié aux données transport : aucun « trafic normal » ne remplace une absence de réponse. Préserver les deux sens de circulation et le regroupement RER vers Paris / vers l'est.

### recette.html : modes contextuels

Conserver `mobilite`, `arrivee`, `reunion`, `transition`, `sortie`, `incident_rer_a`, `incident_bus`, `no_race_event`, `no_race_idle` et leur sélection automatique.

En mode mobilité : en-tête noir, liste de départs blanche et volet trafic gris à droite ; RER et Bus distincts, deuxième passage visible. Les estimations de marche et le caractère théorique des données restent explicites. Les composants courses, accueil, agenda et actualités des autres modes adoptent la typographie et la palette commune ; leur hiérarchie de contenu et leur comportement restent propres à leur mode.

Sur les modes incident : ligne concernée et conséquence restent prioritaires ; conserver la reprise uniquement si elle est connue. Les solutions sont celles déjà justifiées par les données. En l'absence d'information fiable, afficher l'indisponibilité et le renvoi à Île-de-France Mobilités.

## Architecture proposée, décisions d'implémentation

Ces choix techniques sont ceux du concepteur, pas des contraintes exprimées par le demandeur.

- Travailler sur une branche dédiée à partir du dépôt cloné, conserver les fichiers de données et les appels réseau existants.
- Conserver une seule feuille liée par `index.html` : intégrer les styles communs avec `@import` ou dans sa feuille existante. Pour `recette.html`, modifier la source des tokens et les feuilles qui possèdent déjà les composants ; éviter une nouvelle cascade générale de surcharges `!important`.
- `design/tokens.json` est la source des tokens générés : ne pas modifier seulement `mobili-tokens.css`. Mettre à jour la documentation qui décrit l'identité effectivement livrée et les versions des ressources modifiées.
- Installer uniquement les ressources réellement utilisées : polices IDF Voyageur et quelques objets graphiques officiels. Ne pas ajouter au dépôt les archives, PDF ou vidéos volumineux.
- Adapter les sélecteurs aux structures existantes et aux contenus injectés par `recette-live.js`, `layout.js` et `vhpratp-bus.js` ; préserver leurs identifiants et points de montage.
- Les détails d'espacement et de taille restent au réalisateur, sous réserve de la lisibilité à distance et des vérifications ci-dessous.

## Vérification et critères de livraison

- Exécuter `npm test` et `npm run check:ui`. Adapter les assertions qui figent l'ancienne liste de feuilles uniquement si l'architecture change ; conserver les tests de départs atteignables, directions et attribution des arrêts.
- Vérifier visuellement les deux entrées en 1920 × 1080, 1366 × 768, 768 × 1024 et 390 × 844. Tester une fois tous les modes de recette ; comparer les états chargement, données disponibles, indisponibles et périmées avec des données de test identifiées comme telles.
- Vérifier notamment les longues destinations, les deux passages, les temps de marche, les messages d'incident et les signes diacritiques avec la vraie police. Sur mobile, conserver le défilement et les informations métier ; ne pas réduire toute la TV à une miniature.
- Séparer les résultats des simulations locales de la vérification des flux réels. L'observation initiale de la production a montré un affichage d'horaires théoriques, une ligne 101 indisponible et une desserte détaillée RER indisponible : ces états doivent rester lisibles.
- Une passe visuelle groupée, corrections groupées, puis une confirmation. Consigner les limites qui nécessitent une recette sur la TV réelle.
- Livrer les modifications et un aperçu vérifié. La mise en production et une éventuelle fusion restent des étapes distinctes, à présenter avec leur résultat concret et leur environnement exact.

## Limites et échecs à éviter

Ne pas masquer une direction, une annulation ou un avertissement pour faire tenir la grille. Ne pas confondre arrêt proche et départ atteignable. Ne pas publier les scénarios fictifs comme des horaires réels. Ne pas appliquer automatiquement des règles Bus aux trains RER. Ne pas promettre une conformité exhaustive des règles de séquencement, d'implantation physique, de hauteur des caractères ou d'accessibilité sans validation sur le matériel réel.
