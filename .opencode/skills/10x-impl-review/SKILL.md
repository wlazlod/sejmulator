---
name: 10x-impl-review
description: Review implementation against plan for drift, dangerous decisions, and pattern compliance
---

# Implementation Review

Compare actual implementation work against the original plan to catch drift, dangerous decisions, architecture violations, and pattern misuse before they compound.

Two granularities:
- **Phase review**: after a single phase — fast, focused on that phase's changes
- **Full plan review**: after all phases — comprehensive sweep

Two modes:
- **Fresh review**: analyze → findings → interactive triage
- **Resume triage**: load a saved report and jump to per-issue triage

## Input resolution

1. Argument points to a saved review file (contains `<!-- IMPL-REVIEW-REPORT -->`) → **resume triage** (skip to Step 5)
2. Argument is a `<change-id>` and `context/changes/<change-id>/plan.md` exists → fresh review on that plan
3. Plan path provided (e.g. `@context/changes/<change-id>/plan.md`) → fresh review on that plan
4. Phase number provided (e.g. "phase 3") → review only that phase
5. No argument → enumerate `context/changes/*/change.md`; pick the most recently `updated` change with `status` in `{implementing, implemented}` and confirm via Ask the user:

If the resolved plan path starts with `context/archive/`, refuse: print "This change is archived. Reviews are not appended to archived plans." and STOP.

## Step 1: Load plan and detect change scope

Create a task named "Implementation Review" with active form "Loading context"

1. **Read the plan file fully** — no limit/offset.
2. **Read `context/foundation/lessons.md` if present** and use accepted rules as priors when scanning for findings — a deviation that violates a known recurring rule is a stronger signal than a generic style nit.
3. **Read the canonical state from the plan's `## Progress` section** (see `references/progress-format.md`): completion = `count([x]) / count([ ] + [x])`; current phase = phase containing the first `- [ ]` (or last phase if all done). Also read sibling `change.md` for `status` and `updated`.
4. **Scope**: specific phase requested → that phase only; else all phases whose Progress checkboxes are fully `[x]` (i.e., completed phases).
5. **Extract** from phases under review: file paths from "Changes Required", architectural decisions, success criteria (Automated/Manual bullets in Phase blocks + their `[ ]`/`[x]` mirror in Progress), and the "What We're NOT Doing" list (scope guardrails).
6. **Git scope detection** — what actually changed:
   ```bash
   PLAN_DATE="<YYYY-MM-DD from filename>"
   git log --oneline --after="${PLAN_DATE}" -- .
   git diff --name-only $(git log --reverse --after="${PLAN_DATE}" --format="%H" | head -1)^..HEAD 2>/dev/null
   ```
   If the range can't be cleanly determined, fall back to commits whose messages reference the plan/feature.

Compare changed-file list against plan-file list:
- **In plan AND in diff** → expected change, verify content matches intent
- **In diff but NOT in plan** → unplanned change, investigate and flag
- **In plan but NOT in diff** → potentially missing implementation

Don't pre-read every changed file into the main context — let the sub-agents read what they need. Main context should carry the plan and the diff summary, not the full source of 20 files.

## Step 2: Parallel review via sub-agents

Update the task's active form to "Gathering evidence"

Launch **two** sub-agents simultaneously. Each gets targeted context — don't dump the full plan into both.

**Agent 1 — Plan Drift Detection** (`subagent_type: "general-purpose"`)

Give it: the "Changes Required" text for the reviewed phases, the list of file paths to read.

Instructions: for each planned change, read the actual file and verify implementation matches intent. Check for:
- Changes implemented differently than planned (intent mismatch, not formatting)
- Planned items skipped without documentation
- Additions not described in the plan (scope creep)

Report each: file path, what the plan said, what exists, verdict (MATCH / DRIFT / MISSING / EXTRA).

**Agent 2 — Safety, Quality & Pattern Compliance** (`subagent_type: "general-purpose"`)

Give it: the full list of changed files to read, the project root path.

Instructions:

