# Confidentialité

## État

**Principes de confidentialité V1 et garanties de filtrage du protocole de synchronisation confirmés le 2026-10-07.**

Les données budgétaires et financières sont considérées comme sensibles.

## Principes

- minimisation des données collectées ;
- absence de données financières réelles dans les artefacts de développement ;
- limitation des logs ;
- aucun contenu financier sensible dans les Issues, PR, exemples ou rapports techniques ;
- contrôle des accès côté serveur ;
- évaluation explicite de tout nouveau flux de données ;
- pas de dépendance à un service externe pour une donnée sensible sans justification et validation.

## Modèle personnel et partagé

Le produit sépare explicitement :

1. la propriété d'une source financière ;
2. l'accès à un espace ;
3. la participation d'une source à un espace ;
4. la sélection de cette source dans un budget ;
5. la visibilité des données financières.

Cette séparation est nécessaire pour permettre à un utilisateur de conserver des données personnelles tout en contribuant à un budget partagé.

## Autorisation en couches

Le modèle V1 sépare explicitement :

1. l'identité de l'utilisateur ;
2. l'appartenance à l'espace ;
3. la permission d'effectuer une opération ;
4. la participation de la source financière au contexte ;
5. la sélection de la source dans un budget ;
6. la visibilité de la donnée.

Une permission ou une visibilité ne peut jamais contourner une couche plus restrictive. En particulier, une politique de visibilité `SHARED` n'accorde pas à elle seule un accès à une donnée.

Les rôles d'espace V1 sont `OWNER`, `EDITOR` et `VIEWER`. Le rôle est un rôle d'espace et ne transforme pas son détenteur en propriétaire des comptes des autres membres.

Les statuts de membre V1 sont `ACTIVE`, `INVITED`, `SUSPENDED` et `REMOVED`. Seul un membre `ACTIVE` peut accéder aux données selon son rôle et les autres règles de contexte.

La suppression des données financières d'un autre utilisateur est interdite par défaut pour `EDITOR`. Les droits précis par entité et opération restent à détailler dans l'implémentation de l'API.

## Politique de visibilité hybride

Le modèle retenu est **hybride**.

La visibilité n'est pas modélisée comme un simple booléen global. Elle est évaluée dans le contexte auquel l'utilisateur a déjà accès.

Une politique peut exprimer :

- `PRIVATE` : donnée réservée au propriétaire autorisé ;
- `SHARED` : donnée exposable dans le contexte partagé autorisé ;
- `INHERIT` : comportement hérité de la règle supérieure.

Une surcharge transactionnelle ne peut jamais créer un droit d'accès qui n'existe pas au niveau de l'espace ou de la source. Elle peut seulement modifier la visibilité d'une donnée déjà accessible dans le contexte.

Le serveur reste l'autorité d'autorisation et de confidentialité.

## Niveau compte/source

Une `AccountParticipation` porte une politique de visibilité applicable lorsque le compte participe à un espace.

Cela permet par exemple :

```
Account A
├── Personal Space → privé
└── Shared Space  → partage selon la politique définie
```

Le fait qu'un compte participe à un espace ne transforme pas le compte en propriété commune.

## Exceptions au niveau transaction

Certaines transactions peuvent nécessiter une règle différente de celle du compte.

Le modèle doit donc permettre une surcharge de visibilité au niveau de la transaction lorsque le produit le justifie.

Cette surcharge ne doit pas être utilisée pour contourner les permissions d'espace ou les règles serveur.

## Budgets partagés

Un budget partagé ne reçoit pas automatiquement toutes les transactions des membres.

Le chemin d'exposition doit respecter :

```
Utilisateur
  ↓
SpaceMember
  ↓
AccountParticipation
  ↓
BudgetAccountSelection
  ↓
Transaction
  ↓
politique de visibilité
```

Les agrégats eux-mêmes peuvent révéler une information financière sensible. Ils doivent donc être considérés comme des données protégées et non comme une alternative permettant de contourner une règle de confidentialité.

## Synchronisation

Le serveur doit appliquer les règles d'accès avant transmission au client.

Une donnée privée ne doit pas être envoyée à un membre sous prétexte que l'interface la masquera ensuite.

Les mécanismes de synchronisation doivent notamment éviter :

- la fuite d'une transaction privée dans un delta ;
- la fuite d'une transaction supprimée ou remplacée ;
- l'exposition d'un détail financier via une réponse d'agrégation non autorisée ;
- la réapparition d'une donnée privée après un retry.

## Synchronisation et filtrage serveur

Le serveur applique les règles d'accès **avant** toute transmission au client.

Pour un changement issu du journal de synchronisation, le backend doit notamment considérer :

1. l'appartenance actuelle de l'utilisateur à l'espace ;
2. la participation de la source au contexte concerné ;
3. la sélection de la source par le budget lorsque le contexte est budgétaire ;
4. la politique de visibilité applicable ;
5. une éventuelle surcharge au niveau de la transaction.

Le journal global interne peut contenir des changements qui ne sont pas visibles par un client donné. Le curseur client représente donc une position dans le journal global et non une liste de changements visibles. Un client peut franchir des révisions invisibles sans recevoir leur contenu.

Une donnée financière à laquelle un utilisateur n'a pas accès ne doit jamais être envoyée pour être simplement masquée dans l'UI.

Le filtrage doit également être appliqué aux :

- suppressions et tombstones ;
- réponses de retry ;
- agrégats ;
- changements issus d'une opération concurrente.

## Client local

Le fonctionnement offline implique la présence de données sensibles sur l'appareil Android.

Ce point fait partie du modèle de confidentialité et doit être pris en compte dans la conception :

- du stockage local ;
- des sauvegardes ;
- de la suppression des données ;
- des journaux locaux ;
- des notifications pouvant afficher du contenu financier.

Les mécanismes précis de protection du stockage restent à définir dans les choix techniques Android.

## Backend

Le backend constitue la frontière d'accès aux données distantes.

V1 utilise **Vercel** pour l'exécution de l'API Fastify et **Supabase** pour PostgreSQL et l'identité via Supabase Auth.

Cette utilisation de fournisseurs externes ne change pas la responsabilité du backend : les règles d'autorisation, de confidentialité et de filtrage des données financières restent appliquées par l'API avant transmission au client.

Android ne doit pas envoyer de données métier directement à la Data API Supabase. Les flux applicatifs passent par l'API Fastify.

Les choix Vercel + Supabase suivent un principe **Free-first mais pas Free-dependent** : l'usage des offres gratuites est une contrainte de coût initial, pas une justification pour diminuer les garanties de confidentialité ou de sécurité. Une évolution vers des offres payantes ou d'autres composants pourra être décidée si nécessaire.

Les futurs fournisseurs et services externes seront évalués avant introduction, notamment sur :

- les données qu'ils peuvent recevoir ;
- les données qu'ils peuvent conserver ;
- leur journalisation ;
- leurs sous-traitants éventuels ;
- les possibilités de suppression et d'export.

## Développement

Les fixtures et exemples utilisent uniquement des données synthétiques.

Les logs de développement ne doivent pas permettre de reconstruire la situation financière d'un utilisateur.

## Non décidé

- taxonomie définitive des politiques de visibilité ;
- rôles et permissions détaillés ;
- règles de visibilité par type d'entité ;
- gestion des agrégats sensibles ;
- politique de rétention ;
- analytics éventuels ;
- télémétrie éventuelle ;
- sauvegardes et exports ;
- fournisseurs de services externes supplémentaires ;
- protections précises du stockage local Android.
