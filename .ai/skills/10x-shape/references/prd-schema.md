# PRD Schema (canonical reference)

This doc is the single source of truth for the shape of `context/foundation/prd.md` produced by `/10x-prd`, and for the `checkpoint:` block written into `context/foundation/shape-notes.md` by `/10x-shape`. Both skills load this file by relative path (`skills/10x-shape/references/prd-schema.md`) and conform to it.

Two contracts live here:

1. **PRD frontmatter + required sections (10 greenfield / 11 brownfield)** — what `prd.md` must contain.
2. **shape-notes.md checkpoint format** — what `shape-notes.md` must carry so a session can resume from disk.

Renames or restructurings of either contract are load-bearing. Update this doc *first*, then both skill bodies, then any sibling change folder that points at it.

PRD frontmatter captures only **product-level priors** — what the product is, who it's for, when it ships. Fields that depend on team composition, runtime, or deployment target belong to a separate downstream tech-stack-selection step, not to PRD. Frame the PRD as the product's identity, not its architecture.

# Frontmatter fields

Every PRD declares this YAML frontmatter block. Field order is suggested, not load-bearing; key names ARE load-bearing.

```yaml
---
project: <string>                    # human-readable project name, e.g. "Recipe Fridge"
version: <integer>                   # 1 for first PRD; bumped only when a versioned save lands (prd-v2.md → version: 2)
status: <enum>                       # draft | reviewed | locked
created: <YYYY-MM-DD>                # date the PRD was first written
context_type: <enum>                 # greenfield | brownfield
product_type: <enum>                 # web-app | api | cli | mobile | desktop | library | data-pipeline | other (+ free-text)
target_scale: <object>               # { users: <small|medium|large|enterprise>, qps: <ballpark>, data_volume: <ballpark> }
timeline_budget: <object>            # greenfield: { mvp_weeks: <int>, hard_deadline: <YYYY-MM-DD | null>, after_hours_only: <bool> }
                                     # brownfield: { delivery_weeks: <int>, hard_deadline: <YYYY-MM-DD | null>, after_hours_only: <bool> }
---
```

Field semantics:

- **`project`** — short proper-noun name. The skill never invents this; if the user did not name the project, `/10x-shape` asks before `/10x-prd` runs.
- **`version`** — starts at `1`. Versioned saves (`prd-v2.md`, `prd-v3.md`) increment this so downstream tooling can sort by recency.
- **`context_type`** — `greenfield` for new projects built from scratch; `brownfield` for changes to existing systems. Determines which section list (10 greenfield vs 11 brownfield) the PRD uses. Set by `/10x-shape`'s auto-detection; `/10x-prd` reads it from `shape-notes.md` frontmatter.
- **`status`** — `draft` on first write. `/10x-prd` does not promote past `draft`; downstream skills (review, sign-off) flip it.
- **`product_type`** — enum + free-text fallback. Use the closest enum value and put nuance in `## Open Questions` if the project genuinely sits between categories.
- **`target_scale.users`** — `small` (single-digit), `medium` (≤ 100), `large` (≤ 10k), `enterprise` (≥ 10k). The skill uses ballparks, not point estimates.
- **`timeline_budget.mvp_weeks`** (greenfield) / **`timeline_budget.delivery_weeks`** (brownfield) — integer week count for the first shippable version / change. Three weeks of after-hours work is a good default target — short enough to maintain momentum, long enough to build something real. Longer timelines are valid when the team has acknowledged the sustained-effort cost up front.

Stack-shaped concerns — team composition, language preferences, technology avoid-lists, deployment mode, region, budget tier, CI/CD shape — are intentionally absent from this frontmatter. They belong to the tech-stack-selection step that runs after `/10x-prd` and are gathered there. If `/10x-shape` captures forward-looking notes about them, those notes live in `shape-notes.md` body, not in PRD frontmatter or sections.

Example (minimal but valid):

```yaml
---
project: "Recipe Fridge"
version: 1
status: draft
created: 2026-05-03
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
---
```

# Required PRD sections (in order)

A conforming `prd.md` contains a set of `##`-level headings determined by `context_type`. Greenfield uses 10 sections; brownfield uses 11 sections. Section names are the contract — downstream parsers split on them. Subsection (`###`) structure is documented per section below.

