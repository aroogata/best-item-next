# Supabase Project Rules

- Allowed Supabase project ref: `iincrjxaedycekvkorrp` only.
- Keep public content tables and draft staging tables distinct.
- Prefer explicit SQL migrations in `supabase/migrations/` over ad hoc dashboard edits.
- When changing schema, update related TypeScript types in `src/types/`.
- Be careful with service-role writes; keep them server-side and intentional.
- Do not weaken row-level security without clearly documenting why.