1. **Safety & quality scan** on each changed file. Flag:
   - **Security**: injection risks (SQL, command, XSS), hardcoded secrets, missing authn/authz at system boundaries, overly permissive CORS/permissions.
   - **Performance**: N+1 queries, unbounded iteration/recursion, missing pagination, unnecessary sync I/O.
   - **Reliability**: missing error handling at external boundaries (API calls, file I/O, DB), race conditions, resource leaks.
   - **Data safety**: destructive DB ops without rollback, schema changes without migration path, data loss potential.

2. **Pattern compliance** — for each changed file, find 1–2 similar existing files and compare naming, error handling approach, module structure, imports/exports, test structure, config patterns. **Only report substantive mismatches** (e.g., a new module uses camelCase where siblings use snake_case; a new endpoint skips the auth middleware pattern the rest of the API uses). Skip trivial style differences — if the code works and follows the plan, minor formatting is not a finding.

3. **Budget pattern work to scope** — if the diff changed ≤3 files, spend minimal time on patterns (not much to compare). Scale pattern depth with change scope.

Report each finding with: file, line number, category, severity (CRITICAL / WARNING / OBSERVATION), description, recommendation.

## Step 3: Verify success criteria

Update the task's active form to "Verifying success criteria"

For each reviewed phase:

**Automated**: run each command from the "Automated Verification" checkboxes using a bash shell. Record command, pass/fail, actual output (truncate if huge).

**Manual**: in the `## Progress` section, check Manual items as `- [x]` vs `- [ ]`. Flag items marked complete that lack observable evidence in the diff (possible rubber-stamping); acknowledge unchecked items as pending.

## Step 4: Compile findings and present report

Update the task's active form to "Compiling findings"

Each finding has:
- **ID**: F1, F2, F3…
- **Severity**: CRITICAL / WARNING / OBSERVATION (how bad if ignored)
- **Impact**: LOW / MEDIUM / HIGH (how much focus the decision needs)
- **Dimension**: Plan Adherence / Scope Discipline / Safety & Quality / Architecture / Pattern Consistency / Success Criteria
- **Title**: one line
- **Location**: `file:line` (or "N/A" for missing items)
- **Detail**: what's wrong with evidence — plan vs. actual, or code vs. expected
- **Fix options**: 1 or 2 (see below)

### Impact

Orthogonal to severity. A CRITICAL with LOW impact (obvious one-line fix) is cheap; a WARNING with HIGH impact (architectural rework) deserves careful thought.

| Impact | Meaning |
|---|---|
| 🏃 **LOW** | Quick decision. Fix is obvious and narrowly scoped. Safe to batch. |
| 🔎 **MEDIUM** | Worth pausing. Real tradeoff or non-trivial edit — think before deciding. |
| 🔬 **HIGH** | Architectural stakes. Wide blast radius, strategic implications, or unclear best path. |

### Fix options

Default to **one** fix. Only offer two when there's a genuine tradeoff a smart reviewer would want to weigh (e.g. "patch the call site" vs. "fix it at the source"). If you find yourself inventing a weak second option, don't — present one and move on.

**LOW-impact findings**: just `Fix: [one line]`. Noise isn't helpful when the answer is obvious.

**MEDIUM/HIGH-impact findings**: each option gets:
```
[1-sentence approach] · Strength: [advantage, ideally grounded in code/plan evidence] · Tradeoff: [cost or risk] · Confidence: HIGH|MED|LOW — [1-line why] · Blind spot: [what we haven't verified, or "None significant"]
```

When offering two options, mark exactly one `⭐ Recommended`.

### Dimension verdicts

PASS / WARNING / FAIL per dimension:
- **Plan Adherence** — planned changes implemented as described? FAIL on MISSING or major DRIFT.
- **Scope Discipline** — "not doing" boundaries respected? WARNING if EXTRA changes exist but are benign.
- **Safety & Quality** — security, performance, reliability, data safety. FAIL on any CRITICAL finding.
- **Architecture** — module boundaries, dependency direction, abstraction justification. FAIL on violations.
- **Pattern Consistency** — follows existing conventions. WARNING on minor inconsistencies.
- **Success Criteria** — automated checks pass, manual checks addressed. FAIL on automated failures.

### Overall verdict

- **APPROVED** — all PASS, or PASS with ≤2 minor warnings
- **NEEDS ATTENTION** — multiple warnings or 1 non-critical FAIL
- **REJECTED** — any critical FAIL (security, major drift, data safety, failing tests)

