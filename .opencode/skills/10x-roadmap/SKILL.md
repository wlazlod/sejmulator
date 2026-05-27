---
name: 10x-roadmap
description: >
  Generate context/foundation/roadmap.md from a PRD as an ordered set of
  vertical, end-to-end slices. Use AFTER /10x-prd (and after the tech-stack
  selection / bootstrap step, when applicable) to turn a holistic PRD into a
  sequence of user-visible milestones a programmer can pick off and hand to
  /10x-plan. Trigger phrases: "write the roadmap", "generate roadmap",
  "create the roadmap from PRD", "stwórz roadmapę", "turn PRD into a
  roadmap", "what should I build first". Do NOT use for per-change planning
  — that's /10x-plan's job.
---

# Roadmap: Generate context/foundation/roadmap.md from a PRD

This skill is the bridge between **product** (PRD) and **per-change planning** (`/10x-plan`). Its single job: read a PRD, auto-probe the codebase baseline, **infer a decisive sequencing proposal** (main goal, north-star slice, investment areas, top blocker), surface only the genuine uncertainty the PRD can't resolve, and emit a `context/foundation/roadmap.md` that lists vertical, user-visible slices in dependency order — ready to feed into `/10x-plan <change-id>`.

**Posture: opinionated recommender, lean interview.** The skill acts as a senior tech-lead who has read the PRD, probed the codebase, and arrived with a recommendation — but who still asks the human the 2-3 load-bearing calls before committing. The default shape of Step 5 is a **capped interview**: at most three anchor questions (main goal, north star, top blocker), each presented as one **strong Recommend** grounded in a quoted artifact line, plus 1-2 alternatives with a one-line "why this is also reasonable" rationale. The user picks Recommend, picks an alternative, or overrides in their own words. Investment areas are *derived* from the answers, not asked. The two failure modes to avoid: **(a) performative interrogation** — asking what the artifacts already answer, or asking more than three questions; **(b) false confidence** — silently deciding load-bearing framing without offering the human a real choice. The one exception is genuinely custom MVP shapes (not a familiar SaaS / CRUD / content / AI-wrapper pattern) — there the agent allows up to two follow-ups on top of the anchor questions, because design intuition is doing more work than artifacts can.

It is a **decomposition + sequencing** skill, not a low-level planner. It NEVER picks frameworks, file paths, schemas, libraries, or implementation details — those belong to `/10x-plan`. It NEVER assigns time estimates, t-shirt sizes, points, or human-calendar dates — agentic execution is non-linear and time-budgeted estimates would lie. What it DOES is: name the slices, sequence them by dependency and by stated goal, surface what's blocking, and route open questions where they can be resolved.

The skill is **AI-native** in four concrete ways: (1) it expresses ordering as a dependency graph, not a calendar; (2) it marks slices that can be executed in parallel by separate agent runs; (3) it pushes "blocking unknowns" up where a human can resolve them, instead of letting them silently slip into implementation; (4) it inventories the existing codebase with subagents instead of asking the user what's already in place.

## When to use, when to skip

**Use when**: `context/foundation/prd.md` exists with non-trivial content (FRs and user stories populated, business logic present), AND the user wants to know what to build first / in what order. Typical triggers: just finished `/10x-prd`, just finished bootstrap, or returning to a project and asking "what's next".

**Skip when**: the PRD is hollow (large `## Open Questions`, `# TODO: domain rule`) — point at `/10x-prd` (or upstream `/10x-shape`) first; a roadmap from a hollow PRD will inherit the hollowness. Also skip when the user wants to plan a *single* change in detail — that's `/10x-plan`. The roadmap is plural; the plan is singular.

## Relationship to other skills

- `/10x-shape` and `/10x-prd` — produce the upstream PRD this skill consumes. If `shape-notes.md` carries a `## Forward: technical-roadmap` block (where shape parks roadmap-bound content), this skill lifts it.
- `10x-tech-stack-selector` — runs between `/10x-prd` and this skill in the bootstrap chain. If `context/foundation/tech-stack.md` exists, this skill reads it as input to derive `## Foundations` (auth scaffold, deploy skeleton, observability — anything the tech-stack-selection step implied) and to short-circuit baseline probes for layers already declared.
- `/10x-plan` — downstream consumer. The user picks a roadmap item and invokes `/10x-plan <change-id>`; that skill creates the change folder and produces a detailed plan. The roadmap does NOT pre-create change folders; one slice can spawn multiple changes when `/10x-plan` discovers that the item is still too broad.
- `/10x-implement` — further downstream. The intermediate lifecycle states (`status: planning`, `in-progress`) are defined here but **not yet wired** in `/10x-plan` and `/10x-implement`; today this skill writes only `proposed` / `ready` / `blocked`. Future work will wire the intermediate states.
- `/10x-archive` — closes the loop at the end. When a change whose `Change ID` matches a roadmap item is archived, `/10x-archive` flips that item's `Status` to `done` (in `## At a glance` and in the item's body block) and appends an entry to `## Done`. This skill never pre-populates `## Done`; `/10x-archive` is its sole writer.
- `/10x-frame`, `/10x-research` — orthogonal. They operate on a single change, not the roadmap.

## Initial Response

When this skill is invoked:

1. **If a path argument was provided** (e.g. `/10x-roadmap @path/to/prd.md`), capture it as the PRD path. Proceed to Step 1.
2. **If no argument was provided**, default the PRD path to `context/foundation/prd.md` and proceed to Step 1. Do not prompt yet — Step 1 handles the missing-input case.

## Interactive prompts — host-agnostic

Whenever the procedure says *"ask the user"*, use whichever interactive-question tool the host agent exposes. The skill is host-agnostic; do not hard-code one tool name into execution. Known equivalents (non-exhaustive):

- your AI coding assistant → Ask the user:
- Cursor → `ask_question`
- OpenAI Codex / Codex CLI → `request_user_input`
- Other harnesses → look for any tool whose description mentions asking the user a structured question with options.

**Self-discovery rule.** Before the first interactive step, scan your available tools for one matching the patterns above (names containing `ask`, `question`, `input`, `prompt_user`, etc., with a `question` or `prompt` parameter and an `options`/`choices` field). Use the first match. If none is available, fall back to a plain conversational message asking the user to reply with one of the labelled options — do not block the procedure.

State which tool you selected (or that you fell back to plain chat) the first time you ask a question, so the user can correct you if there's a better option.

The interactive-question tool is used in Steps 1, 3, 4, 5, and 9 (input-missing, PRD-readiness, baseline-confirm, the 2-3 framing anchors, file-collision) — short structured choices. Step 5 asks each anchor as its own structured question; the synthesis recap at the end of Step 5 is plain markdown (no extra question).

## Parallel baseline research — host-agnostic

Whenever the procedure says to use subagents or run parallel probes, use whichever background research / task-spawn tool the host exposes. Known equivalents (non-exhaustive):

- your AI coding assistant → Spawn an isolated agent with its own context window and return a summary
- Cursor → background agents / delegated tasks
- OpenAI Codex → task delegation tools where available
- Other harnesses → look for any tool that spawns an isolated agent with its own context window and returns a summary.

