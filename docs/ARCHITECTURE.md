# Architecture

## État

**Architecture V1 et protocole de synchronisation V1 validés le 2026-10-07.**

Le backend V1 et son hébergement sont désormais formalisés : **TypeScript + Fastify**, déployé sur **Vercel Functions / Fluid Compute**, avec **Supabase PostgreSQL** comme persistance distante et **Supabase Auth** pour l'identité utilisateur. Ce choix est **Free-first mais pas Free-dependent** : l'architecture doit rester portable si les besoins dépassent les offres gratuites.

Budget démarre avec un client **Android natif**, conçu pour offrir une excellente expérience Android sans imposer de compromis liés à une interface multiplateforme. L'architecture applicative, les contrats d'API et les règles métier doivent toutefois rester suffisamment découplés pour permettre l'ajout ultérieur de clients Web, iOS ou desktop.

## Architecture générale

```
Android
  │
  ├── UI — Jetpack Compose
  ├── Presentation — ViewModels / UI state
  ├── Domain — entités / règles métier / use cases
  └── Data — repositories / local / API / synchronisation
              │
              │ HTTPS + JWT
              ▼
       Vercel / Fastify API
              │
              │ serveur uniquement
              ▼
      Supabase PostgreSQL

       Supabase Auth
             │
             └── identité / JWT
```

Android n'accède jamais directement à PostgreSQL. Le backend constitue la frontière d'accès aux données distantes et reste indépendant du client.

## Backend et services V1

### Backend API

Le backend applicatif V1 est une API **TypeScript + Fastify**.

Il constitue la frontière de confiance et de logique métier entre les clients et PostgreSQL. Il porte notamment :

- l'authentification de la requête et l'identité utilisateur ;
- l'autorisation ;
- les règles de confidentialité ;
- la validation métier ;
- les opérations métier ;
- le futur protocole de synchronisation ;
- les contrôles d'idempotence, de versionnement et de cohérence côté serveur.

Le backend ne doit pas dépendre de l'UI Android et doit rester exploitable par de futurs clients Web, iOS ou desktop.

### Hébergement V1

Le backend Fastify sera déployé sur **Vercel Functions / Fluid Compute**.

Vercel est retenu pour les requêtes API normales et les traitements courts. Les Functions sont considérées comme **stateless** : aucun état métier critique ne doit dépendre de la mémoire d'une instance.

Les traitements durables, les files de travail et les traitements longs ne sont pas implicitement confiés à une Function. Ils feront l'objet d'une décision séparée si le protocole de synchronisation ou les besoins futurs le justifient.

### Base distante

**Supabase PostgreSQL** est retenu pour la persistance distante.

Android ne se connecte jamais directement à PostgreSQL et n'utilise pas directement la Data API Supabase pour contourner le backend métier.

### Authentification

**Supabase Auth** est retenu comme fournisseur d'identité V1.

Le client Android obtient un jeton d'accès après authentification. Le backend vérifie le JWT et dérive l'identité authentifiée de son `sub`.

La vérification doit privilégier les clés publiques/JWKS de Supabase plutôt que de placer inutilement un secret de signature dans le client ou dans un flux applicatif.

Le backend implémente maintenant la vérification des jetons d'accès Supabase avec `@supabase/supabase-js`. Le client serveur utilise uniquement l'URL Supabase et la clé publishable, avec la persistance et le renouvellement de session désactivés : le backend ne gère pas la session cliente et vérifie chaque jeton reçu dans `Authorization: Bearer <JWT>` avec `auth.getClaims()`. L'identité applicative dérivée est limitée au `sub` vérifié et, lorsqu'il est présent, au `session_id` ; ces valeurs ne sont pas journalisées. Aucun `service_role` ni secret de signature JWT n'est utilisé par le backend.

Le cycle de vie des sessions côté client — durée de vie, renouvellement, révocation et déconnexion — reste une décision distincte suivie par l'Issue #15.

### Principe de coût

