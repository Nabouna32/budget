# Base de données

## État

**Modèle métier détaillé V1 et architecture de synchronisation V1 validés le 2026-10-07.**

Le schéma PostgreSQL physique V1 est désormais matérialisé dans `supabase/migrations/20261007193257_initial_schema_v1.sql`. La migration est versionnée dans Git et son application sur le projet Supabase réel a été vérifiée lors de l'étape 7F.5.

## PostgreSQL

**Supabase PostgreSQL** est la cible de persistance distante V1. Supabase fournit PostgreSQL comme stockage persistant ; il ne remplace pas la frontière backend définie par l'architecture.

L'API Fastify hébergée sur Vercel est le seul point d'accès applicatif prévu aux données métier distantes. Android ne doit pas accéder directement à PostgreSQL ni contourner l'API via la Data API Supabase.

Les clients n'y accèdent jamais directement. Les accès passent par le backend afin de centraliser :

- l'autorisation ;
- la validation ;
- les règles d'intégrité côté serveur ;
- la synchronisation ;
- la traçabilité technique pertinente.

## Persistance locale Android

Android utilise **Room** pour la persistance locale des données applicatives.

La base locale n'est pas une simple copie jetable : elle participe au fonctionnement offline-first et doit donc conserver les changements nécessaires à la synchronisation.

Les préférences et petits états de configuration ne relevant pas du modèle métier utilisent **DataStore** plutôt que la base métier.

## Modèle métier conceptuel V1

### User

Représente un utilisateur du produit.

```
User
├── id
├── created_at
└── updated_at
```

L'identifiant doit être stable et compatible avec la génération côté client.

### Space

Représente un espace budgétaire personnel ou partagé.

```
Space
├── id
├── type              # PERSONAL | SHARED
├── name
├── created_at
└── updated_at
```

Le type ne doit pas encoder un usage particulier comme « couple » ou « famille » : un espace partagé peut correspondre à plusieurs usages.

### SpaceMember

Relie un utilisateur à un espace.

```
SpaceMember
├── id
├── space_id
├── user_id
├── role
├── status
├── created_at
└── updated_at
```

Un utilisateur peut appartenir à plusieurs espaces.

Les rôles et permissions détaillés restent à formaliser avant l'implémentation de la collaboration.

### Account

Représente une source financière appartenant à un utilisateur.

```
Account
├── id
├── owner_user_id
├── name
├── type
├── currency
├── opening_balance
├── opening_balance_date
├── status
├── created_at
└── updated_at
```

Un compte reste la propriété de son utilisateur même lorsqu'il participe à un espace partagé.

### AccountParticipation

Indique qu'un compte peut être utilisé dans un espace donné.

```
AccountParticipation
├── id
├── account_id
├── space_id
├── status
├── visibility_policy
├── created_at
└── updated_at
```

Une même source financière peut participer à plusieurs espaces sans être copiée :

```
Account A
├── Personal Space
└── Shared Space
```

La participation ne transfère pas la propriété du compte.

### Budget

Représente un cadre de planification ou d'analyse rattaché à un espace.

```
Budget
├── id
├── space_id
├── name
├── start_date
├── end_date
├── status
├── created_at
└── updated_at
```

Un budget ne doit pas automatiquement inclure tous les comptes de l'espace.

### BudgetAccountSelection

Sélectionne explicitement les sources autorisées à contribuer à un budget particulier.

```
BudgetAccountSelection
├── id
├── budget_id
├── account_participation_id
├── created_at
└── updated_at
```

Cette relation permet notamment qu'un même espace contienne plusieurs comptes, mais qu'un budget n'en agrège qu'une partie.

Elle doit référencer une participation valide du compte dans l'espace du budget.

Le nom est conceptuel : le nom physique définitif pourra être ajusté lors du schéma SQL.

### Transaction

Représente un événement financier appartenant à un compte.

```
Transaction
├── id
├── account_id
├── type
├── transaction_date
├── amount
├── currency
├── description
├── note
├── visibility_override ?
├── created_at
└── updated_at
```