Sort findings by severity: CRITICAL → WARNING → OBSERVATION. Cap at 10 — consolidate related findings if more.

### Report format

Plain text, box-drawing. PASS dimensions appear only in the verdicts table, never as findings. Omit severity groups with zero findings.

```
═══════════════════════════════════════════════════════════
  IMPLEMENTATION REVIEW: [Plan Title]
  Scope: Phase [N] of [Total]  |  Date: YYYY-MM-DD
  Findings: [N critical] [N warnings] [N observations]
═══════════════════════════════════════════════════════════

  Plan Adherence        PASS    ✅
  Scope Discipline      WARNING ⚠️   (1 finding)
  Safety & Quality      FAIL    ❌   (1 finding)
  Architecture          PASS    ✅
  Pattern Consistency   WARNING ⚠️   (1 finding)
  Success Criteria      PASS    ✅

  ► Overall: NEEDS ATTENTION

═══════════════════════════════════════════════════════════
  CRITICAL FINDINGS ❌
═══════════════════════════════════════════════════════════

  F1 — SQL injection in auth handler
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ❌ CRITICAL
    Impact:    🔎 MEDIUM — real tradeoff; pause to reason through it
    Dimension: Safety & Quality
    Location:  src/auth/handler.ts:42

    Detail:
    SQL query built with string concatenation. Plan specified
    parameterized queries but implementation uses template literals.

    Fix: Replace the template literal with a parameterized query using
         db.query($1, [value]).
      Strength:   Matches the pattern in src/users/query.ts and removes
                  the injection class entirely.
      Tradeoff:   Minor — one call site, a few-line change.
      Confidence: HIGH — identical pattern used elsewhere in this repo.
      Blind spot: None significant.

═══════════════════════════════════════════════════════════
  WARNING FINDINGS ⚠️
═══════════════════════════════════════════════════════════

  F2 — Unplanned /api/status endpoint
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🔬 HIGH — architectural stakes; think carefully before deciding
    Dimension: Scope Discipline
    Location:  src/api/routes.ts:18

    Detail:
    New GET /api/status endpoint not in plan. Functionality is
    related to planned work but extends public API surface.

    Fix A ⭐ Recommended: Document in the plan as an addendum
      Strength:   Preserves the work already done; updates the source of
                  truth before future reviews use the plan as ground truth.
      Tradeoff:   Plan becomes a slightly moving target.
      Confidence: HIGH — this repo's plan updates regularly pick up
                  discovered scope through addenda.
      Blind spot: Stakeholders who reviewed the original scope aren't
                  notified.

    Fix B: Remove and add to follow-up work
      Strength:   Keeps scope discipline strict.
      Tradeoff:   Loses implemented work; another PR needed later.
      Confidence: MEDIUM — depends whether anything already depends on it.
      Blind spot: Haven't checked for callers of /api/status.

  ···

  F3 — camelCase vs. snake_case
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
    Severity:  ⚠️ WARNING
    Impact:    🏃 LOW — quick decision; fix is obvious and narrowly scoped
    Dimension: Pattern Consistency
    Location:  src/utils/format.ts

    Detail:
    Uses camelCase (formatDate, parseInput) while existing utils use
    snake_case (format_date, parse_input).

    Fix: Rename exports to snake_case to match src/utils/.

═══════════════════════════════════════════════════════════
```

### Formatting rules for the report

- The **finding title line** holds only the ID and the short title — nothing else. Everything else goes below as labeled fields so each row is short and scannable.
- **Always pair icons with a word.** Never use a bare icon as the only signal — `❌ CRITICAL`, not just `❌`. This keeps the report readable when skimming and doesn't force the user to memorize what each icon means.
- **Impact always carries its one-line meaning** (copy from the Impact table — "architectural stakes; think carefully before deciding" / "real tradeoff; pause to reason through it" / "quick decision; fix is obvious and narrowly scoped"). This makes LOW/MEDIUM/HIGH self-explanatory at the point of use instead of relying on the user to remember the table.
- Severity, Impact, Dimension, Location are each on their own line with aligned labels. Detail starts on its own line under a `Detail:` label so it can wrap naturally.

After the report, ask the user:

