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
- Les choix de fournisseur cloud et les versions exactes des outils ne sont pas verrouillés par cette décision.

### Statut

**Validée.**
