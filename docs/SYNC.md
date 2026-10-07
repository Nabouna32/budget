# Synchronisation

## État

**Architecture du protocole de synchronisation V1 validée le 2026-10-07.**

Le modèle métier détaillé doit être synchronisable sans dépendre d'une UI particulière et sans dupliquer les transactions entre espaces ou budgets.

## Objectif

Permettre à Android de fonctionner localement sans réseau tout en synchronisant ses données de manière bidirectionnelle avec **Supabase PostgreSQL via l'API Fastify**. L'architecture doit également permettre l'ajout ultérieur de clients Web, iOS ou desktop.

Le protocole V1 doit notamment supporter :

- le fonctionnement offline-first ;
- plusieurs appareils pour un même utilisateur ;
- plusieurs utilisateurs dans des espaces partagés ;
- les créations, modifications et suppressions ;
- les retries après erreur réseau ;
- la perte d'une réponse après traitement serveur ;
- les interruptions et redémarrages du client ;
- la concurrence entre modifications ;
- les contraintes de confidentialité ;
- une récupération déterministe sans dépendre de la mémoire d'une Function Vercel.

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

Toute mutation envoyée au serveur doit disposer d'un **identifiant de mutation stable**, généré côté client.

Conceptuellement :

```
mutation_id = UUID
operation    = UPDATE_TRANSACTION
entity_id    = ...
base_version = ...
```

Le `mutation_id` identifie une tentative logique de mutation, et non une requête HTTP particulière.

Le serveur doit conserver suffisamment d'état durable pour reconnaître un retry de cette mutation. Si une requête est traitée mais que sa réponse est perdue, un retry avec le même `mutation_id` doit retourner le résultat déjà enregistré sans appliquer la mutation une seconde fois.

La création, la modification et la suppression d'une même entité doivent donc être idempotentes selon le contrat de synchronisation.

## Révisions serveur

Le serveur attribue une **révision globale monotone** aux changements acceptés.

Conceptuellement :

```
revision 100
revision 101
revision 102
...
```

La révision sert à ordonner les changements dans le journal de synchronisation. Elle constitue un ordre technique global et ne représente ni une date métier ni une version de contenu d'une entité.

Chaque changement accepté doit être associé à une révision persistante.

## Versionnement des entités

Le protocole distingue la révision globale du journal et la **version propre à chaque entité**.

Conceptuellement :

```
Transaction X → version 7
```

Une mutation de modification transporte la version de base connue par le client.

Exemple :

```
Client A connaît X en version 7
Client B modifie X → version 8

A envoie une mutation avec base_version = 7
Serveur constate version courante = 8
→ conflit explicite
```

La version d'entité sert à détecter les modifications concurrentes incompatibles. Elle ne remplace pas la révision globale du journal.

## Journal persistant des changements

Le serveur doit conserver un **journal de changements persistant** permettant aux clients de récupérer les changements depuis leur dernière position connue.

Un événement de journal doit au minimum permettre d'identifier :

- la révision serveur ;
- l'entité concernée ;
- le type d'opération ;
- les informations nécessaires à l'application du changement ou de la suppression ;
- le contexte technique nécessaire à la récupération.

Le journal est une infrastructure de synchronisation et ne constitue pas un flux directement exposé sans filtrage aux clients.

Une mutation métier et l'événement correspondant doivent être persistés de manière atomique.

## Curseur de synchronisation

Chaque client conserve un **curseur de dernière révision serveur appliquée avec succès**.

Conceptuellement :

```
last_server_revision = 102
```

Le client demande ensuite les changements postérieurs à ce curseur via l'opération de **pull** du protocole. Le contrat HTTP V1 utilise `POST /sync/pull`. La requête porte au minimum un `cursor` et une limite de lot ; la réponse contient `changes`, `next_cursor` et `has_more`.

Le serveur filtre les changements avant de les inclure dans `changes`. Le curseur reste une position dans le journal global et peut donc franchir des révisions invisibles.

Le client ne doit avancer son curseur qu'après avoir appliqué tout le lot avec succès dans sa base locale.

Le traitement local doit donc être transactionnel :

```
Réception du lot
    ↓
Transaction Room :
  appliquer les changements
  persister le nouveau curseur
    ↓
COMMIT
```

Si l'application s'arrête avant le commit, l'ancien curseur est conservé et le lot peut être rejoué. Le protocole doit rendre ce rejeu sûr.

Le curseur représente une position dans le journal global, pas le nombre de changements visibles par le client. Un client peut donc avancer au-delà de révisions qu'il n'est pas autorisé à recevoir.

## Push

Les opérations locales non confirmées sont conservées dans une file persistante côté client, conceptuellement `PendingOperation`.

Le client envoie des lots de mutations à l'opération de **push** du protocole.

Le contrat HTTP est défini par le Sync API V1 : le push utilise `POST /sync/push`.

Une mutation porte au minimum :

```json
{
  "mutation_id": "...",
  "operation": "UPDATE_TRANSACTION",
  "entity_id": "...",
  "base_version": 7,
  "payload": {}
}
```

L'idempotence est scoped par le couple `(user_id, mutation_id)`. Le serveur doit conserver le résultat de la mutation de manière durable afin qu'un retry après perte de réponse ne réapplique pas l'opération.

Les résultats distinguent au minimum `APPLIED`, `ALREADY_PROCESSED`, `CONFLICT`, `REJECTED` et `RETRYABLE_ERROR`.

Le serveur traite chaque mutation de manière idempotente et persistante.

