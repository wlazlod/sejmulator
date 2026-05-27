---
name: 10x-shape
description: >
  Facilitate a structured discovery conversation that turns an idea —
  greenfield or brownfield — into shape-notes.md, the input to /10x-prd.
  Auto-detects context type from project markers in cwd (brownfield) or
  absence thereof (greenfield) and adapts all six discovery phases
  accordingly. Use when the user is starting a new project from scratch OR
  shaping a meaningful change to an existing system (new module, significant
  feature, architectural improvement). Trigger phrases: "new project",
  "from scratch", "starting an app", "od pomysłu", "shape an idea",
  "brainstorm a product", "greenfield", "I have an idea", "existing project",
  "brownfield", "istniejący projekt", "zmiana w projekcie".
  Use BEFORE /10x-prd, not in place of it.
---

# Shape: Facilitate Discovery (Greenfield & Brownfield) Before /10x-prd

This skill is the head of the bootstrap chain. For greenfield: `/10x-shape → /10x-prd → 10x-tech-stack-selector → bootstrapper`. For brownfield: `/10x-shape → /10x-prd → 10x-stack-assess → 10x-health-check`. Its single job: walk a user from "I have an idea" (greenfield) or "I want to change this system" (brownfield) to a structured `context/foundation/shape-notes.md` that `/10x-prd` can turn into a PRD that conforms to the locked schema.

The skill is a **facilitator**, not a content generator. It NEVER writes vision, FRs, business-logic rules, or any other domain content the user did not say. Its value is the question shape and the order of questions, not the answers it offers.

The locked schema both this skill and `/10x-prd` conform to lives at `references/prd-schema.md` (relative to this SKILL.md). Read it before producing any artifact and re-check against it at every checkpoint write.

## When to use, when to skip

**Use when**: the user describes a new project idea (greenfield), a meaningful change to an existing system — new module, significant feature, architectural improvement (brownfield), or a product they want to rebuild from first principles. Use also when an existing `context/foundation/shape-notes.md` is incomplete and needs resuming. The skill auto-detects context type from project markers in cwd and adapts.

**Skip when**: the project already has a PRD or an ADR set (use `/10x-frame` or `/10x-plan` instead), or the user is reasoning about a single bug / refactor / small feature within an existing codebase that doesn't warrant a full PRD (use `/10x-frame`). For brownfield projects where the user wants to shape a meaningful change, this skill IS the right starting point.

## Relationship to other skills

- `/10x-init` — scaffolds the `/context` skeleton (`changes/`, `archive/`, `foundation/`) plus universal READMEs in each. `/10x-shape` requires `context/foundation/` to exist; if absent, it delegates to `/10x-init` via a tool call (Step 0 below).
- `/10x-prd` — consumes `shape-notes.md`. The handoff is the `## Step 8` clipboard write.
- `/10x-frame` — for *reframing* small-scope problems within existing systems where a full PRD is overkill. `/10x-shape` is for larger brownfield changes (new modules, significant features) that need structured discovery and a PRD.
- `/10x-stack-assess` — downstream of `/10x-prd` for brownfield projects. Evaluates existing stack against quality gates.
- `/10x-health-check` — downstream of `/10x-stack-assess` for brownfield. Audits existing project health.
- `/10x-plan` — downstream of `/10x-prd`, never invoked from here directly.

## Initial Response

When this skill is invoked:

1. **If a freeform idea was provided as the argument** (e.g. `/10x-shape a recipe app that suggests meals from what's in your fridge`), capture it verbatim as the **seed idea**. Do not rephrase. Proceed to Step 0.
2. **If a file path was provided** (e.g. `/10x-shape @notes/idea.md`), read it FULLY and use its contents as the seed. Proceed to Step 0.
3. **If nothing was provided**, respond with:

```
I'll help you shape an idea into structured notes that /10x-prd can turn into
a real PRD — whether you're starting from scratch (greenfield) or shaping a
change to an existing system (brownfield).

Please share:
1. The seed idea — what do you want to build or change, in your own words?
2. (Optional) Any rough notes, sketches, or links I should read

Tip: pass the idea inline — `/10x-shape a recipe app that uses fridge contents`
     or for brownfield — `/10x-shape add a recommendation engine to my recipe app`
```

Then wait.

## Process

### Step 0: Check 10xWorkflow precondition

Check the 10xWorkflow scaffold by testing two paths:

```bash
test -d context/foundation
```

If it exists, proceed to Step 0.5.

If missing, the project has not been initialized for 10xWorkflow. Ask the user:
Ask the user: "This directory isn't initialized for 10xWorkflow (context/foundation/ is missing). Run /10x-init now?" with options:
- "Yes — run /10x-init (Recommended)" (description: "Scaffolds the /context skeleton (changes/, archive/, foundation/) with READMEs, then continues shaping.")
- "No — stop here" (description: "Exit without changes. You'll need to initialize before shape can run.")

On "Yes": invoke `/10x-init` via a tool call (NOT via Bash). When `/10x-init` returns, re-check the precondition; if it now passes, continue to Step 0.5. On "No": print "Stopping. Run `/10x-init` when ready, then re-invoke `/10x-shape`." and STOP.

Do not duplicate `/10x-init`'s scaffold logic. A tool call is the correct delegation path.

### Step 0.5: Resume detection

Before starting fresh, check for a prior session:

```bash
test -f context/foundation/shape-notes.md
```

If absent, proceed to Step 1 with a fresh session.

