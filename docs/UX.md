# UX

## État

**Principes UX techniques V1 validés le 2026-10-07.**

L'objectif prioritaire est une application Android **très agréable, claire et soignée**, même si une future plateforme nécessite une UI différente.

## Android-first

L'interface V1 est conçue nativement avec Jetpack Compose.

Le projet ne doit pas sacrifier la qualité Android afin de maximiser une réutilisation théorique de l'UI sur d'autres plateformes.

Les futures interfaces Web, iOS ou desktop pourront adopter leurs conventions propres tout en conservant les contrats et règles métier communs.

## Adaptive UI

L'interface Android doit être adaptative dès V1.

Elle ne doit pas être pensée uniquement pour un téléphone en portrait. Les layouts doivent pouvoir s'adapter à différentes tailles de fenêtre, notamment téléphone, tablette et grandes fenêtres.

Le contenu doit être réorganisé lorsque la largeur disponible le justifie, plutôt que simplement étiré.

## Architecture UI

Les écrans Compose consomment un état de présentation et déclenchent des actions. Ils ne doivent pas accéder directement à la base de données ou au réseau.

Les composants visuels réutilisables doivent être séparés des règles métier.

## Design system

Le projet doit disposer progressivement d'un design system cohérent :

- typographie ;
- espacements ;
- formes ;
- composants ;
- états interactifs ;
- états de chargement, vide, erreur et succès ;
- thème clair/sombre lorsque pertinent.

L'identité visuelle et les choix graphiques détaillés seront définis pendant la conception produit/UI, sans les figer artificiellement dans l'architecture.

## États et feedback

Les opérations offline, la synchronisation, les erreurs et les conflits doivent être compréhensibles pour l'utilisateur.

L'application ne doit pas donner l'impression qu'une donnée est définitivement synchronisée lorsque le serveur n'a pas encore confirmé son traitement.

## Accessibilité

L'accessibilité est intégrée dès la conception : taille des cibles tactiles, lisibilité, contraste, ordre de navigation, descriptions sémantiques et gestion correcte des états.

Voir `docs/ACCESSIBILITY.md`.

## Internationalisation

L'UI doit éviter les chaînes codées en dur et être compatible avec l'internationalisation future. La liste des langues et les priorités produit restent à décider.
