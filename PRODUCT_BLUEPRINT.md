# Nqta — Architecture produit

Nqta est un système personnel de préparation à la 2e année du Bac marocain. Le prototype privilégie l'expérience élève mobile et ne présente aucune donnée pédagogique non vérifiée comme officielle.

## Navigation élève

- Accueil : position, objectif, échéance, session du jour, trajectoire.
- Aujourd'hui : plan adaptatif et justification pédagogique.
- Apprendre : matières, chapitres, cours complet, vidéo, fiche Bac, méthodes et erreurs.
- Annales : sujet, découpage, correction et correction intelligente ; BAC DNA reste descriptif.
- KZAKO : explication en cinq étapes, niveaux de langage et modes visuels.
- Mon niveau : couverture du référentiel, maîtrise des notions et carte de compétences.
- Score Bac : simulation à partir des coefficients validés pour l'année et la filière.
- Espaces complémentaires prévus : Scan Bac, devoirs, Bac blanc, Smart Review, Final 30 et Final Week.

## Modèle de données central

`school_year → track → subject → domain → chapter → concept → competency → learning_objective → question_type`

Les ressources (`lesson`, `video`, `bac_sheet`, `method`, `exercise`, `exam`, `correction`, `rubric`) sont reliées aux nœuds du référentiel avec une source, un statut de validation et une année scolaire.

Les données élève (`attempt`, `mastery_estimate`, `study_session`, `review_item`, `goal`, `mock_exam`) alimentent le plan quotidien et la trajectoire de note.

## BAC Framework Engine

1. Import versionné des documents officiels.
2. Extraction assistée, jamais publiée sans validation humaine.
3. Matrice filière × matière × compétence × contenu × type de question.
4. Contrôle de couverture et signalement des éléments « À valider par l'équipe pédagogique ».
5. Publication annuelle atomique, avec conservation des versions précédentes.

## Moteur IA

- Récupération limitée au référentiel actif et aux contenus validés.
- Contexte élève : filière, notion, erreurs, niveau et langue choisie.
- Modes pédagogiques : indice, méthode guidée, explication ou correction progressive.
- Garde-fous : aucune prédiction de sujet, pas de solution automatique dans Scan Bac, citation de la source pédagogique, remontée des incertitudes.

## Back-office pédagogique

- Import : programme, référentiel, coefficients, annales et barèmes.
- Taxonomie : filières, matières, domaines, chapitres, notions et compétences.
- Studio de contenu : cours, exercices, vidéos, corrections et métadonnées.
- Validation : brouillon → revue → conforme → archivé, avec auteur et historique.
- Qualité : couverture du référentiel, contenus orphelins, conflits de version et données à valider.

## Design system

- Direction : studio de performance, énergique mais calme ; aucune esthétique scolaire traditionnelle.
- Palette : encre profonde, vert citron signal, violet progression, menthe maîtrise.
- Typographie : Manrope pour les titres, DM Sans pour l'interface.
- Composants : cartes larges, rayons généreux, données très lisibles, une action principale par écran.
- Mobile : barre à cinq actions, KZAKO comme bouton signature central, contenus empilés et zones tactiles confortables.

## Onboarding

1. Choisir la filière.
2. Choisir l'objectif de note.
3. Définir le temps quotidien disponible.
4. Réaliser un diagnostic court par matière.
5. Afficher le premier plan avec les sources et données restant à valider.
