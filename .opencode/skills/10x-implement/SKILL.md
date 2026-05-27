---
name: 10x-implement
description: Implement technical plans from context/changes/<change-id>/plan.md with verification
---

# Implement Plan

You are tasked with implementing an approved technical plan from `context/changes/<change-id>/plan.md`. These plans contain phases with specific changes and a canonical `## Progress` section at the bottom that drives execution state (see `references/progress-format.md`).

## Initial Setup

When this command is invoked:

1. **Resolve the plan**:
   - If invoked as `/10x-implement <change-id> [phase N]`, resolve to `context/changes/<change-id>/plan.md`.
   - If invoked with `@context/changes/<change-id>/plan.md` or a full path, accept it.
   - **Refuse if the resolved path starts with `context/archive/`** — print "This change is archived. Open a new change with `/10x-new` instead." and STOP.
   - If nothing was provided, respond with the message below and **STOP and wait**:

```
I'll help you implement an approved technical plan. Please provide:

1. A change-id (e.g., `/10x-implement oauth-login phase 1`), or
2. A full path (e.g., `@context/changes/oauth-login/plan.md`).

You can list active changes with: `ls context/changes/`

Tip: Make sure the plan has been reviewed and approved before implementation.
```

## Getting Started

When given a plan path:

- Read the plan completely. The `## Progress` section at the bottom is authoritative for execution state — checkmarks (`- [x]`) live ONLY there. Phase blocks contain plain `- ` bullets (no checkboxes).
- Read `context/foundation/lessons.md` if present and internalize each entry before starting any phase — these are the team's accepted recurring rules and must shape every implementation choice you make in this run.
- Read all files mentioned in the plan (referenced research, frame, source files in the same change folder)
- **Read files fully** - never use limit/offset parameters, you need complete context
- Think deeply about how the pieces fit together
- **Update `change.md`**: on entry, set `status: implementing` (only if currently in `{planned, plan_reviewed}`) and `updated: <today>`.
- Count total phases (from `## Phase N:` headers) and create one TaskCreate entry per phase (these appear in the user's status bar):
  - For each phase, create a task with `subject: "Phase N: [Phase Name]"` and `activeForm: "Implementing Phase N"`
  - Set the current phase to `in_progress` via TaskUpdate before starting work
  - Mark each phase `completed` via TaskUpdate when its success criteria pass
- **Find the next pending step** by scanning the `## Progress` section: the first `- [ ]` line in document order is where you start. If a `phase N` argument was passed, jump to the first `- [ ]` inside `### Phase N:` instead.
- Start implementing if you understand what needs to be done

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:

- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:

- STOP and think deeply about why the plan can't be followed
- Present the issue clearly as text:

  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]
  ```

- Then ask the user for a structured decision:

  Ask the user: "How should I handle this mismatch?" with options:
  - "Adapt and continue" (description: "Adjust the implementation to match reality. I'll explain the adaptation.")
  - "Skip this part" (description: "Move on to the next section/phase. This change isn't needed.")
  - "Stop and re-plan" (description: "This mismatch is too significant. We need to update the plan first.")

## Tracking files touched during a phase

The phase-end commit ritual (see "Verification Approach" below) stages files from a **touched-file set** that you maintain in working memory throughout each phase. This set is the canonical input to `git add` — never fall back to `git status` heuristics for staging decisions.

**Discipline**:

- Every time you modify or create a file during the current phase, add its repo-relative path to the touched-file set.
- The set always contains `context/changes/<change-id>/plan.md` because each phase produces at least one modification to its `## Progress` section. Add it on entry to a phase even before any checkboxes flip.
- **Phase 1 bootstrap**: on the first phase of a change, also seed the touched-file set with all untracked or modified files inside `context/changes/<change-id>/` — typically `change.md`, `research.md`, `plan.md`, and any other context files created during planning. These files are part of the change and should land in the first commit rather than being left as untracked stragglers.
- The set **resets at each phase boundary**. After the phase-end commit completes, clear it before starting the next phase.
- This list overrides any heuristic from `git status`. If the touched set is `{a.md, b.md, plan.md}` but `git status --porcelain` also reports `c.md` dirty, `c.md` is unrelated — handle it via the dirty-path prompt in the ritual, never silently bundle it into the commit.

## Tracking issue/task references for commits