```
question: "Review complete. How would you like to proceed?"
header: "Implementation Review — [N] findings"
options:
  - label: "Triage findings"
    description: "Walk through each finding and decide."
  - label: "Save report & triage later"
    description: "Save the full report. Resume with /10x-impl-review <report-path>."
  - label: "Save report only"
    description: "Save and finish — I'll handle the findings myself."
multiSelect: false
```

### Saving the report

Save to `context/changes/<change-id>/reviews/impl-review.md` (or `context/changes/<change-id>/reviews/impl-review-phase-N.md` for a phase-scoped review). Update `change.md`: set `status: impl_reviewed` and `updated: <today>`. If the user opts to triage, queue any "fix in plan/code" follow-ups into `context/changes/<change-id>/follow-ups/review-fixes.md`.

```markdown
<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: [Plan Title]

- **Plan**: [plan file path]
- **Scope**: Phase [N] of [Total]
- **Date**: YYYY-MM-DD
- **Verdict**: [APPROVED/NEEDS ATTENTION/REJECTED]
- **Findings**: [N critical] [N warnings] [N observations]

## Verdicts

| Dimension | Verdict |
|-----------|---------
| Plan Adherence | PASS/WARNING/FAIL |
| Scope Discipline | PASS/WARNING/FAIL |
| Safety & Quality | PASS/WARNING/FAIL |
| Architecture | PASS/WARNING/FAIL |
| Pattern Consistency | PASS/WARNING/FAIL |
| Success Criteria | PASS/WARNING/FAIL |

## Findings

### F1 — SQL injection in auth handler

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/auth/handler.ts:42
- **Detail**: SQL query built with string concatenation. Plan specified parameterized queries.
- **Fix**: Replace the template literal with a parameterized query using db.query($1, [value]).
  - Strength: Matches pattern in src/users/query.ts; removes injection class.
  - Tradeoff: Minor — one call site, a few-line change.
  - Confidence: HIGH — identical pattern used elsewhere.
  - Blind spot: None significant.
- **Decision**: PENDING

### F2 — Unplanned /api/status endpoint

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Scope Discipline
- **Location**: src/api/routes.ts:18
- **Detail**: New GET /api/status endpoint not in plan.
- **Fix A ⭐ Recommended**: Document in the plan as an addendum
  - Strength: Preserves the work; updates source of truth.
  - Tradeoff: Plan becomes a slightly moving target.
  - Confidence: HIGH — addendum pattern used regularly here.
  - Blind spot: Original-scope stakeholders not notified.
- **Fix B**: Remove and add to follow-up work
  - Strength: Keeps scope discipline strict.
  - Tradeoff: Loses implemented work; another PR later.
  - Confidence: MEDIUM — depends on callers.
  - Blind spot: Haven't checked for callers.
- **Decision**: PENDING

### F3 — camelCase vs. snake_case

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/utils/format.ts
- **Detail**: Uses camelCase while existing utils use snake_case.
- **Fix**: Rename exports to snake_case to match src/utils/.
- **Decision**: PENDING
```

The `<!-- IMPL-REVIEW-REPORT -->` marker and `Decision: PENDING` fields enable resume mode.

"Save & triage later" → save, print the path, remind them to run `/10x-impl-review <saved-report-path>`.
"Triage" → proceed to Step 5.

## Step 5: Interactive triage

Update the task's active form to "Triage"

### Resume mode

If entered via saved file: read it, parse `### F` headers, filter to `Decision: PENDING`. If none: "All findings triaged." Done.

### Triage loop

Walk findings in severity order (CRITICAL → WARNING → OBSERVATION). For each:

**With 2 fix options:**
Ask the user:
```
question: "F[N] — [title]\n\nSeverity: [sev icon] [SEV]\nImpact: [impact icon] [LEVEL] — [meaning]\nDimension: [dim]\nLocation: [loc]\n\nDetail: [detail]\n\n[Fix A block]\n\n[Fix B block]"
header: "Finding [current] of [total remaining]"
options:
  - label: "Apply Fix A ⭐"
    description: "[Fix A one-liner]"
  - label: "Apply Fix B"
    description: "[Fix B one-liner]"
  - label: "Skip"
    description: "Not worth fixing now."
  - label: "Record as lesson"
    description: "Save as a recurring project rule via /10x-lesson."
multiSelect: false
```

