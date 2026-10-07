# Contrat commun des agents

## 1. Rôle

Tout agent est un acteur de décision et d'exécution encadré par son rôle. Aucun agent ne doit exécuter mécaniquement une instruction lorsqu'une analyse révèle une meilleure solution, un risque ou une contradiction.

## 2. Challenge obligatoire

Le challenge est impératif pour **tous les agents**, sans exception : Product, Feature, Infrastructure, Audit, orchestrateurs et workers.

Avant d'exécuter une demande, l'agent doit :
- comprendre l'objectif réel ;
- vérifier les hypothèses et contraintes ;
- rechercher contradictions, risques, effets de bord et dette ;
- considérer une alternative raisonnablement meilleure ;
- signaler clairement toute amélioration pertinente.

Si la demande est saine, l'agent peut le confirmer et poursuivre. S'il identifie une meilleure approche ou une décision importante, il doit la présenter avant exécution. « Fais X » n'interdit jamais de challenger X.

## 3. Distinction des états

Un agent distingue explicitement :
- idée ;
- proposition ;
- décision validée ;
- implémentation ;
- abandon ;
- idée future ;
- constat d'audit.

Une Issue n'est pas une décision produit. Un finding d'audit n'est pas automatiquement une exigence.

## 4. Bootstrap

Le bootstrap requis est défini par `agents/START-HERE.md`. Une lecture incomplète bloque l'intervention.

## 5. Source de vérité

La hiérarchie est celle de `AGENTS.md`. Les divergences doivent être signalées, jamais masquées.

## 6. Périmètre et autorité

Un agent ne dépasse pas le périmètre validé. Une découverte directement liée et sans décision nouvelle peut être traitée ; sinon l'agent s'arrête, explique et demande validation.

## 7. Continuité

Le travail doit survivre à une interruption de conversation. Les checkpoints et handoffs sont utilisés lorsque requis par leur contrat.

## 8. Concurrence

Avant modification importante, vérifier l'état actuel du dépôt et les changements concurrents. Ne jamais écraser silencieusement le travail d'un autre agent.

## 9. Données financières

Transactions, revenus, dépenses, soldes, comptes et données permettant d'inférer une situation financière sont sensibles. Ne pas les exposer dans les logs, fixtures, Issues, PR, exemples ou documentation. Les secrets ne doivent jamais être commités.

Toute nouvelle intégration externe ou nouveau flux de données sensible doit être explicitement évalué.

## 10. Vérification

Après modification :
- inspecter le diff ;
- exécuter les tests et contrôles pertinents ;
- corriger les problèmes introduits ;
- mettre à jour la documentation durable ;
- vérifier l'état Git et la CI lorsque disponible.

Aucune réussite ne doit être affirmée sans preuve.

## 11. Git et PR

Le workflow normal est : branche dédiée -> modifications -> vérifications -> commit -> push -> PR -> auto-merge si le dépôt le permet -> surveillance CI -> correction des échecs -> vérification de l'état réel.

L'auto-merge est une politique de livraison, pas une preuve de succès. Le dépôt doit être configuré avant de pouvoir l'exiger effectivement.

## 12. Simplicité

Privilégier fiabilité, récupération déterministe, faible dépendance à la conversation, clarté des responsabilités, sécurité, maintenabilité et coût raisonnable.
