# Sync API V1 — contrat métier

## État

**Contrat des DTO et mutations V1 validé le 2026-10-07.**

Ce document complète docs/SYNC.md et constitue la référence du contrat HTTP métier du Sync API V1. Les règles de conflit par entité, la rétention du journal/tombstones et le retry/backoff client restent suivis par leurs Issues dédiées.

## 1. Principes

- Les opérations de synchronisation sont authentifiées par le JWT de l'utilisateur.
- Le serveur détermine l'identité depuis le JWT ; user_id n'est jamais fourni par le client comme autorité d'identité.
- mutation_id est un UUID généré côté client et stable pendant toute la durée d'une mutation logique.
- L'idempotence est portée par le couple (user_id, mutation_id).
- entity_id est un UUID stable généré côté client pour les entités synchronisables.
- base_version est obligatoire pour une modification ou suppression d'une entité existante et absent pour une création.
- payload contient uniquement les champs métier modifiables par l'opération.
- Les champs techniques serveur (version, server_revision, timestamps serveur, auteur authentifié) ne sont jamais acceptés comme autorité du client.
- Une mutation multi-objet nécessaire au maintien d'un invariant est une seule mutation logique ; elle n'est pas représentée par une dépendance implicite entre plusieurs mutations distinctes.

## 2. Types communs

### Mutation

~~~json
{
  "mutation_id": "uuid",
  "operation": "UPDATE_TRANSACTION",
  "entity_id": "uuid",
  "base_version": 7,
  "payload": {}
}
~~~

Règles :

| Champ | Création | Modification | Suppression |
|---|---|---|---|
| mutation_id | requis | requis | requis |
| operation | requis | requis | requis |
| entity_id | requis | requis | requis |
| base_version | absent | requis | requis |
| payload | requis | requis | absent |

Une même mutation_id ne peut apparaître qu'une fois dans une requête. Si elle a déjà été traitée pour l'utilisateur authentifié, le serveur retourne le résultat durablement enregistré.

### Résultat de mutation

~~~json
{
  "mutation_id": "uuid",
  "status": "APPLIED",
  "entity_id": "uuid",
  "version": 8,
  "server_revision": 153
}
~~~

Statuts V1 :

- APPLIED : mutation appliquée ;
- ALREADY_PROCESSED : résultat d'une mutation déjà traitée ;
- CONFLICT : base_version incompatible avec la version courante ;
- REJECTED : mutation refusée pour autorisation, intégrité ou validation métier ;
- RETRYABLE_ERROR : mutation valide mais traitement temporairement impossible.

Un conflit ou un refus ne retourne pas la représentation complète d'une entité à laquelle le client pourrait ne pas avoir accès.

## 3. Catalogue des opérations

Le catalogue V1 est volontairement conservateur. Les opérations d'identité et d'administration des membres qui nécessitent un workflow spécifique ne sont pas transformées en mutations génériques du Sync API.

### Space

- CREATE_SPACE
- UPDATE_SPACE
- DELETE_SPACE

Payload de création/modification :

~~~json
{
  "type": "PERSONAL",
  "name": "..."
}
~~~

type est PERSONAL ou SHARED.

### SpaceMember

Les membres ne sont pas modifiés par un CRUD générique de synchronisation.

Les invitations, acceptations, suspensions, retraits et changements de rôle constituent des opérations d'administration/collaboration soumises à des contrôles d'autorisation spécifiques. Elles utiliseront des Business API dédiées lorsque leur implémentation sera traitée.

Cette restriction évite qu'un client puisse représenter une modification de membership comme une simple mutation de données.

### Account

- CREATE_ACCOUNT
- UPDATE_ACCOUNT
- DELETE_ACCOUNT

Payload :

~~~json
{
  "name": "...",
  "type": "...",
  "currency": "EUR",
  "opening_balance": 5432,
  "opening_balance_date": "2026-10-07",
  "status": "..."
}
~~~

Le montant opening_balance est exprimé en minor units. Les valeurs métier exactes de type, status et les règles multi-devises restent soumises à l'Issue #20.

### AccountParticipation

- CREATE_ACCOUNT_PARTICIPATION
- UPDATE_ACCOUNT_PARTICIPATION
- DELETE_ACCOUNT_PARTICIPATION

Payload :

~~~json
{
  "space_id": "uuid",
  "account_id": "uuid",
  "status": "...",
  "visibility_policy": "INHERIT"
}
~~~

