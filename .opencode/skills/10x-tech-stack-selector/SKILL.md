---
name: 10x-tech-stack-selector
description: >
  Pick a starter and a stack for a greenfield project after the PRD is written.
  Reads context/foundation/prd.md, opens with a Q0 path-fork (recommended
  default for the (product_type, language_family) cell vs design-your-own),
  runs the residual interview on the custom path, reasons over a language-aware
  starter registry with four agent-friendly quality gates, and writes a
  context/foundation/tech-stack.md hand-off /10x-bootstrapper consumes. Use when
  the user asks "what stack should I use", says "pick a stack", "choose
  framework", "co wybrać do projektu", or has a PRD on disk and is ready to
  scaffold. Use AFTER /10x-prd, BEFORE /10x-bootstrapper.
---

# Tech Stack Selector: From PRD to Starter

This skill is the third link in the bootstrap chain (`/10x-shape → /10x-prd → 10x-tech-stack-selector → /10x-bootstrapper`). Its single job: turn a written PRD into a recommended starter and a small machine-readable hand-off `/10x-bootstrapper` can read to scaffold a project.

The skill is a **decision facilitator over a curated registry**, not a recommendation engine from first principles. It reads PRD priors, asks at most ~6 residual questions on the custom path (or short-circuits to a vetted recommendation on the standard path), reasons over language-aware starter cards in `references/starter-registry.yaml`, and applies four hard-filter quality gates. Rich rationale stays in conversation; the file hand-off is minimal.

The starter registry in `references/starter-registry.yaml` is the **single source of truth** for available starters. `/10x-bootstrapper` reads it; a CI validator (`scripts/validate-starter-registry-sync.mjs`) prevents bootstrapper from referencing a `starter_id` that does not exist here.

## When to use, when to skip

**Use when**: `context/foundation/prd.md` exists and the user is ready to pick a stack. Trigger phrases: "what stack should I use", "pick a starter", "choose a framework", "co wybrać", "what should I build this in", "can you recommend a stack". Use also when the user asks for a comparison ("React vs Vue vs Svelte") with a PRD on disk — the skill forces the custom path and walks framework variants.

**Skip when**: `context/foundation/prd.md` is absent — the skill refuses and redirects to `/10x-shape` + `/10x-prd`. Skip also when the user is mid-implementation on an existing codebase asking about adding a library or replacing a single dependency — that is `/10x-frame` territory, not stack selection.

## Relationship to other skills

- `/10x-shape` — produces `shape-notes.md`, the precursor to PRD. Two upstream of this skill.
- `/10x-prd` — produces `context/foundation/prd.md`, the canonical input. Always upstream.
- `/10x-bootstrapper` — downstream consumer. Reads `context/foundation/tech-stack.md` frontmatter and the registry; scaffolds the project.

## Required inputs

1. A PRD file — exists, is readable, conforms to the PRD schema (`/skills/10x-shape/references/prd-schema.md`). Default location: `context/foundation/prd.md`. The user MAY pass a different path as the argument (see "Initial Response" below). The skill reads the **frontmatter** as priors (`product_type`, `target_scale`, `timeline_budget`, `project`) and may read body sections (`## Functional Requirements`, `## Non-Goals`) for the feature audit and to detect Socratic moments where the PRD's FRs surface a feature the recommended starter does not include.
2. `references/starter-registry.yaml` — bundled with the skill. Loaded at decision time.
3. `references/residual-interview.md` — bundled. Loaded at interview time.
4. `references/handoff-schema.md` — bundled. Loaded at write time.
5. `references/agent-friendly-criteria.md` — bundled. Loaded at filter time.
6. `references/decision-flow.md` — bundled. Loaded at decision time.

## Initial Response

When this skill is invoked:

1. **If a path argument was provided** (e.g. `/10x-tech-stack-selector @context/foundation/prd-v2.md` or `/10x-tech-stack-selector path/to/prd.md`), strip a leading `@` if present and use the path verbatim as the PRD location for this run.
2. **If no argument was provided**, default the PRD path to `context/foundation/prd.md`.

