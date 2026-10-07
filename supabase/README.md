# Supabase database tooling

Versioned database tooling for Budget V1.

## Migrations

Les migrations de schéma sont versionnées dans `supabase/migrations/` et constituent la source de vérité Git pour le schéma PostgreSQL.

Le workflow `.github/workflows/supabase-migrations.yml` déploie automatiquement les migrations vers la production après un push sur `main`. Il exécute d'abord un `supabase db push --dry-run`, puis `supabase db push`.

Le workflow utilise un **scoped Personal Access Token Supabase** fourni par le secret GitHub `SUPABASE_ACCESS_TOKEN`. Aucun credential Supabase ne doit être stocké dans ce répertoire.

Les changements de schéma distants doivent passer par les migrations Git et le workflow CI/CD ; les modifications SQL manuelles de production ne constituent pas le chemin normal.