Before proposing any phase-end or epilogue commit message, scan the conversation context for tracking-system issue or task references tied to this implementation work, including Jira keys (for example `ABC-123`), Linear issue IDs (for example `ENG-123`), GitHub issue/PR references (for example `#123`, `GH-123`, or full GitHub issue/PR URLs), or explicit task links from Jira, Linear, or GitHub.

- If one or more references are present, include them in the commit message body under a `Refs:` line, preserving the exact identifiers/URLs the user provided where possible.
- If multiple references apply, list them comma-separated on one `Refs:` line.
- Do not invent or infer tracking references from the change-id, branch name, or filenames. Only use references visible in the current conversation context or explicitly provided by the user.
- Apply the same `Refs:` line to every phase-end commit and to the epilogue commit, unless the user narrows a reference to a specific phase.

## Verification Approach

After implementing a phase:

- Run the success criteria checks (usually `make check test` covers everything)
- Fix any issues before proceeding
- Update your progress in your todos and in the plan's `## Progress` section
- **Mutate ONLY the `## Progress` section.** Phase blocks (Overview, Changes Required, Success Criteria) are read-only. Use file editing to flip `- [ ] N.M <title>` → `- [x] N.M <title>` in Progress as each step completes. Do NOT edit Phase block bullets, do NOT add HTML comment progress markers at the bottom of the plan, and do NOT write any state-file sidecar.
- **Run the phase-end commit ritual**: After all automated checks pass for the phase, walk through this sequenced ritual to author one Conventional-Commits commit and write the closing short SHA back into every Progress row flipped during the phase.

  1. **Manual confirmation gate.** Inform the human that automated verification passed and list the manual verification items from the plan. Pause here. Do not proceed until the human confirms manual testing succeeded. Use this format:

     ```
     Phase [N] Complete - Ready for Manual Verification

     Automated verification passed:
     - [List automated checks that passed]

     Please perform the manual verification steps listed in the plan:
     - [List manual verification items from the plan]

     Let me know when manual testing is complete so I can proceed to the commit step.
     ```

     **Cross-phase manual rollup (final phase only).** Before printing the gate message, determine whether the current phase is the final phase: scan the `## Progress` section for `### Phase M:` headings and treat the current phase as final iff no heading with `M > N` exists in document order. If the current phase is **not** final, the gate message is exactly the format above — no rollup. If the current phase **is** final, after the "Please perform the manual verification steps listed in the plan:" block, scan the entire Progress section for `- [ ]` rows that sit under a `#### Manual` subsection in any phase **other than the current one**. If any such rows exist, append the following block to the gate message (in document order, one row per line, formatted as `<phase>.<index> <title>` — strip any `- [ ]` prefix and any trailing ` — <sha>` suffix):

     ```
     Pending manual checks from earlier phases:
     - [phase.index title]
     ```

     If no earlier-phase manual rows are pending, omit the rollup block entirely. The gate still pauses for human confirmation; this is informational, not a hard block. Mid-stream phases (any phase that is not the final one) keep the original gate format with no rollup.

  2. **Compute the staging set.** Take the touched-file set maintained during the phase (see "Tracking files touched during a phase" above) and union it with `{context/changes/<change-id>/plan.md}`. The plan file is always staged because each phase produces at least one modification to its `## Progress` section.

  3. **Detect unrelated dirty paths.** Run `git status --porcelain` and intersect with paths *outside* the staging set. If the dirty-but-untouched set is non-empty, present the offending paths and ask the user:

     Ask the user: "<N> unrelated path(s) are dirty. How should I handle them?" with options:
     - "Continue — stage only the planned set (Recommended)" (description: "Commit only files this phase touched. Leave the unrelated paths dirty for you to handle separately.")
     - "Stage all" (description: "Add the unrelated paths to this commit. You take responsibility for the broader scope.")
     - "Abort" (description: "Stop the phase commit. Resolve the dirty paths first, then re-run the ritual.")

     If the dirty-but-untouched set is empty, skip this step.

  4. **Stage explicitly by path.** Run `git add` for each file in the chosen set by name. Do NOT use `git add -A` or `git add .` — explicit paths only.

  5. **Check empty diff.** Run `git diff --cached --quiet`. Exit code 0 means no staged diff. If empty, print:

     ```
     Phase [N] had no diff to commit; rows remain SHA-less; archive warn-only will surface them.
     ```

     Set `SHA=""` and skip to step 8.

  6. **Propose a Conventional-Commits message.** Build a subject line in the form `<type>(<change-id>): <phase title> (p<N>)`, where `<type>` is one of `feat / fix / chore / refactor / docs` chosen from the phase's nature (e.g., `feat` for new user-visible behavior, `chore` for prompt/doc edits, `refactor` for restructuring without behavior change). The phase title is the meaningful part and leads; the `(p<N>)` suffix carries the phase index. Build a short body listing the touched files, plus the `Refs:` line from "Tracking issue/task references for commits" when applicable. Ask the user:

     Ask the user: "Approve commit message?" with options:
     - "Approve as proposed (Recommended)" (description: "Use the message as drafted.")
     - "Edit subject line" (description: "Override the subject; keep the body.")
     - "Override entirely" (description: "Replace both subject and body.")

  7. **Commit via heredoc.** Run `git commit` per the global commit-message protocol:

     ```bash
     git commit -m "$(cat <<'EOF'
     <type>(<change-id>): <phase title> (p<N>)

     <short body listing touched files>
     <Refs: issue/task references, if applicable>

     Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
     EOF
     )"
     ```

     Never pass `--no-verify`, `--amend`, or signing-bypass flags. If a pre-commit hook fails, fix the underlying issue and create a NEW commit — the original commit did NOT happen, so amending would touch the previous phase's commit instead.

  8. **Capture the short SHA.** Run `git rev-parse --short HEAD` and store as `SHA`. Skip this step if `SHA=""` was set by step 5.

  9. **Write the SHA back into Progress.** For every Progress row flipped during this phase, run a targeted file edit:

     - Find: `- [x] N.M <title>` (no existing ` — <sha>` suffix at end of line)
     - Replace with: `- [x] N.M <title> — <SHA>`

     Skip rows that already carry a SHA suffix (resume safety: if the ritual is re-entered after a partial run, do not double-append). If `SHA=""`, skip the append entirely — the rows stay SHA-less and `/10x-archive` will surface them as informational warnings under its missing-SHA soft-warning check.

  10. **Update `change.md`.** Set `updated: <today>`; keep `status: implementing` (idempotent until the final phase). On the final phase, set `status: implemented` after the SHA write-back lands (see "After all phases" below).

  11. **Reset the touched-file set.** Clear it before starting the next phase. The ritual is self-contained per phase.