Carry the resolved path through Step 0; the rest of the workflow operates on it as `<prd-path>`.

## Workflow

### Step 0 — PRD precondition

Check the PRD precondition against the resolved path:

```bash
test -f "<prd-path>"
```

If the file is **absent**, do exactly this and STOP — no fallback interview, no inline mini-PRD, no reading conversation history for substitute priors:

```bash
echo -n "/10x-shape" | pbcopy 2>/dev/null || echo -n "/10x-shape" | clip.exe 2>/dev/null || echo -n "/10x-shape" | xclip -selection clipboard 2>/dev/null || true
```

```powershell
# PowerShell (Windows)
Set-Clipboard "/10x-shape"
```

Print verbatim (substitute the resolved path; if defaulted, this is `context/foundation/prd.md`):

```
Tech-stack-selector requires a PRD at `<prd-path>`. Run `/10x-shape` first, then re-invoke.
```

Then STOP. The conversation context is **not** a fallback — even if PRD content was discussed earlier in chat, the skill demands the file on disk.

If the file is **present**, read it FULLY (no `limit`/`offset`) and proceed to Step 1.

### Step 1 — Load PRD priors

Parse the PRD frontmatter. Extract:

- `project` → seeds `project_name` in the hand-off (kebab-case it for the hand-off if not already kebab-case).
- `product_type` → drives Q0 path-fork lookup.
- `target_scale.users` → priors weight (small/medium/large/enterprise).
- `timeline_budget.mvp_weeks` → priors weight (short timelines favor battle-tested + popular starters).

Read PRD body for the feature audit context: scan `## Functional Requirements` for technology-forcing features (auth, payments, realtime, AI/LLM, background jobs, file storage, i18n). Surface them as a checklist later in Q1.

Echo the priors back to the user:

```
PRD priors:
  Project:       <project>
  Product type:  <product_type>
  Scale:         <target_scale.users>
  Timeline:      <timeline_budget.mvp_weeks> weeks
                 (after-hours: <timeline_budget.after_hours_only>)

  Detected feature signals from FRs:
    - <feature> (FR-NNN)
    - ...
```

Ask the user:
- question: "Are these priors correct, or do you want to correct anything before we proceed?"
  header: "Priors"
  options:
  - label: "Correct — proceed (Recommended)"
    description: "Continue with these priors."
  - label: "Correct a value"
    description: "I'll ask which field to correct, then update an in-memory override (the PRD on disk is unchanged)."
  - label: "Stop — fix the PRD first"
    description: "Exit. Re-run /10x-prd to fix priors, then re-invoke /10x-tech-stack-selector."
  multiSelect: false

If "Correct a value": ask which field, capture an override, proceed with the override applied for this session only.

### Step 2 — Q0 path-fork + residual interview

Load `references/residual-interview.md` and follow the Q-flow described there.

The interview has two paths:

- **Standard path** (default-recommended at Q0): user accepts the vetted recommendation for their `(product_type, language_family)` cell. Q1–Q3 and Q6 are skipped. Q4 (deployment), Q5 (CI/CD), and the project-name confirmation still run; Q8 self-check is skipped (the recommended path is itself the safer choice).
- **Custom path** (user opts to design their own): full Q1–Q6 walk plus conditional Q7 (testing runner) plus Q8 self-check before hand-off.

Q0 derives `language_family` from explicit PRD content if present, otherwise asks once at Q0 (PRD frontmatter does not carry tech_preferences). The recommended-defaults map at the top of `references/starter-registry.yaml` resolves `(product_type, language_family) → starter_id`. If the cell has a vetted default, present it by name with a one-line fit and the starter's `bootstrapper_confidence` value. If the cell has no default (the map shows `<none>`), force the custom path with a single-sentence note ("No vetted recommended default exists for `<product_type, language_family>`; we'll walk the full residual interview.").

The Q0 default is **editorial, not silent**: name the recommended starter up front and ask for explicit confirmation. The user must consciously accept or branch — never accept-by-default-without-prompt.