Le choix Vercel + Supabase est **Free-first** : il doit permettre de commencer avec un coût initial nul ou très faible.

Cela ne constitue pas une dépendance fonctionnelle aux limites gratuites. Si le produit grandit, l'infrastructure pourra évoluer vers des offres payantes ou des composants différents sans remettre en cause les contrats métier et API.

## Stack Android V1

- **Kotlin** pour le code Android.
- **Jetpack Compose** pour l'interface.
- **Room** pour la persistance locale des données applicatives.
- **DataStore** pour les préférences et petits états de configuration ne relevant pas de la base métier.
- Coroutines et Flow peuvent être utilisés pour les opérations asynchrones et les flux d'état.
- Les versions exactes des outils, bibliothèques et SDK seront fixées au moment de l'initialisation du projet.

## Couches et responsabilités

### UI

La couche UI présente l'état et collecte les interactions utilisateur. Elle ne porte pas directement les règles métier ni les accès aux sources de données.

### Presentation

Les ViewModels et l'état de présentation orchestrent les use cases et exposent un état adapté à l'UI.

### Domain

Le domaine contient les entités, règles métier et use cases. Les calculs et invariants financiers importants ne doivent pas dépendre de Compose ou d'un mécanisme de stockage.

### Data

La couche Data abstrait les sources locales et distantes derrière des repositories. Elle contient notamment la base locale, le client API et le moteur de synchronisation.

## Offline-first

L'application Android est conçue selon un modèle **offline-first** :

- la lecture de l'application s'appuie prioritairement sur les données locales ;
- une modification valide est persistée localement avant de dépendre du réseau ;
- les changements à synchroniser sont conservés jusqu'à leur traitement confirmé ;
- une indisponibilité réseau ne doit pas rendre l'application inutilisable ;
- la synchronisation est un mécanisme de propagation, pas une condition préalable au fonctionnement courant de l'application.

## Synchronisation V1

Le protocole V1 repose sur les mécanismes suivants :

- **mutation_id stable** pour rendre les mutations idempotentes ;
- **révision serveur globale monotone** pour ordonner les changements ;
- **version par entité** pour détecter les modifications concurrentes ;
- **journal de changements persistant** côté serveur ;
- **curseur de pull** pour reprendre la synchronisation de manière déterministe ;
- **push idempotent** des opérations locales en attente ;
- **transactions PostgreSQL atomiques** pour coupler mutation, versionnement, journal et résultat de mutation ;
- **tombstones** pour propager les suppressions ;
- **détection explicite des conflits**, sans Last-Write-Wins global ;
- **filtrage serveur des données** avant transmission selon les règles d'autorisation et de confidentialité.

Le protocole privilégie la récupération déterministe et la simplicité opérationnelle. Les CRDT, vector clocks, event sourcing complet et autres mécanismes distribués plus complexes ne sont pas retenus pour V1 sans besoin démontré.

### Contrat API V1

Le contrat public sépare explicitement les **Business API** du **Sync API**. Le backend reste la seule frontière applicative entre les clients et PostgreSQL.

Toutes les opérations protégées utilisent :

```
Authorization: Bearer <JWT>
```

Le backend vérifie le JWT et dérive l'identité depuis son `sub`. Les contrôles d'autorisation et de confidentialité sont appliqués côté serveur avant toute lecture ou transmission.

Le Sync API expose conceptuellement :

```
POST /sync/push
POST /sync/pull
```

Le transport utilise `POST` pour permettre des payloads structurés et ne pas faire dépendre le protocole de synchronisation d'une query string.

Une mutation de push porte au minimum :

```json
{
  "mutation_id": "...",
  "operation": "UPDATE_TRANSACTION",
  "entity_id": "...",
  "base_version": 7,
  "payload": {}
}
```

Le `mutation_id` est stable pour une mutation logique et son idempotence est scoped par l'identité authentifiée : le serveur raisonne sur le couple `(user_id, mutation_id)`.

Un résultat de push distingue au minimum :

