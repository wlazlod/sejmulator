---
name: 10x-agents-md
description: >
  Generate an AGENTS.md onboarding document for AI coding agents working in
  this repository. Inspects the repo (package manifest, README, scripts,
  lint/test config, layout, commit history) and writes a concise contributor
  guide titled "Repository Guidelines". Use when the user invokes
  /10x-agents-md, asks to "create AGENTS.md", "write an agent onboarding
  doc", "generate contributor guide for agents", or similar. The output is
  optimized to be small, precise, reference-heavy, and ordered with critical
  rules at the top — so a future agent reads it once and stays unblocked.
---

# 10x Agents MD

Produce an `AGENTS.md` that serves as an onboarding document for AI coding agents in this repository. The file is short, specific to the repo, and structured so the most important rules appear first.

## Input resolution

`$ARGUMENTS` is optional. It may be:

- empty → write to `AGENTS.md` at the repo root.
- a directory path → write `AGENTS.md` inside that directory (useful for nested per-area guides, e.g. `src/api/AGENTS.md`).
- a full file path ending in `.md` → write there verbatim.

If the target file already exists, do **not** silently overwrite. Switch to the update flow under "Procedure → Update path". The default behavior is a surgical edit that preserves still-valid content, not a rewrite.

## Scope detection — repo-level vs. directory-level

The same skill can produce two materially different documents depending on **where** it's invoked from. Detect the scope before discovery so the draft targets the right altitude.

1. **Resolve the target directory.** If `$ARGUMENTS` names a path, that's the target. Otherwise it's the current working directory (`pwd`).
2. **Compare against the repo root.** Run `git rev-parse --show-toplevel`. If the target directory equals the repo root → **repo-level scope**. If it's a subdirectory (e.g. `src/components/`, `packages/api/src/routes/`, `app/api/`) → **directory-level scope**.

**Repo-level scope.** Follow the procedure and "Output structure" below as written — the document is a high-level onboarding guide (project structure, build commands, CI gate, commit conventions, etc.).

**Directory-level scope.** Drop the repository-onboarding framing entirely. The reader already knows the repo; they need the rules of *this* directory. Reorient discovery and output:

- **Discover locally first.** Inspect the files actually living next to the target: sibling source files, the nearest `index.*`/`mod.rs`/`__init__.py`, co-located tests, the parent directory's README if any, and any nested config (e.g. `tsconfig.json`, `.eslintrc`, route manifests) that overrides repo-level defaults. Only consult repo-root docs (`README.md`, `the project's AI configuration file (AGENTS.md)`) to **resolve conflicts** or pull a single canonical `@`-reference — not as the primary source.
- **Infer the local pattern by reading siblings.** What shape do existing files in this directory take? Component file layout, naming (`PascalCase.tsx`, `kebab-case.ts`, `*.handler.ts`), default vs. named exports, prop/argument conventions, where types/styles/tests live relative to the unit, error-handling idioms, what gets imported from where. The AGENTS.md captures the convention you observed, not generic advice.
- **Reframe sections around the local unit.** Replace repo-level sections with directory-relevant ones. Useful defaults (adapt to what's there):
  - *Adding a new \<unit\>* — concrete steps for the dominant artifact in this directory (component, route handler, migration, hook, worker, etc.), citing one existing sibling as the reference shape via `@./<sibling-file>`.
  - *File layout & naming* — naming pattern, co-location rules (test next to source? styles inline? types in a sibling file?), barrel-export policy if one exists.
  - *Local conventions* — props/args shape, state/data-flow rules, allowed imports (and forbidden ones — e.g. "components in this directory must not import from `src/server/`"), accessibility or i18n rules visible in siblings.
  - *Testing this unit* — the test pattern used by neighbors, how to run just this directory's tests.
  - *Tripwires* — directory-specific "never do X" rules visible in siblings or a nearby AGENTS.md fragment.
- **Skip the repo-level sections.** No top-level project structure map, no monorepo package list, no global build/CI overview, no commit-convention recap — those belong in the root `AGENTS.md`. If the reader needs them, link once: `See @AGENTS.md at the repo root for repo-wide rules.`
- **Length budget shrinks.** Aim for **120–250 words** of body for directory-level guides; the surface area is smaller, and padding here is worse than at the root.

The Quality guards still apply, with one substitution: guard 5 ("Critical rules first") becomes "Local rules first" — the highest-leverage line is the one that prevents a wrong-shaped sibling from landing in this directory.

## Interactive prompts — host-agnostic

Whenever the procedure says *"ask the user"*, use whichever interactive-question tool the host agent exposes. The skill is host-agnostic; do not hard-code one tool name. Known equivalents (non-exhaustive):

- your AI coding assistant → Ask the user:
- Cursor → `ask_question`
- OpenAI Codex / Codex CLI → `request_user_input`
- Other harnesses → look for any tool whose description mentions asking the user a structured question with options.

**Self-discovery rule.** Before the first interactive step, scan your own available tools for one matching the patterns above (names containing `ask`, `question`, `input`, `prompt_user`, etc., with a `question` or `prompt` parameter and an `options`/`choices` field). Use the first match. If none is available, fall back to a plain conversational message asking the user to reply with one of the labelled options — do not block the procedure.

State which tool you selected (or that you fell back to plain chat) the first time you ask a question, so the user can correct you if there's a better option.

## Parallel research via subagents (optional)

If the host exposes a subagent / task-spawn tool, the discovery and diff steps parallelize cleanly — they're mostly independent reads. Known equivalents (non-exhaustive):

- your AI coding assistant → `Agent` (with `Explore`/`general-purpose` subagent types)
- Cursor → background subagents
- OpenAI Codex → task delegation tool (where available)
- Other harnesses → look for any tool that spawns an isolated agent with its own context window and returns a summary.

**Self-discovery rule.** Before kicking off discovery, check whether such a tool exists. If it does, fan out the independent reads in **one batched call** (multiple subagents in a single message, not sequentially):

- one subagent reads `README.md`, `the project's AI configuration file (AGENTS.md)`, existing `AGENTS.md`, top-level `docs/` index;
- one inspects the manifest + lint/format/type configs;
- one inspects test config + CI workflows;
- one runs the git-history queries (commit conventions, last-touch on AGENTS.md, diff range since `LAST_TOUCH`).

