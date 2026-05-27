---
name: 10x-lesson
description: Capture a recurring rule or pattern into context/foundation/lessons.md. Use when you spot a class of bug or design pitfall worth surfacing for future reviews and implementations.
---

# /10x-lesson — Capture a Recurring Rule

Append a single entry to `context/foundation/lessons.md` so future runs of `/10x-frame`, `/10x-research`, `/10x-plan`, `/10x-plan-review`, `/10x-implement`, and `/10x-impl-review` re-read it as a prior. This is the proactive twin of the "Accept as recurring rule" triage option in `/10x-impl-review` — invoke it inline when you notice a pattern worth surfacing without waiting for a structured review.

A "lesson" is a recurring rule — not a one-off bug fix. The bar is: "this would have changed the framing or the fix on past work, and will keep coming up." If it's a single-incident write-up, this is the wrong skill.

## Initial Response

When this skill is invoked:

1. **If a freeform description was provided inline** (e.g. `/10x-lesson feature flags should always have a kill date`), use it as a seed for the Rule field and proceed to the interview.
2. **If nothing was provided**, respond with:

```
I'll record a recurring rule into context/foundation/lessons.md.

I'll ask four short questions and then append the entry. The four fields are:
  1. Context — where this rule applies (subsystem / phase / file pattern)
  2. Problem — what goes wrong without the rule
  3. Rule — the rule itself, in one or two sentences
  4. Applies to — which skills should weigh this most (frame / plan / implement / review)

Then wait.
```

## Process

### Step 1: Interview

Ask the user to collect the four fields. You may batch them as one round of four free-form prompts (each option set is just `["I'll fill it in"]` — i.e., the user picks "Other" to type the answer), or run four sequential rounds. Either form is fine; the goal is that the user, not the skill, writes the wording.

Pre-fill nothing. The user provides every field. If a freeform intent was passed in the invocation, surface it as a suggestion next to the Rule prompt — not as the default.

The four fields, with one-line guides:

- **Context** — where does this rule apply? Subsystem / phase / file pattern. Be specific enough that a future skill can pattern-match (e.g. "any phase that adds a feature flag", "research on multi-tenant systems", not "everywhere").
- **Problem** — what concretely goes wrong if the rule is violated? Cite a past incident or recurring failure shape. One or two sentences.
- **Rule** — the rule itself, imperative voice ("Always …", "Never …", "Before X, do Y"). One or two sentences. The reader of a future review should be able to paste this verbatim into a finding.
- **Applies to** — comma-separated list of skill names this rule should weigh most for: `frame`, `research`, `plan`, `plan-review`, `implement`, `impl-review`. Use `all` if the rule cuts across the whole lifecycle.

### Step 2: Echo and confirm

Render the proposed entry as a markdown block and show it to the user. Ask the user to confirm:

- question: "Append this lesson to `context/foundation/lessons.md`?"
  header: "Confirm"
  options:
  - label: "Append"
    description: "Save the entry as shown."
  - label: "Edit"
    description: "Let me revise one or more fields before saving."
  - label: "Cancel"
    description: "Discard — don't save anything."
    multiSelect: false

The proposed entry shape (this is the canonical lesson-entry format):

```markdown
## <Rule title — short imperative phrase, derived from the Rule field>

- **Context**: <Context field>
- **Problem**: <Problem field>
- **Rule**: <Rule field>
- **Applies to**: <Applies-to field>
```

The H2 heading IS the rule title. Keep it short — the H2 list is what future skills scan first.

### Step 3: Self-bootstrap and append

If `context/foundation/lessons.md` does not exist, create it with this canonical 5-line header (embedded inline — no separate template file; the same header is used by `/10x-impl-review`'s "Accept as recurring rule" triage branch and here):

```
# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

```

If the file exists, leave it untouched and append to the end. Do not reorder, deduplicate, or reformat existing entries — the file is append-only.

Use a file editing tool (or a file writing tool for the bootstrap case) to land the change. After append, re-read the file and confirm the new H2 is the last section.

### Step 4: Echo result

Print the path and the rule title:

```
Appended to context/foundation/lessons.md:
  ## <Rule title>
```

Stop. Do not chain into other skills. The user invoked this for a single capture; respect the scope.

## Notes

- **Append-only.** Never edit or remove existing lessons through this skill. If a rule needs revision, the user opens the file and edits it directly — that's intentional friction, because rewriting recurring rules without thought is the failure mode this convention prevents.
- **One entry per invocation.** If the user has multiple lessons to capture, they invoke the skill multiple times. Batching invites half-written entries.
- **Self-bootstrap is the default.** Don't tell the user "run /10x-init first" — create the file with the canonical header on first use. (`/10x-init` creates the `/context` directory skeleton; this skill owns `lessons.md` end-to-end.)
- **Pre-fill nothing.** Unlike the `/10x-impl-review` triage branch (which pre-fills Context and Problem from the finding), this proactive skill expects the user to do the writing. That's the price of capturing rules outside a structured review.