Entities, fields, and their lifecycles are intentionally NOT a PRD concern. They emerge from Functional Requirements and User Stories (which name the nouns the product manipulates) and are pinned down later — during stack selection and implementation planning. A PRD that ships with a column-level data model has already over-committed.

# Greenfield PRD Sections (10 sections)

## Vision & Problem Statement

Two paragraphs max. First paragraph: the **specific** pain (named user, named situation, named cost). Second paragraph: the insight that makes this PRD worth writing — what does the team understand that competitors / status-quo solutions don't.

No marketing language. No "we believe" / "we envision" framing. State the pain and the insight as facts.

## User & Persona

One primary persona. Name, role, context, the moment they reach for this product. If a secondary persona exists, mark it `### Secondary persona` and keep it short — the MVP serves the primary.

## Success Criteria

Exactly three subsections, in this order:

```markdown
### Primary
- One or two outcomes that prove the product worked. Measurable.

### Secondary
- Outcomes that would be nice but aren't sufficient on their own.

### Guardrails
- Things that must NOT break (privacy, performance floor, UX cost). Failure here is a regression even if Primary holds.
```

## User Stories

Each story is `### US-NN: <Title>` (NN is a zero-padded two-digit index starting at 01) with a Given/When/Then acceptance-criteria block:

```markdown
### US-01: User adds a recipe from fridge contents

- **Given** a logged-in user with at least one fridge item
- **When** they tap "What can I cook?"
- **Then** they see a ranked list of recipes whose ingredients match their fridge

#### Acceptance Criteria
- Top recipe match must use ≥ 80% of selected fridge items
- Empty fridge shows an explanatory empty-state, not a 0-result list
- ...
```

## Functional Requirements

Each FR is a single line in this exact format:

```
- FR-NNN: [Actor] can [capability]. Priority: must-have | nice-to-have
```

`NNN` is a zero-padded three-digit index. Group thematically with `###` subheadings (e.g., `### Authentication`, `### Recipe matching`) when there are more than ~6 FRs.

`must-have` is binding for the MVP; `nice-to-have` is explicitly out of MVP scope and noted as such in `## Non-Goals` if it would otherwise be assumed.

If `/10x-shape` ran a Socratic round, each FR may carry a `> Socratic:` blockquote underneath capturing the strongest counter-argument and the user's resolution.

## Non-Functional Requirements

Bulleted. Each NFR is a property an outside observer — a user, an operator, a regulator — can measure without inspecting the implementation. Pair the property with a *measurable* target where one exists (prefer `< NUMBER UNIT` / `≥ NUMBER UNIT` over qualitative words); binary properties ("no X leaves Y") are also valid.

Do not name mechanism, enforcement strategy, runtime location, or UI affordance. "Per IP", "client-side", "via streaming", "with a spinner", "in the cache" all describe *how* the property is achieved and belong to downstream design. The NFR says **what must be true at the product's outer boundary**; downstream picks the means.

Examples:
- A learner sees acknowledgement of any input within 200 ms, and continuous visible progress during any operation that takes longer than two seconds.
- A failed login does not lock out a legitimate user who mistypes their password three times in a row, but credential-stuffing at scale is rejected before reaching the auth check.
- Source text submitted for processing leaves no trace in operator-accessible storage after the request that consumed it completes.
- The product remains usable on the latest two major versions of the four mainstream desktop browsers.

## Business Logic

**One sentence first.** A single declarative sentence that captures the domain rule that makes this product non-trivial. If you cannot write this sentence, the product is empty CRUD and the PRD is hollow.

After the one-sentence rule, supporting paragraphs (≤ 3) explain: what inputs the rule consumes (as user-facing inputs, not system components), what its output is, and how the user encounters it in the product flow. Do NOT name the components or actors that *perform* the computation ("the LLM does X", "the SRS library decides Y") — those are downstream architecture choices, not domain rule. State the rule as if the implementation were unknown.

If `/10x-shape` flagged the empty-CRUD anti-pattern and the user accepted the warning, this section still exists with the user's chosen domain rule. If they overrode without choosing one, the section reads `# TODO: domain rule — see Open Questions` and `## Open Questions` carries an entry naming the gap.

