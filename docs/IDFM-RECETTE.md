# Recette de l’écran mobilité — porte C

Cette modification concerne `recette.html?mode=mobilite`. Les autres modes conservent leur composition. Les fonctions communes de lecture des passages distinguent désormais les données absentes, les horaires théoriques et les flux en erreur.

## Référence et adaptation

Référence fournie : `IDFM_Prescriptions_afficheurs_digitaux_Volume1_Bus_V2.0.pdf`, archive « Afficheurs digitaux ».

| Prescription | Application |
| --- | --- |
| Accueil horizontal, 1920 × 1080, marges (pp. 223–225) | Canevas mobilité 1920 × 1080, marges de 30 px ; adaptation mobile avec défilement vertical. |
| Départs à gauche, information trafic à droite (pp. 229–235) | Quatre lignes de bus, RER accessible puis destinations en bas ; trafic et vélos à droite. |
| Ligne, destination et deux prochains passages | Deux colonnes séparées, premier passage gras, deuxième régulier. |
| Minutes sur deux chiffres, puis HH:MM au-delà d’une heure | Fonction commune `MobiliData.label`. |
| Horaire théorique signalé | Astérisque et légende ; l’absence d’horaire attendu ne devient pas du temps réel. |
| Information indisponible explicite | Échec SIRI, flux périmé ou passage absent : « Information non disponible ». |
| Actualisation sans animation | Rendu instantané ; messages longs paginés, sans défilement de texte. |
| IDF Voyageur | Police demandée par CSS, repli Arial : fichiers de police non fournis. |

Il s’agit d’une **adaptation**, pas d’une certification de conformité IDFM/RATP. L’en-tête clair répond à la demande du commanditaire et diffère de l’encadrement sombre du référentiel. Les badges de mode sont textuels ; les pictogrammes et la police officiels restent à intégrer à partir des fichiers autorisés. La couleur du 101 reste neutre tant que la desserte n’est pas validée.

## Données et limites

- PRIM via le proxy déjà présent dans le projet, toutes les 30 secondes ; aucun secret ajouté au navigateur.
- Ligne 77 : directions Gare de Lyon et Joinville-le-Pont séparées d’après les destinations du flux.
- Ligne 101 : anciennes références du projet conservées, filtrage strict du code ligne ; secteur Joinville et desserte à vérifier explicités. Ne pas présenter ce bus comme un départ porte C avant validation du référentiel opérationnel.
- RER A : sens séparés ; seuls les départs après le temps d’accès estimé et 2 minutes de marge sont proposés. Les trains supprimés sont exclus des correspondances.
- Bus : les attentes affichées sont à l’arrêt, hors marche ; elles ne promettent pas que le voyageur pourra prendre un bus imminent.
- Vélib’ : station identifiée par son code, sans reprendre le premier résultat pour deux stations ; indisponibilité explicite si ancien ou fermé.
- Trafic : absence de message reçu ne signifie pas « situation normale sur tous les réseaux ».
- Joinville : marche estimée 12 min ; un bus est proposé à la place uniquement si son arrivée à Joinville est publiée et antérieure à l’arrivée à pied.
- Châtelet : correspondance RER atteignable ; arrivée affichée seulement si reçue dans les appels suivants. Il ne s’agit pas d’un calculateur exhaustif du meilleur itinéraire. Pas de durée totale inventée.
- Les 4 min vers l’arrêt 77 et les 12 min vers le RER reprennent les estimations du projet, à mesurer depuis la porte C et pour l’accès au quai.

## Vérification

`node --test mobility-data.test.cjs` teste les cas temporels, annulations, SIRI invalide, péremption, dédoublonnage, sens RER et pagination sans perte de texte.

Avant recette définitive : afficher en plein écran sur l’équipement cible, vérifier les quatre directions avec PRIM et le terrain, mesurer les parcours porte C, puis contrôler la lecture à la distance réelle des visiteurs. Un contrôle logiciel ne remplace pas cette recette physique.

## Navigation

En bas de l’écran mobilité : Accueil, Sortie, Mobilité et Plein écran. Sur smartphone, les sections s’empilent et la page défile normalement.