**Self-discovery rule.** Before Step 4, check whether such a tool exists. If it does, fan out the baseline probes in one batched call. If it does not, run the same probes sequentially in the main context. Either path must return the same baseline summary shape with file evidence.

## Process

### Step 1: Locate and read PRD

Resolve the input path:

- If an argument was passed, use it verbatim (strip a leading `@` if present).
- Otherwise default to `context/foundation/prd.md`.

```bash
test -f "<resolved-path>"
```

If the file exists, **read it FULLY** (no `limit`/`offset`).

If it does not exist, ask with the selected interactive-question tool:

Ask the user:
- question: "No PRD found at `<resolved-path>`. How would you like to proceed?"
  header: "Input?"
  options:
  - label: "Run /10x-prd first (Recommended)"
    description: "Stop here. Run /10x-prd to produce prd.md, then re-invoke /10x-roadmap."
  - label: "Provide a different path"
    description: "I'll wait for you to give me the path."
  - label: "Cancel"
    description: "Exit without changes."
  multiSelect: false

On "Run /10x-prd first": print the redirect message and STOP.

### Step 2: Read supplementary inputs (best effort)

Read these if they exist; otherwise note their absence and continue:

- `context/foundation/shape-notes.md` — look for a `## Forward: technical-roadmap` section. If present, lift its bullets verbatim as candidate roadmap inputs (the user already parked them there during shaping).
- `context/foundation/tech-stack.md` — informs the `## Foundations` section AND short-circuits baseline probes (a layer already declared here is reported as "per tech-stack.md" without re-probing).
- `context/foundation/roadmap.md` — if it already exists, hold it for Step 9 (collision handling). Do NOT mutate it yet.
- `context/foundation/lessons.md` — if present, scan for any rules that touch ordering or readiness (e.g., "always ship the riskiest slice first"). Treat as priors, not gospel.

### Step 3: PRD readiness check

Before generating, score the PRD on a 0–4 readiness heuristic. Each signal contributes 1 point:

1. **Vision & Problem Statement is non-trivial** — section exists, contains ≥ 2 sentences, does NOT contain `# TODO`.
2. **At least one populated user story** — `### US-NN:` heading exists with a Given/When/Then block beneath it (not `# TODO`).
3. **At least one `must-have` FR** — line matching `^- FR-\d{3}: .* (P|p)riority: must-have$` exists.
4. **Business Logic populated** — `## Business Logic` section's first non-blank line is a declarative sentence (not `# TODO: domain rule`).

Document the heuristic explicitly in the conversation:

```
PRD readiness check (heuristic, 4 signals, 1 point each):
  [✓|✗] Vision & Problem Statement non-trivial
  [✓|✗] ≥ 1 populated user story
  [✓|✗] ≥ 1 must-have FR
  [✓|✗] Business Logic populated

  Score: <N>/4
  Open Questions in PRD: <count>
```

**Score ≥ 3**: PRD is roadmap-ready; proceed to Step 4.

**Score < 3**: warn explicitly. Name what's missing and why it matters for the roadmap (NOT a generic "your PRD is thin"):

```
This PRD scored <N>/4 on the roadmap-readiness heuristic. Missing signals:

  - <signal name>: <one-line consequence for the roadmap>
  - ...

A roadmap generated from a hollow PRD will have many slices marked Status:
blocked with their first Unknown being a PRD gap. That's a valid intermediate
state — the roadmap surfaces what's blocking — but if you have time to firm
up the PRD first, the resulting roadmap will be substantially more actionable.
```

Then ask with the selected interactive-question tool:

Ask the user:
- question: "How would you like to proceed?"
  header: "Thin PRD"
  options:
  - label: "Firm up PRD first (Recommended)"
    description: "Stop here. Resolve PRD's Open Questions / TODOs, then re-invoke /10x-roadmap."
  - label: "Proceed anyway"
    description: "Generate from what's there. Hollow areas surface as blocked slices with PRD gap as their Unknown."
  - label: "Cancel"
    description: "Exit without changes."
  multiSelect: false

On "Firm up PRD first": print the redirect and STOP. On "Proceed anyway": continue with the score recorded so Step 6 can flag thin areas.

### Step 4: Auto-research baseline

The "what's already in place" assessment shouldn't fall on the user — the codebase is the source of truth. Use the selected background research / task-spawn tool, if available, to inventory each layer in parallel. If no such tool exists, run the same probes sequentially in the main context. Each probe returns a one-paragraph verdict: **present** (with file evidence), **absent**, or **partial** (scaffold exists but not wired). Then surface the inventory for user confirmation before it feeds Foundations.

