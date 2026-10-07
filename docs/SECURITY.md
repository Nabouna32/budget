# Sécurité

## État

**Principes d'architecture sécurité V1 validés le 2026-10-07.**

Les données budgétaires et financières sont sensibles. La sécurité doit être conçue autour de la séparation entre client, backend et base de données.

## Frontière de confiance

BTBTBT
Android
   │ HTTPS
   ▼
Backend
   │
   ▼
PostgreSQL
BTBTBT

Android ne dispose pas d'un accès direct à PostgreSQL.

Le backend est responsable des contrôles serveur nécessaires avant lecture ou mutation des données.

## Stockage local

La base Room contient potentiellement des données financières sensibles.

La stratégie détaillée de protection du stockage local, des clés et des sauvegardes doit être définie avant la première implémentation des données réelles.

## Transport

Les échanges distants doivent utiliser un transport sécurisé. Aucun secret, jeton ou donnée financière ne doit être transmis ou journalisé de manière inappropriée.

## Synchronisation

Le mécanisme d'idempotence et de versionnement doit éviter qu'un retry réseau entraîne une double application d'une mutation.

Les contrôles d'autorisation sont effectués côté serveur et ne doivent jamais dépendre uniquement de l'UI Android.

## Secrets

Les secrets et credentials ne doivent jamais être commités dans le dépôt.

Les environnements de développement et de production doivent séparer leurs secrets.

## Non décidé

- mécanisme d'authentification ;
- gestion des sessions/tokens ;
- chiffrement local détaillé ;
- gestion des clés ;
- politique de sauvegarde ;
- hébergeur et contrôles de sécurité associés.
