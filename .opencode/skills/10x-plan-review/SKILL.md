---
name: 10x-plan-review
description: >
  Review implementation plans for substance, feasibility, and architectural fitness.
  Use when user asks to review a plan, says "is this plan good", "check my plan",
  "review this plan", mentions plan review, or references a plan file and asks
  for feedback. Also trigger when user finishes /10x-plan and wants validation
  before starting /10x-implement.
---

# Plan Review

Catch substance problems in an implementation plan before a line of code is written. A flawed plan costs hours — a flawed review costs minutes.

Where `/10x-impl-review` asks "did we build what we planned?", this asks "will this plan actually work?"

Two modes:
- **Fresh review**: analyze → findings → interactive triage
- **Resume triage**: load a saved report and jump to per-issue triage

## Input resolution

1. Argument points to a saved review file (contains `<!-- PLAN-REVIEW-REPORT -->`) → **resume triage** (skip to Step 6)
2. Argument is a `<change-id>` and `context/changes/<change-id>/plan.md` exists → review that plan
3. Plan path provided (e.g. `@context/changes/<change-id>/plan.md`) → use it
4. No argument → list `context/changes/*/plan.md` (newest by `change.md.updated`) via Ask the user:
5. `--quick` flag → document-only mode (skip Step 3)

If the resolved plan path starts with `context/archive/`, refuse to write a review: print "This change is archived. Reviews are not appended to archived plans." and STOP.

## Step 1: Load and internal consistency scan

Read the plan file fully. Also read the sibling `plan-brief.md` in the same change folder if it exists. Read `context/foundation/lessons.md` if present and use accepted rules as priors when scanning for substance / feasibility / contract-break issues — a finding that restates a known recurring rule should weigh more, not less. Extract:
- **Desired End State** and **Success Criteria**
- **Current State Analysis** — documented constraints and gotchas
- **Scope boundaries** — "What We're NOT Doing"
- **Phases** — file paths, changes, dependencies
- **Decisions** and **assumptions** (explicit and implicit)
- **Progress section** — the canonical `## Progress` block at the bottom of the plan (see `references/progress-format.md`)

Before any code verification, check the plan against itself. These three scans often catch the highest-value issues — problems the plan author discovered but didn't fully follow through on:

- **Contradiction**: does Current State Analysis document a limitation the implementation ignores? (e.g., "npm doesn't run preuninstall for deps" yet phases rely on it) Do items from "What We're NOT Doing" reappear in phases? Does a phase assume a behavior elsewhere acknowledged as broken?
- **Promise gap**: every capability promised in Desired End State / Success Criteria / Migration Notes should have a backing phase. If success criteria say "rate limiting works" but no phase builds it, the implementer hits a gap mid-build.
- **Contract breaks** (when the plan defines or uses API endpoints): trace data flow across endpoints — if step B needs a token/ID from step A, does A's response include it? Flag unresolved design decisions the implementer would have to guess at (which endpoint, which auth method, which storage for rate-limit state).
- **Contract surfaces touched**: if `docs/reference/contract-surfaces.md` exists in the project, read it and extract the list of H2 headings as surface names. Run `grep -F` against the plan text with one `-e <surface name>` per heading. For each hit, read the relevant H2 section of `contract-surfaces.md` and verify (a) the plan accurately reports the current shape of the surface, and (b) any rename or schema change is flagged as breaking with a migration story for downstream consumers. If the file does not exist, skip this check silently — it's an opt-in convention self-bootstrapped on first use by `/10x-contract` or `/10x-impl-review`'s triage branch. The H2-derived grep list means: when a consumer adds a new surface to their file, the next plan-review picks it up automatically — no SKILL.md edit needed.
- **Progress↔Phase consistency** (mechanical contract — see `references/progress-format.md`):
  - Exactly one `## Progress` heading at the bottom of plan.md.
  - Each `## Phase N: <name>` in the plan body has a matching `### Phase N: <name>` in Progress.
  - Every Success Criteria bullet (under `#### Automated Verification:` / `#### Manual Verification:`) in a Phase block has a matching `- [ ] N.M <title>` (or `- [x]`) in the corresponding Progress subsection.
  - Phase blocks contain plain `- ` bullets only — no `- [ ]` or `- [x]` outside the Progress section.
  Treat any of these as a CRITICAL finding under Plan Completeness — `/10x-implement` will fail to parse a malformed Progress section.

