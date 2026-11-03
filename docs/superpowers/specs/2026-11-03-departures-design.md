# Mobili : panneau de départs, direction approuvée

Le 3 novembre 2026, Paul a validé l'audit et la refonte de la page publique sous forme de panneau de départs, avec prévisualisation TV et mobile avant publication.

## Résultat attendu

Un visiteur identifie immédiatement une direction, une heure et le temps de marche. Le RER A domine, les bus proches suivent, puis les bus de Joinville, les Vélib', les courses et l'actualité. Les deux sens du RER restent distincts. Les horaires réels, théoriques, annulés, périmés et les pannes ne sont jamais confondus.

## Choix retenu et limites

Recomposer `index.html` et sa feuille unique `mobili-display.css`, en conservant les intégrations existantes. La signalétique de `recette.html` inspire les contrastes et les grands horaires. Promouvoir directement cette page introduirait un moteur contextuel et d'autres comportements hors du périmètre validé. Une simple réduction typographique préserverait les coupures constatées.

## Composition

Sur TV : en-tête compact, alerte utile, RER principal et bus proches, bus de Joinville en lignes, Vélib' et prochaine course, actualités en pied. Repères navy, blanc, jaune pour les heures, couleurs de ligne et statuts textuels. Au moins deux départs par direction lorsque disponibles. Les destinations doivent rester lisibles.

Sur mobile 390 × 844 : flux vertical, premier départ RER dans le premier écran, aucune interaction ni saisie nécessaire. Les autres transports restent accessibles par défilement. Les directions ne dépendent pas du survol. Aucun capteur ni autorisation nécessaire.

## Données et fonctionnement

Les fréquences existantes sont conservées : transports et Vélib' 60 s, trafic 180 s, courses et actualités 300 s, météo 600 s. Chaque bloc possède un état et un horodatage de réception. Une réponse invalide ne devient pas une absence de service. Le dernier état valide est conservé et daté en cas de panne, les départs devenus inatteignables sont retirés indépendamment des requêtes. Une couverture partielle du trafic reste explicite même avec une alerte connue.

## Technique et validation

HTML/CSS/JavaScript natifs, sans framework ni nouvelle dépendance, une feuille CSS. Aucun graphique : listes sémantiques et chiffres tabulaires, nombre de lignes borné par les intégrations. Pas d'animation permanente ni travail visuel en arrière-plan ; reprise au retour dans l'onglet. Source Sans 3 locale existante. Tests de données, contrôles existants, inspection 1920 × 1080, 1920 × 910, 1366 × 768 et 390 × 844, avec erreurs, données absentes et périmées. Prévisualisation sur branche distincte, sans promotion de production.
