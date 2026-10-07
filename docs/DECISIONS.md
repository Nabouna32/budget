# Décisions

Registre des décisions validées.

Format recommandé :
- Date
- Décision
- Contexte
- Alternatives considérées
- Raisons
- Conséquences
- Statut

---

## 2026-10-07 — Architecture Android-first V1

### Décision

Budget V1 sera développé comme une **application Android native en Kotlin avec Jetpack Compose**, avec une architecture en couches UI / Presentation / Domain / Data.

La persistance locale utilisera **Room** pour les données applicatives et **DataStore** pour les préférences. L'application suivra un modèle **offline-first**.

Les données distantes seront persistées dans **PostgreSQL**, accessible uniquement via un backend/API indépendant du client.

La synchronisation sera bidirectionnelle et devra reposer sur des opérations versionnées et idempotentes. Les conflits feront l'objet d'un mécanisme explicite ; la règle générale « dernier écrit gagne » n'est pas retenue à ce stade.

L'interface Android sera adaptative dès V1 et privilégiera une excellente UX Android plutôt qu'une UI multiplateforme imposée.

### Contexte

Le projet souhaite commencer sur Android pour réduire le périmètre initial et éviter de sacrifier la qualité UX à une stratégie multiplateforme prématurée. Une extension future à Web, iOS ou desktop reste souhaitable mais ne doit pas dicter l'UI V1.

### Alternatives considérées

- Flutter dès V1 pour partager davantage l'UI entre plateformes ;
- Kotlin Multiplatform / Compose Multiplatform ;
- React Native / Expo ;
- Android natif avec Kotlin et Jetpack Compose.

### Raisons

L'approche Android native offre la meilleure maîtrise de l'expérience Android et évite d'introduire une complexité multiplateforme uniquement pour des plateformes qui ne sont pas encore nécessaires.

Le découplage du domaine, de l'API, de la synchronisation et du stockage serveur permet néanmoins de préparer les futures plateformes sans imposer leur UI dès maintenant.

Room et DataStore fournissent des abstractions adaptées au fonctionnement local Android, tandis que PostgreSQL reste derrière un backend indépendant du client.

L'offline-first est nécessaire pour que l'application reste utile en l'absence de réseau. L'idempotence et le versionnement sont nécessaires pour rendre les retries et la reprise après interruption déterministes.

### Conséquences

- Le premier client est Android uniquement.
- Une future UI Web/iOS/desktop pourra être native à sa plateforme.
- Le backend et les contrats de données doivent rester indépendants d'Android.
- La conception du modèle de données doit intégrer la synchronisation dès le départ.
- Le protocole de synchronisation détaillé et les règles métier de conflit restent des décisions ultérieures.
- Les choix de fournisseur cloud sont désormais verrouillés pour V1 par une décision distincte du 2026-10-07 ; les versions exactes des outils ne sont pas encore fixées.

### Statut

**Validée.**

---

## 2026-10-07 — Modèle métier personnel et partagé

### Décision

Le modèle métier doit être conçu autour d'un **utilisateur**, d'**espaces budgétaires personnels ou partagés**, de **membres d'espace**, de **comptes/sources financières** et de **budgets**.

Un utilisateur peut commencer avec un espace personnel puis rejoindre ou créer un espace partagé. Les comptes des différents membres restent des entités distinctes : créer un budget commun ne fusionne ni les comptes ni les transactions.

Une source financière peut être incluse dans un espace ou budget partagé selon les règles de participation définies. La propriété de la source, les droits d'accès et son inclusion budgétaire sont trois concepts distincts.

Le budget partagé doit agréger les données autorisées plutôt que dupliquer les transactions.

### Contexte

Un usage réel peut évoluer d'une gestion individuelle vers un budget de couple, de famille, de colocation ou d'un autre groupe. Le produit doit permettre cette évolution sans migration destructrice des données personnelles.

### Alternatives considérées

- fusionner les comptes lors du passage au budget commun ;
- faire appartenir chaque compte à un seul espace ;
- créer des copies des transactions pour le budget partagé ;
- modéliser séparément propriété, accès et participation budgétaire.