If present, read the file FULLY. Parse the frontmatter `checkpoint:` block per the schema reference (`references/prd-schema.md`, "shape-notes.md checkpoint format" section). Extract: `current_phase`, `phases_completed`, `frs_drafted`, `quality_check_status`.

Summarize what you found:

```
Found a prior shape session at context/foundation/shape-notes.md:

  Project:                 [from frontmatter project field, or "(unnamed)"]
  Current phase:           [N — Phase name]
  Phases completed:        [list]
  FRs drafted so far:      [count]
  Quality check status:    [pending | warned | accepted]
```

Then ask the user:
Ask the user: "How would you like to proceed?" with options:
- "Resume from Phase [next] (Recommended)" (description: "Pick up where the prior session left off. Completed phases are summarized, not replayed.")
- "Restart from scratch" (description: "Archive the existing shape-notes.md to context/foundation/archive/ and start a new session.")
- "Cancel" (description: "Exit without changes.")

On "Resume": jump directly to the next unfinished phase (Step `current_phase` + (1 if current is in `phases_completed` else 0)). Do NOT re-run completed phases — only summarize each one back to the user in 1–2 sentences ("Phase 1 captured: <one-line problem>; Phase 2 captured: <one-line persona>; …") so they have context for what was already decided.

On "Restart": move the existing file to `context/foundation/archive/shape-notes-<YYYY-MM-DD-HHMM>.md` (create the archive directory if absent), then proceed to Step 1 with a fresh session.

On "Cancel": STOP without changes.

### Step 0.7: Context type detection

Before entering the discovery loop, determine whether this is a greenfield or brownfield session. The detection runs once; the result (`context_type`) is written into shape-notes.md frontmatter and governs phase behavior for the rest of the session.

**Auto-detection**: score cwd across three signal tiers. A single manifest file isn't enough — an empty `npm init -y` directory shouldn't trigger brownfield.

```bash
# Tier 1 (strong): version control with history
git log --oneline -1 2>/dev/null && echo "T1:git-history"

# Tier 2 (medium): lockfiles prove real dependency resolution happened
ls package-lock.json yarn.lock pnpm-lock.yaml Cargo.lock poetry.lock go.sum Gemfile.lock composer.lock 2>/dev/null | while read f; do echo "T2:$f"; done

# Tier 3 (weak): manifest files alone — could be a fresh init
ls package.json Cargo.toml pyproject.toml go.mod Gemfile composer.json 2>/dev/null | while read f; do echo "T3:$f"; done

# Bonus signals (confirm, don't trigger alone): source dirs, framework configs, CI
ls -d src/ app/ lib/ .github/ .gitlab-ci.yml Dockerfile tsconfig.json next.config.* vite.config.* 2>/dev/null | while read f; do echo "B:$f"; done
```

```powershell
# PowerShell (Windows) — use this block instead of the bash one above on Windows shells.
# Do NOT let a bash→PowerShell translator rewrite the bash block: the `while read f; do echo "B:$f"`
# pattern produces a literal "B:$f" string that Windows interprets as drive `B:`, triggering a
# permission prompt for a non-existent drive.

# Tier 1 (strong): version control with history
if (git log --oneline -1 2>$null) { "T1:git-history" }

# Tier 2 (medium): lockfiles prove real dependency resolution happened
@('package-lock.json','yarn.lock','pnpm-lock.yaml','Cargo.lock','poetry.lock','go.sum','Gemfile.lock','composer.lock') |
  Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object { "T2:$_" }

# Tier 3 (weak): manifest files alone — could be a fresh init
@('package.json','Cargo.toml','pyproject.toml','go.mod','Gemfile','composer.json') |
  Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object { "T3:$_" }

# Bonus signals (confirm, don't trigger alone): source dirs, framework configs, CI
@('src','app','lib','.github','.gitlab-ci.yml','Dockerfile','tsconfig.json') |
  Where-Object { Test-Path -LiteralPath $_ } | ForEach-Object { "B:$_" }
Get-ChildItem -Path . -Filter 'next.config.*' -File -ErrorAction SilentlyContinue |
  ForEach-Object { "B:$($_.Name)" }
Get-ChildItem -Path . -Filter 'vite.config.*' -File -ErrorAction SilentlyContinue |
  ForEach-Object { "B:$($_.Name)" }
```

Scoring:
- **Tier 1 hit** (git history exists) → strong brownfield signal
- **Tier 2 hit** (lockfile exists) → strong brownfield signal
- **Tier 1 + Tier 2** → high-confidence brownfield
- **Tier 3 only** (manifest, no lockfile, no git) → ambiguous — could be a fresh `npm init`
- **No signals** → greenfield

Decision logic:
- **Any Tier 1 or Tier 2 hit** → propose `context_type: brownfield`
- **Tier 3 only** → propose brownfield but flag the ambiguity: "I found a manifest file but no lockfile or git history — this might be a freshly initialized project rather than a real brownfield."
- **No signals** → propose `context_type: greenfield`

Print what was detected:

- **High-confidence brownfield** (T1 or T2):
  ```
  This looks like an existing project:
    [list detected signals, e.g. "git history (47 commits)", "package-lock.json", "src/ directory"]
  I'll run in brownfield mode — focusing on what exists, what's changing,
  and what must be preserved.
  ```

- **Ambiguous** (T3 only):
  ```
  I found [manifest file] but no lockfile or git history — this could be a
  freshly initialized project or a real brownfield. I'll propose brownfield
  mode, but override to greenfield if you're starting from scratch.
  ```

