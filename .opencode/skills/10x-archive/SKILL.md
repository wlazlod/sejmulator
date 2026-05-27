---
name: 10x-archive
description: Archive a completed change by moving its folder into context/archive/ and stamping change.md with archived status
---

# /10x-archive — Close a Change

Move a completed change folder from `context/changes/<change-id>/` to `context/archive/<created-date>-<change-id>/`, stamp `change.md` with `status: archived` + `archived_at`, use `git mv` so file history follows, and — if `context/foundation/roadmap.md` carries a roadmap item whose `Change ID` equals `<change-id>` — close that item too: flip its `Status` to `done` and append an entry to the roadmap's `## Done` section.

The gate is **lenient warn-only** — `/10x-archive` only hard-blocks on uncommitted changes inside the change folder. Everything else (incomplete Progress, missing impl-review, status not in `{implemented, impl_reviewed}`) is surfaced as a warning followed by a confirmation prompt; the user can still archive.

After archiving, every other 10x skill refuses to write inside `context/archive/<...>/` (each guarded skill checks the resolved path prefix and aborts with a fixed message). Archived folders are read-only by convention.

## Initial Response

When this command is invoked:

1. **Check if any argument was provided**:
   - If an argument was provided, parse it (see "Argument Parsing" below) and proceed to "Resolution".
   - If NO argument was provided, respond with the following message and **STOP**:

```
I'll archive a completed change. Please provide a change-id (kebab-case slug) or path:

Examples:
  /10x-archive context-dir-restructure
  /10x-archive @context/changes/oauth-login/

You can list active changes with: `ls context/changes/`
```

   Then **wait** for the user to provide an argument.

## Argument Parsing

Take the first whitespace-delimited token. Normalize:

1. Strip a leading `@` if present.
2. Strip a trailing `/` if present.
3. If the result contains `/`, take the last non-empty path segment.

The result is `<change-id>`.

## Resolution

1. Resolve `<change-id>` to `context/changes/<change-id>/`. If that path does not exist:
   - Check `context/archive/` for a directory whose name ends with `-<change-id>` — if found, print: `error: change "<change-id>" is already archived at <path>.` and STOP.
   - Otherwise print: `error: no change folder at context/changes/<change-id>/. Run `ls context/changes/` to list active changes.` and STOP.
2. Read `context/changes/<change-id>/change.md` frontmatter (`status`, `created`).
   - If `status: archived`, print: `error: change "<change-id>" is already archived in change.md but its folder is still under context/changes/. Inspect manually before re-running.` and STOP.
   - If `created` is missing or not `YYYY-MM-DD`, print: `error: change.md.created is missing or malformed; cannot derive archive folder name.` and STOP.

## Hard refusal: uncommitted changes

Two pre-flight checks. Either failing blocks the archive.

**1. Uncommitted edits inside the change folder.** Run a bash command to check `git status --porcelain "context/changes/<change-id>/"`.

If the output is non-empty, **block** and print:

```
✗ Cannot archive: context/changes/<change-id>/ has uncommitted changes.

  <one line per offending path from git status --porcelain>

Commit or stash them first, then re-run /10x-archive.
```

**2. Pre-existing staged changes anywhere.** The archive commit step (see "Move and stamp" below) bundles whatever is staged at commit time. If the user has unrelated staged changes from earlier work, they'd silently land in the `chore(archive): close ...` commit. Run a bash command to check `git diff --cached --quiet`.

If the exit code is non-zero, **block** and print:

```
✗ Cannot archive: pre-existing staged changes would be bundled into the archive commit.

  <output of `git diff --cached --name-only`>

Either commit them first or `git reset` to unstage, then re-run /10x-archive.
```

Either failure → STOP. Do not proceed to the warn prompt; these are hard blocks.

If `git` is not available or the repo is not a git repo, print: `warning: not a git repository — skipping uncommitted-changes block.` and continue. (Archive still works without git; we just lose history-preservation via `git mv` and skip the archive commit step.)