Types V1 :

- `EXPENSE`
- `INCOME`
- `TRANSFER`

Une transaction appartient à un compte, pas directement à un espace ou à un budget. Les vues budgétaires l'agrègent à partir des comptes autorisés.

### TransactionLine

Permet de répartir une transaction entre plusieurs catégories.

```
TransactionLine
├── id
├── transaction_id
├── category_id
└── amount
```

Pour une transaction `EXPENSE` ou `INCOME`, l'invariant métier est :

```
Σ TransactionLine.amount = Transaction.amount
```

Exemple synthétique :

```
Transaction = 100 €
├── Courses = 70 €
└── Maison = 30 €
```

Les données de démonstration doivent rester synthétiques et ne doivent jamais reproduire une situation financière réelle.

### TransferGroup

Regroupe les deux côtés d'un transfert entre comptes.

```
TransferGroup
├── id
└── ...
```

Exemple conceptuel :

```
Transaction A
├── type = TRANSFER
├── account = A
├── amount = -500
└── transfer_group_id = X

Transaction B
├── type = TRANSFER
├── account = B
├── amount = +500
└── transfer_group_id = X
```

Les transferts liés ne doivent pas être comptés comme un revenu ou une dépense artificiels.

### Category

Représente une catégorie budgétaire.

```
Category
├── id
├── parent_id ?
├── name
├── type
├── status
├── created_at
└── updated_at
```

`parent_id` permet une hiérarchie de catégories.

Le modèle exact des catégories système/personnelles et de leur partage reste à préciser.

### BudgetAllocation

Associe une allocation à une catégorie dans un budget.

```
BudgetAllocation
├── id
├── budget_id
├── category_id
└── amount
```

## Agrégation budgétaire

Un budget partagé ne copie pas les transactions.

Le chemin conceptuel est :

```
Budget
  ↓
BudgetAccountSelection
  ↓
AccountParticipation
  ↓
Account
  ↓
Transaction
  ↓
TransactionLine
  ↓
Category
```

L'autorisation et la visibilité doivent être évaluées avant qu'une donnée financière soit exposée à un membre.

## Argent

Les montants financiers ne doivent jamais utiliser `Float` ou `Double`.

Modèle conceptuel :

```
Money
├── amountMinor : integer
└── currency : ISO code
```

Par exemple, `54,32 EUR` est représenté conceptuellement par `5432 EUR`.

Le stockage SQL V1 utilise `BIGINT` pour les minor units et `CHAR(3)` pour le code devise. Cette représentation reste exacte et cohérente avec le modèle offline-first. Les règles métier de devises et de précision restent ouvertes et sont suivies par l'Issue #20.

## Dates et temps

Les dates métier sont distinctes des timestamps techniques :

- `transaction_date` représente la date métier de la transaction ;
- `created_at` et `updated_at` représentent des timestamps techniques, en UTC.

Cette distinction doit être conservée dans le modèle local comme distant.

## Synchronisation : infrastructure conceptuelle

Les données métier et l'infrastructure de synchronisation sont séparées conceptuellement.

```
Données métier
Account / Transaction / Category / ...

Infrastructure
PendingOperation
SyncState
ChangeJournal
Tombstone
MutationResult
```

Les concepts suivants sont nécessaires au protocole V1 :

- **PendingOperation** côté client pour conserver les mutations locales non confirmées ;
- **SyncState** côté client pour conserver notamment le curseur de dernière révision serveur appliquée ;
- **ChangeJournal** côté serveur pour ordonner et rejouer les changements ;
- **Tombstone** côté serveur pour propager les suppressions ;
- **MutationResult** côté serveur pour reconnaître les retries via le `mutation_id` et restituer un résultat déjà traité.

Le schéma physique V1, les clés structurantes, les index initiaux et la séparation entre journal et tombstones sont matérialisés dans la migration initiale. Les contraintes métier complexes qui nécessitent encore une décision restent hors de cette migration et sont suivies par l'Issue #17.

## Versionnement

Le protocole distingue :