- `APPLIED` ;
- `ALREADY_PROCESSED` ;
- `CONFLICT` ;
- `REJECTED` ;
- `RETRYABLE_ERROR`.

Une réponse d'application porte notamment l'identifiant de mutation, l'identifiant d'entité, la nouvelle version d'entité et la révision serveur lorsque ces informations sont pertinentes.

Une requête de pull porte conceptuellement :

```json
{
  "cursor": 152,
  "limit": 100
}
```

La réponse porte :

```json
{
  "changes": [],
  "next_cursor": 153,
  "has_more": false
}
```

Le curseur représente une position dans le journal global, pas le nombre de changements visibles. Le serveur filtre les changements avant de les inclure dans `changes`.

Les erreurs utilisent une enveloppe commune :

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "...",
    "retryable": false
  }
}
```

Les messages d'erreur ne doivent pas divulguer de données financières, de contenu d'une entité non autorisée ou d'informations permettant de contourner l'autorisation.

En cas de conflit, la réponse peut indiquer l'identifiant de mutation, l'entité concernée et la version courante, mais **ne renvoie pas automatiquement la représentation courante de l'entité**. Le client récupère ensuite l'état autorisé via le pull normal. Cela évite une voie de fuite de données et maintient une seule mécanique de lecture synchronisée.

Le contrat public fixe ces garanties. Les DTO et mutations V1 sont définis dans docs/SYNC-API.md. Les règles de conflit propres à chaque type et les détails internes de persistance restent séparés du contrat HTTP.

## Extensibilité multiplateforme

L'objectif n'est pas de partager obligatoirement l'UI entre plateformes.

Doivent rester aussi indépendants que possible du client :

- modèle métier ;
- contrats API ;
- protocole de synchronisation ;
- règles de sécurité côté serveur ;
- persistance PostgreSQL.

Un futur client peut avoir une UI native adaptée à sa plateforme tout en réutilisant les contrats et services communs pertinents.

## Modularité

L'architecture logique est obligatoire dès V1, mais le découpage en modules Gradle ne doit pas être artificiellement fragmenté. Les modules seront introduits lorsqu'ils apportent une frontière réelle, une isolation utile ou une amélioration de maintenabilité.

## Décisions encore ouvertes

Ne sont pas verrouillés par cette architecture :

- bibliothèque HTTP Android précise ;
- cycle de vie des sessions côté client : durée de vie, renouvellement, révocation et déconnexion (Issue #15) ;
- routes métier détaillées des Business API ;
- règles de conflit par type d'entité ;
- politique de rétention, compactage et purge du journal/tombstones ;
- stratégie de backoff/retry détaillée ;
- versions exactes des dépendances et SDK ;
- traitements durables, files de travail ou autres composants d'exécution à ajouter si les besoins futurs le justifient.


## PostgreSQL runtime

Le backend utilise **`pg` (node-postgres)** avec SQL explicite, sans ORM. Les migrations sont versionnées dans `supabase/migrations/` avec le Supabase CLI.

La connexion runtime utilise `DATABASE_URL` et doit cibler le **Supavisor Transaction Pooler** de Supabase pour les Functions Vercel. Le pool est limité à `max: 1` connexion par instance, avec timeouts de connexion et d'inactivité adaptés à l'exécution serverless.

Aucun état métier ne dépend du pool ou de la mémoire de l'instance. Les requêtes restent paramétrées et les transactions PostgreSQL restent disponibles pour les opérations atomiques du protocole de synchronisation.

`pg` a été retenu à la place de `postgres.js` après vérification de compatibilité : Postgres.js pipeline les requêtes par défaut et cette combinaison avec Supavisor Transaction Pooler peut provoquer des blocages ou des résultats associés à la mauvaise requête. Ce risque n'est pas acceptable pour les transactions atomiques de synchronisation V1.

Le rôle PostgreSQL dédié à privilèges minimaux reste une évolution séparée ; V1 conserve le backend comme frontière d'autorisation et le secret de connexion uniquement côté serveur.