## Soft warnings (non-blocking)

Collect the following warnings, then present them all at once with a single confirmation prompt.

1. **Status check**: read `change.md.status`. If it is NOT in `{implemented, impl_reviewed}`, queue: `Status is "<status>"; expected "implemented" or "impl_reviewed".`
2. **Pending Progress check**: parse the `## Progress` section of `context/changes/<change-id>/plan.md` (if `plan.md` exists). For each `### Phase N:` block, identify its `#### Automated` and `#### Manual` subsections and count `- [ ]` rows under each separately. Let `<X>` = total automated pending across all phases, `<Y>` = total manual pending across all phases, `<N>` = `<X> + <Y>`.

   - **If the plan uses Auto/Manual subsections** (any `### Phase N:` block contains a `#### Automated` or `#### Manual` heading) and `<N> > 0`, queue: `<N> Progress items still pending (<X> automated, <Y> manual): <comma-separated list of "N.M <title>" tokens, truncated to 5 with "…" if longer>.` Order the combined token list by automated items first (in document order), then manual items (in document order); the truncation cap of 5 applies to the combined list.
   - **Legacy fallback**: if no `### Phase N:` block in Progress contains either `#### Automated` or `#### Manual` heading, fall back to the original behavior — count `- [ ]` lines under `### Phase` sub-headers; if any remain, queue: `<N> Progress items still pending: <comma-separated list of "N.M <title>" tokens, truncated to 5 with "…" if longer>.` (no parenthetical breakdown). This preserves zero behavior change for plans authored before workflow-v2.
   - If `plan.md` is missing, queue: `No plan.md found in change folder.` and skip the Progress count.
3. **Missing impl-review check**: glob `context/changes/<change-id>/reviews/impl-review*.md`. If none match, queue: `No impl-review found at reviews/impl-review*.md.`
4. **Missing-SHA check**: parse the `## Progress` section of `plan.md` (if it exists). Count `- [x]` rows whose line does NOT end with ` — <sha>` where `<sha>` is 7+ hexadecimal characters (i.e., the regex ` — [0-9a-f]{7,}$` does not match). If the count is non-zero, queue: `<N> Progress rows missing SHA suffix: <comma-separated "N.M <title>" tokens, truncated to 5 with "…" if longer>.` SHA-less rows are legitimate for empty-diff phases and for plans that completed before the SHA contract shipped — this is a soft signal, not a defect. Skip silently if `plan.md` is missing (the Pending Progress check already covered that case).

If at least one warning was queued, print:

```
⚠ /10x-archive warnings for <change-id>:

  - <warning 1>
  - <warning 2>
  - <warning 3>
```

Then ask the user:
- question: `Archive "<change-id>" anyway?`
  header: `Archive`
  options:
  - label: `Continue archiving`
    description: `Move the folder to context/archive/ despite the warnings.`
  - label: `Resume implementation`
    description: `Don't archive. Suggest /10x-implement <change-id> next.`
  - label: `Cancel`
    description: `Don't archive. Exit cleanly without further action.`
  multiSelect: false

If the Pending Progress check above queued a warning whose breakdown was exactly `0 automated, <Y> manual` with `<Y> ≥ 1`, append ` (Recommended)` to the `Continue archiving` label so the prompt visibly nudges toward archive — manual checks are often deferred-by-design, and archiving is the expected path. In all other cases (mixed pending, automated-only, legacy-fallback warning, or no Progress warning), present the labels verbatim.

- **Continue archiving** → proceed to "Move and stamp" below.
- **Resume implementation** → print `→ /10x-implement <change-id>` and copy that to clipboard via `pbcopy 2>/dev/null || clip.exe 2>/dev/null || xclip -selection clipboard 2>/dev/null || true` (or `Set-Clipboard` on PowerShell) (best effort, cross-platform). STOP.
- **Cancel** → print `Cancelled. Folder unchanged.` and STOP.

If no warnings were queued, skip the prompt and proceed directly.

## Move and stamp

