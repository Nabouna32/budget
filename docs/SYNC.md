# Synchronisation

## État

**Principes de synchronisation V1 validés le 2026-10-07.**

Le modèle métier détaillé doit être synchronisable sans dépendre d'une UI particulière et sans dupliquer les transactions entre espaces ou budgets.

## Objectif

Permettre à Android de fonctionner localement sans réseau tout en synchronisant ses données de manière bidirectionnelle avec **Supabase PostgreSQL via l'API Fastify**. L'architecture doit également permettre l'ajout ultérieur de clients Web, iOS ou desktop.

## Modèle offline-first

La base locale Android est la source immédiatement disponible pour l'expérience applicative.

Une opération utilisateur suit conceptuellement :

```
Utilisateur
    ↓
Use case
    ↓
Base locale
    ↓
Opération en attente
    ↓
Moteur de synchronisation
    ↓
API
    ↓
PostgreSQL
```

Le réseau ne doit donc pas être requis pour les opérations locales compatibles avec le mode offline.

## Identité des entités

Les entités métier synchronisables doivent disposer d'identifiants stables pouvant être générés côté client.

Cela concerne notamment :

- User ;
- Space ;
- SpaceMember ;
- Account ;
- AccountParticipation ;
- Budget ;
- BudgetAccountSelection ;
- Transaction ;
- TransactionLine ;
- TransferGroup ;
- Category ;
- BudgetAllocation.

L'identité d'une transaction ne change pas lorsqu'elle est visible dans plusieurs contextes budgétaires.

Un compte et ses transactions ne doivent jamais être copiés uniquement pour construire un espace ou un budget partagé.

## Mutations et idempotence

Toute mutation envoyée au serveur doit pouvoir être reconnue de façon déterministe.

Une opération de synchronisation doit notamment disposer d'un identifiant stable permettant de distinguer un retry de la création d'une nouvelle opération.

Le serveur doit pouvoir traiter un retry sans appliquer deux fois la même mutation.

La création, la modification et la suppression d'une même entité doivent rester idempotentes selon le contrat de synchronisation.

## Versionnement

Les données synchronisables doivent disposer de mécanismes permettant de déterminer :

- la version ou l'état connu côté client ;
- la version ou l'état connu côté serveur ;
- les changements locaux non encore confirmés ;
- les changements distants intervenus depuis la dernière synchronisation.

Le modèle exact de versionnement sera défini avec le contrat API.

## Conflits

Le principe **« dernier écrit gagne » n'est pas retenu comme règle générale V1**.

Le système doit distinguer :

- les modifications pouvant être fusionnées automatiquement ;
- les modifications incompatibles ;
- les situations nécessitant une résolution explicite.

Les règles précises de résolution seront définies par type d'entité et ne doivent pas être inventées par la couche UI.

Les relations structurantes doivent également être protégées. Par exemple, une sélection de compte dans un budget doit rester cohérente avec la participation du compte dans l'espace auquel appartient le budget.

## Confidentialité et synchronisation

La synchronisation doit respecter les règles de visibilité du modèle métier.

Un compte peut participer à plusieurs espaces et un budget peut sélectionner explicitement certaines participations. Cela ne signifie pas qu'un membre reçoit automatiquement toutes les transactions du compte.

Le serveur doit donc filtrer les données selon :

1. l'appartenance de l'utilisateur à l'espace ;
2. la participation de la source au contexte concerné ;
3. la sélection de la source par le budget ;
4. la politique de visibilité applicable ;
5. une éventuelle surcharge de visibilité au niveau de la transaction.

Une donnée financière à laquelle un utilisateur n'a pas accès ne doit pas être envoyée au client dans l'objectif de la masquer ensuite dans l'UI.

## Agrégation sans duplication

Un budget partagé agrège les données des sources autorisées :

```
Budget
  ↓
BudgetAccountSelection
  ↓
AccountParticipation
  ↓
Account
  ↓
Transactions
```

La synchronisation ne doit pas créer une seconde transaction appartenant au budget.

Ainsi :

- une transaction conserve un identifiant unique ;
- son compte reste sa source ;
- plusieurs budgets peuvent éventuellement exploiter la même source selon leurs règles ;
- les vues et agrégations sont dérivées des données autorisées.

## Suppressions et tombstones

Les suppressions synchronisables doivent être propagées même lorsqu'un client n'a pas reçu l'entité originale au même moment.

Le système devra donc conserver des **tombstones** ou un mécanisme équivalent pendant une durée suffisante pour que les clients concernés puissent apprendre la suppression.

La durée de rétention, le compactage et la purge restent à définir.

Une suppression ne doit pas provoquer la réapparition d'une entité lors d'un retry ou d'une synchronisation ultérieure.

## Résilience

Le moteur de synchronisation doit supporter :

- perte du réseau ;
- interruption de l'application ;
- retry ;
- réponse serveur perdue après traitement ;
- reprise après redémarrage ;
- synchronisation répétée sans duplication ;
- concurrence entre changements locaux et distants.

Une opération ne doit pas disparaître simplement parce que le processus Android a été interrompu avant la confirmation de sa synchronisation.

## Infrastructure de synchronisation

L'infrastructure de synchronisation reste conceptuellement séparée du modèle métier :

```
Données métier
Account / Transaction / Category / ...

Infrastructure
SyncState / PendingOperation / Tombstone
```

Il n'est pas nécessaire de polluer chaque entité métier avec l'ensemble des informations de transport ou de file d'attente.

Le modèle physique pourra toutefois associer aux entités les informations de version indispensables au protocole retenu.

## Frontière serveur

Android ne communique jamais directement avec PostgreSQL ni avec la Data API Supabase pour les opérations métier.

```
Client Android
  ↓ HTTPS + JWT
Vercel / Fastify API
  ↓ serveur uniquement
Supabase PostgreSQL
```

Le backend authentifie la requête, détermine l'utilisateur à partir du JWT, applique les règles d'autorisation et de confidentialité, puis exécute les opérations métier. Le protocole de synchronisation détaillé sera conçu dans l'étape dédiée suivante.

Vercel Functions étant stateless, l'état de synchronisation durable doit rester dans PostgreSQL et/ou dans les mécanismes persistants explicitement retenus ; il ne doit pas dépendre de la mémoire d'une instance.

Cette frontière permet d'ajouter d'autres clients sans reproduire la logique d'accès aux données ou les règles de sécurité.

## Non décidé

Restent à définir lors de la conception du backend et du protocole :

- protocole exact de synchronisation ;
- format des mutations et accusés de réception ;
- mécanisme précis de versionnement ;
- règles de conflit par type d'entité ;
- stratégie exacte de tombstones et de rétention ;
- transport temps réel éventuel ;
- stratégie de reprise et de backoff détaillée ;
- format des erreurs de synchronisation ;
- gestion précise des opérations concurrentes.
