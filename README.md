# best-item-next

`best-item-next` is the production Next.js repository for `https://best-item.co.jp/`.
It owns the public site, admin UI, publish flows, and Supabase schema used by the site.

## Role Split

- `best-item-next`: production site, admin pages, publish routes, Supabase schema
- `linksurge-crawler`: crawl, SERP, GSC, draft generation, staging sync into Supabase

## Getting Started

```bash
cd /home/aro/best-item-next
npm install
npm run dev
```

Open `http://localhost:3000`.

## First Three Commands

```bash
# 1. Confirm scripts
npm run

# 2. Start local development
npm run dev

# 3. Run lint before committing
npm run lint
```

## Important Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Environment Variables

Expected variables include:

```bash
NEXT_PUBLIC_SITE_URL=https://best-item.co.jp
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

If you use local admin or migration flows, verify they point to Supabase project ref `iincrjxaedycekvkorrp`.

## Draft Workflow

Current direction:
1. `linksurge-crawler` creates article drafts locally.
2. `linksurge-crawler` syncs drafts into Supabase staging tables.
3. `best-item-next` reads staged drafts.
4. `best-item-next` publishes approved drafts into public article tables.

Relevant staging tables:
- `draft_articles`
- `draft_article_sections`
- `draft_article_products`

## Supabase

Supabase migrations live under `supabase/migrations/`.
This repo uses Supabase for:
- public article data
- draft staging data
- image storage

Treat schema changes as production-affecting.

## Vercel

This repository is deployed through Vercel.
`main` is the production branch, so pushes to `main` should be treated as production changes.

## Files To Read First

- `AGENTS.md`
- `CLAUDE.md`
- `supabase/migrations/`
- `src/app/admin/articles/drafts/`
- `src/app/api/admin/drafts/publish/route.ts`

## Draft Admin Data Source

`/admin/articles/drafts` and `/api/admin/drafts/publish` now read draft staging data from Supabase, not directly from `linksurge-crawler` HTTP APIs.
Keep `SUPABASE_SERVICE_ROLE_KEY` configured server-side for these admin flows.