## Step 2: Grounding

Quick, no sub-agents:
- **Paths**: Execute a shell command to list files (`ls -l`) on ≥5 file paths the plan claims to modify. Non-existent paths are critical.
- **Symbols**: Execute a shell command to search (`grep`) for specific functions/config keys the plan references.
- **Brief↔plan consistency**: phases, decisions, scope match?

Report inline: `Grounding: 5/5 paths ✓, 3/3 symbols ✓, brief↔plan ✓`. Only escalate to a finding on failure.

## Step 3: Codebase verification (deep mode only)

Skip if `--quick`.

From Steps 1–2, identify the **3–5 riskiest claims** in the plan — things that, if wrong, force significant rework. Launch **one** sub-agent with three combined tasks:

1. **Verify the riskiest claims** against the actual code. For each: what does the code show, does it confirm or contradict the plan, with file:line evidence.
2. **Blast-radius sweep**: for functions, constants, or endpoints the plan modifies, search the codebase for other callers/importers not mentioned in the plan. These are files the plan doesn't know it's affecting.
3. **Pattern check** (only if plan introduces new patterns): do existing files in the touched areas already solve this? Pattern proliferation is a common finding.

Give the sub-agent targeted questions with relevant file paths — don't dump the full plan. A focused prompt finds more than a broad sweep because the agent knows what to look for.

## Step 4: Substance analysis

Analyze the plan against five dimensions. Only produce findings for real issues — don't pad with "no issues found".

### End-State Alignment
Walking phases sequentially, does the system reach the stated end state? Could all success criteria pass while the goal remains unmet? Any "last mile" gap where the plan does 90% and stops short?

### Lean Execution
For each phase: "if I removed this, would the end state still be achievable?" Watch for premature abstraction, "while we're here" additions, framework-where-a-function-would-do, scope contradictions ("not doing" items appearing in phases).

### Architectural Fitness
Does this fit the existing system? New patterns where existing ones would work (pattern proliferation). Clean module boundaries and correct dependency direction. High-blast-radius changes — phases touching many files across modules, changes to shared utilities. Vague "refactor as needed" or "update accordingly" that will spiral.

### Blind Spots
What didn't the plan consider? Error paths (only happy path described?), rollback story (phase 3 fails — can we revert?), resource/cost impact (API calls, computational work — what does this cost at expected usage?), default value changes (a default that triples cost or time should be called out), testing gaps, security boundaries.

### Plan Completeness
Is the document actionable? File paths specific (not "somewhere in src/")? Changes at function/method level? Success criteria with runnable commands? TBDs, TODOs, or placeholder sections?

## Step 5: Compile findings

Each finding has:

- **ID**: F1, F2, F3…
- **Severity**: CRITICAL / WARNING / OBSERVATION (how bad if ignored)
- **Impact**: LOW / MEDIUM / HIGH (how much focus the decision needs)
- **Dimension**: one of End-State Alignment / Lean Execution / Architectural Fitness / Blind Spots / Plan Completeness
- **Title**: one line
- **Location**: plan section or phase
- **Detail**: what's wrong with evidence — plan's claim vs. what's actually true, or what's missing
- **Fix options**: 1 or 2 (see below)

### Impact

Orthogonal to severity. A CRITICAL with LOW impact (obvious fix) is cheap to resolve; a WARNING with HIGH impact (unclear tradeoffs, wide blast) deserves careful thought.