1. **Compute archive destination**:
   - `CREATED=$(awk '/^created:/ {print $2; exit}' context/changes/<change-id>/change.md)` (date prefix, e.g., `2026-04-29`).
   - `DEST="context/archive/${CREATED}-<change-id>"`.
   - If `$DEST` already exists, print: `error: archive destination "<DEST>" already exists. Inspect manually.` and STOP.

2. **Stamp `change.md`** (in place, before the move):
   - Set `status: archived`.
   - Set `archived_at: <ISO-8601 datetime, today, UTC>` — produced by `date -u +"%Y-%m-%dT%H:%M:%SZ"`.
   - Set `updated: <today as YYYY-MM-DD>`.
   - Use a file editing operation to update each of the three frontmatter lines. Do NOT touch any other field; in particular, leave `created` and `change_id` alone.

3. **Move the folder**:
   - Prefer running a bash command `git mv "context/changes/<change-id>" "$DEST"` so history follows.
   - If `git mv` fails (not a git repo, or git refuses for some reason), fall back to running bash commands `mkdir -p context/archive` then `mv "context/changes/<change-id>" "$DEST"`. Print a warning if the fallback was used.
   - Confirm post-move: `[ -d "$DEST" ] && [ ! -d "context/changes/<change-id>" ]`. If either check fails, print a diagnostic and STOP.

4. **Stage the stamp into the rename.** The edit in step 2 modified `change.md` in the working tree, but `git mv` only stages the rename with the file's HEAD content. Run a bash command `git add "$DEST/change.md"` so the frontmatter stamp lands in the same commit as the rename.

5. **Close the matching roadmap item** — best effort; this step never blocks, never rolls back, and never prompts. A roadmap is optional; most changes won't trace to one.

   1. Check if `context/foundation/roadmap.md` exists. If absent, skip this step silently.
   2. Capture whether the file is already dirty by running a bash command `git status --porcelain context/foundation/roadmap.md 2>/dev/null`. (Used in sub-step 7 to decide whether to stage it into the archive commit.)
   3. Read `context/foundation/roadmap.md`. Look for `<change-id>` used as a `Change ID`:
      - in the `## At a glance` table — the row whose **Change ID** column cell equals `<change-id>` exactly;
      - and in the `## Foundations` / `## Slices` bodies — the `### <ID>: …` block that contains a `- **Change ID:** <change-id>` line.

      `<ID>` is that item's roadmap-local id (`F-NN` or `S-NN`); `<Outcome>` is the text of its `- **Outcome:**` line (keep a leading `(foundation) ` if present).
   4. **No match** → print `ℹ context/foundation/roadmap.md has no item with Change ID "<change-id>" — roadmap left untouched.` and skip the rest of this step. Match is exact-string only; a roadmap slice can spawn several changes, so a near-miss is intentionally *not* closed.
   5. **Match found** → apply the three edits below using file editing operations. Each is independent and best effort: if a target isn't where the `/10x-roadmap` template puts it (hand-edited roadmap, older format), skip that sub-edit, keep going, and note what was skipped — never abort the archive over roadmap shape. Touch only the fields named here; leave `Outcome`, `Prerequisites`, `Parallel with`, `Risk`, etc. alone.
      1. **`## At a glance`** — in the matched table row, set the **Status** column cell to `done`.
      2. **Item body** — in the `### <ID>: …` block, rewrite the `- **Status:**` line to `- **Status:** done`.
      3. **`## Done` section** — append one bullet under the `## Done` heading, in that section's documented format:

         ```
         - **<ID>: <Outcome>** — Archived <today> → `context/archive/<CREATED>-<change-id>/`. Lesson: —.
         ```

         `<today>` is `date -u +%F` (`YYYY-MM-DD`); `<CREATED>` is the value computed in step 1 of "Compute archive destination". If the roadmap has no `## Done` heading, append the heading and this bullet at the end of the file.
   6. Bump the roadmap frontmatter: set `updated: <today as YYYY-MM-DD>`. Leave every other key (`created`, `version`, `status`, `prd_version`, `main_goal`, `top_blocker`, …) untouched. If the file has no YAML frontmatter, skip this sub-step.
   7. **Stage it into the archive commit** — only if `git` is available **and** `ROADMAP_PREDIRTY` (sub-step 2) was empty. Then run a bash command `git add context/foundation/roadmap.md` so the roadmap close lands in the same commit as the rename + stamp. If `ROADMAP_PREDIRTY` was non-empty, the file already had uncommitted edits; leave the roadmap close in the working tree and print `⚠ context/foundation/roadmap.md had pre-existing uncommitted changes — closed roadmap item <ID> in the working tree but did NOT stage it. Commit it yourself.` If `git` is unavailable, the edit just stays in the working tree (the pre-flight already warned).
   8. Remember `<ID>` and `<Outcome>` for the confirmation output.

