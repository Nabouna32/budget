# Accessibilité

## État

**Contraintes d'accessibilité V1 confirmées le 2026-10-07.**

L'accessibilité est une contrainte de conception et de validation de l'application Android, et non une optimisation de fin de projet.

## Principes Android

L'interface doit notamment prendre en compte :

- tailles de cibles tactiles suffisantes ;
- contraste et lisibilité ;
- taille du texte et adaptation aux préférences système ;
- ordre de navigation logique ;
- sémantique correcte des composants ;
- libellés et descriptions pour les éléments non textuels ;
- distinction des états par autre chose que la couleur seule ;
- compatibilité avec les technologies d'assistance pertinentes.

## UI adaptative

L'adaptation à différentes tailles de fenêtre ne doit pas dégrader l'accessibilité. Les changements de disposition doivent conserver une hiérarchie claire et un ordre de navigation cohérent.

## Validation

L'accessibilité doit être vérifiée pendant le développement des écrans et non uniquement lors d'un audit final.

Les contrôles exacts et outils de validation seront précisés lorsque la première base UI sera implémentée.
