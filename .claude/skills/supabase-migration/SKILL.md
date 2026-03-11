# Supabase Migration Skill

Use this skill when changing schema in `best-item-next`.

## Scope

- Files in `supabase/migrations/`
- Related type updates in `src/types/`
- Server code that reads or writes the changed tables

## Rules

- Target only Supabase project ref `iincrjxaedycekvkorrp`.
- Prefer additive migrations.
- Keep draft staging tables separate from public content tables.
- Update consuming TypeScript types in the same change when practical.
- Verify the affected code paths with `npm run lint`, and `npm run build` for routing or server-side changes.