Le protocole doit permettre de distinguer au minimum :

- mutation acceptée ;
- mutation déjà traitée ;
- mutation en conflit ;
- mutation refusée pour autorisation ou intégrité ;
- erreur transitoire permettant un retry.

Le contrat utilise une enveloppe d'erreur commune :

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "...",
    "retryable": false
  }
}
```

Les messages d'erreur ne doivent pas contenir de données financières ni révéler des informations permettant de contourner l'autorisation.

## Atomicité serveur

Le traitement d'une mutation métier et l'écriture de son événement de synchronisation doivent utiliser une transaction PostgreSQL atomique.

Conceptuellement :

```
BEGIN
  appliquer la mutation
  vérifier les invariants
  vérifier la version attendue
  attribuer la nouvelle version d'entité
  attribuer la révision serveur
  écrire le journal de changement
  enregistrer le mutation_id et son résultat
COMMIT
```

Cela évite notamment :

- une donnée métier modifiée sans événement de synchronisation ;
- un événement de synchronisation sans donnée métier correspondante ;
- une mutation appliquée deux fois après un retry correctement identifié.

Les transactions impliquant plusieurs objets liés doivent également préserver les invariants métier. Une transaction et ses `TransactionLine`, par exemple, doivent être modifiées atomiquement lorsque la mutation les concerne ensemble.

## Conflits

Le principe **« dernier écrit gagne » n'est pas retenu comme règle générale V1**.

Le protocole détecte les conflits à partir de la version de base connue par le client.

Le système doit distinguer :

- les modifications pouvant être fusionnées automatiquement ;
- les modifications incompatibles ;
- les situations nécessitant une résolution explicite.

Les entités financières sensibles à une perte silencieuse de données, notamment `Transaction`, `TransactionLine`, `TransferGroup` et `BudgetAllocation`, doivent adopter une stratégie conservatrice. Une résolution automatique ne sera introduite que lorsqu'une règle métier explicite le justifie.

Les règles précises de résolution restent à définir par type d'entité. Elles ne doivent pas être inventées par la couche UI.

## Suppressions et tombstones

Une suppression synchronisable doit produire un **tombstone** ou un événement de suppression persistant dans le journal.

Conceptuellement :

```
revision 201
entity_id = X
operation = DELETE
```

Le tombstone permet à un client obsolète d'apprendre qu'une entité a été supprimée et évite sa réapparition lors d'une synchronisation ultérieure.

La durée de rétention, le compactage et la purge des tombstones restent à définir. Aucune durée arbitraire n'est imposée avant que la stratégie de récupération des clients obsolètes soit connue.

## Confidentialité et filtrage serveur

Le journal interne du serveur n'est pas un flux client public.

Avant toute transmission, le backend doit filtrer les changements selon les autorisations et politiques de visibilité applicables, notamment :

1. l'appartenance de l'utilisateur à l'espace ;
2. la participation de la source au contexte concerné ;
3. la sélection de la source par le budget lorsque le contexte est budgétaire ;
4. la politique de visibilité applicable ;
5. une éventuelle surcharge de visibilité au niveau de la transaction.

Une donnée financière à laquelle un utilisateur n'a pas accès ne doit jamais lui être envoyée pour être simplement masquée dans l'UI.

Le même principe s'applique aux agrégats, aux suppressions et aux résultats de retry.

## PostgreSQL et Vercel

Le serveur de synchronisation est stateless du point de vue de Vercel.

L'état durable nécessaire au protocole doit rester dans PostgreSQL et dans la persistance locale du client. Le protocole ne doit pas dépendre de la mémoire d'une instance de Function.

PostgreSQL constitue donc le support de persistance des informations serveur nécessaires à l'idempotence, au versionnement et au journal de changements.

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
SyncState / PendingOperation / ChangeJournal / Tombstone
```

Les informations de transport, de file d'attente, de curseur et de journal ne doivent pas être ajoutées inutilement à chaque entité métier.

Le modèle physique pourra toutefois associer aux entités les informations de version indispensables au protocole retenu.

## Approches explicitement non retenues pour V1

Le protocole V1 ne justifie pas, à ce stade :

- CRDT ;
- event sourcing complet ;
- vector clocks ;
- horloges de Lamport ;
- Merkle trees ;
- synchronisation pair-à-pair.

Ces approches pourraient être reconsidérées si les contraintes du produit évoluent fortement, mais elles introduiraient actuellement une complexité disproportionnée.

## Frontière serveur

Android ne communique jamais directement avec PostgreSQL ni avec la Data API Supabase pour les opérations métier.

```
Client Android
  ↓ HTTPS + JWT
Vercel / Fastify API
  ↓ serveur uniquement
Supabase PostgreSQL
```

Le backend authentifie la requête, détermine l'utilisateur à partir du JWT, applique les règles d'autorisation et de confidentialité, puis exécute les opérations métier et de synchronisation.

Cette frontière permet d'ajouter d'autres clients sans reproduire la logique d'accès aux données ou les règles de sécurité.

## Non décidé

Restent à définir lors de la conception détaillée du backend et de l'API :

- format exact des endpoints ;
- format des payloads JSON ;
- schéma physique exact des tables de synchronisation ;
- règles de conflit par type d'entité ;
- politique de rétention et de compactage des tombstones et du journal ;
- stratégie de backoff et retry détaillée ;
- pagination et taille maximale des lots ;
- format détaillé des erreurs ;
- gestion précise des opérations concurrentes ;
- transport temps réel éventuel.