- **Greenfield** (no signals):
  ```
  No project markers found in this directory — I'll run in greenfield mode,
  which assumes you're starting from scratch.
  ```

Then confirm with the user:
Ask the user: "Detected context: [greenfield|brownfield]. Is this correct?" with options:
- "[Greenfield|Brownfield] — correct (Recommended)" (description: "[Auto-detected mode description]")
- "[Other mode] — override" (description: "Switch to [other mode] instead.")

Write the confirmed `context_type` into the shape-notes.md frontmatter (alongside `checkpoint:`) immediately. This value is load-bearing for `/10x-prd`'s auto-routing.

On resume (Step 0.5), if shape-notes.md already has `context_type:` in frontmatter, skip auto-detection — the mode is locked from the prior session.

### Discovery pattern (applies to every Step 1–6 below)

Every discovery phase follows the same loop. Internalize this before reading the per-phase steps; the per-phase content is what to ask, not how to ask.

The pattern is **BMAD-Facilitator + GSD-Gray-Area + mattpocock-recommended-answer + Socrates challenge**:

1. **Open the phase** with a one-line statement of what this phase produces, and a single open question to elicit the user's first attempt at it. (BMAD facilitator stance: never generate the content yourself.)
2. **Surface 3–5 gray areas** as multi-select decisions when the user's first attempt has ambiguities. Ask the user for input. Each option is a real position with a tradeoff, not a placeholder. (GSD gray-area discovery.)
3. **Mark a recommended option** with "(Recommended)" in the label and place it first. Always include a "Not sure / haven't decided" option. (mattpocock-recommended-answer fatigue mitigator.)
4. **Lock the decision back to the user** as a one-line summary they confirm before you write to disk.
5. **Write the phase's section(s)** into `shape-notes.md` and bump `checkpoint.current_phase` and `checkpoint.phases_completed` per the schema.

**Hard rules**:

- NEVER generate content the user did not say. If a section needs a value the user has not provided, ask — don't invent. The exception is mechanical formatting (FR-NNN numbering, section headings, frontmatter scaffolding).
- NEVER pre-commit to a stack (framework, database, hosting platform, language family). The PRD captures product-level priors only — `product_type`, `target_scale`, `timeline_budget`. Stack-shaped concerns are gathered downstream of `/10x-prd`.
- NEVER use 10xDevs / cohort / certification language in shipped output. The mechanics here are universal indicators of a well-scoped project. The user-facing artifact reads as a generic shaping skill.

### Step 1: Vision & problem

This phase produces the `## Vision & Problem Statement` and `## User & Persona` (primary persona only) sections of `shape-notes.md`. Two sections, not one, because the persona binds the problem. **Brownfield** also produces the `## Current System` section.

#### Greenfield mode

Open with: "Let's start with the pain. In one or two sentences — who has it, what's the moment they feel it, what does it cost them today?"

Listen. Echo back the three components separately:

```
Pain:        [the literal problem]
Person:      [who has it — name a role, not "users"]
Moment:      [when they feel it — the situation that triggers the pain]
Cost today:  [what they currently do, and what it costs them]
```

If any of the four is vague ("everyone", "always", "a lot of pain"), challenge with a Socrates prompt: "What would have to be true about this for it to be the wrong problem to solve?" or "Who specifically have you seen experience this in the last month?"

Then surface gray areas (ask the user for input with 2–4 questions, **multiSelect on questions where multiple positions can co-exist**):

- Pain category — what kind of pain is this? (workflow friction / missing capability / data trapped somewhere / decision paralysis / coordination overhead / other)
- Insight — what does the user know that the status quo doesn't? (use Socrates: "If your idea is obvious, why hasn't this been built?")
- Primary persona scope — who exactly? (a specific role inside an org / individuals across many orgs / a single named user including yourself / hobbyist niche / not sure)

#### Brownfield mode

Open with: "Let's start with the current system. In a few sentences — what exists today, who uses it, and what's the pain point or missing capability that's driving this change?"

Listen. Echo back five components separately:

```
Current system:  [what exists — name the product/service/module]
Tech stack:      [languages, frameworks, infrastructure the user mentions]
Users:           [who uses it today — name roles, not "users"]
Pain / gap:      [what's wrong or missing — the trigger for this change]
Must preserve:   [what must NOT break — existing behavior, integrations, data]
```

If the user can't articulate "must preserve", challenge with: "If this change broke something tomorrow, what's the thing that would page you?" or "What would your existing users notice first?"

Then surface gray areas:

- Change category — what kind of change is this? (new module / significant feature / architectural improvement / migration / integration / other)
- Insight — what does the user know about the current system that makes this change non-obvious? (Socrates: "Why hasn't this been done already?")
- Primary persona scope — same as greenfield