### Raisons

La séparation des concepts évite de perdre l'historique personnel lorsqu'un utilisateur commence un budget commun. Elle permet également de construire des vues partagées sans créer de doublons financiers.

### Conséquences

- Le modèle de données doit supporter plusieurs espaces.
- Les relations compte/espace ou compte/budget ne doivent pas imposer une propriété unique par espace.
- La synchronisation doit préserver l'identité unique des comptes et transactions.
- La confidentialité doit être conçue conjointement avec les règles de participation.

### Statut

**Validée.**

---

## 2026-10-07 — Confidentialité hybride des budgets partagés

### Décision

Le partage d'un budget ne signifie pas automatiquement que toutes les transactions personnelles sont visibles par les autres membres.

Le modèle retenu est **hybride** : des règles de visibilité peuvent être définies à un niveau approprié (notamment source/compte), avec possibilité d'exceptions au niveau d'une transaction lorsque le produit le nécessite.

### Contexte

Un budget commun doit permettre de partager les informations utiles à la gestion commune sans obliger les membres à renoncer à toute confidentialité sur leurs dépenses personnelles.

### Alternatives considérées

- transparence totale dès qu'une source participe au commun ;
- confidentialité totale, empêchant toute agrégation utile ;
- contrôle exclusivement transaction par transaction ;
- modèle hybride combinant règles générales et exceptions.

### Raisons

Le modèle hybride offre un compromis entre utilité du budget partagé et confidentialité financière, tout en laissant la place à des règles plus fines si les usages futurs le justifient.

### Conséquences

- La visibilité est une propriété métier à prendre en compte dans le modèle et la synchronisation.
- Les API et mécanismes de synchronisation devront éviter de transmettre à un membre des données auxquelles il n'a pas accès.
- Les tests devront couvrir les frontières de confidentialité.
- Le détail exact des rôles, permissions et règles d'exposition reste à formaliser avant implémentation de la collaboration.

### Statut

**Validée.**

---

## 2026-10-07 — Noyau financier extensible

### Décision

Le noyau métier V1 comprend les concepts suivants :

- `Account` pour les sources financières ;
- `Transaction` pour les événements financiers ;
- `TransactionLine` pour permettre notamment les répartitions entre catégories ;
- `Category` pour la classification budgétaire ;
- `Budget` et `BudgetAllocation` pour la planification ;
- des relations explicites pour les transferts entre comptes.

Une transaction n'est pas limitée à une seule catégorie. Les montants ne reposent pas sur des types flottants et les dates métier sont distinctes des timestamps techniques.

Les extensions futures doivent être ajoutées autour du noyau plutôt que par multiplication de colonnes spécifiques. Les justificatifs/tickets de caisse constituent notamment un cas d'extension via une future entité de pièce jointe.

### Contexte

Le modèle doit rester suffisamment simple pour une V1 tout en évitant les impasses connues, notamment pour les transactions multi-catégories, les transferts et les justificatifs futurs.

### Alternatives considérées

- une transaction directement liée à une seule catégorie ;
- des entités distinctes Income/Expense/Transfer ;
- un champ spécifique de type `receipt_photo_url` dans la transaction ;
- un noyau extensible avec lignes et entités associées.

### Raisons

Le modèle extensible couvre les cas réels sans imposer dès V1 un système complet de documents, OCR ou imports.

### Conséquences

- Le schéma devra être conçu à partir de ce noyau et du contrat de synchronisation.
- Les futures pièces jointes ne doivent pas être conçues comme une propriété intrinsèque d'une transaction.
- Les idées futures restent séparées des exigences immédiates.

### Statut

**Validée.**


---

## 2026-10-07 — Modèle détaillé des espaces, sources et budgets

### Décision

Le modèle V1 autorise :

- un compte à participer à plusieurs espaces ;
- un budget à sélectionner explicitement certaines sources financières participantes ;
- une politique de visibilité plutôt qu'un simple booléen pour représenter la confidentialité des données partagées.

