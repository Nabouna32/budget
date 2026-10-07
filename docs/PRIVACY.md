# Confidentialité

## État

**Principes de confidentialité V1 confirmés le 2026-10-07.**

Les données budgétaires et financières sont considérées comme sensibles.

## Principes

- minimisation des données collectées ;
- absence de données financières réelles dans les artefacts de développement ;
- limitation des logs ;
- aucun contenu financier sensible dans les Issues, PR, exemples ou rapports techniques ;
- contrôle des accès côté serveur ;
- évaluation explicite de tout nouveau flux de données ;
- pas de dépendance à un service externe pour une donnée sensible sans justification et validation.

## Client local

Le fonctionnement offline implique la présence de données sensibles sur l'appareil Android. Ce point fait partie du modèle de confidentialité et doit être pris en compte dans la conception du stockage, des sauvegardes et de la suppression des données.

## Backend

Le backend constitue la frontière d'accès aux données distantes. Les futurs fournisseurs et services externes seront évalués avant introduction, notamment sur les données qu'ils peuvent recevoir, conserver ou journaliser.

## Développement

Les fixtures et exemples utilisent uniquement des données synthétiques. Les logs de développement ne doivent pas permettre de reconstruire la situation financière d'un utilisateur.

## Non décidé

- politique de rétention ;
- analytics éventuels ;
- télémétrie éventuelle ;
- sauvegardes et exports ;
- fournisseurs de services externes.