- une **révision serveur globale monotone**, utilisée par le journal de synchronisation ;
- une **version propre à chaque entité**, utilisée pour détecter les modifications concurrentes ;
- un **mutation_id stable**, utilisé pour l'idempotence des mutations ;
- un **curseur local**, utilisé pour reprendre le pull après interruption.

Ces mécanismes ont des responsabilités distinctes et ne doivent pas être confondus.

## Intégrité

Les données financières doivent être modélisées avec une attention particulière à :

- l'intégrité référentielle ;
- la précision numérique ;
- les invariants métier ;
- l'identification stable des entités ;
- la gestion des suppressions ;
- le versionnement nécessaire à la synchronisation ;
- la confidentialité ;
- la traçabilité technique utile.

Les relations structurantes attendues incluent notamment :

- `SpaceMember.space_id → Space.id` ;
- `SpaceMember.user_id → User.id` ;
- `Account.owner_user_id → User.id` ;
- `AccountParticipation.account_id → Account.id` ;
- `AccountParticipation.space_id → Space.id` ;
- `Budget.space_id → Space.id` ;
- `BudgetAccountSelection.budget_id → Budget.id` ;
- `BudgetAccountSelection.account_participation_id → AccountParticipation.id` ;
- `Transaction.account_id → Account.id` ;
- `TransactionLine.transaction_id → Transaction.id` ;
- `TransactionLine.category_id → Category.id` ;
- `BudgetAllocation.budget_id → Budget.id` ;
- `BudgetAllocation.category_id → Category.id`.

La sélection d'un compte par un budget porte également le `space_id` et utilise des clés étrangères composites vers le budget et la participation : PostgreSQL garantit ainsi que les deux appartiennent au même espace.

## Suppressions et synchronisation

Les entités synchronisables doivent rester identifiables après une suppression logique suffisamment longtemps pour permettre la propagation de la suppression aux autres clients.

La migration V1 sépare les tombstones du journal et les rattache à une `server_revision`. Leur rétention, compactage et purge restent volontairement ouverts et sont suivis par l'Issue #14.

## Données sensibles

Aucune donnée financière réelle ne doit apparaître dans :

- les fixtures ;
- les tests ;
- les exemples ;
- les Issues ;
- les PR ;
- les rapports ;
- les logs ;
- les autres artefacts du dépôt.

## Décisions physiques V1

- identifiants métier synchronisables : `uuid`, générables côté client ;
- montants : `bigint` en minor units ;
- devises : `char(3)` avec contrôle syntaxique ISO-like (`A-Z`), sans figer encore la taxonomie métier ;
- timestamps techniques : `timestamptz` ; dates métier : `date` ;
- version d'entité : `bigint`, initialisée à `1` ;
- révision serveur : identité monotone dans `change_journal` ;
- idempotence : clé primaire `(user_id, mutation_id)` dans `mutation_results` ;
- suppressions : `tombstones` séparés du modèle métier ;
- `BudgetAccountSelection` utilise une clé de contexte `space_id` et des FK composites pour empêcher les sélections inter-espaces ;
- les tables du schéma `public` ont RLS activé comme défense en profondeur ; l'autorisation métier reste portée par Fastify et aucune politique client n'est introduite à ce stade.

## Non décidé

- stratégie de rétention et d'audit ;
- rôles et permissions détaillés ;
- taxonomie définitive des catégories ;
- protocole API détaillé ;
- règles de conflit par type d'entité ;
- invariants financiers complexes et éventuels triggers ;
- règles métier de devises et précision ;
- rôle PostgreSQL dédié à privilèges minimaux ;

## Outillage PostgreSQL V1

Les migrations de schéma sont versionnées dans `supabase/migrations/` et générées avec le Supabase CLI. Le runtime applicatif n'utilisera pas le CLI pour accéder aux données.

### Connexion runtime V1

L'API Fastify utilise **`pg` (node-postgres)** avec du SQL explicite, sans ORM.

