---
change_id: deploy-skeleton
title: "Skonfiguruj deploy na Cloudflare Pages"
status: done
created: 2026-05-27
updated: 2026-05-27
roadmap_ref: F-02
---

Foundation change: configure Cloudflare Pages deployment with wrangler.toml and CI pipeline.

## What was done

1. Added `wrangler.toml` with Cloudflare Pages config (nodejs_compat, output dir)
2. Updated `.github/workflows/ci.yml`: branch `main`, added `npm run test` step
3. Verified `npm run build` produces working output with `@astrojs/cloudflare` adapter

## Deploy strategy

Using Cloudflare's GitHub integration (connect repo in CF dashboard → auto-deploy on push to main).
No deploy step in CI needed — Cloudflare handles it natively after GitHub push.