| Impact | Meaning |
|---|---|
| 🏃 **LOW** | Quick decision. Fix is obvious and narrowly scoped. Safe to batch. |
| 🔎 **MEDIUM** | Worth pausing. Real tradeoff or non-trivial edit — think before deciding. |
| 🔬 **HIGH** | Architectural stakes. Wide blast radius, strategic implications, or unclear best path. |

### Fix options

Default to **one** fix. Only present two when there's a genuine tradeoff a smart reviewer would want to weigh — not every finding has alternatives worth manufacturing.

**When to offer two fixes**: when approach A and approach B each have a real upside the other lacks (e.g., "minimal edit that patches the symptom" vs. "refactor that removes the class of problem"). If you find yourself inventing a weak second option to satisfy a template, don't — present one fix and move on.

**LOW-impact findings**: skip the decomposition — just `Fix: [one line]`. Noise isn't helpful when the answer is obvious.

**MEDIUM/HIGH-impact findings**: each option gets:
```
[1-sentence approach] · Strength: [advantage, ideally grounded in plan/codebase evidence] · Tradeoff: [cost or risk] · Confidence: HIGH|MED|LOW — [1-line why] · Blind spot: [what we haven't verified, or "None significant"]
```

When offering two options, mark exactly one `⭐ Recommended`.

### Dimension verdicts and overall verdict

Each dimension: **PASS** / **WARNING** / **FAIL**.

- **SOUND** — safe to implement. All PASS, or PASS with minor warnings.
- **REVISE** — needs targeted fixes. Multiple warnings or 1 non-critical FAIL.
- **RETHINK** — fundamental problems. Multiple FAILs or wrong approach.

Sort findings by severity: CRITICAL → WARNING → OBSERVATION. Cap at 10 — consolidate related findings if you have more.

## Step 6: Present report and offer save

Plain text, box-drawing. Findings grouped by severity; omit empty groups. PASS dimensions appear only in the verdicts table, never as findings.

```
═══════════════════════════════════════════════════════════
  PLAN REVIEW: [Plan Title]
  Mode: Deep / Quick  |  Date: YYYY-MM-DD
  Findings: [N critical] [N warnings] [N observations]
═══════════════════════════════════════════════════════════

  End-State Alignment    PASS    ✅
  Lean Execution         WARNING ⚠️   (1 finding)
  Architectural Fitness  PASS    ✅
  Blind Spots            FAIL    ❌   (1 finding)
  Plan Completeness      WARNING ⚠️   (1 finding)

  Grounding: 5/5 paths ✓, 3/3 symbols ✓, brief↔plan ✓
  ► Overall: REVISE

═══════════════════════════════════════════════════════════
  CRITICAL FINDINGS ❌
═══════════════════════════════════════════════════════════

  F1 — No rollback for 50M-row backfill
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ❌ CRITICAL
    Impact:    🔬 HIGH — architectural stakes; think carefully before deciding
    Dimension: Blind Spots
    Location:  Phase 3 — Database Changes

    Detail:
    Plan adds a NOT NULL column to users (50M rows) but no phase
    covers rollback if the backfill fails mid-way. Partial backfill
    leaves the table in an inconsistent state.

    Fix A ⭐ Recommended: Make column nullable + separate restartable backfill
      Strength:   Restartable; partial progress isn't destructive; matches
                  the pattern used for users.email_verified_at last quarter.
      Tradeoff:   Two deploys (add nullable → backfill → enforce NOT NULL).
      Confidence: HIGH — this exact approach shipped cleanly 3 months ago.
      Blind spot: Enforce step still needs its own rollback note.

    Fix B: Add explicit rollback phase with full table snapshot
      Strength:   Single deploy; rollback is atomic.
      Tradeoff:   50M-row snapshot is expensive in disk and lock time.
      Confidence: MEDIUM — haven't measured snapshot cost on a table this size.
      Blind spot: Replication lag during snapshot is unverified.

═══════════════════════════════════════════════════════════
  WARNING FINDINGS ⚠️
═══════════════════════════════════════════════════════════

  F2 — Provider pattern for 2 config sources
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🔎 MEDIUM — real tradeoff; pause to reason through it
    Dimension: Lean Execution
    Location:  Phase 1 — Config Refactor

    Detail:
    Plan builds a full provider-pattern config system for only two
    sources (env + file). A direct dict merge achieves the same end
    state with ~1/3 the code.

    Fix: Replace config provider abstraction with direct dict merge in
         load_config(). Introduce the provider pattern only when a third
         source appears.
      Strength:   Less code, fewer concepts to maintain.
      Tradeoff:   If a third source ships soon, we refactor twice.
      Confidence: HIGH — the existing codebase follows this "add abstraction
                  when needed" pattern everywhere else.
      Blind spot: Plans for additional config sources not surveyed.

  ···

  F3 — Vague "refactor utils as needed"
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Plan Completeness
    Location:  Phase 2

    Detail:
    "Refactor format_output as needed" — format_output is imported by
    12 files across 4 modules. Implementer has no guidance.

    Fix: Specify exact signature changes and list callers needing updates.

═══════════════════════════════════════════════════════════
```

