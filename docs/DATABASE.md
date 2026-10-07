# Base de données

## État

**Principes de persistance V1 validés le 2026-10-07.**

## PostgreSQL

PostgreSQL est la cible de persistance distante.

Les clients n'y accèdent jamais directement. Les accès passent par le backend afin de centraliser :

- l'autorisation ;
- la validation ;
- les règles d'intégrité côté serveur ;
- la synchronisation ;
- la traçabilité technique pertinente.

## Persistance locale Android

Android utilise **Room** pour la persistance locale des données applicatives.

La base locale n'est pas une simple copie jetable : elle participe au fonctionnement offline-first et doit donc être conçue pour conserver les changements nécessaires à la synchronisation.

Les préférences et petits états de configuration ne relevant pas du modèle métier utilisent **DataStore** plutôt que la base métier.

## Intégrité

Les données financières doivent être modélisées avec une attention particulière à :

- l'intégrité référentielle ;
- la précision numérique ;
- les invariants métier ;
- l'identification stable des entités ;
- la gestion des suppressions ;
- le versionnement nécessaire à la synchronisation ;
- la traçabilité technique utile.

Aucune donnée financière réelle ne doit apparaître dans les fixtures, exemples, tests, Issues ou autres artefacts du dépôt.

## Schéma

Le schéma PostgreSQL n'est pas encore défini. Il sera conçu à partir du modèle métier validé et du contrat de synchronisation, plutôt que l'inverse.

## Non décidé

- hébergeur PostgreSQL ;
- schéma détaillé ;
- stratégie exacte de migrations ;
- index définitifs ;
- mécanisme précis de versionnement ;
- stratégie de rétention et d'audit.
