# Vision

Application de gestion budgétaire Android et Web, conçue autour d'une expérience claire, agréable et visuellement forte, notamment autour du « radiant ring ».

## Vision produit

Budget doit permettre à une personne de construire et piloter son budget personnel sans enfermer le produit dans un modèle exclusivement individuel.

Le produit doit pouvoir évoluer naturellement d'un usage personnel vers un usage partagé :

- une personne peut commencer seule avec son propre budget ;
- elle peut ensuite créer ou rejoindre un espace budgétaire partagé ;
- plusieurs personnes peuvent contribuer à un budget commun ;
- chaque personne peut conserver ses comptes et son budget personnels ;
- les comptes personnels ne sont pas fusionnés pour créer le budget commun ;
- certaines sources financières peuvent être incluses dans un budget partagé selon les règles définies par les membres ;
- la propriété, les droits d'accès et l'inclusion dans un budget sont des concepts distincts.

Cette capacité de passer du budget personnel au budget partagé sans repartir de zéro constitue une **direction produit validée** et un axe de différenciation important.

## Espaces personnels et partagés

Le modèle produit doit pouvoir représenter au minimum :

- un utilisateur ;
- un espace personnel ;
- un espace partagé ;
- des membres d'un espace ;
- des comptes/sources financières ;
- des budgets ;
- les participations des sources financières à un budget ou espace.

Un espace partagé n'implique pas que tous les comptes de ses membres deviennent communs.

Exemple conceptuel :

```
Utilisateur A
├── Espace personnel
│   └── Compte A
│
└── Espace partagé
    ├── Compte A
    └── Compte B

Utilisateur B
├── Espace personnel
│   └── Compte B
│
└── Espace partagé
    ├── Compte A
    └── Compte B
```

Les transactions ne doivent pas être dupliquées pour construire une vue commune : le budget partagé doit agréger les sources autorisées.

## Confidentialité des espaces partagés

Le modèle validé est **hybride**.

La participation à un budget commun ne signifie pas automatiquement que toutes les transactions personnelles deviennent visibles aux autres membres.

La conception devra permettre :

- des règles de visibilité au niveau d'un compte ou d'une source ;
- des exceptions ou surcharges au niveau d'une transaction lorsque nécessaire ;
- le maintien de transactions strictement personnelles ;
- le partage des informations nécessaires au budget commun sans imposer une transparence totale.

La confidentialité financière est une contrainte structurante du produit et doit être prise en compte dès le modèle métier et la synchronisation.

## Modèle financier

Le noyau métier doit rester simple mais extensible :

- `Account` représente une source financière ;
- `Transaction` représente un événement financier ;
- `TransactionLine` permet notamment de répartir une transaction entre plusieurs catégories ;
- `Category` représente la classification budgétaire ;
- `Budget` représente un cadre de planification/analyse ;
- `BudgetAllocation` représente une allocation de budget à une catégorie ;
- les transferts entre comptes doivent être représentés comme des mouvements liés et ne doivent pas être comptés comme un revenu ou une dépense artificiels.

Les montants ne doivent pas reposer sur des flottants. Les dates métier doivent être distinctes des timestamps techniques. Les identifiants doivent pouvoir être générés côté client afin de rester compatibles avec l'offline-first.

## Extensibilité

Le modèle doit permettre d'ajouter des capacités autour d'une transaction sans modifier sa nature fondamentale.

Exemple validé comme direction d'extensibilité :

```
Transaction
├── TransactionLine
├── Attachment       (futur)
├── Note              (futur/selon besoin)
├── Import metadata   (futur)
└── OCR data          (futur)
```

Une pièce jointe ne doit donc pas devenir une colonne spécifique du type `receipt_photo_url` dans `Transaction`. Un futur ticket de caisse pourra être représenté comme une pièce jointe associée à la transaction, sans imposer dès V1 un système complet de stockage, d'OCR ou de traitement documentaire.

## Pistes et capacités futures

Les éléments suivants ont émergé des discussions et sont conservés comme **idées futures**, pas comme exigences V1 déjà implémentées :

- 📸 tickets de caisse et autres justificatifs ;
- 📎 pièces jointes multiples sur une transaction ;
- 🤖 OCR et extraction automatique d'informations depuis un ticket ;
- 🏦 import de transactions bancaires ;
- 🔁 transactions récurrentes ;
- 🏷️ tags ;
- 🧾 commerçants/payees plus structurés ;
- ✂️ répartitions avancées de transactions ;
- 💱 gestion multi-devises plus avancée ;
- 📊 règles automatiques et automatisations budgétaires ;
- 🕘 historique détaillé des modifications ;
- 🤖 fonctionnalités d'assistance ou d'analyse intelligente ;
- autres extensions pouvant être ajoutées sans remettre en cause le noyau financier.

Ces pistes ne constituent pas automatiquement une roadmap ni une exigence. Elles servent de contraintes d'extensibilité et de mémoire produit durable.

## Principes de conception produit

Le produit doit privilégier :

- une excellente expérience Android ;
- une interface claire et agréable ;
- une représentation visuelle utile du budget ;
- une progression naturelle entre usage personnel et partagé ;
- la confidentialité financière ;
- l'offline-first ;
- l'extensibilité sans migrations conceptuelles inutiles ;
- une séparation nette entre données financières, droits d'accès et vues budgétaires.

Le détail fonctionnel reste à préciser et à valider progressivement.