La connexion runtime V1 repose sur l'URL `DATABASE_URL` fournie par l'environnement de déploiement. Cette URL doit cibler le **Supavisor Transaction Pooler** de Supabase pour l'exécution serverless Vercel.

Le pool applicatif est volontairement limité à **une connexion maximale par instance** (`max: 1`) afin d'éviter de multiplier inutilement les connexions lorsque Vercel exécute plusieurs instances. Les requêtes utilisent des paramètres PostgreSQL natifs et aucun mécanisme de prepared statements nommé n'est introduit.

Le pool est créé à la demande et reste local à l'instance stateless ; aucune donnée métier ne dépend de sa mémoire. Les timeouts de connexion et d'inactivité limitent les ressources retenues par une instance inactive.

`pg` a été retenu à la place de `postgres.js` après vérification de la compatibilité avec Supavisor Transaction Pooler : Postgres.js pipeline les requêtes par défaut et sa combinaison avec le pooler transactionnel partagé peut provoquer des blocages ou des résultats associés à la mauvaise requête. Cette propriété est incompatible avec la criticité des transactions atomiques prévues pour la synchronisation V1.

Le rôle PostgreSQL dédié avec privilèges minimaux reste une évolution de sécurité séparée : pour V1, le secret de connexion reste uniquement côté backend et l'autorisation métier reste portée par Fastify.

La migration initiale de schéma métier et de synchronisation reste la source de vérité versionnée dans ce répertoire. L'état distant est désormais réconcilié avec son historique Supabase.

Lors de l'étape 7F.5, son DDL a été appliqué au projet Supabase réel via l'accès MCP SQL après que l'outil d'application de migration a refusé l'exécution complète. La vérification distante confirme **15 tables publiques**, **15 tables avec RLS activé**, les clés étrangères attendues et les index du schéma. Aucun enregistrement métier n'a été créé.

L'historique Supabase était initialement absent, car l'application directe par SQL ne passe pas par le mécanisme de migration. Il a ensuite été **recréé de façon contrôlée** avec la structure officielle `supabase_migrations.schema_migrations`, puis l'entrée `20261007193257 / initial_schema_v1` a été enregistrée comme déjà appliquée. La vérification finale via l'API Supabase retourne maintenant cette migration dans l'historique distant.

Cette réparation ne rejoue pas le DDL : elle ne fait que réconcilier la métadonnée d'historique avec un schéma déjà vérifié. Le workflow de déploiement normal utilise désormais le Supabase CLI et `supabase db push`; les modifications manuelles de l'historique ne constituent pas le chemin de déploiement.


### Déploiement des migrations

Les migrations de production sont appliquées automatiquement par GitHub Actions après un push sur `main` qui modifie `supabase/migrations/**`, `supabase/config.toml` ou le workflow de migrations.

Le workflow `.github/workflows/supabase-migrations.yml` cible explicitement le projet Supabase de production, installe le Supabase CLI, effectue un `supabase db push --dry-run`, puis applique `supabase db push`. Les déploiements sont sérialisés et le workflow peut être relancé manuellement avec `workflow_dispatch`.

L'authentification CI repose sur les secrets GitHub `SUPABASE_ACCESS_TOKEN` et `SUPABASE_DB_PASSWORD`. Le token est un scoped Personal Access Token Supabase limité au projet et aux permissions nécessaires ; le mot de passe est le mot de passe PostgreSQL propre au projet. Aucune de ces valeurs ne doit être versionnée ou affichée dans les logs.

### Connexion CI Supabase et IPv4

GitHub Actions étant IPv4-only dans cet environnement, le workflow de migrations n'utilise pas la connexion PostgreSQL directe IPv6. Il reçoit `SUPABASE_DB_URL` comme secret GitHub contenant la **connexion Supavisor Session Pooler** du projet (port 5432), puis transmet explicitement cette URL à `supabase db push --db-url`. Le Session Pooler est IPv4 et ne nécessite pas l'IPv4 Add-On payant. `SUPABASE_DB_PASSWORD` reste conservé pour les opérations CLI de liaison ; aucune URL ou credential n'est versionnée.