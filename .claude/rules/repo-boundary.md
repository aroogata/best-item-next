# Repo Boundary

`best-item-next` owns:
- public site behavior
- admin review and publish UI
- publish route handlers
- Supabase schema for public content and draft staging

`linksurge-crawler` owns:
- crawl execution
- SERP collection
- GSC ingestion
- local SQLite draft storage
- draft-to-staging sync orchestration

Do not pull crawler internals into this repository.
Consume staged data through Supabase instead.
