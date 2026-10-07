# Sécurité

## État

**Principes d'architecture sécurité V1 validés le 2026-10-07.**

Les données budgétaires et financières sont sensibles. La sécurité doit être conçue autour de la séparation entre client, backend et base de données.

## Frontière de confiance

```text
Android
   │ HTTPS + JWT
   ▼
Vercel / Fastify API
   │ serveur uniquement
   ▼
Supabase PostgreSQL

Supabase Auth
   │
   └── identité / JWT
```

Android ne dispose pas d'un accès direct à PostgreSQL.

Le backend est responsable des contrôles serveur nécessaires avant lecture ou mutation des données.

## Backend et authentification

Le backend V1 est une API **Fastify / TypeScript** déployée sur **Vercel Functions / Fluid Compute**. **Supabase Auth** fournit l'identité et les jetons d'accès.

Le backend doit vérifier le JWT avant toute opération protégée et utiliser son `sub` comme identifiant de l'utilisateur authentifié. L'autorisation ne doit jamais être déduite d'informations contrôlées par le client.

La vérification des signatures JWT doit privilégier les clés publiques/JWKS publiées par Supabase. Aucun secret de signature ne doit être embarqué dans l'application Android.

Le backend reste la seule frontière applicative vers PostgreSQL. Le client Android ne doit pas utiliser directement la Data API Supabase pour les données métier.

Les détails de durée de vie des sessions, renouvellement, révocation et déconnexion seront définis lors de l'implémentation de l'authentification.

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
- contrôles de sécurité Vercel/Supabase spécifiques à l'implémentation ;
