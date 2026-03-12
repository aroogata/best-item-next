# AGENTS.md

## Purpose

This file is the Codex-facing execution guide for `best-item-next`.
Use it for day-to-day implementation rules. For broader product and operational context, read `CLAUDE.md`.

## Project Summary

- Project: `best-item.co.jp` production site and admin tooling
- Main language for user-facing communication: Japanese
- Stack: Next.js App Router, TypeScript, React, Supabase, Vercel
- Deployment target: Vercel project `best-item-next`
- Database: Supabase project ref `iincrjxaedycekvkorrp`

## Core Principles

- Always respond to the user in Japanese unless explicitly asked otherwise.
- Treat this repository as the source of truth for `best-item.co.jp` UI, publishing, and production-facing admin features.
- Prefer safe, incremental changes over broad refactors.
- Keep production data operations explicit and reversible when possible.
- Separate `linksurge-crawler` concerns from site concerns. This repo should consume staged data, not own crawler logic.

## Repository Layout

```text
best-item-next/
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── package.json
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
└── supabase/
    └── migrations/
```

## Important Commands

```bash
# Install dependencies
cd /home/aro/best-item-next && npm install

# Local development
npm run dev

# Lint
npm run lint

# Production build check
npm run build
```

## Preferred Work Surface

- Use `best-item-next` as the default work surface for `best-item.co.jp` changes.
- Keep site UI, admin UI, publish behavior, and Supabase schema work in this repo.
- Only switch to `linksurge-crawler` when the task requires crawler-side generation logic, staging sync, SERP, or GSC work.
- If one feature spans both repos, make separate commits and pushes per repo.

## Development Rules

- Keep `best-item.co.jp` production behavior stable. Avoid speculative refactors.
- Put production site UI, admin pages, publish routes, and Supabase schema changes in this repo.
- Do not reimplement crawler, SERP, or `robots.txt` logic here. Those belong in `linksurge-crawler`.
- When adding admin tooling, prefer reading staged draft data from Supabase instead of calling a local crawler API.
- Document any new environment variables in `README.md`.

## Supabase And Vercel Rules

- Allowed Supabase project ref: `iincrjxaedycekvkorrp` only.
- Allowed Vercel project: `best-item-next` under `aroogatas-projects`.
- Before any migration or deploy-related work, verify the target repo and project ref.
- Never point `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, or service-role operations at another project.
- Do not weaken RLS or publish write paths without calling out the impact.

## Publishing Rules

- `draft_articles`, `draft_article_sections`, and `draft_article_products` are staging tables, not public content tables.
- Publishing from draft to public articles should happen in this repo.
- Prefer idempotent publish operations and explicit slug-based lookups.
- Keep image generation and upload flows compatible with Supabase Storage.

## Testing Rules

- Run `npm run lint` after meaningful code changes.
- Run `npm run build` before changes that affect routing, server components, route handlers, or production data flows.
- Do not rely on live production data mutations as the only verification path.
- If a change depends on Supabase schema, verify the migration and the consuming TypeScript types together.

## Branch Sync Rules

- Default branch flow: `feature/*` -> `develop` -> `main`.
- After any PR merge into `develop` or `main`, always sync the matching local branch from `origin`.
- After any PR merge into `main`, also verify whether `develop` already contains the same changes. If not, bring `origin/main` back into `develop`.
- Standard sync commands:

```bash
git fetch origin
git switch main && git pull origin main
git switch develop && git pull origin develop
```

- If a hotfix or direct change lands in `main` first, then additionally run:

```bash
git switch develop
git merge origin/main
```

## Recommended Reading

- `CLAUDE.md`: product context and repo boundary decisions
- `supabase/migrations/`: schema history for public and staging tables
- `src/app/admin/articles/drafts/`: draft review UI
- `src/app/api/admin/drafts/publish/route.ts`: publish flow entry point
- `.claude/rules/`: project-specific operating rules
