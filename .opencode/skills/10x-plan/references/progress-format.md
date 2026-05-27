# `## Progress` Section Reference

The `## Progress` section in `plan.md` is the **single source of truth** for execution state of a change. This document defines its shape so every skill that reads or writes it (`/10x-plan`, `/10x-implement`, `/10x-status`, `/10x-impl-review`, the migration script) treats it as a mechanical contract.

## Where it lives

At the bottom of `context/changes/<change-id>/plan.md`, after `## References`. Exactly one `## Progress` heading per plan.

## Structure

```markdown
## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: <phase name>

#### Automated

- [ ] 1.1 <step title>
- [x] 1.2 <step title> — abc1234

#### Manual

- [ ] 1.3 <step title>

### Phase 2: <phase name>

#### Automated

- [ ] 2.1 <step title>
```

## Rules

- **One `## Progress` heading**, at the bottom of the file (after `## References`).
- **One `### Phase N: <name>`** per phase, in order, matching the `## Phase N:` headers earlier in the plan.
- **Per-phase Automated/Manual subdivision**:
  - `#### Automated` lists steps verifiable without human action (commands, tests, type checks).
  - `#### Manual` lists steps that require a human to look at the result (UI, smoke tests, eyeball checks).
  - A phase may have only `#### Automated`, only `#### Manual`, or both. Omit empty subsections.
- **Step format**: `- [ ] <phase>.<index> <title>` (pending) or `- [x] <phase>.<index> <title> — <sha>` (done).
- **Step indices** are 1-based and unique within their phase. They are assigned at planning time and **never renumbered**. New steps added later get the next available index; deleted steps leave gaps (acceptable).
- **Step titles are immutable** once the plan is reviewed. If a step's intent changes, leave the title and add a brief inline note in the relevant Phase block above — do not rewrite the Progress entry.
- **Commit SHA suffix** is appended to a step when the work lands (` — <sha>`). The SHA is the short form (7+ chars) of the commit that closed the step. Multiple commits per step → list the closing commit only.

## Mutation surface

- `/10x-implement` is the only skill that flips `[ ]` → `[x]` and appends the SHA suffix. Checkbox flips happen **per step**, as each step completes; the SHA suffix is appended **at phase end**, in one shot, after the closing commit lands. Mid-phase, completed rows sit `[x]` without a SHA suffix — this is a valid intermediate state, not drift.
- All other skills (`/10x-status`, `/10x-impl-review`, `/10x-impl-review-ci`) **read** Progress and **never write to it**.
- `/10x-plan` writes the Progress section once at planning time, with all steps as `[ ]` and no SHA suffixes.
- The `/10x-archive` skill does not modify Progress; archived plans retain their final Progress state as historical record.

## Parsing contract for tooling

Skills that need to derive state from Progress:

- **Next pending step** = first `- [ ]` line in document order.
- **Completion** = `count([x]) / count([ ] + [x])`.
- **Current phase** = phase containing the first `- [ ]`, or last phase if all done.
- **Drift detection** (e.g. `/10x-status` consistency check):
  - If `change.md.status = implementing` but Progress has 0 `[x]` → warn (no progress recorded).
  - If `change.md.status = implementing` but all items are `[x]` → warn (status should be `implemented`).
  - If `change.md.status = planned` but Progress has any `[x]` → warn (status should be `implementing`).

## What is NOT in Progress

- **No state file sidecar**: Progress is the single source of execution state — no JSON cache anywhere.
- **No `<!-- PLAN STATUS -->` / `<!-- PLAN COMPLETED -->` markers**: removed. Status lives in `change.md` frontmatter, completion is derived from Progress.
- **No nested checkboxes**: a step is one bullet. Sub-tasks belong in the Phase block as Success Criteria, not as Progress sub-items.
- **No estimates, owners, due dates**: scope creep. Add them via PR description if needed; not here.
- **No descriptive prose between phases or subsections**: the Progress section is parsed by tooling. Keep it strictly headings + bullets.