**With 1 fix option:**
Ask the user:
```
question: "F[N] — [title]\n\nSeverity: [sev icon] [SEV]\nImpact: [impact icon] [LEVEL] — [meaning]\nDimension: [dim]\nLocation: [loc]\n\nDetail: [detail]\n\n[Fix block]"
header: "Finding [current] of [total remaining]"
options:
  - label: "Fix now"
    description: "[Fix one-liner]"
  - label: "Fix differently"
    description: "Different approach — let's discuss."
  - label: "Skip"
    description: "Not worth fixing now."
  - label: "Record as lesson"
    description: "Save as a recurring project rule via /10x-lesson."
multiSelect: false
```

**Handling responses:**
- **Apply Fix A/B / Fix now**: show the exact before/after code change. Ask for confirmation ("Apply this?"), then perform the edit. Mark FIXED (record which option, e.g. "Fixed via Fix A").
- **Fix differently**: Ask the user for the preferred approach, perform the edit, mark FIXED.
- **Record as lesson**: pre-fill four lessons-entry fields directly from the finding — `Context` from the finding's Location, `Problem` from the finding's Detail, `Rule` and `Applies to` left as empty placeholders for the user to fill. Show the proposed entry as a complete markdown block and ask the user to edit / confirm via Ask the user: ("Approve this entry?" / "Edit before saving" / "Cancel"). On confirm, append the entry as a new H2 section to `context/foundation/lessons.md` — if the file does not exist, create it first with this canonical 5-line header (no separate template file; the header is embedded inline here):

  ```
  # Lessons Learned

  > Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

  ```

  The pre-fill-then-confirm flow is the load-bearing UX detail; the user must see the full proposed entry with the pre-filled Context/Problem and have a chance to edit Rule and Applies-to before append. After the append succeeds, **always** ask a follow-up via Ask the user: "Lesson saved. Also apply the fix to the current code?" with options "Yes — fix now" / "No — lesson only". **Never skip this question or decide on the user's behalf** — whether the fix is trivial, out of scope, or spans many files, the decision belongs to the user. If yes: show the before/after code change, perform the edit, mark `FIXED + ACCEPTED-AS-RULE: <rule title>`. If no: mark `ACCEPTED-AS-RULE: <rule title>` (finding stays unfixed, rule is recorded for future work).
- **Skip** → SKIPPED. Move on, don't argue.
- **Other (free text)**: interpret the user's intent. Common intents: "fix differently" (especially in dual-fix context) → Ask the user for the preferred approach, perform the edit, mark FIXED; "accept risk" → mark ACCEPTED with the user's justification; "dismiss"/"disagree" → mark DISMISSED.

After each decision, if working from a saved file, update its `Decision:` field.

### Summary

```
═══════════════════════════════════════════════════════════
  TRIAGE COMPLETE
═══════════════════════════════════════════════════════════

  Fixed:     F1, F2 (Fix A)   (2)
  Rule:      F3 (+ fixed)     (1)
  Skipped:   F4               (1)
  Accepted:  F5               (1)

═══════════════════════════════════════════════════════════
```

If there's a saved report, update it with final decisions. Mark the review task completed.

## Notes

- This is a **review** skill. Default to analyzing and reporting — only make edits during triage when the user explicitly chooses "Apply Fix" or "Fix differently" for a specific finding.
- Be specific. "src/auth/handler.ts:42 — SQL query built with string concatenation, vulnerable to injection" — not "there might be a security issue somewhere".
- Don't flag style preferences unless they matter. If the code works and follows the plan, minor style differences from existing code are observations, not warnings.
- If the plan itself was flawed (e.g., planned an insecure approach), flag it — this review catches plan issues too.
- Impact is about *decision effort*, not *severity*. LOW impact on a CRITICAL finding means the fix is obvious; HIGH impact on a WARNING means the tradeoff is real.
- Two fix options only when there's a genuine tradeoff. Don't invent alternatives for trivial fixes.
- When reviewing a single phase, still check if changes from that phase broke assumptions of previous phases. Phases can interact.
- During triage, keep momentum. User already read the report.
- When fixing, minimal targeted edits. Don't refactor surrounding code or "improve" things that weren't flagged.