Each subagent should return a **short structured report** (≤200 words: facts only, with `path:line` citations) — not a full file dump. The main agent then synthesizes the AGENTS.md from those reports.

**When not to use subagents.** Skip the fan-out if:

- the repo is small (under ~20 top-level files) — overhead exceeds savings;
- the host doesn't support subagents — fall back to sequential reads in the main loop;
- you've already loaded most of the relevant files in the current context — re-reading via subagent just burns tokens.

**Do not delegate** the synthesis step (drafting and Quality-guard checks). Drafting requires holding the full picture in one context to enforce the 200–400 word budget, ordering, and `@`-reference policy.

## What this skill does NOT do

- Does not invent project facts. Every claim in the output must trace back to a file, command, or commit you actually inspected.
- Does not embed multi-line code or config snippets. Use `@`-references to canonical files instead (e.g. `@package.json`, `@tsconfig.json`, `@docs/architecture.md`).
- Does not write generic engineering advice ("write clean code", "follow best practices", "handle errors properly"). If a rule cannot be checked against a diff, drop it or rewrite it concretely.
- Does not restate framework defaults, language tutorials, or anything the AI assistant already knows from training. Only project-specific knowledge earns a line.
- Does not edit unrelated files. The skill writes one markdown file and stops.

## Procedure

**First, branch on existence.** Before discovering anything else, check whether the resolved target path already exists (use a file read operation or `ls`). If it does, follow the **Update path** below. If not, follow the **Create path**.

### Create path

1. **Discover.** Read in this order, skipping what doesn't exist:
   - `README.md`, `the project's AI configuration file (AGENTS.md)`, existing `AGENTS.md`, top-level `docs/` index.
   - Manifest: `package.json` (scripts, workspaces, engines), or `pyproject.toml` / `Cargo.toml` / `go.mod` / `Gemfile` / equivalent.
   - Lint/format/type configs: `.eslintrc*`, `oxlint*`, `biome.json`, `tsconfig.json`, `ruff.toml`, `.editorconfig`.
   - Test config: `vitest.config.*`, `jest.config.*`, `pytest.ini`, `playwright.config.*`, `*.test.*` locations.
   - CI: `.github/workflows/*` (one or two files; just enough to know the gate).
   - Layout: top two levels of the tree (`ls`/`find`-bounded), workspace package list if monorepo.
   - History: `git log --oneline -n 30` to learn commit-message conventions; `git config remote.origin.url` for PR target.
2. **Extract.** From discovery, write down for yourself:
   - The 1–3 commands an agent runs most often (build, test, lint, dev server).
   - The handful of conventions a reviewer would actually flag in PR review (naming patterns, file layout, commit prefix style).
   - Any hard "never do X" rule visible in `the project's AI configuration file (AGENTS.md)`, README, or CI validators.
   - Where deeper docs live, so the AGENTS.md can point to them instead of duplicating.
3. **Draft.** Write the file per "Output structure" below.
4. **Self-check before writing.** Run the five guards in "Quality guards". If any fail, revise the draft, do not write yet.
5. **Write.** Perform a single file write operation to the resolved path. Confirm the path and word count back to the user.