Le serveur vérifie que l'utilisateur possède ou peut gérer la participation selon la matrice d'autorisation. space_id et account_id ne créent aucun droit à eux seuls.

### Budget

- CREATE_BUDGET
- UPDATE_BUDGET
- DELETE_BUDGET

Payload :

~~~json
{
  "space_id": "uuid",
  "name": "...",
  "start_date": "2026-10-01",
  "end_date": "2026-10-31",
  "status": "..."
}
~~~

### BudgetAccountSelection

- CREATE_BUDGET_ACCOUNT_SELECTION
- DELETE_BUDGET_ACCOUNT_SELECTION

Payload de création :

~~~json
{
  "budget_id": "uuid",
  "account_participation_id": "uuid"
}
~~~

La sélection ne confère jamais un droit d'accès absent des couches d'autorisation supérieures.

### Transaction

- CREATE_TRANSACTION
- UPDATE_TRANSACTION
- DELETE_TRANSACTION

Payload :

~~~json
{
  "account_id": "uuid",
  "type": "EXPENSE",
  "transaction_date": "2026-10-07",
  "amount": 10000,
  "currency": "EUR",
  "description": "...",
  "note": "...",
  "visibility_override": "INHERIT",
  "lines": [
    {
      "id": "uuid",
      "category_id": "uuid",
      "amount": 10000
    }
  ],
  "transfer": {
    "transfer_group_id": "uuid"
  }
}
~~~

Règles :

- amount et les montants de lignes sont en minor units ;
- lines est traité atomiquement avec la transaction lorsqu'il est fourni ;
- une transaction EXPENSE ou INCOME doit respecter l'invariant de somme des lignes lorsque les lignes sont utilisées ;
- TRANSFER utilise le même modèle de transaction mais doit conserver les invariants propres au groupe de transfert ;
- les règles détaillées de validation financière restent suivies par l'Issue #17 ;
- une suppression de transaction est synchronisée par tombstone, pas comme une disparition silencieuse.

### TransactionLine

Il n'existe pas d'opération CRUD indépendante V1.

Les lignes sont une partie atomique de la mutation Transaction. Cela évite les états intermédiaires où une transaction financière et ses répartitions ne correspondent plus.

### TransferGroup

Il n'existe pas d'opération CRUD indépendante V1.

La création ou modification d'un transfert est portée par une mutation logique de transaction multi-objet lorsque les deux côtés doivent évoluer ensemble. Les règles précises de cohérence restent suivies par l'Issue #17.

### Category

- CREATE_CATEGORY
- UPDATE_CATEGORY
- DELETE_CATEGORY

Payload :

~~~json
{
  "parent_id": "uuid",
  "name": "...",
  "type": "...",
  "status": "..."
}
~~~

La portée système/personnelle/espace et les règles de suppression ou déplacement restent suivies par l'Issue #18.

### BudgetAllocation

- CREATE_BUDGET_ALLOCATION
- UPDATE_BUDGET_ALLOCATION
- DELETE_BUDGET_ALLOCATION

Payload :

~~~json
{
  "budget_id": "uuid",
  "category_id": "uuid",
  "amount": 10000
}
~~~

Le montant est exprimé en minor units. Les invariants complexes restent suivis par l'Issue #17.

### User

Il n'existe pas d'opération CRUD User dans le Sync API.

L'identité est fournie par Supabase Auth. La création, désactivation, suppression et conséquences sur les données financières relèvent du cycle de vie d'identité suivi par l'Issue #15.

## 4. Dépendances entre mutations

L'ordre des mutations dans un batch ne constitue jamais une dépendance implicite.

Lorsqu'une opération nécessite plusieurs objets pour préserver un invariant, elle doit être représentée comme une seule mutation logique et traitée dans une transaction PostgreSQL.

Une mutation distincte ne peut pas supposer qu'une autre mutation du même batch a été appliquée.

Les dépendances métier explicites entre mutations distinctes ne font donc pas partie du contrat V1 actuel. Cette décision évite d'introduire un système de planification dans le protocole avant qu'un besoin concret ne le justifie.

## 5. Pull

Requête :

~~~json
{
  "cursor": 152,
  "limit": 100
}
~~~

Réponse :

~~~json
{
  "changes": [
    {
      "server_revision": 153,
      "entity": "Transaction",
      "operation": "UPDATE",
      "entity_id": "uuid",
      "version": 8,
      "payload": {}
    }
  ],
  "next_cursor": 153,
  "has_more": false
}
~~~