Une relation dédiée entre le budget et la participation de compte sera utilisée conceptuellement pour sélectionner les sources d'un budget sans dupliquer les comptes ou transactions.

### Contexte

Le produit doit permettre à un utilisateur de conserver ses données personnelles tout en utilisant certaines sources dans un ou plusieurs contextes partagés. Un espace peut contenir plusieurs comptes, tandis qu'un budget particulier peut ne nécessiter qu'un sous-ensemble de ces comptes.

La confidentialité doit également pouvoir évoluer au-delà d'un simple partage oui/non, notamment avec des règles générales au niveau d'une source et des exceptions au niveau d'une transaction.

### Alternatives considérées

- imposer un compte à un seul espace ;
- inclure automatiquement tous les comptes d'un espace dans chaque budget ;
- copier les comptes ou transactions pour les budgets partagés ;
- représenter la visibilité par un booléen global ;
- séparer propriété, participation, sélection budgétaire et visibilité.

### Raisons

Permettre plusieurs participations préserve l'identité et l'historique des comptes.

La sélection explicite par budget évite de coupler artificiellement tous les comptes d'un espace à tous ses budgets.

Une politique de visibilité permet de préserver la confidentialité financière tout en laissant la place à des règles plus fines que le seul choix public/privé.

La séparation des relations évite de dupliquer les données financières et reste compatible avec l'offline-first et la synchronisation.

### Conséquences

- `AccountParticipation` représente l'utilisation d'un compte dans un espace sans transférer sa propriété.
- `BudgetAccountSelection` permet à un budget de choisir explicitement les participations qu'il agrège.
- Une transaction reste rattachée à son compte et n'est jamais copiée pour un budget.
- La visibilité doit être évaluée dans le contexte de l'espace et du budget concerné.
- Les API et le moteur de synchronisation doivent appliquer les règles de confidentialité avant transmission des données.
- Les rôles, permissions et valeurs exactes des politiques de visibilité restent des décisions ultérieures.

### Statut

**Validée.**


---

## 2026-10-07 — Backend V1, PostgreSQL, authentification et hébergement

### Décision

Le backend V1 sera une API **TypeScript + Fastify**, déployée sur **Vercel Functions / Fluid Compute**.

La persistance distante V1 utilisera **Supabase PostgreSQL** et **Supabase Auth** fournira l'identité utilisateur et les jetons d'accès.

Le chemin applicatif de référence est :

```text
Android
  ↓ HTTPS + JWT
Vercel / Fastify API
  ↓ serveur uniquement
Supabase PostgreSQL

Supabase Auth
  └── identité / JWT
```

Android n'accède jamais directement à PostgreSQL et n'utilise pas directement la Data API Supabase pour contourner le backend métier.

Le backend porte l'authentification de la requête, l'autorisation, la confidentialité, la validation métier et la future synchronisation.

Le backend vérifie le JWT et dérive l'identité authentifiée de son `sub`. La vérification des signatures privilégiera les clés publiques/JWKS de Supabase.

### Contexte

Le projet doit pouvoir commencer avec un budget très limité. Supabase est déjà connu et utilisé sur un autre projet, et Vercel permet d'héberger l'API sans serveur permanent.

La compatibilité Vercel + Fastify a été vérifiée. Le modèle Functions convient aux requêtes API et traitements courts. Les traitements longs ou durables feront l'objet d'une décision séparée.

### Raisons

La séparation Vercel / Fastify / Supabase conserve une frontière backend explicite et centralise les règles métier, l'autorisation, la confidentialité et la future synchronisation.

Le choix suit un principe **Free-first mais pas Free-dependent** : le démarrage doit rester gratuit ou très peu coûteux sans rendre l'architecture dépendante des limites gratuites.

### Conséquences

- PostgreSQL reste derrière le backend, même s'il est fourni par Supabase.
- Supabase Auth est la source d'identité V1.
- Les Functions Vercel ne doivent pas contenir d'état métier critique en mémoire.
- Les détails de session, révocation, protocole de synchronisation et traitements asynchrones restent à définir.
- L'infrastructure pourra évoluer vers des offres payantes ou d'autres composants si la croissance du produit le nécessite.

