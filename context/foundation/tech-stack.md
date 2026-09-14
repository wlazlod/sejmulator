---
starter_id: 10x-astro-starter
package_manager: npm
project_name: sejmulator
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

Solo developer shipping a Polish election seat simulator in 3 weeks after-hours needs a single-language stack where the real value is in the interactive frontend (d'Hondt visualization, per-district drill-down, confidence intervals). Astro + React + TypeScript gives interactive islands for rich UI with zero unnecessary JS on static pages; Supabase provides simple KV-like storage for share links with TTL without requiring auth setup; Cloudflare Pages delivers edge deployment with a generous free tier matching the medium-scale audience (dozens to a hundred users). The starter clears all four agent-friendly gates and its bootstrapper confidence is first-class.