### Formatting rules for the report

- The **finding title line** holds only the ID and the short title — nothing else. Everything else goes below as labeled fields so each row is short and scannable.
- **Always pair icons with a word.** Never use a bare icon as the only signal — `❌ CRITICAL`, not just `❌`. This keeps the report readable when skimming and doesn't force the user to memorize what each icon means.
- **Impact always carries its one-line meaning** (copy from the Impact table — "architectural stakes; think carefully before deciding" / "real tradeoff; pause to reason through it" / "quick decision; fix is obvious and narrowly scoped"). This makes LOW/MEDIUM/HIGH self-explanatory at the point of use instead of relying on the user to remember the table.
- Severity, Impact, Dimension, Location are each on their own line with aligned labels. Detail starts on its own line under a `Detail:` label so it can wrap naturally.

Then ask:

```
question: "Plan review complete. How would you like to proceed?"
header: "Plan Review — [N] findings"
options:
  - label: "Triage findings"
    description: "Walk through each finding and decide."
  - label: "Save report & triage later"
    description: "Save the full report. Resume with /10x-plan-review <report-path>."
  - label: "Save report only"
    description: "Save and finish — I'll handle the findings myself."
multiSelect: false
```

### Saving the report

Save to `context/changes/<change-id>/reviews/plan-review.md` (one plan-review per change folder; rerunning overwrites). Update `change.md`: `status: plan_reviewed`, `updated: <today>`.

```markdown
<!-- PLAN-REVIEW-REPORT -->
# Plan Review: [Plan Title]

- **Plan**: [plan file path]
- **Mode**: Deep / Quick
- **Date**: YYYY-MM-DD
- **Verdict**: [SOUND/REVISE/RETHINK]
- **Findings**: [N critical] [N warnings] [N observations]

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS/WARNING/FAIL |
| Lean Execution | PASS/WARNING/FAIL |
| Architectural Fitness | PASS/WARNING/FAIL |
| Blind Spots | PASS/WARNING/FAIL |
| Plan Completeness | PASS/WARNING/FAIL |

## Grounding
[grounding line]

## Findings

### F1 — No rollback for 50M-row backfill

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Blind Spots
- **Location**: Phase 3 — Database Changes
- **Detail**: Plan adds a NOT NULL column to users (50M rows) but no phase covers rollback if the backfill fails mid-way.
- **Fix A ⭐ Recommended**: Make column nullable + separate restartable backfill
  - Strength: Restartable; partial progress isn't destructive.
  - Tradeoff: Two deploys.
  - Confidence: HIGH — this approach shipped cleanly last quarter.
  - Blind spot: Enforce step still needs its own rollback note.
- **Fix B**: Add explicit rollback phase with full table snapshot
  - Strength: Single deploy; rollback is atomic.
  - Tradeoff: 50M-row snapshot is expensive in disk and lock time.
  - Confidence: MEDIUM — snapshot cost unverified at this size.
  - Blind spot: Replication lag during snapshot is unverified.
- **Decision**: PENDING

### F3 — Vague "refactor utils as needed"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2
- **Detail**: "Refactor format_output as needed" — imported by 12 files across 4 modules.
- **Fix**: Specify exact signature changes and list callers needing updates.
- **Decision**: PENDING
```

