# Produit

Document canonique du produit.

Les exigences sont ajoutées uniquement après validation. Les idées et discussions doivent rester distinguées des décisions.

## Directions produit validées

### Budget personnel → budget partagé

Le produit doit être conçu pour qu'un utilisateur puisse commencer avec un budget personnel puis évoluer vers un usage partagé sans devoir recréer ou fusionner ses données.

Le budget partagé doit pouvoir agréger des sources financières appartenant à plusieurs utilisateurs, tout en conservant les comptes comme entités distinctes.

La propriété, les droits d'accès et l'inclusion d'une source dans un budget partagé sont des concepts distincts.

### Confidentialité hybride

Le modèle de confidentialité retenu pour les espaces partagés est hybride :

- les comptes ou sources peuvent définir leur niveau d'exposition ;
- certaines transactions peuvent rester personnelles ;
- des exceptions peuvent être définies au niveau d'une transaction ;
- le partage d'un budget ne signifie pas transparence automatique de toutes les dépenses personnelles.

Cette règle doit être intégrée à la conception du domaine et de la synchronisation.

### Modèle financier extensible

Le noyau métier V1 validé comprend :

- utilisateurs et espaces ;
- comptes/sources financières ;
- transactions ;
- lignes de transaction ;
- catégories ;
- budgets ;
- allocations budgétaires ;
- relations nécessaires aux transferts entre comptes.

Le modèle doit rester extensible pour accueillir notamment les justificatifs, pièces jointes, tags, imports et automatisations sans remettre en cause le noyau financier.

## Idées futures conservées

Les discussions produit ont fait émerger plusieurs pistes qui doivent rester visibles même lorsqu'elles ne sont pas encore planifiées :

- tickets de caisse et justificatifs ;
- pièces jointes multiples sur les transactions ;
- OCR ;
- imports bancaires ;
- transactions récurrentes ;
- tags ;
- commerçants/payees structurés ;
- répartitions avancées de transactions ;
- multi-devises avancé ;
- règles et automatisations ;
- historique détaillé ;
- assistance/analyse intelligente.

Ces éléments sont des **idées futures** et non des exigences d'implémentation immédiate.
