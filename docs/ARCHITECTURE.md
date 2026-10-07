# Architecture

## État

**Architecture V1 validée le 2026-10-07.**

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

Les détails du parcours de connexion, du renouvellement de session, de l'expiration et de la révocation restent à préciser lors de l'implémentation de l'authentification.

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

## Synchronisation

Les mutations synchronisables sont conçues pour être :

- versionnées ;
- traçables au niveau technique ;
- idempotentes afin de supporter les retries ;
- indépendantes du cycle de vie d'une conversation ou d'un client particulier.

Les détails du protocole et des règles de résolution des conflits sont définis dans `docs/SYNC.md`.

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

- fournisseur d'hébergement ;
- framework backend précis ;
- bibliothèque HTTP Android précise ;
- stratégie d'authentification détaillée ;
- protocole de synchronisation détaillé ;
- règles métier définitives de résolution de chaque type de conflit ;
- versions exactes des dépendances et SDK.