Un changement de suppression utilise :

~~~json
{
  "server_revision": 154,
  "entity": "Transaction",
  "operation": "DELETE",
  "entity_id": "uuid",
  "version": 9
}
~~~

Le serveur ne transmet dans payload que les données auxquelles l'utilisateur authentifié a droit. Une suppression elle-même doit être filtrée selon les mêmes règles d'autorisation que les autres changements.

## 6. Validation structurelle

Avant tout traitement métier :

- JSON valide ;
- objet racine conforme à l'enveloppe attendue ;
- nombre de mutations compris entre 1 et 100 pour le push ;
- mutation_id UUID valide et unique dans la requête ;
- entity_id UUID valide ;
- base_version entier >= 1 lorsqu'il est requis ;
- opération appartenant au catalogue V1 ;
- payload objet conforme à l'opération ;
- pull : cursor entier >= 0 ;
- pull : limit entier compris entre 1 et 100.

Une enveloppe structurellement invalide produit une erreur HTTP 400 et aucun traitement partiel de la requête concernée.

Une mutation structurellement valide mais refusée par l'autorisation, l'intégrité ou une règle métier produit son résultat individuel REJECTED lorsque le problème concerne cette mutation.

## 7. Catalogue d'erreurs

### Erreurs HTTP de transport

| Code | HTTP | Retry |
|---|---:|---|
| INVALID_REQUEST | 400 | non |
| UNAUTHORIZED | 401 | après renouvellement du jeton si nécessaire |
| FORBIDDEN | 403 | non |
| PAYLOAD_TOO_LARGE | 413 | non |
| RATE_LIMITED | 429 | oui |
| INTERNAL_ERROR | 500 | oui |
| SERVICE_UNAVAILABLE | 503 | oui |

Enveloppe :

~~~json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request",
    "retryable": false
  }
}
~~~

Les messages restent génériques et ne contiennent pas de données financières ni de détails d'autorisation.

### Résultats métier par mutation

| Code/statut | Signification |
|---|---|
| CONFLICT | version de base incompatible |
| REJECTED + autorisation | opération non permise |
| REJECTED + intégrité | relation ou invariant structurel refusé |
| RETRYABLE_ERROR | échec transitoire pendant le traitement |
| APPLIED | mutation appliquée |
| ALREADY_PROCESSED | résultat déjà durablement enregistré |

Les codes internes d'intégrité SQL ne sont pas exposés au client. Le backend les traduit en erreurs stables et non révélatrices.

## 8. Conflits

Le contrat transporte base_version pour détecter les conflits, mais ne définit pas de stratégie de résolution par type d'entité.

Une mutation en conflit retourne CONFLICT. Le client ne doit pas supposer qu'un merge automatique est possible.

La stratégie par entité est suivie par l'Issue #13 et doit être décidée avant l'implémentation des résolutions correspondantes.

## 9. Évolution du contrat

Une nouvelle opération ou un nouveau champ obligatoire constitue une évolution de contrat et doit être documenté avant d'être consommé par un client.

Les champs optionnels peuvent être ajoutés lorsque leur absence conserve la sémantique existante.

Aucun client ne doit dépendre de champs serveur non documentés.

## 10. Sécurité et données financières

Le protocole ne doit jamais utiliser de données financières réelles dans les tests, exemples, Issues, PR ou documentation.

Les erreurs et réponses ne doivent pas révéler :

- des données d'un autre utilisateur ;
- le contenu d'une transaction non visible ;
- une existence d'entité interdite lorsque cette information elle-même est sensible ;
- des secrets, JWT ou credentials ;
- des détails SQL internes.

L'autorisation est évaluée côté serveur avant lecture, mutation ou transmission.

## 11. Hors de ce contrat

Restent volontairement séparés :

- règles de résolution des conflits par entité — Issue #13 ;
- rétention/compactage/purge du journal et tombstones — Issue #14 ;
- cycle de vie des sessions — Issue #15 ;
- invariants financiers complexes — Issue #17 ;
- taxonomie et portée des catégories — Issue #18 ;
- devises et précision métier — Issue #20 ;
- retry/backoff détaillé et temps réel — Issue #22 ;
- rôle PostgreSQL runtime minimal — Issue #27.

Ces points ne sont pas des omissions accidentelles : ils nécessitent chacun une décision métier ou de sécurité distincte.
