# Base de données

## État

**Modèle métier détaillé V1 validé le 2026-10-07.**

Le schéma PostgreSQL concret, les migrations et les index définitifs restent à concevoir à partir de ce modèle et du contrat de synchronisation.

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

Le type SQL exact (`BIGINT`, `NUMERIC`, ou autre représentation justifiée) reste à décider avec le schéma PostgreSQL définitif.

## Dates et temps

Les dates métier sont distinctes des timestamps techniques :

- `transaction_date` représente la date métier de la transaction ;
- `created_at` et `updated_at` représentent des timestamps techniques, en UTC.

Cette distinction doit être conservée dans le modèle local comme distant.

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

La contrainte empêchant une sélection de budget d'utiliser une participation appartenant à un autre espace devra être garantie côté serveur et, autant que possible, par la structure SQL.

## Suppressions et synchronisation

Les entités synchronisables doivent rester identifiables après une suppression logique suffisamment longtemps pour permettre la propagation de la suppression aux autres clients.

La stratégie exacte de tombstones, leur rétention et les contraintes SQL restent à définir dans le contrat de synchronisation.

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

## Non décidé

- schéma SQL physique définitif ;
- hébergeur PostgreSQL ;
- stratégie exacte de migrations ;
- index définitifs ;
- type SQL exact des montants ;
- mécanisme précis de versionnement ;
- stratégie de rétention et d'audit ;
- rôles et permissions détaillés ;
- taxonomie définitive des catégories ;
- protocole API et de synchronisation ;
- règles de conflit par type d'entité.