## Access Control

Who is allowed to do what. Even single-user local apps need this section — write `Single user; no auth; data lives on-device only.` and move on. The section existing matters.

If multi-user: roles, role → capability matrix, sign-up vs sign-in behavior, what happens when an unauthenticated user hits a gated route.

## Non-Goals

Explicit list of things this MVP does NOT do, with one-line rationale each. Strong non-goals prevent scope creep. Weak ("not building a mobile app yet") is fine for nice-to-haves; load-bearing ("never sync to cloud — this is a local-first product") is critical.

This section covers *both*:

- **Functional non-goals** — capabilities the MVP explicitly will not provide (e.g., "no manual flashcard creation", "no team workspaces", "no PDF import").
- **Non-functional non-goals** — quality dimensions the MVP explicitly will not aim for (e.g., "no offline-first guarantee", "no multi-region SLA", "no compliance certification beyond baseline GDPR").

Technology avoids ("avoid: PHP", "avoid: monorepo") are NOT non-goals — they describe *how* the product is built, not what it does. They belong with the tech-stack-selection step downstream, alongside the rest of the runtime concerns. Scope decisions framed as avoids ("avoid: building our own recommendation algorithm", "avoid: running a local LLM") DO belong here as functional non-goals — they shape the product surface, not the implementation stack.

## Open Questions

Numbered list. Each entry names what's unknown, who needs to resolve it, and the latest acceptable resolution date if any. The `/10x-prd` skill ALWAYS routes captured uncertainty here verbatim — it never invents domain decisions to fill gaps.

```markdown
1. **What is the one-sentence business rule?** — TBD by user. Block: yes (PRD is hollow until resolved).
2. **What's the canonical recipe data source?** — Owner: user. By: 2026-05-10.
```

# Brownfield PRD Sections (11 sections)

When `context_type: brownfield`, the PRD uses delta-framing: sections describe what changes, not the full system. The brownfield template replaces the 10 greenfield sections with 11 sections optimized for describing changes to an existing system.

## Current System Overview

What exists now: key architecture, tech stack, user base, core functionality. This section has no greenfield equivalent — it establishes the baseline that all subsequent sections describe changes against. Unlike the greenfield "stack openness" rule, this section MAY name specific technologies because it describes reality, not a choice.

Required content:
- System purpose (one sentence)
- Key architecture (monolith, microservices, serverless, etc.)
- Tech stack (languages, frameworks, databases, infrastructure)
- Current user base (who uses it, rough scale)
- Core functionality (what it does today)

## Problem Statement & Motivation

What's wrong or missing, and why now. Delta-framed: focuses on the gap between current state and desired state. This replaces the greenfield `## Vision & Problem Statement`.

Required content:
- The specific pain or gap (named user, named situation)
- Why this change is needed now (trigger event, business pressure, user feedback)
- What the current workaround is (if any) and its cost

## User & Persona

Who is affected by this change. For brownfield, emphasize existing users whose experience changes, plus any new users this change enables. Same structure as greenfield but delta-framed.

## Success Criteria

Same structure as greenfield: `### Primary` / `### Secondary` / `### Guardrails`. For brownfield, guardrails should explicitly include existing behavior that must not regress.

## User Stories

What changes for the user. Delta-framed: Given/When/Then describes the new behavior, with explicit notes on what was different before. Same `### US-NN:` format as greenfield.

## Scope of Change

What's being modified, added, or removed. Explicit delta — each item is categorized:

```
- [new] [description of new capability]
- [modified] [description of changed behavior — was X, now Y]
- [removed] [description of removed capability — rationale]
- [preserved] [description of explicitly preserved behavior — must not break]
```

This replaces the greenfield `## Functional Requirements`. The `[preserved]` category makes preservation explicit — it's the brownfield equivalent of a defensive FR.

## Constraints & Compatibility

Backward compatibility, data migration, existing integrations, preserved behavior. The brownfield-specific section that makes preservation explicit.

Required content:
- Backward compatibility requirements (API contracts, data formats, URLs)
- Data migration needs (schema changes, data backfill, rollback plan)
- Existing integrations that must continue working
- Preserved behavior (explicitly named — what must NOT change)