### Update path

Triggered when the target file already exists. The default is a **surgical edit**: keep what's still true, fix what's stale, fill what's missing, and remove what's been deleted from the repo. Do not rewrite from scratch unless the user asks.

1. **Inventory the existing file.**
   - Read the full file.
   - List its current sections (H1/H2/H3 headings) and the rules/commands under each.
   - Extract every `@`-reference and every relative path or filename it cites.

2. **Date the file via git.**
   - `git log --follow --format="%h %ad %s" --date=short -- <path>` — full edit history of the file.
   - Note the **last-touched commit hash** and date. Call this `LAST_TOUCH`.
   - If the file is untracked (`git ls-files --error-unmatch <path>` fails), treat it as freshly authored: skip git-diff steps and run the full Create path discovery, but still preserve any obviously project-specific content the user wrote.

3. **Diff repo state since `LAST_TOUCH`.** Use these checks (skip any whose target the file doesn't reference):
   - `git diff --stat LAST_TOUCH..HEAD -- README.md the project's AI configuration file (AGENTS.md) docs/` — has top-level documentation moved or changed?
   - `git diff LAST_TOUCH..HEAD -- package.json pyproject.toml Cargo.toml go.mod` (whichever exists) — for **scripts**, **dependencies**, **engines**, **workspaces**. Pay closest attention to the `scripts` block: renamed/added/removed scripts are the most common source of stale AGENTS.md content.
   - `git diff LAST_TOUCH..HEAD -- .eslintrc* oxlint* biome.json tsconfig.json ruff.toml .editorconfig` — has the lint/format/type toolchain changed?
   - `git diff LAST_TOUCH..HEAD -- vitest.config.* jest.config.* pytest.ini playwright.config.*` — has the test stack or layout changed?
   - `git diff --stat LAST_TOUCH..HEAD -- .github/workflows/` — has the CI gate changed?
   - `git log --oneline LAST_TOUCH..HEAD -- <commit-conventions-relevant-area>` and `git log --oneline -n 30` — does the commit-style observation in the file still match recent history?
   - For each `@`-reference and path the file mentions: perform a file system check or read operation on the path. If it no longer exists or has been renamed, that line is stale.

4. **Classify each line of the existing file** into one of four buckets:
   - **KEEP** — still accurate; cited file/command/path still exists with the same shape.
   - **UPDATE** — directionally right but a detail is stale (renamed script, moved path, changed tool, version bump). Note the exact replacement.
   - **REMOVE** — the underlying file/command/convention no longer exists, or the rule has been contradicted by a newer source (`the project's AI configuration file (AGENTS.md)`, README) that you trust more.
   - **MISSING** — not currently in the file but should be (new top-level package, new required script, new "never do X" rule landed via CI validator, new commit convention visible in `git log`).
   Keep this classification as a short table you can show the user. Cite `path:line` (in the existing AGENTS.md) for every UPDATE/REMOVE entry, and cite the source-of-truth path (e.g. `package.json:42`) for every UPDATE/MISSING entry.

5. **Confirm scope before editing.** Use the host's interactive-question tool once (see "Interactive prompts — host-agnostic" above) with these options:
   - **Apply the proposed updates** — execute the UPDATE/REMOVE/MISSING list as targeted edit operations; KEEP lines are not touched.
   - **Show me the change list first** — print the classification table to chat, no edits, then ask again.
   - **Full regenerate** — discard the existing file and run the Create path. Use only when the existing file is mostly stale or the user explicitly wants a clean slate.
   - **Cancel** — no changes.

6. **Edit surgically.** For the "Apply" choice, prefer multiple small edit operations (one per UPDATE/REMOVE/MISSING entry) over a single file write rewrite. This preserves authorial voice in KEEP sections and produces a reviewable diff. If section ordering violates the "critical rules first" guard from the Quality guards and the user approved updates, you may move whole sections — but only sections, never re-author rule wording silently.

7. **Re-run the Quality guards** on the updated file. The same five gates apply. If a guard now fails because of the update (e.g. body grew past 400 words after MISSING additions), trim KEEP content that has become low-leverage rather than dropping the new MISSING content.

8. **Report.** Confirm path, new word count, and a one-line summary of what changed in each bucket (e.g. *"3 updated, 1 removed, 2 added; section order unchanged"*).

## Output structure

The document title is `# Repository Guidelines`. Target length is **200–400 words** of body content. Use Markdown headings for structure. Adapt sections to what the repo actually has — omit any section that would be empty or speculative.

Order sections by **leverage to a fresh agent**, not by tradition. Critical rules and the most-used commands go first; nice-to-know context goes last. A useful default ordering, when in doubt:

1. **Hard rules / Agent-specific instructions** — the "never do X" list and any tripwires (only include if the repo actually has them; otherwise skip and let conventions carry the weight).
2. **Project Structure & Module Organization** — top-level directory map, where source/tests/assets live, monorepo package list if relevant. Reference deeper docs with `@path/to/doc.md` instead of inlining them.
3. **Build, Test, and Development Commands** — the 3–6 commands an agent will actually run, each with a one-line purpose. Prefer `pnpm <script>` / `make <target>` / etc. over raw tool invocations when the project wraps them.
4. **Coding Style & Naming Conventions** — indentation, language version, naming patterns (with one short example pattern, not a code block), and the lint/format tools that enforce them.
5. **Testing Guidelines** — framework, where tests live, naming pattern, how to run a single test, any coverage threshold the repo actually checks.
6. **Commit & Pull Request Guidelines** — the convention observed in `git log` (e.g. Conventional Commits prefixes seen), PR description expectations, required CI checks.
7. **Security & Configuration Tips** *(optional)* — secrets handling, env-file location, validator scripts that fail CI.
8. **Architecture Overview** *(optional, only if not already covered by a `@`-reference)* — 3–6 bullets max; otherwise link out.

Open the file with one short paragraph (1–2 sentences) naming what the project is and the primary stack — enough that an agent landing in the repo for the first time has a frame. No mission statements, team intros, or values.

## Quality guards (run before performing a file write operation)

Each guard is a hard gate. If any fails, revise the draft.

1. **Length.** Body is 200–400 words. Under 200 means you skipped specifics; over 400 means you padded or inlined what should be a reference.
2. **No multi-line snippets.** No fenced code blocks longer than a single command line. Replace example components / configs / migrations with `@path/to/file`. Short single-line command examples (`pnpm test`, `git rebase main`) are fine.
3. **Every rule is checkable.** Re-read each sentence and ask: *could a reviewer flag a diff against this?* If not, rewrite it with a concrete pattern, threshold, or named tool. Strike phrases like "clean code", "best practices", "modern patterns", "be consistent", "handle errors properly", "keep it simple".
4. **No redundant knowledge.** Strike any line you could have written without opening the repo. Framework defaults, language tutorials, and definitions of common terms do not earn a slot. If a rule duplicates `README.md` / `package.json` / lint config, replace it with `@README.md` / `@package.json` / `@.eslintrc.json`.
5. **Critical rules first.** The first third of the file must contain the highest-stakes rules and the most-used commands. If the only "never do X" rule is at the bottom, move it up. If the top is welcome/mission/values, cut it.

## Tone

Professional, instructional, terse. Second person ("Run `pnpm test` before pushing") or imperative ("Place new handlers in `src/api/<feature>/`"). No marketing voice, no emojis, no decorative dividers.

## After writing

Report to the user:

- the file path written,
- the body word count,
- a one-line summary of the section order chosen,
- a reminder: *test the file by running a real task with a fresh agent session — onboarding docs only prove themselves on the next run.*

Do not propose follow-ups unless the user asks.

## Edge cases

- **No `README.md` and no manifest detected.** Stop and tell the user the repo looks empty or unfamiliar; ask for a one-paragraph project description before drafting.
- **Monorepo with per-package READMEs.** Write a root `AGENTS.md` that lists packages and `@`-references each package's README, rather than duplicating per-package detail. Suggest nested `packages/<name>/AGENTS.md` for any package with rules that materially differ.
- **Existing rich `the project's AI configuration file (AGENTS.md)` in the repo.** Treat it as authoritative source material. The new `AGENTS.md` should be a tighter, agent-tool-agnostic distillation that points back to `@AGENTS.md` for depth, not a verbatim copy.
- **Existing `AGENTS.md` was edited by hand after its last commit.** `git diff HEAD -- <path>` will show uncommitted changes. Read those changes first and treat them as KEEP unless they directly contradict a CI-enforced rule — the user is mid-edit and you must not clobber in-flight work.
- **`LAST_TOUCH` is the initial commit of the repo.** Diff range becomes `LAST_TOUCH..HEAD` with no useful signal. Fall back to inspecting current repo state vs. the file's claims, line by line, without the git-diff shortcut.
- **File exists but is empty or a stub.** Skip the Update path — run the Create path and overwrite, since there is no authorial content to preserve.
- **Repo with no commit history (`git log` empty).** Skip the commit-conventions section rather than guessing; note in the PR section that the convention is to be defined.
- **Polyglot repo (no single manifest).** Pick the dominant stack by file count for the "Build/Test/Dev" section; mention secondary stacks only if they have their own commands an agent will need.