### Statut

**Validée.**


---

## 2026-10-07 — Protocole de synchronisation V1

### Décision

Le protocole de synchronisation V1 repose sur :

- un **mutation_id stable** pour chaque mutation logique ;
- une **révision serveur globale monotone** pour ordonner les changements ;
- une **version par entité** pour détecter les modifications concurrentes ;
- un **journal de changements persistant** côté serveur ;
- un **curseur de pull** permettant une reprise déterministe ;
- un **push idempotent** des opérations locales en attente ;
- des **transactions PostgreSQL atomiques** couplant mutation métier, versionnement, journal et résultat d'idempotence ;
- des **tombstones** pour propager les suppressions ;
- une **détection explicite des conflits**, sans règle globale de Last-Write-Wins ;
- un **filtrage serveur des changements** avant transmission selon les autorisations et politiques de confidentialité.

Les détails d'API, les règles de conflit par entité, la rétention du journal et des tombstones, le backoff, la pagination et le temps réel restent des décisions d'implémentation ultérieures.

### Contexte

Le produit doit rester offline-first, supporter plusieurs clients et utilisateurs, survivre aux interruptions et retries, et éviter toute perte silencieuse de modifications financières. Vercel étant stateless, les informations nécessaires à la reprise doivent être persistées dans PostgreSQL et dans la base locale du client.

### Alternatives considérées

- synchronisation fondée uniquement sur `updated_at` et `updated_since` ;
- Last-Write-Wins global ;
- CRDT ;
- event sourcing complet ;
- vector clocks ;
- horloges de Lamport ;
- Merkle trees ;
- synchronisation pair-à-pair.

### Raisons

Un simple delta basé sur `updated_at` ne fournit pas à lui seul une récupération déterministe robuste des suppressions, retries et changements concurrents.

Un Last-Write-Wins global peut écraser silencieusement une modification financière.

Les approches distribuées plus complexes apportent une capacité de convergence supérieure mais une complexité disproportionnée pour la V1. Le protocole retenu fournit des garanties fortes avec des primitives PostgreSQL et une persistance explicite de l'état.

### Conséquences

- Les clients doivent conserver un curseur de synchronisation et une file persistante de mutations en attente.
- Le serveur doit conserver un journal de changements et les informations d'idempotence nécessaires.
- Les entités synchronisables ont besoin d'un versionnement compatible avec la détection de conflits.
- Les suppressions ne peuvent pas être de simples suppressions physiques immédiates si elles doivent être propagées aux clients obsolètes.
- Le backend doit filtrer les changements avant transmission selon les droits et politiques de confidentialité.
- Les conflits financiers incompatibles ne sont pas résolus silencieusement.
- Le schéma SQL et le contrat API devront être dérivés de ces garanties sans figer prématurément leurs détails d'implémentation.

### Statut

**Validée.**


## 2026-10-07 — Contrat API V1

### Décision

Le contrat public V1 sépare explicitement les **Business API** du **Sync API**. Les opérations de synchronisation utilisent :

- `POST /sync/push` pour les mutations locales ;
- `POST /sync/pull` pour récupérer les changements postérieurs à un curseur ;
- un JWT obligatoire pour les opérations protégées ;
- une enveloppe d'erreur commune ;
- une idempotence des mutations portée par le couple `(user_id, mutation_id)` ;
- une détection explicite des conflits fondée sur `base_version` ;
- un curseur global représentant une position dans le journal serveur, avec filtrage des changements côté serveur avant transmission.

Une réponse de conflit n'inclut pas automatiquement la représentation courante de l'entité. Le client récupère ensuite l'état auquel il a droit via le pull normal.

### Contexte

Le protocole de synchronisation V1 est désormais suffisamment défini pour fixer sa frontière HTTP publique, sans figer les détails SQL ni les DTO complets de toutes les entités.

### Alternatives considérées

