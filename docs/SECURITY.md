# Sécurité

## État

**Principes d'architecture sécurité V1 et garanties de synchronisation V1 validés le 2026-10-07.**

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

Les tables PostgreSQL V1 résident dans `public` mais ont RLS activé comme défense en profondeur. Aucune politique d'accès client n'est encore définie : l'autorisation métier reste exclusivement portée par Fastify. Le rôle de connexion PostgreSQL et son niveau de privilège restent à décider avant l'accès runtime.

Les détails de durée de vie des sessions, renouvellement, révocation et déconnexion seront définis lors de l'implémentation de l'authentification.

## Stockage local

La base Room contient potentiellement des données financières sensibles.

La stratégie détaillée de protection du stockage local, des clés et des sauvegardes doit être définie avant la première implémentation des données réelles.

## Transport

Les échanges distants doivent utiliser un transport sécurisé. Aucun secret, jeton ou donnée financière ne doit être transmis ou journalisé de manière inappropriée.

## Synchronisation

Le mécanisme d'idempotence et de versionnement doit éviter qu'un retry réseau entraîne une double application d'une mutation.

Les contrôles d'autorisation sont effectués côté serveur et ne doivent jamais dépendre uniquement de l'UI Android.

## Synchronisation

Le protocole de synchronisation V1 renforce plusieurs garanties de sécurité et d'intégrité :

- les mutations utilisent un `mutation_id` stable afin qu'un retry ne puisse pas être interprété comme une nouvelle opération ;
- les mutations de modification utilisent une version de base pour détecter les changements concurrents ;
- le serveur attribue une révision persistante aux changements acceptés ;
- les mutations, leur résultat d'idempotence et leur entrée de journal sont liés dans une transaction PostgreSQL atomique ;
- les suppressions sont propagées via des tombstones persistants ;
- le serveur filtre les changements selon les autorisations et politiques de confidentialité avant transmission au client ;
- aucune règle de sécurité ne repose sur le masquage de données côté UI.

Le principe global « dernier écrit gagne » n'est pas utilisé pour les données financières. Les conflits incompatibles doivent être détectés et traités explicitement.

Le contrat API impose une enveloppe d'erreur commune. Les réponses de conflit peuvent exposer l'identifiant de mutation, l'identifiant d'entité et la version courante nécessaires au traitement du conflit, mais ne doivent pas renvoyer automatiquement la représentation courante d'une entité. Le client récupère ensuite l'état autorisé par le pull normal.

L'idempotence des mutations est scoped par `(user_id, mutation_id)). Cette portée empêche qu'une connaissance accidentelle d'un `mutation_id` permette de réutiliser ou consulter le résultat d'une mutation appartenant à un autre utilisateur.

## Secrets

Les secrets et credentials ne doivent jamais être commités dans le dépôt.

Les environnements de développement et de production doivent séparer leurs secrets. Le workflow GitHub Actions de migrations utilise les secrets `SUPABASE_ACCESS_TOKEN` et `SUPABASE_DB_PASSWORD`, qui doivent rester exclusivement dans GitHub Secrets et ne jamais être affichés ou committés.

## Base de données et défense en profondeur

La migration PostgreSQL V1 active RLS sur les tables métier et de synchronisation. Cette mesure ne remplace pas l'autorisation Fastify : elle évite qu'une exposition accidentelle aux rôles clients transforme le schéma en voie d'accès aux données. Les politiques RLS applicatives ne seront ajoutées qu'après décision explicite du modèle d'autorisation.

## Non décidé

- parcours détaillé des sessions/tokens : durée de vie, renouvellement, révocation et déconnexion ;
- chiffrement local détaillé ;
- gestion des clés ;
- politique de sauvegarde ;
- contrôles de sécurité Vercel/Supabase spécifiques à l'implémentation ;


## Connexion PostgreSQL runtime V1

Le secret de connexion PostgreSQL est exclusivement fourni au backend via `DATABASE_URL`. Il ne doit jamais être embarqué dans Android, exposé au client ou commité dans Git.

Le backend utilise `pg` et le Supavisor Transaction Pooler. Le pool est limité à une connexion par instance Vercel afin de réduire la multiplication des connexions. L'autorisation métier reste portée par Fastify ; RLS reste une défense en profondeur.

Le choix de `pg` remplace `postgres.js` pour éviter le risque de pipelining avec le pooler transactionnel partagé, qui serait particulièrement problématique pour les transactions atomiques du protocole de synchronisation.

Le recours à un rôle PostgreSQL dédié à privilèges minimaux reste à étudier séparément avant d'introduire des privilèges plus fins.