6. **Commit the archive.** Author one commit by running a bash command:

   ```bash
   git commit -m "$(cat <<'EOF'
   chore(archive): close <change-id>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```

   No body — the subject is mechanical and the diff (rename + frontmatter stamp, plus the roadmap close when one matched) is self-explanatory. Never pass `--no-verify` or signing-bypass flags. If a pre-commit hook fails, fix the underlying issue and create a NEW commit.

   Skip this step entirely if `git` is unavailable or the repo is not a git repo (the pre-flight already warned).

7. **Print confirmation**:

```
✓ Archived <change-id>
  context/changes/<change-id>/  →  <DEST>/

change.md updated:
  status:       archived
  archived_at:  <ISO datetime>
  updated:      <today>

roadmap.md:     closed <ID> "<Outcome>"  →  Status: done, entry added to ## Done    ← print only when a roadmap item matched; omit this line otherwise

Committed as: <short SHA> chore(archive): close <change-id>

The folder is now read-only by convention. To start a new change: /10x-new <new-id>
```

## Error handling

- Any unexpected filesystem error during the move leaves the source folder in place — the staged `change.md` edits land before the move, so on partial failure the user sees `status: archived` in `context/changes/<change-id>/change.md` but the folder is still in `context/changes/`. `/10x-status` will surface this as a `status drift: archived in wrong folder` warning. Re-running `/10x-archive` is safe: the resolution check at the top will detect `status: archived` and ask the user to inspect manually.
- Do NOT attempt rollback — the change.md edits are intent-marking, and partial state is recoverable by hand.
- The roadmap-close step ("Move and stamp" step 5) is isolated: any failure there is caught, noted in the confirmation output, and skipped. It never aborts the archive and never triggers rollback. A half-applied roadmap edit is recoverable by hand.

## What this skill does NOT do

- Does not append SHAs to Progress items — `/10x-implement` is the sole writer of the SHA suffix at phase end. The archive gate enforces SHA presence as a warn-only signal (see soft-warning check 4); it never rewrites a SHA-less row.
- Does not run `pnpm test` / `pnpm build` / `pnpm ci:local` as a gate — the gate is lenient warn-only by design.
- Does not push. The archive commit lands locally; `git push` is the user's call.
- Does not rewrite the roadmap beyond closing the one matched item. When `context/foundation/roadmap.md` has an item whose `Change ID` equals the archived `<change-id>`, this skill flips only that item's `Status` (table cell + `### <ID>:` body line), appends one `## Done` bullet, and bumps the `updated:` date. It never reorders slices, recomputes the dependency graph, edits other items, or creates a roadmap that doesn't exist. No match (or no roadmap file) → roadmap untouched.
- Does not write to `context/archive/<...>/` after the move; archived folders are read-only by convention. Other 10x skills (`/10x-research`, `/10x-frame`, `/10x-plan`, `/10x-plan-review`, `/10x-implement`, `/10x-impl-review`, `/10x-tdd`, `/10x-auto-implement`) refuse when a resolved path starts with `context/archive/`.
- Does not unarchive. To revisit an archived change, open a new change with `/10x-new` and reference the archived folder for context.