# Synchronisation

## État

**Principes de synchronisation V1 validés le 2026-10-07.**

## Objectif

Permettre à Android de fonctionner localement sans réseau tout en synchronisant ses données de manière bidirectionnelle avec PostgreSQL via un backend. L'architecture doit également permettre l'ajout ultérieur de clients Web, iOS ou desktop.

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

## Mutations et idempotence

Toute mutation envoyée au serveur doit pouvoir être reconnue de façon déterministe.

Une opération de synchronisation doit notamment disposer d'un identifiant stable permettant de distinguer un retry de la création d'une nouvelle opération.

Le serveur doit pouvoir traiter un retry sans appliquer deux fois la même mutation.

## Versionnement

Les données synchronisables doivent disposer de mécanismes permettant de déterminer :

- la version ou l'état connu côté client ;
- la version ou l'état connu côté serveur ;
- les changements locaux non encore confirmés ;
- les changements distants intervenus depuis la dernière synchronisation.

Le modèle exact de versionnement sera défini avec le schéma de données et le contrat API.

## Conflits

Le principe **« dernier écrit gagne » n'est pas retenu comme règle générale V1**.

Le système doit distinguer :

- les modifications pouvant être fusionnées automatiquement ;
- les modifications incompatibles ;
- les situations nécessitant une résolution explicite.

Les règles précises de résolution seront définies avec le modèle métier. Elles ne doivent pas être inventées par la couche UI.

## Résilience

Le moteur de synchronisation doit supporter :

- perte du réseau ;
- interruption de l'application ;
- retry ;
- réponse serveur perdue après traitement ;
- reprise après redémarrage ;
- synchronisation répétée sans duplication.

Une opération ne doit pas disparaître simplement parce que le processus Android a été interrompu avant la confirmation de sa synchronisation.

## Frontière serveur

Android ne communique jamais directement avec PostgreSQL.

```
Client
  ↓ HTTPS / API
Backend
  ↓
PostgreSQL
```

Cette frontière permet d'ajouter d'autres clients sans reproduire la logique d'accès aux données ou les règles de sécurité.

## Non décidé

Restent à définir lors de la conception du backend et du modèle de données :

- protocole exact de synchronisation ;
- format des mutations et accusés de réception ;
- mécanisme précis de versionnement ;
- règles de conflit par type d'entité ;
- stratégie de suppression et tombstones ;
- transport temps réel éventuel ;
- stratégie de reprise et de backoff détaillée.
