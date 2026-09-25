# Nqta × Moodle — intégration à réaliser

Statut : architecture proposée, aucune instance Moodle installée ou connectée.

## Répartition

- Nqta : interface publique, onboarding, expérience élève et professeur.
- Moodle : utilisateurs, cours, inscriptions, devoirs, évaluations et groupes de cours.
- Serveur Nqta : autorisation, correspondance des identités, établissements, classes scolaires, invitations et appels Moodle. Aucun jeton Moodle dans le navigateur.
- Une classe scolaire Nqta ne doit pas être assimilée à un groupe Moodle global : les groupes Moodle appartiennent à un cours. Maintenir une correspondance classe → groupes des cours concernés.

## Onboarding cible

1. Compte vérifié et rôle. Un rôle professeur déclaré ne donne aucun droit de gestion sans validation.
2. Niveau et filière.
3. Établissement : ville, recherche par identifiant d’établissement, demande d’ajout si absent. Ne pas fusionner sur le nom seul.
4. Année scolaire et classe : rejoindre via invitation ou demander l’accès. Aucun annuaire public nominatif des élèves.
5. Matières.

## Invitations

- Créées par un responsable autorisé de la classe ; lien à jeton aléatoire, stocké haché.
- Expiration, révocation, nombre maximal d’utilisations et journalisation.
- Connexion obligatoire avant acceptation ; confirmation de la classe et demande d’approbation selon politique.
- Ne pas ajouter automatiquement quelqu’un parce qu’il a saisi le même établissement et la même classe.
- Acceptation idempotente ; contrôles serveur ; accès aux membres limité aux personnes autorisées.
- Partage par copie du lien ou feuille de partage, jamais envoi automatique à des contacts.

## Installation requise

Choisir un hébergement Moodle compatible avec les exigences de la version stable retenue : domaine HTTPS, PHP, base de données, stockage privé, tâche cron, courrier transactionnel, sauvegardes et mises à jour. Le site statique Nqta actuel ne peut pas exécuter Moodle.

Configurer un service REST minimal dans Moodle, avec un compte technique dédié et des permissions strictement nécessaires. Vérifier la documentation API de l’instance installée avant de choisir les fonctions d’inscription, cours, devoirs et groupes. Conserver les secrets côté serveur.

## Conditions de livraison

Tests avec deux comptes distincts : création de classe autorisée, lien valable, lien expiré/révoqué, lien réutilisé, utilisateur non autorisé, indisponibilité Moodle. Vérifier la synchronisation sans doublons et l’absence d’exposition des autres classes.

Sources : https://docs.moodle.org/dev/Web_services et https://moodledev.io/docs/4.5/apis/subsystems/external/writing-a-service
