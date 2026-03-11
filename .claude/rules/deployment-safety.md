# Deployment Safety

- This repository deploys `best-item.co.jp` through Vercel.
- Treat changes to `main` as production-impacting.
- Prefer additive, reversible changes over broad rewrites.
- Before changing deploy-time environment variables or publish routes, verify the effect on production.
- Do not mix crawler-only infrastructure changes into this repository.