**Layers to probe** (skip a layer if `tech-stack.md` already names that layer's choice — report "per tech-stack.md: <choice>" instead of probing):

| Layer | What the probe looks for |
|---|---|
| Frontend | UI framework, build tooling, routing, component libraries — `package.json` deps, framework config files |
| Backend / API | Server framework, API routes, request handlers — entrypoints, route files, controllers |
| Data | DB driver, ORM/query builder, schema/migration tooling, seeded data — schema files, migration directories |
| Auth | Auth provider integration, session/token handling, auth middleware — auth config, middleware files |
| Deploy / infra | Hosting target, container config, CI/CD workflows, infra-as-code — `Dockerfile`, `.github/workflows`, deploy YAML |
| Observability | Logging library, error tracking, metrics, dashboards — sentry/datadog/otel imports, log middleware |

**Run all probes in one batched delegation when the host supports it.** Each prompt is short and self-contained; delegated agents return only a paragraph each, so the main context stays small. Example for Auth:

> Inventory the auth/identity layer of this codebase. Report in under 100 words: (1) is there an auth provider integration? Name it. (2) Are there session/token issuing or verification code paths? Cite a file:line. (3) Is there route-level auth middleware? Cite. If a layer is absent, say "absent" — don't speculate. Don't suggest changes. Don't write or edit files.

Adapt the same template per layer. Always require: present/absent/partial verdict, ≤ 100 words, file evidence when present, no speculation, no edits.

After all probes return, present a one-screen baseline summary to the user:

```
Codebase baseline (auto-researched):

  Frontend:      <present | absent | partial> — <one line, with file pointer>
  Backend/API:   <…>
  Data:          <…>
  Auth:          <…>
  Deploy/infra:  <…>
  Observability: <…>
```

Then confirm:

Ask the user:
- question: "Does this baseline match your understanding? Anything to correct or add before it informs Foundations?"
  header: "Baseline"
  options:
  - label: "Looks right — proceed"
    description: "Use this baseline as input for Foundations and the roadmap's ## Baseline section."
  - label: "Correct one or more layers — I'll explain"
    description: "Free-form correction. I'll re-record the layer(s) before proceeding."
  - label: "Add something not listed"
    description: "Free-form. Things the probes missed (planned-but-not-wired, scaffold from another repo, etc.)."
  multiSelect: true

Save the confirmed baseline. It feeds Step 6a (Foundations) directly: **present** layers → Foundations skips them; **absent** or **partial** → Foundations slot opens. It also feeds the roadmap's `## Baseline` section verbatim.

### Step 5: Lean interview — 2-3 anchor questions, each with a strong Recommend

The PRD captures the **product**. The baseline (Step 4) captures **what already exists**. This step produces the roadmap's framing — `main_goal`, `north_star`, investment areas, `top_blocker` — through a capped interview: at most **three anchor questions**, each carrying one strong **Recommend** grounded in a quoted artifact line plus 1-2 alternatives with a one-line "why this is also reasonable" rationale. The user picks Recommend, picks an alternative, or overrides freely. The skill never asks more than 3 anchor questions; investment areas are *derived* from the answers, not asked.

This is the sweet spot between two failure modes the skill has lived through: silent auto-framing (false confidence, no human gate on load-bearing calls) and unbounded discovery (performative interrogation, asks what the artifacts already answer). A roadmap built on three real choices the user made with eyes open is more durable than one built on either extreme.

If `shape-notes.md` carried a `## Forward: technical-roadmap` block, lift it as a strong prior — feed it into the Recommend, don't re-elicit content the user already parked there.

**5a. Infer recommendations and the alternatives that are actually reasonable.**

For each anchor below, derive *both* the Recommend AND the alternatives — grounded in specific quotes from PRD frontmatter / `## Vision` / `## Success Criteria` / `## NFRs` / `## Open Questions` / baseline / `tech-stack.md`. An alternative is "reasonable" only if a real signal in the artifacts supports it OR it is a common, defensible default for the product shape. **Do not list strawmen.** If only one value is plausible (no real alternative supportable from the artifacts), say so — that anchor will be presented with a single Recommend and an "override in your own words" fallback option.

- **`main_goal`** — pick from `market-feedback` | `quality` | `low-complexity` | `speed` | `learn` | `other`. Signals: `timeline_budget` (tight → speed or low-complexity), `target_scale` (small → low-complexity; mass-market → quality), Success Criteria phrasing ("learn from real users" → market-feedback; "validate the riskiest assumption" → market-feedback; "no incidents at launch" → quality), Vision tone (exploratory hobby → learn; hard deadline → speed). Alternatives are *adjacent* values that the same evidence could reasonably support — e.g., `market-feedback` and `speed` often coexist when the PRD says "ship to learn fast".

- **`north_star`** — the smallest end-to-end user-visible flow that, if shipped first, proves the core hypothesis of the PRD's Vision. Usually traces to a high-priority US-NN AND the primary Success Criterion. Reasonable alternatives are *other* candidate slices that also trace to the primary Success Criterion or to a high-priority US-NN, with fewer Prerequisites or with different sequencing consequences. When more than three candidates exist, present the top three.

- **`top_blocker`** — pick from `skills` | `capacity` | `time` | `decisions` | `external` | `motivation` | `none`. Signals: ≥ 3 unresolved PRD `## Open Questions` → `decisions`; ambitious scope vs `timeline_budget` mismatch → `time` or `capacity`; vendor dependency named in PRD that's not yet contracted → `external`; tech-stack lists a layer the team has never shipped → `skills`; none fire → `none`. Reasonable alternatives are *adjacent* blocker types that fire on similar signals — e.g., `time` and `capacity` often both fire on scope-vs-deadline tension.

- **Investment areas** (NOT asked — derived in 5d) — for each of `frontend`, `backend`, `data`, `infra`: decide `invest deeply` vs `go simple`. Signals: PRD NFRs that gate launch in a layer (privacy / latency / correctness → invest there), baseline gaps that map to PRD must-haves (auth absent + multi-user must-have → invest in auth), Open Questions concentrated in one layer (decisions unresolved there → invest), and the chosen `main_goal` (`quality` boosts privacy/observability layers; `learn` boosts the unfamiliar layer; `speed` / `low-complexity` keeps everything simple by default). Do NOT promote a layer to "invest" without naming the PRD/baseline/main_goal signal.

**5b. Skip an anchor only when the artifact is unambiguous.**

If PRD frontmatter or Success Criteria *literally states* the value (e.g., `timeline_budget: "1 week to ship"` plus Vision stating "we need to launch before X" → `main_goal: speed` is unambiguous), skip that question. Announce the skip in the conversation with the chosen value and the quote that locks it. Never skip an anchor for which any plausible alternative exists; the user's confirmation on a real choice is more valuable than the seconds saved.

The cap is **3 anchor questions**. In practice you will usually ask 2-3; you may ask fewer if multiple anchors are unambiguous from the artifacts, but you may NEVER ask more.

**5c. Run the interview — one structured question per anchor, in order.**

For each non-skipped anchor — `main_goal`, then `north_star`, then `top_blocker` — use the selected interactive-question tool. Each question is its own call (sequential, not batched). Format:

Ask the user:
- question: "<plain-language anchor question, in the user's language>"
  header: "<short header — e.g., Cel | Gwiazda | Główne ryzyko / Goal | North star | Blocker>"
  options:
  - label: "<Recommend value> (Recommended)"
    description: "<One-line why, with the artifact quote/pointer that grounds the Recommend.>"
  - label: "<Alternative A value>"
    description: "Reasonable when <one-line condition the artifacts partially support>; you'd pick this when <sequencing/scope consequence>."
  - label: "<Alternative B value>"
    description: "Reasonable when <one-line condition>; you'd pick this when <consequence>."
  - label: "Something else — I'll explain"
    description: "Free-form. Name the value and the reason; I'll record both and sequence accordingly."
  multiSelect: false

Rules for the options block:
- **The Recommend is always option 1.** Do not bury it. The "(Recommended)" suffix on the label is load-bearing.
- **Each alternative carries its own "why reasonable" clause.** Not "alternative: quality" — but "alternative: quality — reasonable when launch correctness matters more than first-user signal; you'd pick this when the cost of a public bug exceeds the cost of a slower launch". Alternatives without a "why" clause are strawmen and must be removed.
- **At most 2 alternatives.** Plus the free-form fallback. Total options: 2-4. Five-option lists fatigue the user without adding signal.
- **North star options name the slice candidates, not abstract values.** Each option's label is `<US-NN candidate> — <one-line outcome>`. Description carries why this slice is the recommended/alternative validation milestone.
- **If only one value is plausible for an anchor** (5a says no reasonable alternatives exist), present two options only: the Recommend and "Something else — I'll explain". Disclose in the question text: "the artifacts only support one reading here; flag if your read differs".

**5d. Derive investment areas (no question).**

After the 2-3 anchor answers land, derive investment areas from: (1) the chosen `main_goal`, (2) PRD NFRs gating launch in a layer, (3) baseline gaps mapped to must-have FRs, (4) Open-Question concentration. Announce the derived investment in the synthesis recap (5e). The user can override in one line; they are not asked to pick.

**5e. Synthesis recap — confirm without asking.**

Emit a single plain-markdown message that locks in the framing. No new questions. Mirror the user's language end-to-end (Polish PRD → Polish recap). Shape:

```markdown
Locking in the roadmap framing:

- **Cel sekwencjonowania: `<main_goal>`.** <One-line rationale tying to the user's anchor answer and an artifact pointer.>
- **Gwiazda przewodnia: `<S-NN candidate> — <Outcome>`.** <One-line tying this slice to the primary Success Criterion or riskiest assumption.>
- **Główne ryzyko / blocker: `<top_blocker>`.** <One-line with the specific signal — count of Open Questions, named vendor, deadline mismatch, etc.>
- **Inwestycje: w `<layer>` głęboko; reszta lekko.** <One-line — derived from main_goal + NFR + baseline gap; not asked.>

Powiedz "go" żeby ruszyć dalej, albo nadpisz dowolną linię ("inwestycja powinna być w data, nie infra"). Nie będę pytał ponownie o to, co już ustaliliśmy.
```

When the user says "go" or stays silent past the next step boundary, proceed with the locked framing. Per-line overrides are accepted and re-recorded without re-asking the other anchors.

**5f. Custom-MVP-shape exception.**

A "custom MVP shape" is a product that doesn't map onto a familiar pattern: not a SaaS dashboard, not a CRUD app, not a content platform, not an obvious AI-wrapper, not a marketing site. Signals: PRD `## Vision` describes a novel interaction or domain; `## User Stories` don't cluster around a familiar entity (create/read/update/delete a `<thing>`); `tech-stack.md` declares non-obvious tooling (game engines, hardware bridges, specialized runtimes, novel agent shapes); user wording emphasizes a new mechanic, not a known pattern.

When the PRD looks custom-shaped:

1. **Open the interview by disclosing it** in the message preceding the first anchor question: *"This PRD doesn't fit a familiar MVP pattern (no SaaS dashboard / CRUD / content / AI-wrapper shape). My Recommends for the next 2-3 questions are weaker than usual — push back hard if my read is off."*
2. **Soften the Recommend on `north_star` and any derived investment area.** Phrase the Recommend description as *"My best read is X, but the artifact signal is thin"* rather than *"PRD §Vision says X"*.
3. **Allow up to two follow-up exchanges** on top of the three anchor questions. Custom MVPs reward dialogue; the user's design intuition is doing more work than artifacts can. Follow-ups are free-form text, not new structured questions.

This is the one path where the skill leans into dialogue rather than away from it. Total ceiling under this exception: 3 anchors + 2 follow-ups = 5 exchanges.

**5g. Phrasing and language guardrails (apply to every anchor question and the recap).**

- **Mirror the user's language end-to-end.** Polish PRD → Polish questions, options, and recap. Translate section names (`Open Questions` → `Otwarte pytania`, `Functional Requirements` → `Wymagania funkcjonalne`, `Non-Goals` → `Poza zakresem`, `Success Criteria` → `Kryteria sukcesu`). No English fragments like "north star", "blocker", "must-have" inside a Polish question or option label — paraphrase ("gwiazda przewodnia", "główne ryzyko", "konieczne").
- **Translate skill-internal jargon to plain product language.** *"Privacy posture"* → *"polityka prywatności dostawcy AI"*. *"North star"* → *"pierwsza historyjka, która udowadnia, że produkt działa"*. *"Blocking unknowns"* → *"pytania bez odpowiedzi, które blokują dalsze planowanie"*. A user should never need to open this skill's docs to parse a question.
- **Quotes in option descriptions earn their place.** A citation like *"tech-stack wskazuje Astro + Supabase + OpenRouter"* is a name-dump unless the next clause says why it matters for *this* anchor. Either inline the implication or drop the quote.
- **Recommend must be defensible, not aggressive.** A Recommend's one-liner is grounded in an artifact line, not in confident tone. If you can't point to the quote, downgrade — present the anchor with two alternatives of equal weight (and a free-form fallback), and let the user choose.

**5h. Hard cap.**

Outside the custom-MVP exception: **3 anchor questions, no follow-ups, one synthesis recap.** Inside the exception: 3 anchors + up to 2 follow-up exchanges. If after the cap an anchor is still undecided, **make the call** using the Recommend, record it in frontmatter with a one-line rationale, and proceed — the user can override at any point by editing the file or saying "actually, blocker should be capacity, not time". The skill does not drift into `/10x-plan`'s territory and does not stall on a sub-anchor edge case.

### Step 6: Decompose and sequence

This step is where the skill earns its keep. Build the roadmap content **in memory** (not on disk yet).

**6a. Identify Foundations.** A foundation is a cross-cutting prerequisite that has no user-visible outcome on its own but unblocks named vertical slices, reduces a named blocking unknown, or creates verification infrastructure required by a named slice. It is an enabler contract, not permission to roadmap horizontally. Sources:

- `tech-stack.md` decisions that imply scaffolding work (auth provider → auth scaffold; chosen deploy target → deploy skeleton; chosen monitoring → observability baseline).
- PRD `## Non-Functional Requirements` that need infrastructure (e.g., NFR "p95 < 800ms" implies basic perf instrumentation).
- PRD `## Access Control` if it's anything beyond "single user, no auth".
- **Step 4 baseline** — anything reported as **absent** or **partial** is a Foundations candidate. Anything reported as **present** is skipped (and noted in `## Baseline`).
- **Step 5 "Where to invest"** — "invest deeply" picks promote a foundation to its own explicit slice (e.g., "data layer — invest deeply" + absent baseline → F-NN explicit data-design foundation, not just an implicit migration step).

Don't invent foundations the PRD doesn't imply (no "set up Storybook" unless something forces it). Do not create a generic "data layer", "API layer", "UI layer", or "auth system" foundation unless you can name the downstream `S-NN` item it unlocks, the blocking unknown it reduces, or the verification path it enables.

Foundation IDs are `F-NN` (zero-padded two-digit, starting at `F-01`).

**6b. Decompose the user-facing surface into slices.** Walk the PRD's `## User Stories` and `## Functional Requirements`. Group them into vertical, end-to-end slices where each slice:

- Delivers a **single user-visible capability** stated as "user can …".
- Touches every layer needed to make that capability real (data + logic + interface), top to bottom.
- Is small enough that one `/10x-plan` invocation produces a tractable plan, but big enough that the slice is meaningful on its own (a slice is generally one US-NN, occasionally two when they're tightly coupled — e.g., "create" and "list" of the same entity).

Do NOT slice horizontally ("the database slice", "the API slice", "the UI slice"). Horizontal slices are the anti-pattern this skill exists to prevent. The default decomposition is vertical-first: each user-facing slice should produce a usable capability that an agent can implement and verify end-to-end. Horizontal work is allowed only as a named Foundation with an explicit downstream reason.

Slice IDs are `S-NN` (zero-padded two-digit, starting at `S-01`).

Each `F-NN` and `S-NN` also gets a stable **Change ID** in kebab-case. The Change ID is the bridge into `/10x-plan` and, later, a backlog item in Jira/Linear. Prefer concise, outcome-oriented names such as `first-gated-generation`, `minimal-auth-for-generation`, or `srs-review-session`.

**6c. Build the dependency graph.** For each slice and foundation, identify Prerequisites:

- **Other foundation IDs** the slice needs in place (e.g., S-03 needs F-01 auth).
- **Other slice IDs** whose data or capabilities this slice consumes (e.g., S-04 "rate a recipe" depends on S-03 "see recipes").
- **External state** (e.g., "a seeded ingredient table"). Concrete, not vague.

For every foundation, also identify **Unlocks**:

- one or more downstream `S-NN` vertical slices the foundation directly enables, OR
- one or more blocking Unknowns it reduces, OR
- one or more named verification paths required by a downstream slice.

If a foundation has no clear Unlocks, remove it or fold the work into the first vertical slice that needs it.

Then for each item, derive **Parallel with** — the slices whose Prerequisites are a subset or sibling of this slice's Prerequisites and which don't depend on it. AI agents can fan out across these. If two slices share zero dependencies and neither blocks the other, they're parallel. When the #1 blocker (Step 5) is **capacity**, be especially generous in computing parallel-with — it's the user's most actionable lever.

**6d. Topological sort, biased by main goal.** Foundations first (in dep order among themselves), then slices in dep order. Place the **north star** slice as early as its Prerequisites allow — don't defer it for symmetric ordering. Then bias ties by main goal (Step 5):

- **Market feedback** → ties broken in favor of the slice that surfaces the riskiest assumption (often integration or domain logic). Surfacing risk early matters more than maximizing demo value of slice 1.
- **Quality / craft** → Foundations sequenced more eagerly; observability and access-control foundations are NOT deferred behind user-facing slices.
- **Low complexity / quick win** → ties broken in favor of the smallest viable slice; aggressive Parking.
- **Speed to launch** → strict must-have path first; non-essentials get Parked, not sequenced late.
- **Learn the tech / explore** → ties broken in favor of slices that exercise unfamiliar tech earliest; learning value counts as user value here.

If `## Open Roadmap Questions` includes a sequencing-relevant decision (e.g., "do we ship for mobile first?"), do NOT pick a sequence that prejudges the answer — leave the affected slices as `Status: blocked` until the question resolves.

**6e. Identify blocking unknowns.** For each slice, list:

- **Blockers** (external, pending) — vendor approval, design asset, stakeholder decision. If none, write `—`. The Step 5 "External" #1-blocker answer feeds these.
- **Unknowns** (questions to research) — things the roadmap can't answer that `/10x-plan` shouldn't try to either. Each unknown carries: question, owner, blocking-status (yes/no — is planning blocked until this resolves?). The Step 5 "Decisions" #1-blocker answer feeds these.

A slice with `Status: blocked` exists when at least one Unknown has `Block: yes`. The roadmap's job is to surface these so the user can resolve them before `/10x-plan` is wasted on a slice that can't be planned.

**6f. Generate `## Open Roadmap Questions`.** Two sources:

- PRD's `## Open Questions` — copy verbatim, renumber if needed. These are still open.
- New questions surfaced during Step 5 that span multiple slices ("should we actually ship for mobile?").

Per-slice unknowns stay in the slice; cross-cutting ones live here.

**6g. Generate `## Parked`.** Lift PRD's `## Non-Goals`. Also append anything Step 5 surfaced as deferred — particularly when the main goal is **speed to launch** or the #1 blocker is **time/capacity**, this section grows. Each entry: one-line item, one-line rationale.

**6h. Derive `## Streams` (navigation aid).** Streams are a *derived view* over the dependency graph — they do NOT replace the topological order in `## Foundations` + `## Slices` and they do NOT introduce new IDs. Their job is to give a reader the proposed reading order across parallel tracks in one screen, so a foundation like F-02 that unlocks only a far-away slice doesn't read as a non-sequitur next to F-01.

A stream is one coherent Prerequisites chain plus the slices that share its head. The default rule for deriving streams:

1. **One stream per foundation that anchors a distinct chain.** Walk Foundations in order; for each `F-NN`, the stream is `F-NN → (slices that list F-NN in Prerequisites, in dep order, branching where appropriate)`.
2. **Slices with no foundation prerequisite become their own stream.** A `ready` slice that depends on nothing (typical: small compliance / hardening work like `S-05`) is its own one-item stream. Do not invent a "Misc" bucket.
3. **A slice that depends on multiple streams' heads joins the most-derived one** (the chain whose head sits deepest in topological order). Mention the join in that stream's one-liner ("joins Stream A at S-01"). Do not duplicate the slice across streams.
4. **One row per stream in a markdown table** with columns `Stream | Theme | Chain | Note`. The `Chain` column uses the same Roadmap IDs the rest of the doc uses, joined by `→` for sequential and `/` or "parallel with" prose for branches. The `Note` column is one short clause tying the stream to `main_goal` or naming the join point with another stream.
5. **Themes are descriptive, not promotional.** Good: "Wedge & deck", "Review loop", "Account lifecycle", "Auth compliance". Bad: "The killer feature", "Critical path 1".
6. **Cap: 5 streams.** More than five usually means the dep graph is being over-segmented — fold a single-slice stream into the adjacent foundation's stream if its prerequisites overlap. Fewer than two streams means streams are not pulling their weight (the topological order already reads cleanly); omit the section.

Streams are NOT canonical: if a stream conflicts with the topological order, the topological order wins and the stream definition is wrong. Self-review enforces stream coverage (every F-NN and S-NN appears in exactly one stream) but does not enforce stream count or theme phrasing.

### Step 7: Emit roadmap content

Use this exact template (section names are the contract; downstream tooling and `/10x-plan` may grep for them):

````markdown
---
project: <from PRD frontmatter>
version: 1
status: draft                    # draft | active | locked
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
prd_version: <int from PRD frontmatter>
main_goal: <market-feedback | quality | low-complexity | speed | learn | other>
top_blocker: <skills | capacity | time | decisions | external | motivation | none>
---

# Roadmap: <Project>

> Derived from `context/foundation/prd.md` (v<N>) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

<2-3 sentences lifted from PRD's Vision & Problem Statement. NOT a re-statement —
just enough that a reader can orient without opening prd.md.

If the recap leans on a product-strategy term — most commonly "wedge", but also
"beachhead", "primary metric", "validation milestone", "north star" — define it
inline on first use, in one short sentence in plain language. Example:
"The product wedge — the one trait that, if removed, makes the product
indistinguishable from a generic AI tool — is that cards must be both
AI-grounded in the learner's own pasted text and human-gated before they
land in the deck." A reader who has not taken a product-strategy course must
be able to read the section cold.>

## North star

**<Slice ID>: <Outcome>** — <one sentence on why this is the validation milestone, tied to main_goal>.

> A reader-facing one-liner explaining what "north star" means here: the smallest
> end-to-end slice whose successful delivery would prove the core product hypothesis
> — placed as early as Prerequisites allow because everything else only matters
> if this works. Include this gloss the FIRST time "north star" appears in the
> document body; do not repeat it later.

## At a glance

| ID | Change ID | Outcome (user can …) | Prerequisites | PRD refs | Status |
|---|---|---|---|---|---|
| F-01 | <kebab-case-change-id> | (foundation) <foundation outcome> | — | NFR-XX | proposed |
| F-02 | <kebab-case-change-id> | (foundation) <foundation outcome> | F-01 | NFR-YY | proposed |
| S-01 | <kebab-case-change-id> | <user-can outcome> | F-01 | US-01, FR-001 | ready |
| S-02 | <kebab-case-change-id> | <user-can outcome> | S-01 | US-02, FR-003 | proposed |
| S-03 | <kebab-case-change-id> | <user-can outcome> | S-01, F-02 | US-03, FR-005 | blocked |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme | Chain | Note |
|---|---|---|---|
| A | <Theme> | `F-01` → `S-01` → `S-02` | <One-line rationale tying the stream to main_goal.> |
| B | <Theme> | `F-02` → `S-03` | <Joins Stream A at `S-NN` if applicable, else standalone.> |
| C | <Theme> | `S-NN` | <Standalone slice with no foundation prerequisite.> |

(2–5 streams; every `F-NN` and `S-NN` appears in exactly one stream. Omit this section entirely if the dep graph is too small for streams to add value — see Step 6h.)

## Baseline

What's already in place in the codebase as of `<YYYY-MM-DD>` (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** <present | absent | partial> — <one line, file pointer if present>
- **Backend / API:** <…>
- **Data:** <…>
- **Auth:** <…>
- **Deploy / infra:** <…>
- **Observability:** <…>

## Foundations

### F-01: <Foundation title>

- **Outcome:** (foundation) <one sentence on what's now in place — not user-visible>.
- **Change ID:** <kebab-case-change-id>
- **PRD refs:** <NFR-NN, Access Control section, etc. — be specific>
- **Unlocks:** <downstream S-NN IDs, blocking unknown IDs/questions, or named verification paths>
- **Prerequisites:** <slice/foundation IDs and external state — or `—`>
- **Parallel with:** <IDs that can run alongside, or `—`>
- **Blockers:** <external pending, or `—`>
- **Unknowns:** <questions, or `—`>
- **Risk:** <one line: why sequenced here, what could go wrong>
- **Status:** proposed | ready | blocked

(Repeat for each F-NN.)

## Slices

### S-01: <Slice title>

- **Outcome:** <user can …>
- **Change ID:** <kebab-case-change-id>
- **PRD refs:** <FR-NNN, US-NN, NFR-N — every must-have FR this slice satisfies, every US-NN it advances>
- **Prerequisites:** <slice/foundation IDs and external state>
- **Parallel with:** <IDs, or `—`>
- **Blockers:** <external pending, or `—`>
- **Unknowns:**
  - <question> — Owner: <user|team|TBD>. Block: <yes|no>.
  - (or `—` if none)
- **Risk:** <one line>
- **Status:** proposed | ready | blocked

(Repeat for each S-NN, in dependency order.)

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for `/10x-plan` | Notes |
|---|---|---|---|---|
| F-01 | <kebab-case-change-id> | <issue title for Jira/Linear> | no | <why or `—`> |
| S-01 | <kebab-case-change-id> | <issue title for Jira/Linear> | yes | Run `/10x-plan <change-id>` |

This table is the clean handoff to Jira/Linear or any MCP-backed backlog. Include one row for every `F-NN` and `S-NN`. It should be compact enough to copy into issues, but it must not duplicate the detailed roadmap body.

## Open Roadmap Questions

1. **<Question>** — Owner: <who>. Block: <which slice IDs this gates, or `roadmap-wide`>.
2. ...

(Each entry mirrors PRD's `## Open Questions` shape. Per-slice unknowns stay in the slice.)

## Parked

- **<Item>** — Why parked: <PRD §Non-Goals reference, or rationale from interview>.
- ...

## Done

(Empty on first generation. `/10x-archive` appends an entry here — and flips that item's `Status` to `done` — when a change whose `Change ID` matches the item is archived. Do NOT pre-populate. Format:)

- **<Slice ID>: <Outcome>** — Archived <YYYY-MM-DD> → `context/archive/<YYYY-MM-DD-change-id>/`. Lesson: <pointer to lessons.md if any, or `—`>.
````

**Field semantics, in detail:**

- **Outcome** is verb-led. Slices: *"user can sign in and see an empty fridge"*. Foundations: *"(foundation) auth scaffold landed; tokens issued via configured provider"*. Never a noun phrase ("authentication system"); always a state-of-the-world declarative.
- **Change ID** is kebab-case, stable, and suitable for `context/changes/<change-id>/`. Do not use `F-01` / `S-01` as the change id; those are roadmap-local order IDs.
- **Unlocks** appears only on Foundations. It names the downstream reason this Foundation exists: specific `S-NN` slices, blocking unknowns, or verification paths. A Foundation without Unlocks is horizontal drift.
- **PRD refs** uses the literal IDs from PRD (`FR-001`, `US-01`, `NFR-02`). Don't paraphrase. Every must-have FR in PRD must appear in at least one slice's `PRD refs` after Step 8 self-review.
- **Prerequisites** mixes slice IDs (`S-01`, `F-02`) and external state, comma-separated. External state is plain English ("seeded ingredient table", "design tokens published"). One field, not split.
- **Parallel with** is informational. Computed from the dep graph: any slice X where my Prerequisites and X's Prerequisites have no path between them. Empty = `—`.
- **Blockers** is *external pending* only (vendor, design, stakeholder decision). Things the team can't unilaterally resolve. If the team CAN resolve it, it's an Unknown, not a Blocker.
- **Unknowns** is questions to research. Each carries Owner and Block flag. Block=yes promotes the slice's Status to `blocked`.
- **Risk** is one line: why sequenced here, what could go wrong, why this is the safer order than alternatives. Not a postmortem. Not catastrophizing. Just the load-bearing reason a future reader needs to understand the sequence.
- **Status** lifecycle: `proposed` (default on first generation) | `ready` (Prerequisites all met, no blocking unknowns — `/10x-plan` can run) | `planning` | `in-progress` | `done` | `blocked` (one or more unknowns with `Block: yes`). Today this skill emits only `proposed`, `ready`, and `blocked`; `/10x-archive` flips an item to `done` when its change archives. `planning` and `in-progress` are reserved for future `/10x-plan` / `/10x-implement` wiring.
- **Frontmatter `main_goal` / `top_blocker`** record Step 5 answers so a future re-read (or a reviewer) can see the sequencing bias at a glance without opening the conversation history.

**Hard rule — never invent slices.** Every slice must trace to a PRD US-NN or FR-NNN. If the interview surfaced something that isn't in the PRD ("oh and we also need offline mode"), it does NOT become a slice. It becomes either an Open Roadmap Question (if it's a real gap) or a Parked entry (if the user explicitly chose to defer it). The roadmap's job is to sequence what the PRD declares, not to grow the PRD.

**No time units. No estimates. No complexity scores.** No "Day 1", no "Week 2", no "small/medium/large", no story points. Order is encoded in Prerequisites; pacing is encoded in Blockers and Unknowns. If you find yourself wanting to write "this should take a few hours" — stop. That's `/10x-plan`'s downstream territory, and even there it's about scope clarity, not calendar prediction.

### Step 8: Self-review

Before any disk write, verify the in-memory roadmap:

1. **Frontmatter** — all 8 keys present (`project`, `version`, `status`, `created`, `updated`, `prd_version`, `main_goal`, `top_blocker`).
2. **Required sections** — these `##` headings exist, in this order: `Vision recap`, `North star`, `At a glance`, `Streams` (optional — present iff Step 6h decided streams add value), `Baseline`, `Foundations`, `Slices`, `Backlog Handoff`, `Open Roadmap Questions`, `Parked`, `Done`. With `Streams` present the count is 11; without it, 10.
3. **Per-entry schema** — every S-NN has the 9 mandatory fields (`Outcome`, `Change ID`, `PRD refs`, `Prerequisites`, `Parallel with`, `Blockers`, `Unknowns`, `Risk`, `Status`). Every F-NN has those fields plus `Unlocks`.
4. **PRD coverage** — every PRD `must-have` FR (grep `^- FR-\d{3}: .* must-have$`) appears in at least one slice's `PRD refs`. Same for every `### US-NN:`. If a must-have isn't covered, the self-review FAILS.
5. **Dependency graph integrity** — no cycles. Every ID listed in `Prerequisites` exists somewhere in the doc. The order in `## Foundations` and `## Slices` is a topological sort: no slice depends on something that comes after it.
6. **At-a-glance table parity** — table rows match section bodies. Each row's `Change ID`, `Prerequisites`, `PRD refs`, `Status` match the body fields verbatim.
7. **Status consistency** — every `blocked` slice has at least one Unknown with `Block: yes`. Every `ready` slice has all Prerequisites already in `done` state (today this means: no Prerequisites, OR Prerequisites are all foundations the baseline reports as `present`).
8. **No invented slices** — every slice's `PRD refs` contains at least one real PRD ID (`FR-\d{3}` or `US-\d{2}`).
9. **Baseline ↔ Foundations consistency** — no Foundation re-scaffolds a layer the `## Baseline` section reports as `present`. If the baseline says auth is present and there's still an `F-NN` for auth scaffold, that's a self-review failure (either the baseline is wrong or the foundation is redundant).
10. **Foundation enabler contract** — every Foundation has `Unlocks` populated with at least one downstream `S-NN`, a named blocking unknown, or a named verification path. A generic foundation such as "database layer" without a downstream reason is a self-review failure.
11. **Change ID integrity** — every F-NN and S-NN has a unique kebab-case `Change ID`; every F-NN and S-NN appears exactly once in `## Backlog Handoff`; every handoff row references an existing roadmap ID and repeats the same Change ID. No spaces, dates, status labels, or roadmap IDs as change IDs.

13. **Streams coverage** (only if a `## Streams` section was emitted) — every `F-NN` and every `S-NN` listed in `## At a glance` appears in exactly one stream's `Chain` cell. Duplicates and omissions both fail. The Chain cells only reference existing Roadmap IDs (no invented IDs). Stream count is 2–5. If the doc has < 2 candidate streams, the section should have been omitted (Step 6h cap).

12. **Strategic terms are defined inline** — scan the emitted document for product-strategy jargon: `wedge`, `beachhead`, `north star`, `validation milestone`, `primary metric`, `product-market fit`, `thin end of the wedge`, `riskiest assumption`, `core hypothesis`. For each term that appears anywhere in the body (Vision recap, North star, Risk lines, slice titles), verify there is a one-sentence inline definition on its **first** occurrence in the document. If a term is used without being defined on first use, the self-review FAILS. Acceptable forms of definition: parenthetical ("the wedge — the one trait that, if removed, makes the product generic — is …"), em-dash gloss, or a short follow-on sentence. Identifier-style terms (`FR-001`, `US-03`, `F-01`, `S-02`) and proper names of tools/services are exempt. If the term cannot be defined in one sentence, replace it with plain language and re-emit.

If any check fails, **abort the write** and report the specific failure:

```
Roadmap self-review FAILED:

  - <specific failure, e.g., "FR-007 (must-have) is not covered by any slice"
     or "Slice S-04 lists S-06 in Prerequisites, but S-06 comes later in the doc"
     or "F-02 (auth scaffold) is redundant — Baseline reports auth as present">
  - ...

The roadmap was NOT written. Fix the failure and regenerate, or — if a check is
wrong — file a skill bug. Self-review aborts protect downstream tooling from
drift.
```

Then STOP.

### Step 9: Collision check

```bash
test -f context/foundation/roadmap.md
```

If the file does not exist, write to `context/foundation/roadmap.md` and proceed to Step 10.

If the file exists, the foundation-doc convention is **edit-in-place** for incremental refinement, **archive-then-replace** for full regeneration. This skill produces a *full* roadmap from PRD; surgical refinement is out of scope. So default to archive-then-replace, but ask with the selected interactive-question tool:

Ask the user:
- question: "context/foundation/roadmap.md already exists. How would you like to proceed?"
  header: "Collision"
  options:
  - label: "Archive and replace (Recommended)"
    description: "Move existing to context/foundation/archive/<today>-roadmap.md, then write the new roadmap. History preserved per foundation README convention."
  - label: "Overwrite without archiving"
    description: "Replace in place. Existing content is lost (unless you've committed it). Use only if the existing roadmap is empty or scratch."
  - label: "Cancel"
    description: "Exit without writes. No collision resolution."
  multiSelect: false

On "Archive and replace": create `context/foundation/archive/` if missing, move the existing file to `context/foundation/archive/<today>-roadmap.md` (use today's date in `YYYY-MM-DD`), then write the new content. If a file already exists at that archive path (regenerated twice in one day), append `-2`, `-3`, etc.

On "Overwrite without archiving": write the new content, overwriting in place.

On "Cancel": STOP.

### Step 10: Hand off

After the write lands, summarize:

```
═══════════════════════════════════════════════════════════
  ROADMAP GENERATED
═══════════════════════════════════════════════════════════

  Project:           <project>
  Path:              context/foundation/roadmap.md
  Main goal:         <main_goal>            (sequencing bias)
  #1 blocker:        <top_blocker>          (what to plan around)
  Baseline present:  <comma-separated layers reported present>
  Foundations:       <count>
  Slices:            <count>
  Status breakdown:  ready: N  |  proposed: M  |  blocked: K
  PRD coverage:      <covered must-have FRs> / <total must-have FRs>
  Open Roadmap Q:    <count>
  Parked items:      <count>

  North star:  <Slice ID> — <Outcome>

═══════════════════════════════════════════════════════════
```

Then **recommend a single next move** — don't hand back a "ready" list and ask the user to choose. Pick the one roadmap item to plan first and justify it in one line. The user can override, but the default surface is a recommendation, not a menu.

**Selection rule for the recommended next move** (apply in order, first match wins):

1. If the north star is `ready`, recommend it. The north star is the validation milestone; deferring it loses signal.
2. Else if a Foundation the north star directly depends on is `ready`, recommend that Foundation, and explicitly say "this unlocks the north star <S-NN>".
3. Else if no slice is `ready`, recommend resolving the highest-leverage Open Question or Blocker (the one that unblocks the most downstream items). No planning move is available until then.
4. Else recommend the `ready` slice that unblocks the most downstream items (highest fan-out in the dep graph). Tie-break by main goal (Step 6d).

Format:

```
► **Your next move:** `/10x-plan <change-id>` on **<Roadmap ID>: <Outcome>**.

  Why this one first: <one sentence — load-bearing reason: it IS the north
  star / it unblocks the north star / it has the highest fan-out / it's the
  smallest end-to-end validation we can ship now>.

  After that, in order: <next ready ID>: <Outcome> → <next>: <Outcome>.
  (Full list in `## Backlog Handoff`.)

  Blocked — stay parked until their Unknowns resolve:
    - <Slice ID>: <Unknown> (Owner: <who>)
    - ...
  (Resolving any of these promotes its slice to `ready` and changes my
  recommendation; come back and I'll re-recommend.)
```

If no slice is `ready` and no Foundation is `ready` either (case 3), replace the recommendation with:

```
► **No planning move is available yet.** Every slice is blocked.
  Highest-leverage unknown to resolve next:

    <Question> — Owner: <who>. Unblocks: <S-NN, S-MM, ...>.

  Resolving this promotes <count> slices and is the single change that
  most opens the roadmap. Resolve it, then re-invoke `/10x-roadmap` to
  re-recommend.
```

STOP. Do not chain into another skill automatically — the user picks when to plan. But do NOT degrade the recommendation into a multiple-choice list; if the user wants a different slice, they say so.

## Critical guardrails

1. **PRD is the source.** Every slice traces to PRD IDs. Step 5's framing surfaces goal/north-star/investment/blocker context inferred from the PRD; the baseline surfaces what already exists; neither grows the PRD. Roadmap items without PRD trace are a self-review failure.

2. **Vertical slices first.** A slice delivers user-visible capability end-to-end. Horizontal slices ("the API layer", "the schema") are the anti-pattern this skill exists to prevent. Foundations are the *only* exception — they are explicitly cross-cutting enablers, live in their own section, carry `Unlocks`, and are marked `(foundation)` so no reader confuses them with user-facing work.

3. **No estimates, no time units.** No "Day 1", no "2 weeks", no "small/medium/large", no points. AI-agent execution is non-linear and time-budgeted estimates lie. Order is encoded in Prerequisites; pacing surfaces via Blockers and Unknowns. The roadmap describes shape, not schedule.

4. **No low-level technical details.** No frameworks named (those live in `tech-stack.md`), no file paths, no schema definitions, no code, no library choices. If you find yourself writing those, you've crossed into `/10x-plan`'s territory — stop and let `/10x-plan` do its job downstream.

5. **Surface unknowns, don't paper over them.** Per-slice Unknowns with `Block: yes` promote `Status: blocked`. Cross-cutting unknowns land in `## Open Roadmap Questions`. If the PRD has TODOs, the roadmap inherits them as blocked-slice unknowns. The roadmap's value is partly in showing the user what's NOT yet plannable.

6. **Baseline is auto-researched, not asked.** Don't ask the user "what's already in place?" — spawn parallel Explore subagents (Step 4) and let the codebase answer. Then ask the user only to confirm or correct. This is the contract that makes Foundations honest: a foundation only exists when the baseline says the layer is absent or partial.

7. **Self-review aborts on drift.** Missing required sections, broken dep graph, uncovered must-have FRs, invented slices, Baseline-vs-Foundations contradictions — all abort the write with a specific error. No silent patch-up.

8. **Foundation-doc convention.** `roadmap.md` is a foundation doc per `context/foundation/README.md`. Default collision handling is archive-then-replace (history goes to `foundation/archive/<today>-roadmap.md`); surgical refinement is out of scope for this skill (edit by hand if you need it).

9. **Universal language only.** No 10xDevs / cohort / certification references in any user-facing output or any artifact written to disk. The skill is a generic roadmap generator.

10. **Never chain automatically.** Step 10 is an announcement, not an invocation. The user picks when (and which) slice to feed to `/10x-plan`. Auto-chaining would skip the human's review of the generated roadmap.

11. **Define strategic terms inline on first use.** Product-strategy vocabulary — `wedge`, `beachhead`, `north star`, `validation milestone`, `primary metric`, `must-have path`, `riskiest assumption`, `core hypothesis` — is skill-internal and PRD-internal shorthand, not common knowledge. The roadmap must be readable cold by a teammate (or future-you) who has not taken a product-strategy course. On the FIRST occurrence of any such term in the document body, attach a one-sentence definition inline (parenthetical, em-dash gloss, or short follow-on sentence). Do not repeat the definition on later uses. If the concept cannot be defined in one sentence, replace it with plain language ("the smallest end-to-end flow that proves the product works" beats "the wedge" if you can't compress the wedge's distinguishing trait into one clause). This guardrail applies to user-facing prose in the emitted document — not to the interview questions (Step 5 already handles those) and not to the field semantics inside this skill file. Step 8's self-review check #12 enforces this; bypass is a self-review failure, not a stylistic preference.

12. **Lean interview with strong Recommends — not silent auto-framing, not unbounded discovery.** Step 5 asks **at most 3 anchor questions** (`main_goal`, `north_star`, `top_blocker`); investment areas are *derived* from the answers. Each anchor question carries one strong **Recommend** grounded in a quoted artifact line, plus 1-2 alternatives where each alternative has its own one-line "why this is also reasonable" rationale tied to artifact signal. Strawman alternatives (an option listed only to make the Recommend look right) are forbidden — if the artifacts support only one value, present the anchor with a single Recommend and a free-form override, and say so. An anchor may be **skipped only when the PRD or Success Criteria literally states the value** (e.g., `timeline_budget: "1 week"` plus "must launch before X" → `main_goal: speed` is unambiguous); never skip when any plausible alternative exists. The two failure modes to avoid: **(a) performative interrogation** — asking what the artifacts already answer, or asking more than 3 questions; **(b) false confidence** — silently deciding load-bearing framing without offering the user a real choice. The custom-MVP-shape exception (Step 5f) is the only path that allows follow-ups (up to 2, on top of the 3 anchors). Step 10's recommended-next-move is the same principle applied to the hand-off: one recommendation with a one-line reason, not a "ready to plan" list the user has to triage.

## Notes

- This skill is a **document generator**. Output is `context/foundation/roadmap.md`, period. Per-change planning lives downstream in `/10x-plan`.
- The interview is intentionally lean — at most 3 anchor questions (`main_goal`, `north_star`, `top_blocker`), each carrying one strong Recommend plus 1-2 alternatives with their own "why this is reasonable" rationale. Investment areas are derived from the answers, not asked. PRD already did the heavy diagnostic work; Step 5 captures only the load-bearing calls the artifacts can't lock by themselves. The custom-MVP-shape exception allows up to 2 follow-up exchanges on top of the 3 anchors; no other path adds follow-ups.
- The baseline probe (Step 4) replaces what used to be a "what's already in place?" question. Subagents are cheaper than the user's attention, and the codebase is more reliable than memory.
- The `## Done` section is empty on first generation. It exists so `/10x-archive` has a stable place to record closed items — when a change whose `Change ID` matches a roadmap item is archived, `/10x-archive` flips that item to `Status: done` and appends a `## Done` entry. Do NOT pre-populate it.
- When the skill regenerates an existing roadmap, the previous file moves to `foundation/archive/<today>-roadmap.md`. Reading the diff between the archived version and the new one is the cleanest way to see what changed in the project's understanding — that's the affordance the foundation-doc convention is designed for.
- Lifecycle status fields `planning` and `in-progress` are reserved — today this skill emits only `proposed` / `ready` / `blocked`, and `/10x-archive` flips an item to `done` on archive. Wiring `/10x-plan` and `/10x-implement` to flip `planning` / `in-progress` is future work.