The `<!-- PLAN-REVIEW-REPORT -->` marker and `Decision: PENDING` fields enable resume mode.

"Save & triage later" → save, print the path, remind them to run `/10x-plan-review <saved-report-path>`.
"Triage" → proceed to Step 7.

## Step 7: Interactive triage

### Resume mode

If entered via saved file: read it, parse `### F` headers, filter to `Decision: PENDING`. If none, say "All findings triaged" and stop.

### Triage loop

Walk findings in severity order (CRITICAL → WARNING → OBSERVATION). For each:

**With 2 fix options:**
```
question: "F[N] — [title]\n\nSeverity: [sev icon] [SEV]\nImpact: [impact icon] [LEVEL] — [meaning]\nDimension: [dim]\nLocation: [loc]\n\nDetail: [detail]\n\n[Fix A block]\n\n[Fix B block]"
header: "Finding [current] of [total remaining]"
options:
  - label: "Apply Fix A ⭐"
    description: "[Fix A one-liner]"
  - label: "Apply Fix B"
    description: "[Fix B one-liner]"
  - label: "Fix differently"
    description: "Different approach — let's discuss."
  - label: "Skip"
    description: "Not worth addressing now."
  - label: "Accept risk"
    description: "Understood — I'll handle during implementation."
  - label: "Disagree"
    description: "Not actually an issue — dismiss."
multiSelect: false
```

**With 1 fix option:** same options, but replace "Apply Fix A/B" with a single "Fix in plan".

**Handling responses:**
- **Apply Fix A/B / Fix in plan**: show the exact plan edit (before/after). Brief confirmation, then apply the edit to the plan file. Mark FIXED (record which fix, e.g. "Fixed via Fix A").
- **Fix differently**: ask the preferred approach, apply the edit to the plan file, mark FIXED.
- **Skip** → SKIPPED. **Accept risk** → ACCEPTED. **Disagree** → DISMISSED. Move on, don't argue.

After each decision, if working from a saved file, update its `Decision:` field.

### Summary

```
═══════════════════════════════════════════════════════════
  TRIAGE COMPLETE
═══════════════════════════════════════════════════════════

  Fixed:     F1 (Fix A), F3   (2)
  Skipped:   F4               (1)
  Accepted:  F2               (1)
  Dismissed: F5               (1)

  ► Verdict after fixes: [updated if fixes changed it, e.g. REVISE → SOUND]
═══════════════════════════════════════════════════════════
```

## Notes

- This is a **review** skill. Analyze and report — don't rewrite the plan unless asked during triage.
- Be specific. "Phase 3 introduces a second event system alongside the existing EventBus in `src/core/events.ts`" — not "architecture might have issues".
- Distinguish "won't work" (FAIL) from "could be better" (WARNING).
- If the plan is genuinely good, say so briefly and stop. Don't manufacture findings.
- Impact is about *decision effort*, not *severity*. LOW impact on a CRITICAL finding means the fix is obvious; HIGH impact on a WARNING means the tradeoff is real.
- Two fix options only when there's a genuine tradeoff. Don't invent alternatives for trivial fixes.
- During triage, keep momentum. User already read the report — present the finding, take the decision, move on.
- When applying a fix to the plan, make minimal targeted edits. Don't restructure the whole plan for one finding.