### Step 3 — Decide

Load `references/decision-flow.md` and `references/agent-friendly-criteria.md`. Load `references/starter-registry.yaml` and read only the cards relevant to the constrained candidate set (filtered by `language_family` and `product_type` per the decision flow Step A) — not all 25 entries, to keep the prompt cost down.

Execute the decision flow:

- **Standard path** — the recommended_defaults pick is already the lead; jump to Step E (surface `bootstrapper_confidence`) and skip filter/scoring.
- **Custom path** — execute Step A (filter by language_family + product_type + must-have features + deployment compatibility), Step B (drop entries failing any `agent_friendly.*` criterion, with the per-language-family caveat), Step C (reason over surviving cards weighting team_profile + tech_preferences + timeline_budget), Step D (lead + 1–2 alternatives from `alternatives_to_consider`), Step E (surface bootstrapper_confidence).

Surface Socratic challenges where the decision flow says to: Q6 framework variant on custom path, `tech_preferences` names a starter that fails ≥1 quality gate, recommended-default starter doesn't include a feature the user named in PRD FRs, or the chosen starter has `bootstrapper_confidence: best-effort` AND the user is solo (extra heads-up).

Conversation output shape:

```
Recommendation: <starter_id> — <name>
Confidence:     <verified | first-class | best-effort>

<one-paragraph rationale tying the PRD priors and the user's answers to the lead card>

Alternatives worth a glance:
  - <starter_id_a> — <one-line tradeoff>
  - <starter_id_b> — <one-line tradeoff>

<if a flag was raised during the interview (preference vs quality, missing
 feature, scaffolding-friction warning): a one-line summary of what surfaced,
 how the user resolved it, and whether they're proceeding with a known-friction
 stack>
```

### Step 4 — Write hand-off

Load `references/handoff-schema.md`. Build the hand-off content in memory first.

Resolve `package_manager` from the chosen card's `toolchain.package_manager`. The field is open string (whatever the card prescribes — `npm`, `uv`, `poetry`, `bundle`, `gradle`, `cargo`, `go-modules`, `composer`, `dotnet`, etc.); for ecosystems with no external choice (e.g., Go), the card may omit the field, in which case omit it from the hand-off frontmatter too.

Resolve `hints.deployment_target` from Q4. If the user picked "I don't know yet — pick the recommended default for me", land the card's first `deployment_default` value (NOT the literal string `unspecified`).

Populate `hints.path_taken`: `standard` or `custom`. Populate `hints.self_check_answers` with the 5 booleans from Q8 if the custom path ran it; emit `null` if the standard path was taken.

Check for collision:

```bash
test -f context/foundation/tech-stack.md
```

If the file does not exist, write `context/foundation/tech-stack.md` with the validated content.

If the file exists, ask the user:
- question: "context/foundation/tech-stack.md already exists. How would you like to proceed?"
  header: "Collision"
  options:
  - label: "Overwrite (Recommended)"
    description: "Replace the existing tech-stack.md with the new selection. The prior version is lost unless committed."
  - label: "Save as tech-stack-v2.md"
    description: "Preserve history. New selection lands at the next available tech-stack-vN.md slot."
  - label: "Abort"
    description: "Exit without writing. The conversation rationale is preserved in chat only."
  multiSelect: false

The recommended default here is "Overwrite" because tech-stack-selector is a one-shot decision per project; multiple versions are usually a sign the user is reconsidering, in which case losing the prior pick is intentional. Versioned save is the escape hatch.

After the write lands, copy the next-step command and announce:

```bash
echo -n "/10x-bootstrapper" | pbcopy 2>/dev/null || echo -n "/10x-bootstrapper" | clip.exe 2>/dev/null || echo -n "/10x-bootstrapper" | xclip -selection clipboard 2>/dev/null || true
```

```powershell
# PowerShell (Windows)
Set-Clipboard "/10x-bootstrapper"
```

Print:

```
═══════════════════════════════════════════════════════════
  TECH STACK SELECTED
═══════════════════════════════════════════════════════════

  Starter:        <starter_id>
  Path taken:     <standard | custom>
  Confidence:     <verified | first-class | best-effort>

  ► Hand-off:  context/foundation/tech-stack.md
  ► Next:      /10x-bootstrapper  (✓ copied to clipboard)
═══════════════════════════════════════════════════════════
```

STOP. Do not chain into `/10x-bootstrapper` automatically — the user runs it when ready.

## Output

Single file written: `context/foundation/tech-stack.md` (or `tech-stack-vN.md` if a versioned save was picked).

Frontmatter keyed on the schema in `references/handoff-schema.md`:

```yaml
---
starter_id: <key from registry>
package_manager: <card-prescribed string; may be omitted for some ecosystems>
project_name: <kebab-case>
hints:
  language_family: js | python | ruby | java | go | rust | php | dotnet | dart | multi
  team_size: solo | small | mixed
  deployment_target: <starter-prescribed string>
  ci_provider: github-actions | gitlab-ci | circleci | cloudflare-builds
  ci_default_flow: auto-deploy-on-merge | manual-promotion
  bootstrapper_confidence: verified | first-class | best-effort
  path_taken: standard | custom
  quality_override: <bool>
  self_check_answers: <object | null>
  has_auth: <bool>
  has_payments: <bool>
  has_realtime: <bool>
  has_ai: <bool>
  has_background_jobs: <bool>
---

## Why this stack

<one paragraph, ≤ 200 words>
```

## References

- `references/starter-registry.yaml` — canonical starter cards + `recommended_defaults` map.
- `references/residual-interview.md` — Q0 path-fork + Q1–Q8 walk.
- `references/handoff-schema.md` — `tech-stack.md` frontmatter contract.
- `references/agent-friendly-criteria.md` — four quality gates + per-language-family caveat.
- `references/decision-flow.md` — Steps A–E for both paths.

## Critical guardrails

1. **PRD is a precondition, not a fallback.** No inline mini-PRD, no reading the conversation for substitute priors. The file on disk is the contract.

2. **Q0 default is editorial.** Name the recommendation up front; require explicit confirmation. Never accept-by-default-silently.

3. **Standard vs custom path is binding.** Standard short-circuits to recommendation + Q4/Q5/project-name. Custom runs the full walk plus Q8 self-check. Don't blend them — the path the user picked at Q0 is what `hints.path_taken` records.

4. **`bootstrapper_confidence` is informational, never blocking.** A `best-effort` confidence does NOT exclude a starter from recommendation; it surfaces in conversation as a heads-up and lands in `hints.bootstrapper_confidence` so bootstrapper can adjust.

5. **One-way validator.** Bootstrapper may not reference a `starter_id` absent from this skill's registry; tech-stack-selector may carry starters bootstrapper hasn't yet wired (those starters carry `bootstrapper_confidence: best-effort` until they're verified end-to-end).

6. **Universal language only.** No private vault paths or organization-specific branding in shipped content. `pnpm validate:no-vault-paths` enforces this in CI. The recommended-defaults registry is multi-language by design; no single starter is "the" recommended path.

7. **Skill-internal labels stay internal.** When speaking to the user, never reference Q-numbers (`Q0`, `Q3`, `Q6`), Step letters (`Step A`, `Step B`, …, `Step E`), or author phrases like "path-fork", "residual interview", "Socratic moment", "decision flow". These labels organize the reference docs for runtime navigation; the user has no way to map them to anything visible. Translate to plain language before printing — "this choice" instead of "the path-fork", "the framework question" instead of "Q6", "an alternative worth flagging" instead of "a Socratic moment", "I'll skip the feature audit, team profile, and tech preferences questions" instead of "I'll skip Q1–Q3". Same applies to internal field paths in conversation: `hints.deployment_target` / `agent_friendly.typed` / `bootstrapper_confidence` are field names in the hand-off / registry, not phrases to say to the user — "your deployment target", "whether the stack uses explicit types", "how smooth scaffolding will be" are the user-facing translations.