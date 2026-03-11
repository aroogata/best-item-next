# best-item-next

## Overview

`best-item-next` is the production repository for `https://best-item.co.jp/`.
It owns public site behavior, production-facing admin pages, publish flows, and Supabase schema used by the site.
Use `AGENTS.md` for concise execution rules. This file provides the broader operating context.

## Core Boundary

### This repository owns
- Public site pages for `best-item.co.jp`
- Admin pages used to review drafts and publish content
- Supabase migrations for public and staging content tables
- Vercel deployment configuration
- Production-safe route handlers and image generation routes

### This repository does not own
- Web crawling
- SERP collection
- GSC ingestion
- crawler-side SQLite data management
- low-level site crawling rules

Those belong in `linksurge-crawler`.

## Infrastructure

### Supabase
- Project ref: `iincrjxaedycekvkorrp`
- Purpose: production content tables, draft staging tables, and Storage for `best-item.co.jp`
- Use service-role writes carefully and only for intentional server-side admin or publish flows

### Vercel
- Project: `best-item-next`
- `main` branch deploys to the production site
- Any change merged or pushed to `main` should be treated as production-impacting

## Current Separation Strategy

The current migration path is:
1. `linksurge-crawler` creates and stores draft data locally.
2. Drafts are synced into Supabase staging tables.
3. `best-item-next` reads staged drafts and provides the review/publish surface.
4. `best-item-next` publishes approved drafts into public article tables.

This keeps crawler concerns out of the production site while preserving the existing workflow.

## Key Tables

### Public content
- `articles`
- `article_sections`
- `article_products`

### Draft staging
- `draft_articles`
- `draft_article_sections`
- `draft_article_products`

Draft staging tables are integration boundaries. They should not be treated as the final public model.

## Operating Rules

- Always answer the user in Japanese unless explicitly asked otherwise.
- Assume `main` changes can reach production quickly through Vercel.
- Avoid direct production data rewrites without a clear rollback path.
- Prefer additive schema changes and explicit migrations.
- Keep `linksurge-crawler` integration points documented when they change.

## Environment Variables

Typical variables used in this repo include:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

If draft staging sync or publish flow changes require new variables, document them in `README.md` and relevant admin docs.

## Near-Term Direction

- Move best-item-specific review and publish tooling fully into this repo.
- Reduce `linksurge-crawler` to draft generation and staging sync responsibilities.
- Keep production publishing logic centralized here.