- exposer le journal interne directement au client ;
- utiliser des paramètres GET pour le pull ;
- identifier l'idempotence uniquement par `mutation_id` global ;
- renvoyer automatiquement l'entité courante dans les conflits ;
- mélanger les Business API et le protocole de synchronisation.

### Raisons

La séparation Business/Sync clarifie les responsabilités et permet de faire évoluer le protocole sans coupler les routes métier à l'infrastructure de synchronisation.

Le `POST` pour le pull permet un payload structuré. La portée `(user_id, mutation_id)` évite qu'un identifiant de mutation ne soit interprété hors de son contexte d'identité. Le filtrage serveur avant transmission protège les données financières privées. Le pull normal comme mécanisme de récupération après conflit évite de créer une seconde voie de lecture potentiellement moins contrôlée.

### Conséquences

- Les futurs clients doivent respecter le même contrat public de synchronisation.
- Le backend doit authentifier chaque requête protégée et appliquer l'autorisation avant transmission.
- Les détails de conflit par entité, DTO complets, limites de lots, retry/backoff et routes métier restent ouverts.
- L'implémentation peut choisir librement sa structure Fastify, ses repositories et son schéma SQL tant que les garanties publiques sont respectées.

### Statut

**Validée.**


## PostgreSQL tooling V1

Decision recorded during Step 7F.

- Driver retenu : `pg` (node-postgres) avec SQL explicite, sans ORM.
- Connexion Vercel : Supavisor Transaction Pooler.
- Pool applicatif : `max: 1` connexion par instance, avec timeouts de connexion et d'inactivité.
- Configuration : `DATABASE_URL`, uniquement côté backend.
- Migrations : Supabase CLI dans `supabase/migrations/`.
- Aucun prepared statement nommé n'est utilisé.


---

## 2026-10-07 — Schéma PostgreSQL physique V1

### Décision

Le schéma PostgreSQL V1 est versionné dans `supabase/migrations/` et utilise :

- des UUID générables côté client pour les entités synchronisables ;
- des `BIGINT` pour les montants en minor units ;
- `CHAR(3)` pour les codes devise avec validation syntaxique minimale ;
- `timestamptz` pour les timestamps techniques et `date` pour les dates métier ;
- une version `BIGINT` par entité ;
- une révision serveur monotone portée par `change_journal` ;
- une table `mutation_results` indexée par `(user_id, mutation_id)` ;
- des tombstones séparés du modèle métier ;
- des clés étrangères composites pour garantir la cohérence d'espace des sélections de comptes par budget.

Les tables du schéma `public` ont RLS activé comme défense en profondeur. L'autorisation métier reste portée par Fastify et aucune politique RLS client n'est figée à ce stade.

### Contexte

Le protocole offline-first nécessite des identifiants générables côté client, une version par entité, une révision serveur globale, des tombstones et une idempotence persistante. Le modèle métier nécessite également une intégrité relationnelle forte.

### Alternatives considérées

- identifiants générés uniquement par PostgreSQL ;
- `NUMERIC` pour les montants ;
- suppression logique directement dans chaque table métier ;
- contrôle exclusif côté backend des relations inter-espaces ;
- RLS comme mécanisme principal d'autorisation métier.

### Raisons

Les UUID permettent la création offline sans dépendance à une séquence serveur. Les minor units en BIGINT restent exactes et correspondent au modèle métier validé. Les tombstones séparés évitent de confondre état métier et infrastructure de synchronisation. Les FK composites déplacent une contrainte structurante importante dans PostgreSQL. RLS fournit une défense en profondeur sans créer deux systèmes concurrents d'autorisation métier.

### Conséquences

- La migration initiale doit rester synchronisable avec le protocole V1.
- Les règles métier complexes restent dans Fastify ou feront l'objet de décisions SQL dédiées.
- Les rôles PostgreSQL, le pooling runtime et les politiques RLS détaillées restent ouverts.
- La migration est versionnée mais son application distante est vérifiée séparément.

### Statut

**Validée.**


---