- **Next phase decision**: If there is a next phase, help the user decide whether to continue or start fresh.

  Ask the user: "Phase [N] complete. How to proceed?" with options:
  - "Continue to Phase [N+1]" (description: "Stay in this context and proceed to the next phase.")
  - "Clear context first" (description: "Copy resume command to clipboard. Start fresh for Phase [N+1].")
  - "Review this phase first" (description: "Run /10x-impl-review to verify implementation against the plan before proceeding.")

  **If user chooses to review**: Run `/10x-impl-review @[path-to-plan] phase [N]` to review the just-completed phase. After the review completes, re-present the continue/clear decision (without the review option this time).

  **If user chooses to continue**: Proceed directly to the next phase — read the plan section for the next phase, set the task to `in_progress`, and implement. No need to re-read the entire plan or already-loaded files.

  **If user chooses to clear**: Copy the resume command to clipboard and display it:
  1. Copy:
     ```bash
     echo -n "/10x-implement <change-id> phase [next-phase-number]" | pbcopy 2>/dev/null || echo -n "/10x-implement <change-id> phase [next-phase-number]" | clip.exe 2>/dev/null || echo -n "/10x-implement <change-id> phase [next-phase-number]" | xclip -selection clipboard 2>/dev/null || true
     ```

     ```powershell
     # PowerShell (Windows)
     Set-Clipboard "/10x-implement <change-id> phase [next-phase-number]"
     ```
  2. Display:
     ```
     → /10x-implement <change-id> phase [next-phase-number] (✓ copied)
     ```

If instructed to execute multiple phases consecutively, skip the AskUserQuestion between phases.

do not check off items in the manual testing steps until confirmed by the user.

## State Tracking

**The `## Progress` section in `plan.md` is the single source of truth.** No state file. No comment markers. See `references/progress-format.md` for the format contract.

### After each step

Use file editing to flip exactly one Progress line at a time:

- Find: `- [ ] N.M <title>`
- Replace with: `- [x] N.M <title>`

Do not append the SHA suffix on a per-step edit — the SHA is written back at phase end by the commit ritual (see "Verification Approach" above), and only the closing commit's SHA goes onto every row that flipped during the phase. Mid-phase, completed rows sit `[x]` without a SHA suffix; this is a valid intermediate state.

### After each phase

When all `- [ ]` items inside `### Phase N:` are now `- [x]`:

1. Run the phase-end commit ritual (see "Verification Approach" above): manual confirmation → staging → dirty-path prompt → commit → SHA write-back.
2. `change.md.updated` is bumped as part of step 10 of the ritual.

Empty-diff phases (manual-verification-only or no-op adapted phases) commit nothing and leave their rows SHA-less; `/10x-archive` will surface them as informational warnings under its missing-SHA soft-warning check. This is intentional — not every phase produces code.

### After all phases

When every `- [ ]` in the entire `## Progress` section is now `- [x]`:

1. **Defensive pending-items surface.** Re-scan the entire `## Progress` section one last time for any `- [ ]` rows. Under normal flow this is a no-op — the trigger condition for "After all phases" is already "every `- [ ]` is `- [x]`", so the surface should find nothing. It exists to make any unexpected stragglers explicit rather than silently lost (e.g., if a partial run, a manual edit, or a resume path bypassed the trigger). If the count is non-zero, list each row as `<phase>.<index> <title>` grouped by Automated vs Manual subsection in document order, then ask the user:

   Ask the user: "<N> Progress item(s) still pending. How to proceed?" with options:
   - "Pause (Recommended)" (description: "STOP without flipping change.md.status. Address the stragglers manually, then re-enter the epilogue path.")
   - "Proceed to epilogue" (description: "Flip status: implemented and run the epilogue commit anyway. Stragglers will surface as warnings under /10x-archive.")

   On "Pause": STOP immediately. Do NOT update `change.md`, do NOT run the epilogue commit. On "Proceed to epilogue": continue with steps 2–4 below. If the count is zero, skip this step and continue.

2. Update `change.md`: set `status: implemented`, `updated: <today>`. (Do NOT set `archived_at` — that belongs to `/10x-archive`.)
3. Do NOT write any HTML comment progress marker at the bottom of the plan.
4. **Run the epilogue commit.** The final phase's commit cannot contain its own SHA (chicken-and-egg), so the SHA write-back into the final phase's Progress rows plus the `change.md` status flip both sit dirty in the working tree after the final phase ritual returns. Author one closing commit to land them — otherwise `/10x-archive`'s hard-refusal gate (uncommitted paths inside the change folder) will block. Steps:
   1. Stage exactly `context/changes/<change-id>/plan.md` and `context/changes/<change-id>/change.md` (explicit paths, no `git add -A`).
   2. Run `git diff --cached --quiet`; if exit code 0, skip the epilogue (nothing trailing to commit) and stop here.
   3. Propose subject `chore(<change-id>): close out plan (epilogue)` with a short body noting the plan's final SHA write-back + change.md → implemented, plus the `Refs:` line from "Tracking issue/task references for commits" when applicable. Ask the user to approve as proposed / edit subject / override entirely (same options as the phase ritual).
   4. Commit via heredoc per the global protocol (`Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer; never `--no-verify` / `--amend`).
   5. Do NOT write the epilogue's own SHA back into the plan — its only job is to land the trailing edits cleanly.

### "Where am I?" — derived, not stored

Parse the `## Progress` section. The first `- [ ]` line is the next step. The current phase is the `### Phase N:` heading immediately above it. Completion is `count([x]) / count([ ] + [x])`. No JSON, no markers, no sidecar — just the Progress section.

## Plan Completion

When ALL phases are implemented and verified (every Progress checkbox is `[x]`):

1. Confirm `change.md.status` is now `implemented`.
2. Present completion summary, then offer a final review:

```
All phases implemented! 🎉

Summary:
- Phases completed: [N]
- Files changed: [list key files]
```

Ask the user:
"Plan complete. Would you like a final implementation review?" with options:
  - "Run full review (/10x-impl-review)" (description: "Comprehensive review of all phases against the plan. Catches cross-phase issues.")
  - "Skip review — I'm satisfied" (description: "No review needed. Mark the plan as done.")

If user chooses review → run `/10x-impl-review <change-id>` (no phase number = full plan review).

## If You Get Stuck

When something isn't working as expected:

- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-tasks sparingly — mainly for targeted debugging or exploring unfamiliar territory:

- **Explore** (`subagent_type: "Explore"`) — Fast search for files, patterns, similar code
- **general-purpose** (`subagent_type: "general-purpose"`) — Deep analysis requiring multi-step reasoning

## Resuming Work

If the plan's `## Progress` section has existing `[x]` marks:

- Trust that completed work is done
- Pick up from the first `- [ ]` line
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.