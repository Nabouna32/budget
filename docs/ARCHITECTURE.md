# Architecture

## État

**Architecture V1 validée le 2026-10-07.**

Budget démarre avec un client **Android natif**, conçu pour offrir une excellente expérience Android sans imposer de compromis liés à une interface multiplateforme. L'architecture applicative, les contrats d'API et les règles métier doivent toutefois rester suffisamment découplés pour permettre l'ajout ultérieur de clients Web, iOS ou desktop.

## Architecture générale

```
Android
  │
  ├── UI — Jetpack Compose
  │
  ├── Presentation — ViewModels / UI state
  │
  ├── Domain — entités / règles métier / use cases
  │
  └── Data — repositories / local / API / synchronisation
              │
              ▼
        Backend / API
              │
              ▼
          PostgreSQL
```

Android n'accède jamais directement à PostgreSQL. Le backend constitue la frontière d'accès aux données distantes et reste indépendant du client.

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
