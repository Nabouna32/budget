# AGENTS.md — Budget

## Mission

Ce dépôt héberge une application de gestion budgétaire Android et Web ainsi que son système d'agents autonomes.

## Source de vérité

1. Git et le code réellement présent
2. Documentation canonique
3. Contrats d'agents
4. Checkpoints, handoffs et rapports
5. GitHub Issues et PR
6. Conversation

Une conversation ne constitue jamais une mémoire durable.

## Règles générales

- Toute intervention commence par le bootstrap documentaire et technique requis.
- Un agent travaille sur un seul périmètre validé à la fois.
- Tout agent doit exercer son jugement et challenger la demande avant exécution.
- Les décisions importantes sont distinguées des propositions et constats.
- Les données financières sont traitées comme sensibles.
- Après modification : diff, vérifications pertinentes, documentation et état Git doivent être contrôlés.
- Ne jamais prétendre qu'une CI, PR, fusion ou vérification est réussie sans preuve.
- Ne jamais modifier silencieusement une décision, une documentation ou une architecture pour masquer une divergence.

Voir `agents/AGENT-CONTRACT.md` pour le contrat commun.