## 2026-10-07 — Connexion PostgreSQL runtime V1

### Décision

Le backend Fastify utilise **`pg` (node-postgres)** avec SQL explicite, sans ORM. La connexion runtime utilise `DATABASE_URL` et cible le **Supavisor Transaction Pooler** de Supabase.

Le pool est limité à une connexion maximale par instance Vercel (`max: 1`). Les timeouts de connexion et d'inactivité sont bornés. Les requêtes restent paramétrées et les transactions PostgreSQL restent disponibles pour les opérations atomiques de synchronisation.

Le rôle PostgreSQL dédié à privilèges minimaux n'est pas introduit dans cette étape et reste une décision de sécurité séparée.

### Contexte

L'exécution sur Vercel est stateless et peut multiplier les instances. Le protocole de synchronisation dépend de transactions PostgreSQL atomiques et ne doit pas introduire une couche de pooling ou de driver incompatible avec ces garanties.

### Alternatives considérées

- `postgres.js` avec Supavisor Transaction Pooler ;
- `pg` (node-postgres) avec SQL explicite ;
- ORM ;
- connexion PostgreSQL directe persistante depuis le backend serverless.

### Raisons

Supavisor Transaction Pooler est adapté aux connexions serverless et évite de créer une connexion directe persistante par instance. `pg` évite le problème de pipelining de `postgres.js` avec le pooler transactionnel partagé, qui peut provoquer des blocages ou des résultats associés à la mauvaise requête. Ce risque est incompatible avec la criticité des transactions atomiques de synchronisation.

`pg` conserve une API transactionnelle PostgreSQL classique et l'accès SQL explicite déjà retenu pour le schéma et le protocole de synchronisation. L'absence d'ORM évite une abstraction supplémentaire sur les mécanismes critiques de versionnement, d'idempotence et de journalisation.

### Conséquences

- `DATABASE_URL` est un secret backend et ne doit jamais être exposé au client.
- Le pool est local à l'instance et ne porte aucun état métier persistant.
- Les futurs repositories doivent réutiliser cette infrastructure plutôt que créer leurs propres pools.
- La mise en place d'un rôle DB dédié à privilèges minimaux reste à traiter séparément.
- L'application et la vérification de la migration distante restent hors de cette étape et relèvent de 7F.5.

### Statut

**Validée.**


---

## 2026-10-07 — Déploiement automatique des migrations Supabase

### Décision

Les migrations PostgreSQL versionnées dans `supabase/migrations/` sont déployées automatiquement vers le projet Supabase de production après un push sur `main`.

Le déploiement est assuré par GitHub Actions avec le Supabase CLI. Le workflow effectue d'abord un `supabase db push --dry-run`, puis `supabase db push` pour appliquer effectivement les migrations non encore présentes dans l'historique distant.

### Contexte

Le schéma V1 est maintenant versionné et l'historique Supabase a été réconcilié. Une application manuelle après chaque merge créerait un risque d'oubli et ferait diverger l'état réel de production de la source de vérité Git.

### Alternatives considérées

- appliquer les migrations manuellement après les merges ;
- CI uniquement en vérification sans déploiement automatique ;
- déploiement automatique sur `main` après validation CI.

### Raisons

Le déploiement automatique rend le passage de Git vers la base déterministe et réduit le risque d'un schéma de production oublié. Le `dry-run` fournit un pré-contrôle explicite avant l'application réelle.

La concurrence du workflow est sérialisée afin d'éviter deux `db push` simultanés sur le même projet.

### Conséquences

- Un merge sur `main` peut modifier le schéma de production sans intervention manuelle supplémentaire.
- Le token Supabase est stocké uniquement dans GitHub Secrets et ne doit jamais être commité.
- Toute migration future doit être conçue comme un changement de production et vérifiée avant merge.
- Une migration défectueuse peut échouer le workflow ; elle ne doit pas être masquée par une modification manuelle de l'historique.
- Les migrations déjà présentes dans l'historique distant sont ignorées par `db push`.

### Statut

**Validée.**