Write the `## Current System` section first (brownfield-only section — describes what exists), then `## Vision & Problem Statement` (reframed as the delta: what's changing and why), then `## User & Persona`.

#### Both modes

Lock the captured content back matching the schema's section structure. Append to `shape-notes.md`. Bump `checkpoint.current_phase: 2` and add `1` to `checkpoint.phases_completed`.

### Step 2: Persona & access control

This phase produces the `## Access Control` section. Persona was captured in Step 1; here we ask how the persona reaches the product.

#### Greenfield mode

Open with: "How does this person get into the app? Login, a local profile, an access key, no auth at all?"

Ask the user for input with options drawn from the most common shapes:

- Login (email + password / OAuth / passwordless) (Recommended for multi-user web/mobile)
- Local profile (data lives on-device, no server) (Recommended for solo / privacy-first)
- Access key (link or token; no account creation)
- N/A — single user, single device, no separation

If the answer is anything but N/A, ask one follow-up about role separation: is this a flat user model, or are there roles (e.g., admin / member / guest) that see different things? Socrates: "What's the smallest access model that would still make the MVP useful?"

#### Brownfield mode

Open with: "Describe the current auth and user roles in this system. How do users get in today, and what roles exist?"

Listen. Then ask what's changing:

- "Is the auth model changing as part of this work?" (yes — describe / no — keep as-is)
- "Are new roles being added, or are existing role boundaries shifting?" (yes — describe / no — keep as-is)

If the user says auth isn't changing, record the current auth model as `## Access Control` with a note: `No changes planned — current model preserved.` If changes are planned, capture both the current model and the planned changes.

Socrates: "What's the smallest access change that would still make this feature useful without disrupting existing users?"

#### Both modes

Write the captured content as the `## Access Control` block per schema. Bump `checkpoint.current_phase: 3` and append `2` to `checkpoint.phases_completed`.

### Step 3: MVP discipline

This phase produces a draft `## Success Criteria` block (Primary / Secondary / Guardrails subsections per schema) and seeds the `timeline_budget` frontmatter field.

#### Greenfield mode

Open with: "Sketch the smallest end-to-end user flow that would prove this product works. Walk me through the first session, click by click."

Listen. Once the user describes the flow, echo it back as a numbered sequence ("1. user opens app, 2. user does X, 3. user sees Y, …") and ask: "If you had three weeks of after-hours work, can you ship this flow?"

**Scope-cost surface**: if the flow has more than ~6 distinct user actions before producing value, OR the user's own estimate exceeds ~3 weeks of after-hours work, OR the flow requires multiple integrations / external services / custom infrastructure before any user-visible payoff, surface the cost explicitly. The goal is informed choice, not enforcement — longer timelines are valid, but the user should pick them deliberately:

```
This first version is bigger than what typically ships in three weeks of
after-hours work. The greenfield trap is shipping nothing because the first
version was too big to finish. Two valid paths from here:

  Scope down — keep the timeline tight. Common moves:
    - Drop the [identified expensive piece] for v1; add it in v2 once anything works.
    - Replace [identified integration] with a manual / hardcoded version for now.
    - Cut the user count to one (yourself) for v1.

  Commit to the longer timeline — own the cost. A multi-week MVP is doable, but
  it requires sustained dedication, hard work over a stretch of evenings or
  weekends, and tolerance for periods where progress feels invisible. Most
  greenfield projects that exceed their first estimate die not from the work
  itself but from the gap between expected and actual effort.
```

Ask the user for input with three options:

- **Scope down (Recommended)** — pick this if the cost above is news; we'll restart this step with a smaller first flow.
- **Commit to the longer timeline — I understand it will take sustained effort** — pick this only if you've genuinely thought about what multi-week, after-hours commitment looks like for you and you're going in eyes-open.
- **Restart Step 3 with a different first flow** — pick this if neither option fits and you want to re-sketch the MVP from scratch.

If the user picks "Commit to the longer timeline":

1. Capture their estimated `mvp_weeks` (ask if not already stated).
2. Append a `## Timeline acknowledgment` line under the timeline budget block in shape-notes that records: estimated weeks, that the user explicitly accepted the sustained-effort cost, and the date. Format: `Acknowledged on <YYYY-MM-DD>: <N>-week MVP requires sustained dedication; user accepted.`
3. Proceed without further nagging — the acknowledgment is the gate, repeat warnings are not.

#### Brownfield mode

Open with: "Describe the smallest incremental change that would prove this improvement works. Walk me through how a user's experience changes — what do they do differently after this change ships?"

Listen. Echo back as a numbered delta-sequence: "1. user opens [existing feature], 2. they now see [new thing], 3. they can [new capability]…"

Then ask two brownfield-specific questions:

- "What's the blast radius of this change? Which existing features, integrations, or data flows could break?" (Socrates: "What's the thing an existing user would notice first if this change went wrong?")
- "If you had three weeks of after-hours work, can you ship this change?" (same timeline discipline as greenfield)

**Scope-cost surface**: same logic as greenfield, but reframed:

```
This change is bigger than what typically ships in three weeks of after-hours work.
The brownfield trap is starting a large change in an existing system and leaving
it half-done — partially modified code is worse than the original. Two paths:

  Scope down — find the smallest slice that proves the change works. Common moves:
    - Limit to one use case / one user role first.
    - Keep the existing behavior as fallback; add the new path alongside.
    - Drop [identified expensive integration] for v1.

  Commit to the longer timeline — same as greenfield: sustained effort, accepted.
```

Same options as greenfield.

#### Both modes

When the flow is locked, capture it as the `### Primary` success criterion (the flow working = the product/change worked). Ask once more for `### Secondary` (1 nice-to-have) and `### Guardrails` (1–2 things that must not break — privacy, performance floor, UX). For brownfield, guardrails should explicitly include existing behavior that must be preserved.

Set `timeline_budget.mvp_weeks` (greenfield) or `timeline_budget.delivery_weeks` (brownfield) in the frontmatter scaffold to the user's number — 1 if scoped down, the acknowledged estimate otherwise.

Write the `## Success Criteria` block. Bump `checkpoint.current_phase: 4` and append `3` to `checkpoint.phases_completed`.

### Step 4: Functional requirements & user stories

This phase produces the `## Functional Requirements` and `## User Stories` sections.

#### Greenfield mode

Open with: "Now let's get concrete. From the MVP flow you sketched, what does the actor have to be *able* to do? List the capabilities — I'll format them as FRs."

Capture each capability as a single FR line per the schema format:

```
- FR-NNN: [Actor] can [capability]. Priority: must-have | nice-to-have
```

`NNN` is zero-padded three-digit, starting at `001`. Default `Priority: must-have` for anything in the MVP flow; ask explicitly if any capability is `nice-to-have`.

#### Brownfield mode

Open with: "Now let's get concrete. From the change you described, what capabilities are being added, modified, or preserved? List them — I'll format them as FRs with a change category."

Capture each capability with an additional `Change:` tag:

```
- FR-NNN: [Actor] can [capability]. Priority: must-have | nice-to-have. Change: new | modified | preserved
```

- `new` — capability that doesn't exist in the current system
- `modified` — existing capability that's changing behavior
- `preserved` — existing capability that must continue working unchanged (defensive FR — makes preservation explicit)

Prompt the user to think about preserved FRs: "Which existing capabilities must explicitly survive this change? Making preservation explicit prevents accidental breakage." If the user identifies preserved FRs, capture them — they become guardrail-FRs for the brownfield PRD.

#### Both modes

Group thematically with `###` subheadings if the FR count exceeds ~6 (e.g., `### Authentication`, `### Recipe matching`, `### Persistence`).

After FR capture, ask the user to translate at minimum the **MVP flow's primary path** (greenfield) or **primary change path** (brownfield) into a `### US-01:` user story with Given/When/Then per the schema. Each additional user story is optional but encouraged for any FR that has non-obvious acceptance criteria.

Update `checkpoint.frs_drafted` to the count of FR-NNN entries.

Bump `checkpoint.current_phase: 4.5` and proceed directly to the Socrates round (do NOT mark phase 4 complete in `phases_completed` until the Socrates round writes back).

### Step 4.5: Socrates challenge round

This is a dedicated batched round — exactly one challenge per FR captured in Step 4, no more, no less.

For each FR-NNN in document order, ask:

```
FR-NNN: [Actor] can [capability]. Priority: ...
What would have to be true for this FR to be wrong — i.e., for shipping it to
hurt the product instead of help it? OR: what's the strongest counter-argument
to including this in the MVP?
```

Ask the user for input per FR with 2–4 options framed as plausible counter-arguments (drawn from the FR's domain — not generic). Always include a "No counter-argument; it stands as written" option as the LAST option (not first), so the question forces the user to consider the challenge before dismissing it.

Capture each user response as a `> Socrates:` blockquote underneath its FR in `shape-notes.md`:

```
- FR-001: User can save a recipe to favorites. Priority: must-have
  > Socrates: Counter-argument considered: "favorites duplicate the recipe list
  > if recipes are already small in number." Resolution: kept; favorites are
  > cross-session, the main list is per-fridge.
```

If a Socrates round prompts the user to revise an FR (e.g., split into two, demote to nice-to-have, drop entirely), update the FR line in place and re-emit `checkpoint.frs_drafted`.

Once every FR has a Socrates blockquote, append `4` to `checkpoint.phases_completed`, bump `checkpoint.current_phase: 5`.

### Step 5: Business logic & quality properties

This phase produces the `## Business Logic` and `## Non-Functional Requirements` sections. **Brownfield** also produces the `## Constraints & Preserved Behavior` section. Entities and fields are intentionally NOT captured as a separate section — they emerge from FRs and User Stories (Steps 4 and 4 of this skill respectively) and are pinned during downstream stack selection / implementation planning.

#### Greenfield mode

Open with: "Describe the rule of operation in ONE sentence — the domain decision your app makes that distinguishes it from a generic CRUD list."

If the user can produce the one-sentence rule, capture it as the first line of `## Business Logic`. Then ask for ≤ 3 supporting paragraphs explaining what inputs the rule consumes (as user-facing inputs, not system components), what its output is, and how the user encounters it in the product flow. Do NOT name the components or actors that perform the computation — those are downstream architecture choices. State the rule as if the implementation were unknown.

**Empty-CRUD anti-pattern detection**: if the user's "business logic" reduces to "users can add, view, update, and remove records" with no rule that the application itself applies (no recommendation, no prioritization, no classification, no validation, no scoring, no workflow, no calculation), surface this explicitly:

```
What you've described is a CRUD list — and that's a known greenfield
anti-pattern. CRUD without a domain decision means the app provides no value
the user couldn't get from a spreadsheet or a notes file. The product is
hollow.

A real domain rule answers "what does the application decide for the user?".
Common shapes:

  - Recommendation:  app suggests items based on user state
  - Prioritization:  app orders items by an inferred urgency / importance
  - Classification:  app tags items by category / sentiment / quality
  - Validation:      app checks items against a domain rule and flags problems
  - Scoring:         app rates items so the user can compare them
  - Workflow:        app moves items through states with transition rules
  - Calculation:     app computes a value from inputs the user supplies

What rule does YOUR app apply?
```

Ask the user for input with the rule shapes above as multi-select options (plus "I want to add a rule — give me a moment to think" and "I'm building this as pure CRUD anyway — record it"). If the user picks a rule, return to the one-sentence prompt. If they accept the empty-CRUD label, record it as `# TODO: domain rule — see Open Questions` per the schema and add an entry to a running `## Open Questions` block in shape-notes.md.

#### Brownfield mode

Open with: "What is the existing domain rule — the decision your current system makes for the user? Then: does this change add a new rule, modify the existing one, or is it infrastructure-only (no rule change)?"

Listen. Classify the answer:

- **Adds a new domain rule** — capture as in greenfield (one-sentence rule for the new capability).
- **Modifies an existing rule** — capture the current rule first ("The system currently does X"), then the change ("This change modifies it to do Y"). Both lines go into `## Business Logic`.
- **Infrastructure-only** — the change doesn't touch domain logic (e.g., migration, performance improvement, integration). Record: "No domain logic change. This is an infrastructure/technical change." Skip the empty-CRUD check — it doesn't apply to brownfield infrastructure work.

After business logic, capture constraints and preserved behavior as `## Constraints & Preserved Behavior`:

- "What existing integrations, APIs, or data contracts must this change respect?"
- "Are there data migrations involved? What happens to existing data?"
- "What backward compatibility guarantees are needed?"

#### Both modes

After business logic is locked (or its absence is recorded), ask one round on non-functional requirements: "Are there qualities the app must hold at its outer boundary — what a user, operator, or regulator could measure without inspecting the implementation? Think: response timing as the user perceives it, privacy commitments, accessibility, browser/device support, retention windows." For brownfield, add: "Are there existing externally-observable behaviors or SLAs that must not regress?"

Capture as `## Non-Functional Requirements` bullets per schema. Each NFR pairs a property with a measurable target (or a binary commitment) and avoids naming mechanism, enforcement strategy, runtime location, or UI affordance — those are downstream choices. If the user phrases an NFR mechanically ("rate-limit per IP", "spinner during load", "Postgres query < 50ms"), reflect it back in outside-observable form before capturing ("auth resists credential stuffing without locking out fat-finger users"; "continuous visible feedback during any operation > 2s"; "user-perceived response < 800ms p95").

Do NOT ask "what entities does the user create, read, update, or delete?" — entities are not a PRD concern. The nouns the product manipulates surface in FRs (Step 4) and User Stories. If a field-level question seems needed to clarify a business rule, route it to `## Open Questions` for downstream resolution, not to a data-model capture.

Append `5` to `checkpoint.phases_completed`, bump `checkpoint.current_phase: 6`.

### Step 6: Product framing

This phase produces the `## Non-Goals` section plus the product-level frontmatter fields (`product_type`, `target_scale`, `timeline_budget`).

PRD frontmatter is product-level only. Stack-shaped concerns — team composition, language preferences, technology avoid-lists, deployment mode/region/budget, CI/CD pipeline shape — and architectural commitments — implementation decisions, testing strategy, deployment plan — are NOT part of the PRD. They are gathered downstream of `/10x-prd`, after the product shape is locked. Asking them now invites the user to over-commit before stack selection has happened, and the answers usually need to be revisited once the stack is picked.

#### Greenfield mode

Open with: "Last phase — let's pin a few framing details, then nail down what this MVP is explicitly NOT doing. We're not picking frameworks, deployment, or test/CI plans here — those come after, when the stack is picked."

Ask the user these three short framing questions, ONE AT A TIME (a separate question for each, not a single multi-question block). Phrase each question in plain language as suggested below — DO NOT print field names like `product_type` or `target_scale` in the question text or option labels. Map the user's answer to the underlying frontmatter field internally.

1. **What kind of thing are you building?**
   - Options: "A website or web app" / "An API or backend service" / "A command-line tool" / "A mobile app" / "A desktop app" / "A library or SDK" / "A data pipeline" — plus the free-text fallback.
   - Map the chosen label to `product_type`: web-app / api / cli / mobile / desktop / library / data-pipeline / other.

2. **Roughly how many people will use this once it's live?**
   - Options: "Just me, or a handful" / "Dozens to a hundred" / "Up to ten thousand" / "More than ten thousand".
   - Map the chosen label to `target_scale.users`: small / medium / large / enterprise.
   - After the answer, follow up with a short Socrates probe: "How would your domain rule change at 100x that scale?" Capture any insight as a one-line note in shape-notes' Vision section if it surfaces something new.

3. **Two quick questions about timing.**
   - Ask in one round: "Is there a hard deadline you're aiming for? If yes, what date — if no, just say 'no deadline'." (Map to `timeline_budget.hard_deadline`: an ISO date or `null`.)
   - Then: "Will this be after-hours work, or part of your day job?" (Map to `timeline_budget.after_hours_only`: bool.)
   - `timeline_budget.mvp_weeks` was already locked during Step 3 — don't re-ask it.

#### Brownfield mode

Open with: "Last phase — let's pin a few framing details and what this change is explicitly NOT doing. We're not changing the stack here — those decisions come after."

For brownfield, product framing questions become "is this changing?" yes/no gates plus constraint capture:

1. **Is the product type changing?**
   - If the existing system is a web app and this change doesn't alter that → record `product_type` as-is with note: `No change — existing [type].`
   - If the change introduces a new product surface (e.g., adding a CLI to a web app) → capture the new `product_type` alongside the existing one.

2. **Is the user base changing?**
   - Same pattern: record current `target_scale` and whether the change affects it. If the change opens the system to new users or a different scale, capture the delta.

3. **Timing** — same two questions as greenfield (`hard_deadline`, `after_hours_only`). `timeline_budget.delivery_weeks` was already locked during Step 3.

After framing, add: "What constraints does the existing system impose on this change? Think about: deployment windows, existing CI/CD requirements, backward compatibility with current API consumers, existing monitoring/alerting." Capture in `## Constraints & Preserved Behavior` (extend the section created in Step 5).

#### Both modes

After product framing is locked, run **one** Non-Goals multi-select round. The shape is a multi-select avoid-list — but aimed at *scope* avoids (capabilities the MVP won't build / change won't touch, quality dimensions it won't aim for), not technology avoids. Ask:

```
What is this [MVP/change] explicitly NOT doing? Pick anything that should be
ruled out *now* so it doesn't sneak back in later. Functional non-goals
(capabilities we won't build/change) and non-functional non-goals (quality
dimensions we won't aim for) both belong here.
```

Ask the user for input with `multiSelect: true` and 3–5 options drawn from the user's domain — NOT generic. Examples (regenerate per project):

- "Avoid: building our own [domain algorithm — e.g., recommendation, scheduling, scoring]" — strong scope avoid; force a buy-vs-build decision now.
- "Avoid: [expensive infrastructure piece — e.g., local LLM, real-time sync, multi-region]" — strong scope avoid; the absence shapes the data flow.
- "Avoid: [secondary persona — e.g., shared decks, team workspaces, admin features]" — explicit single-tenant lock.
- "Avoid: [quality dimension — e.g., offline-first, full WCAG-AA, sub-100ms latency]" — explicit non-functional non-goal.
- For brownfield: "Avoid: [existing system change — e.g., migrating the database, rewriting auth, changing the deployment target]" — explicit existing-system non-goal.
- "Other (you tell me)" — free-text capture.

Append the picked items to `## Non-Goals` per schema (one-line rationale each). If technology avoids come up (e.g., "avoid: PHP", "avoid: monorepo"), DO NOT add them to `## Non-Goals` — capture them in shape-notes' body under a `## Forward: tech-stack` block (informational, not part of the PRD schema) so the next chain step can pick them up.

**Do NOT** ask about implementation decisions, testing strategy, or deployment & CI/CD plan in this skill. Those concerns sit downstream of stack selection / stack assessment. If the user volunteers content of that shape, capture it in shape-notes under `## Forward: technical-roadmap` (informational; not a PRD section) so a downstream skill can pick it up.

Append `6` to `checkpoint.phases_completed`, bump `checkpoint.current_phase: 7`. Proceed directly to Step 7.

### Step 7: Closing soft-gate cross-check

This phase runs the quality bar against everything captured. It is a **soft gate**: warns but allows override.

Read back the current `shape-notes.md` and check each of the following elements. For each, mark `present` or `missing/weak`:

1. **Access Control** — `## Access Control` block exists with a non-trivial value (not just empty placeholder).
2. **Business Logic (one-sentence rule)** — `## Business Logic` opens with a single declarative sentence (not a paragraph, not "TBD"). For brownfield infrastructure-only changes, "No domain logic change" is valid.
3. **Project artifacts** — `shape-notes.md` itself exists with a valid frontmatter checkpoint. (This is always present at this point.)
4. **Timeline-cost acknowledged** — either `timeline_budget.mvp_weeks` / `delivery_weeks` ≤ 3, OR a `## Timeline acknowledgment` block exists in shape-notes recording that the user accepted the sustained-effort cost in Step 3. Longer timelines are valid; the gate is that the cost was surfaced and accepted, not that the timeline is short.
5. **Non-Goals** — `## Non-Goals` block exists with at least one entry.
6. **Preserved behavior** *(brownfield only)* — `## Constraints & Preserved Behavior` block exists and explicitly names what must not break. Skip this check for greenfield sessions.

Do NOT check for `## Testing Strategy`, `## Deployment & CI/CD`, or `## Implementation Decisions` — those are not part of the PRD schema. They sit downstream of stack selection / stack assessment, not in PRD.

Print the result table:

```
═══════════════════════════════════════════════════════════
  QUALITY CROSS-CHECK
═══════════════════════════════════════════════════════════

  Access Control:           [present | missing — describe]
  Business Logic:           [...]
  Project artifacts:        present
  Timeline-cost ack:        [present | missing — describe]
  Non-Goals:                [...]
  Preserved behavior:       [present | missing — describe | n/a (greenfield)]

═══════════════════════════════════════════════════════════
```

For each `missing/weak`, **list it by name** with a one-line consequence: "Business Logic: not captured as a one-sentence rule — your PRD will be hollow without a domain decision." Generic "your PRD has gaps" warnings nullify the gate; do not write them.

Then ask the user:
Ask the user: "How would you like to proceed?" with options:
- "Address gaps now" (description: "Re-enter the relevant phase to fill in missing elements. Recommended if multiple elements are missing.")
- "Accept and finish" (description: "Proceed despite the gaps. They will be recorded as warnings in the checkpoint and surfaced in /10x-prd's Open Questions.")
- "Restart phase [N]" (description: "Go back to a specific phase and rebuild from there.")

On "Address gaps now": ask which gap; jump back to the phase that owns it (Step 1–6); re-run that phase only; then return to Step 7.

On "Accept and finish": set `checkpoint.quality_check_status: warned` (if any gaps remain) or `accepted` (if all elements are present — 6 for greenfield, 7 for brownfield). Append a `## Quality cross-check` section to `shape-notes.md` listing every gap by name with its one-line consequence — `/10x-prd` mirrors these into `## Open Questions`.

On "Restart phase [N]": move to that phase. Do NOT erase prior content; let the phase overwrite its own sections.

Append `7` to `checkpoint.phases_completed`, bump `checkpoint.current_phase: 8`. Proceed to Step 8.

### Step 8: Hand off

Final write of `shape-notes.md`:

- Confirm `checkpoint.quality_check_status` is either `warned` or `accepted` (never `pending` at this point).
- Bump `updated:` to today's date in the frontmatter.
- Re-validate against the schema reference one more time: for greenfield, the body should anticipate the 10 PRD sections in the order the schema requires; for brownfield, the 11 brownfield PRD sections. The frontmatter should be the full `checkpoint:` block plus `context_type`. Any forward-looking content captured in Step 6 stays in its `## Forward: ...` block — NOT folded into PRD-schema sections.

Then copy the next-step command to clipboard and announce:

```bash
echo -n "/10x-prd" | pbcopy 2>/dev/null || echo -n "/10x-prd" | clip.exe 2>/dev/null || echo -n "/10x-prd" | xclip -selection clipboard 2>/dev/null || true
```

```powershell
# PowerShell (Windows)
Set-Clipboard "/10x-prd"
```

Print:

```
═══════════════════════════════════════════════════════════
  SHAPE COMPLETE
═══════════════════════════════════════════════════════════

  Project:                [project name]
  Context type:           [greenfield | brownfield]
  Phases captured:        1, 2, 3, 4, 5, 6
  FRs drafted:            [count]
  Quality check:          [warned | accepted]

  ► Notes:  context/foundation/shape-notes.md
  ► Next:   /10x-prd  (✓ copied to clipboard)

  After /10x-prd, the next chain step will pick up:
    Greenfield → tech-stack selection, then bootstrap
    Brownfield → stack assessment, then health check
  None of those belong in PRD itself.
═══════════════════════════════════════════════════════════
```

STOP. Do not chain into `/10x-prd` automatically — the user runs it when ready.

## Critical guardrails

1. **Facilitator, not generator.** The skill never writes domain content the user did not say. If a section needs a value the user has not provided, ask. The exception is mechanical formatting (FR-NNN numbering, schema heading scaffolds, frontmatter keys).

2. **Schema is the contract.** The shape of `shape-notes.md` and the embedded scaffold for the future PRD are dictated by `references/prd-schema.md`. Re-check at every checkpoint write. If the schema changes mid-implementation, update this skill body to match — drift is the failure mode.

3. **Stack openness is binding.** Never ask about, recommend, or commit to a framework, database, language family, or specific platform. The PRD captures product-level priors only (`product_type`, `target_scale`, `timeline_budget`); team composition, language preferences, deployment, and CI/CD shape are gathered downstream of `/10x-prd`. If the user volunteers stack-shaped content, capture it in shape-notes' body under `## Forward: tech-stack` — not in PRD-mapped sections.

4. **Anti-patterns are surfaced by name, not generically.** Empty-CRUD detection names the missing rule shapes and asks the user to pick one. MVP-too-big detection names the expensive pieces and offers concrete scope-down moves. "Your idea has issues" warnings nullify the gate.

5. **Soft gate, not hard gate.** The closing cross-check WARNS but allows the user to override every gap. Override paths are recorded in the checkpoint as `quality_check_status: warned` and surfaced in `/10x-prd`'s `## Open Questions`. Refusing to finish is not in scope.

6. **Mode-aware behavior.** The skill auto-detects context type (greenfield vs brownfield) from project markers in cwd and adapts all six discovery phases accordingly. For brownfield, the discovery loop shifts from "what are you building from scratch?" to "what exists, what's changing, what must be preserved?". If the user invokes this skill for a small-scope problem within an existing codebase (single bug, quick refactor), suggest `/10x-frame` instead — `/10x-shape` is for changes that warrant a full PRD.

7. **Universal language only.** No 10xDevs / cohort / certification references in any user-facing output or any artifact written to disk. The mechanics here are universal indicators of a well-scoped project; the persona context that motivated them lives in the change folder, not in the shipped skill.

8. **Resume preserves prior work.** On resume, completed phases are SUMMARIZED in 1–2 sentences each, never re-run. The user's prior decisions are load-bearing; replaying them frustrates the user and risks contradicting earlier captures.

## Notes

- This is a **shaping** skill. Output is `shape-notes.md`, not `prd.md`. `/10x-prd` is the document generator.
- The schema reference (`references/prd-schema.md`) is the single source of truth. Any field name, section name, or checkpoint key referenced in this body MUST exist in the schema doc — if it doesn't, fix the schema doc first.
- For greenfield, the 10 PRD sections are anticipated in `shape-notes.md` body order so `/10x-prd` can map cleanly. For brownfield, the 11 brownfield PRD sections are anticipated instead (see `references/prd-schema.md`). The names match exactly. Forward-looking content (tech-stack-selector / stack-assess residuals; future technical-roadmap concerns) lives in separate `## Forward to ...` blocks in shape-notes' body and does NOT map into PRD.
- If the user pushes to skip a phase ("just generate the PRD already"), explain the consequence: missing phases produce hollow PRD sections. Then offer to skip with the cost made explicit. The choice is theirs.