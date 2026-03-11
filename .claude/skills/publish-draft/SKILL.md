# Publish Draft Skill

Use this skill when working on draft review or publish features in `best-item-next`.

## Scope

- Admin pages under `src/app/admin/articles/drafts/`
- Publish handlers under `src/app/api/admin/drafts/`
- Supabase writes from staging tables into public article tables

## Rules

- Treat publish operations as production-affecting.
- Prefer idempotent slug-based operations.
- Verify staging table shape and public table shape together.
- Run `npm run lint` after changes.
- Run `npm run build` if route handlers, server components, or data flows changed.
