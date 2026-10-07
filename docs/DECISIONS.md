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