## Business Logic Changes

Domain rule additions or modifications. NOT the full domain model — only the delta. If the change is infrastructure-only (no domain logic change), state that explicitly: "No domain logic change. This is an infrastructure/technical change."

For modifications: state the current rule first, then the change.

## Access Control Changes

Permission changes, if any. If no changes: "No access control changes — current model preserved." If changes: describe what's changing and what's preserved.

## Non-Goals

What this change is explicitly NOT doing. Critical for brownfield: explicitly names existing system aspects that are out of scope for this change. Same structure as greenfield (functional and non-functional non-goals).

## Open Questions

Same structure and rules as greenfield. Numbered list with owner and resolution date.

# shape-notes.md checkpoint format

`/10x-shape` writes `context/foundation/shape-notes.md` with a frontmatter `checkpoint:` block that drives resume behavior. The block's shape is fixed; the body of `shape-notes.md` (the captured discussion, draft FRs, draft user stories) is freeform and may evolve.

```yaml
---
project: <string|null>                     # mirrors PRD frontmatter; null until phase 1 lands
context_type: <enum>                       # greenfield | brownfield — set during Step 0.7, load-bearing for /10x-prd routing
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>                      # bumped at every phase-end write
checkpoint:
  current_phase: <integer>                 # 1..6 during a session, 7 during cross-check, 8 when finalized
  phases_completed: [<integer>, ...]       # e.g. [1, 2, 3]
  gray_areas_resolved:                     # list of decisions surfaced and resolved
    - topic: <string>                      # e.g. "auth strategy"
      decision: <string>                   # e.g. "passwordless email; no social"
  frs_drafted: <integer>                   # count of FR-NNN entries currently in shape-notes.md
  quality_check_status: <enum>             # pending | warned | accepted
---
```

`current_phase` semantics:

- `1..6` — discovery phases (Vision, Persona & Access, MVP, FRs, Business logic & Data, Stack openness).
- `7` — closing cross-check in progress.
- `8` — finalized; ready for `/10x-prd`.

`quality_check_status` semantics:

- `pending` — cross-check not yet run.
- `warned` — cross-check ran, gaps surfaced, user accepted override. The body lists gaps under `## Quality cross-check` so `/10x-prd` can mirror them into `## Open Questions`.
- `accepted` — cross-check ran, no gaps.

On re-entry, `/10x-shape` reads `current_phase` and `phases_completed` and resumes at the next unfinished phase. The skill MUST NOT replay completed phases on resume — only summarize them.

# How `/10x-shape` and `/10x-prd` use this doc

- `/10x-shape` auto-detects context type (greenfield vs brownfield) and writes `context_type` into shape-notes.md frontmatter. It produces `shape-notes.md` whose body anticipates the PRD sections (10 for greenfield, 11 for brownfield); it captures decisions in the order PRD will need them. For brownfield, the body includes `## Current System` and `## Constraints & Preserved Behavior` sections. It writes the `checkpoint:` block per the format above and validates `quality_check_status` is set before signaling done. Forward-looking notes for downstream chain steps (tech-stack-selection / stack-assessment, longer-term technical roadmap) may live in `shape-notes.md` body under explicitly-named blocks — but they are NOT part of the PRD schema and do not flow into PRD frontmatter or sections.
- `/10x-prd` reads `shape-notes.md` (or a user-supplied notes file), determines `context_type` from frontmatter (or auto-detects from cwd if absent), maps captured content into the correct section list (10 greenfield / 11 brownfield) in order, and routes any captured gaps verbatim into `## Open Questions`. Frontmatter fields it cannot fill from input become `# TODO: <field-name> — see Open Questions` placeholders, and a matching numbered entry lands in `## Open Questions`. Content that sits outside the PRD schema (forward-looking notes for downstream chain steps) is summarized into the hand-off message — it is NOT copied into PRD.

# Drift detection

If a maintainer renames a PRD section or restructures frontmatter, the failure mode is silent drift between this doc and the skills. The mitigation:

1. Edit this doc first.
2. Grep both skill bodies (`skills/10x-shape/SKILL.md`, `skills/10x-prd/SKILL.md`) for the old name; update.
3. Re-run any local skill validators the project provides to confirm the skills still parse.
