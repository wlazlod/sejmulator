---
name: 10x-plan
description: Create detailed implementation plans with thorough research and iteration
---

# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path or ticket reference was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:

```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task/ticket description (or reference to a ticket file)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

The more upstream context you pass in, the fewer questions I'll ask:
- Just a task description → full questioning
- Task + research doc (`context/changes/<change-id>/research.md`) → fewer questions; I won't redo what research covered
- Task + frame brief (`context/changes/<change-id>/frame.md`) → far fewer questions; the problem framing is already settled
- Task + frame + research → minimum questions; I focus only on solution-design decisions that need your input

Tip: invoke directly with a change-id or path — `/10x-plan oauth-login` or `/10x-plan @context/changes/oauth-login/frame.md`
For deeper analysis, try: `/10x-plan think deeply about @context/changes/oauth-login/research.md`
```

Then wait for the user's input.

## Process Steps

### Step 1: Context Gathering & Initial Analysis

#### Step 1.0: Identify upstream artifacts and scale questioning depth

Before any reading, identify what kinds of upstream artifacts the user passed in. Each one represents decisions already made — don't re-ask them.

- **Frame brief** — path matches `context/changes/<change-id>/frame.md`, or content begins with `# Frame Brief:` / contains a `## Reframed` section.
- **Research doc** — path matches `context/changes/<change-id>/research.md`, or YAML frontmatter contains `topic:` and `researcher:` fields.
- **Existing plan** — path matches `context/changes/<change-id>/plan.md` (resume/refine mode — out of scope for this scaling logic).
- **Task description only** — none of the above.

**Question count and focus scale with what's provided:**

| Upstream artifacts          | LOW   | MEDIUM | HIGH  | What changes vs. baseline                                                                                                              |
| --------------------------- | ----- | ------ | ----- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Task only (baseline)        | 4–6   | 7–10   | 11–15 | Full questioning across all relevant categories.                                                                                       |
| Task + research             | 3–5   | 5–7    | 8–11  | Skip questions whose answer is already in the research doc. Don't re-spawn sub-agents to find what research already mapped.            |
| Task + frame                | 2–3   | 4–6    | 7–9   | Skip [D]iagnostic categories — frame settled problem framing. Treat the Reframed (or Confirmed) Problem Statement as authoritative.    |
| Task + frame + research     | 1–2   | 3–5    | 5–7   | Skip both. Ask only [S]olution-design questions that genuinely need user input.                                                        |

**Principle**: every artifact passed in is a source of decisions already made. Reading them counts as listening to the user. Don't ask the user what they already wrote down.

**When a frame is present**, read it FULLY and treat as authoritative:
- Copy the **Reported Observation** + **Reframed (or Confirmed) Problem Statement** as the task definition. Do not re-question the framing.
- Lift the **Hypothesis Investigation** table and **Narrowing Signals** into your "Current State Analysis" — this work is already done.
- If the frame **Confidence: LOW** is flagged, surface that in the plan's "Open Risks & Assumptions" and ask ONE clarifying question about how to proceed (verify first, or plan with risk acknowledged).
- Do NOT re-investigate the framing. Frame owns problem framing; you own solution design.

**When research is present**, read it FULLY and use as the codebase baseline:
- "Code References" section IS your codebase grounding — don't re-spawn Explore agents to find the same files.
- "Architecture Insights" feed directly into "Current State Analysis."
- Spawn sub-agents only to fill specific gaps research didn't cover (e.g., the exact files this plan will modify if research was broader).

#### Step 1.1: Read and research

1. **Read all mentioned files immediately and FULLY**:
   - Reference files (e.g., `context/changes/<change-id>/research.md`, `context/changes/<change-id>/frame.md`)
   - Research documents
   - Frame briefs
   - Related implementation plans
   - Any JSON/data files mentioned
   - `context/foundation/lessons.md` if present — treat its rules as priors when probing scope, edge cases, and architecture choices; rules already accepted by the team narrow which design pitfalls still need fresh questioning.
   - **IMPORTANT**: Read files WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context
   - **NEVER** read files partially - if a file is mentioned, read it completely

2. **Spawn initial research tasks to gather context** (skip or narrow based on Step 1.0):
   Before asking the user any questions, use the Task tool with parallel sub-agents to research:
   - **Explore agent** (`subagent_type: "Explore"`) — find all files related to the task, search for patterns, trace code paths. Use for file discovery and codebase structure questions.
   - **general-purpose agent** (`subagent_type: "general-purpose"`) — for deeper analysis that may require reading many files and synthesizing findings. Use for understanding complex systems.

   Example: spawn 2-3 Explore agents in parallel for different search dimensions (e.g., "find all files related to X", "find similar implementations of Y", "find prior decisions about Z in `context/changes/**/` and `context/archive/**/`").

   These agents will:
   - Find relevant source files, configs, and tests
   - Trace data flow and key functions
   - Return detailed explanations with file:line references

3. **Read all files identified by research tasks**:
   - After research tasks complete, read ALL files they identified as relevant
   - Read them FULLY into the main context
   - This ensures you have complete understanding before proceeding

4. **Analyze and verify understanding**:
   - Cross-reference the ticket requirements with actual code
   - Identify any discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on codebase reality

5. **Present informed understanding and assess complexity**:

   First, present a brief summary of what you found:

   ```
   Based on [the ticket and my research of the codebase / your description and my analysis], I understand we need to [accurate summary].

   I've found that:
   - [Key discovery — code reference, existing asset, prior work, or domain constraint]
   - [Relevant pattern, convention, or constraint discovered]
   - [Potential complexity or edge case identified]
   ```

   Then assess the task complexity and present it to the user for confirmation:

   ```
   **Complexity Assessment: [HIGH / MEDIUM / LOW]**

   [2-3 sentence explanation of WHY this complexity level, referencing specific factors:
   number of systems touched, integration points, state management needs,
   data model changes, unknown unknowns, testing surface area, etc.]

   I'd like to ask **[N] questions** across multiple rounds to nail down the important
   decisions about [list key decision areas: architecture, edge cases, data model, UX, testing, etc.].

   Does this feel right, or would you adjust the complexity level?
   ```

   Ask the user: "Does this complexity assessment match your expectations?"
   - header: "Complexity"
   - options:
     - label: "Agree — proceed with [N] questions"
       description: "The assessment is accurate, let's dig into the details."
     - label: "Higher — ask more questions"
       description: "There's more complexity than identified. I'll explain what's missing."
     - label: "Lower — fewer questions needed"
       description: "This is simpler than it looks. Let's keep it focused."
       multiSelect: false

   **Complexity scale:**

   | Level      | Questions | When to use                                                                                                                                                                                                                                                                                                           |
   | ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | **LOW**    | 4-6       | Straightforward task with clear requirements. Few moving parts, follows established patterns or conventions, limited unknowns. Software examples: single-file change, config tweak. Non-software examples: single-topic outline, simple process tweak.                                                                |
   | **MEDIUM** | 7-10      | Multiple components or considerations that interact. Requires design decisions, has edge cases worth discussing, some ambiguity in approach. Software examples: multi-file feature, new API endpoint. Non-software examples: multi-part content plan, workflow redesign, course module.                               |
   | **HIGH**   | 11-15     | Cross-cutting concerns, significant unknowns, many stakeholders or constraints. Requires architectural thinking, has risk of expensive rework if wrong. Software examples: system redesign, data migration. Non-software examples: multi-channel launch strategy, curriculum overhaul, organizational process change. |

   After the user confirms (or adjusts), proceed to questioning.

6. **Ask deep probing questions**:

   Ask the confirmed number of questions across multiple rounds (1-4 questions per round, as many rounds as needed).

   **Rules for structuring questions:**
   - Each question should have 2-4 concrete options
   - Use `multiSelect: true` only when choices aren't mutually exclusive
   - Keep `header` short (max 12 chars): "Scope", "Edge cases", "Priority"
   - The user can always choose "Other" for free-form input

   **Every option MUST include a recommendation signal and tradeoff analysis:**
   - Mark exactly one option as `⭐ Recommended` in its label
   - Each option's `description` must follow this format:
     `[1-sentence what this does] · Strength: [key advantage] · Tradeoff: [key cost or risk]`
   - The recommendation should be grounded in research (codebase patterns for software, domain knowledge and context for non-software) — not guessing

   **Example question with recommendations (software):** `Conflicts` is `[S]` — solution architecture; always asked even when a frame defined the problem.

   Ask the user: "How should the system handle conflicts when two users edit simultaneously?"
   - header: "Conflicts"
   - options:
     - label: "Last write wins"
       description: "Later save silently overwrites earlier one. · Strength: Zero added complexity, no UI changes needed. · Tradeoff: Users can lose work without warning — acceptable only if edits are rare or low-stakes."
     - label: "⭐ Recommended: Notify and merge"
       description: "Show conflict to user, let them choose which version to keep. · Strength: Prevents data loss while keeping UX simple — matches the pattern in existing EditPanel component. · Tradeoff: Adds a conflict resolution modal and WebSocket subscription for real-time detection."
     - label: "Lock-based"
       description: "First editor locks the resource; others see read-only until released. · Strength: Prevents conflicts entirely — simplest mental model for users. · Tradeoff: Stale locks require TTL + cleanup logic; blocks legitimate concurrent work."
       multiSelect: false

   **Example question with recommendations (non-software — content/strategy):** `Depth` is `[D]` — diagnostic about audience/scope; skip if a frame brief already settled who this is for.

   Ask the user: "What depth of technical detail should the course module target?"
   - header: "Depth"
   - options:
     - label: "Conceptual overview"
       description: "High-level principles, no code. · Strength: Accessible to all skill levels, faster to produce. · Tradeoff: Advanced learners may find it too shallow — risks losing engagement."
     - label: "⭐ Recommended: Hands-on with guided examples"
       description: "Concepts paired with step-by-step exercises. · Strength: Balances understanding and practice — matches the format that got highest completion rates in 10xDevs2. · Tradeoff: 2-3x more prep time per lesson; requires working example repos."
     - label: "Deep dive with open challenges"
       description: "Minimal scaffolding, real-world problems. · Strength: Forces genuine problem-solving, highest learning retention. · Tradeoff: High dropout risk for less experienced learners; harder to support at scale."
       multiSelect: false

   **What to ask about** — adapt categories to the domain of the task:

   First, identify the task domain: **software**, **content/education**, **strategy/process**, or **hybrid**. Then pick question categories that fit. The categories below are organized by domain — select what's relevant, don't force software categories onto non-software tasks.

   **Each category is tagged `[D]` (diagnostic — about the problem) or `[S]` (solution — about how to build it).** When a frame brief was provided in Step 1.0, **skip all `[D]` categories** — frame settled them. Always ask `[S]` categories the user input still needs to drive.

   **Universal categories (all domains, all levels):**
   - **Scope boundaries** `[D]`: What's in vs out
   - **Edge cases / failure modes** `[S]`: What happens when things go wrong or get weird (implementation handling, even if a frame named the observation class)
   - **Success criteria** `[D]`: How do we know this worked — from the end user's or stakeholder's perspective
   - **Priority** `[D]`: Must-have vs nice-to-have — what gets cut if time is tight

   **Software-specific categories (add based on complexity):**

   MEDIUM+:
   - **Data model decisions** `[S]`: Schema, relationships, constraints, migrations
   - **Error handling strategy** `[S]`: Failure modes, retry logic, user-facing messages
   - **Testing approach** `[S]`: Coverage level, which edge cases to test explicitly
   - **Performance boundaries** `[S]`: Expected load, acceptable latency, caching

   HIGH:
   - **Architecture choices** `[S]`: Service boundaries, sync vs async, event-driven vs request-response
   - **State management** `[S]`: Where state lives, consistency guarantees, conflict resolution
   - **Security model** `[S]`: Auth boundaries, data access, input validation
   - **Migration & rollback** `[S]`: Incremental deployment, revert strategy
   - **Observability** `[S]`: Key metrics, alerting, debugging surface

   **Content / education categories (add based on complexity):**

   MEDIUM+:
   - **Audience & prerequisites** `[D]`: Who is this for, what do they already know
   - **Format & medium** `[S]`: Written, video, interactive, live — and why
   - **Narrative arc** `[S]`: What journey does the reader/learner go on
   - **Examples & exercises** `[S]`: What makes concepts stick

   HIGH:
   - **Curriculum dependencies** `[D]`: What must be learned before what
   - **Assessment strategy** `[S]`: How to verify learning happened
   - **Reuse & modularity** `[S]`: Can parts be used standalone or in other contexts
   - **Distribution & access** `[D]`: Where does this live, how do people find it

   **Strategy / process categories (add based on complexity):**

   MEDIUM+:
   - **Stakeholders & roles** `[D]`: Who's involved, who decides, who executes
   - **Timeline & milestones** `[S]`: Key dates, dependencies, critical path
   - **Risk identification** `[S]`: What could go wrong, what's the fallback
   - **Resource constraints** `[D]`: Budget, time, people, tools

   HIGH:
   - **Change management** `[S]`: How do affected people learn about and adopt this
   - **Measurement framework** `[D]`: Leading vs lagging indicators, how to course-correct
   - **Dependencies & sequencing** `[S]`: What blocks what, what can run in parallel
   - **Communication plan** `[S]`: Who needs to know what, when, through which channel

   **What NOT to ask about:**
   - Anything already settled in upstream artifacts (frame brief, research doc) — re-asking is the failure mode this scaling is designed to prevent
   - Low-level implementation details you can determine yourself (from codebase research for software, from context files and prior work for non-software)
   - Questions with obvious answers given the context already provided
   - Preferences that don't affect the plan's structure or success

   **CRITICAL**: You MUST ask the number of questions appropriate to the confirmed complexity level *and* the upstream-artifacts scaling from Step 1.0. Do not shortcut this when no upstream artifacts were provided — thorough questioning prevents costly rework. Equally, do not pad questions when a frame or research already covers the ground — re-asking erodes trust in the upstream artifact. Each question should force a real decision, not confirm something obvious.

### Step 2: Research & Discovery

After getting initial clarifications from the user, NOW is when you address the implementation details:

1. **Research implementation patterns and prior work**:
   During this phase, answer implementation questions yourself — don't ask the user to make these decisions.

   **For software tasks**, research the codebase:
   - What patterns does the codebase use for similar features?
   - What's the established error handling / logging / testing approach?
   - Which existing components or utilities can be reused?
   - What constraints does the current architecture impose?

   **For non-software tasks**, research context files and prior work:
   - What formats, structures, or templates were used for similar work before?
   - What constraints exist from prior decisions, audience, or platform?
   - What related content or processes already exist that this should align with?
   - What worked well (or didn't) in previous iterations?

   **This is NOT for users to decide** — you determine this by researching existing patterns, files, and context.

2. **If the user corrects any misunderstanding**:
   - DO NOT just accept the correction
   - Spawn new research tasks to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed once you've verified the facts yourself

3. **Create research tasks** using the Task tool to track exploration (these appear in the user's status bar). Update them as research completes.

4. **Spawn parallel sub-tasks for comprehensive research**:
   - Create multiple Task agents to research different aspects concurrently
   - Use the right agent type for each research need:

   **For codebase investigation:**
   - **Explore** (`subagent_type: "Explore"`) — Fast file/pattern search, code structure analysis
   - **general-purpose** (`subagent_type: "general-purpose"`) — Deep analysis requiring multi-step reasoning

   **For historical context:**
   - **Explore** — Search `context/changes/**/research.md` and `context/changes/**/plan.md` (and the same paths under `context/archive/`) for related documents

   Each agent will:
   - Find the right files and code patterns
   - Identify conventions and patterns to follow
   - Look for integration points and dependencies
   - Return specific file:line references
   - Find tests and examples

5. **Wait for ALL sub-tasks to complete** before proceeding

6. **Present findings and design options**:

   First, present a brief summary of research findings:

   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing code]
   - [Pattern or convention to follow]
   ```

   Then, if there are multiple valid approaches, present them as structured choices:

   Ask the user: "Which implementation approach should we use?"
   - header: "Approach"
   - options:
     - label: "[Option A name]"
       description: "[Key tradeoffs: simpler but X, or faster but Y]"
     - label: "[Option B name]"
       description: "[Key tradeoffs]"

   If there's clearly one best approach, skip asking the user and explain why you chose it.
   Only ask when the choice genuinely matters and you can't determine the answer from codebase patterns.

### Step 3: Plan Structure Development

Once aligned on approach:

1. **Present plan outline and get structured feedback**:

   First, print the proposed phases as text (informational):

   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   1. [Phase name] - [what it accomplishes]
   2. [Phase name] - [what it accomplishes]
   3. [Phase name] - [what it accomplishes]
   ```

   Then ask the user: "Does this phase breakdown look right?"
   - header: "Phases"
   - options:
     - label: "Looks good, proceed"
       description: "Write the detailed plan with these phases."
     - label: "Needs adjustment"
       description: "I'll explain what to change before you write the detailed plan."
     - label: "Too granular"
       description: "Combine some phases — this is simpler than it looks."
     - label: "Too coarse"
       description: "Split some phases — there are hidden complexities."
       multiSelect: false

### Step 4: Detailed Plan Writing

After structure approval:

1. **Resolve the change folder, then write the plan** to `context/changes/<change-id>/plan.md`.
   - If the user invoked `/10x-plan <change-id>` and `context/changes/<change-id>/` already exists, use it.
   - Otherwise derive a kebab-case `<change-id>` from the topic and create the folder + `change.md` (mirroring `/10x-new` semantics) before writing.
   - Refuse if the resolved path starts with `context/archive/` — print: "This change is archived. Open a new change with `/10x-new` instead." and STOP.
   - Update `change.md`: set `status: planned` and `updated: <today>`.
2. **Use this template structure** (Phase blocks contain plain bullets — `- ` not `- [ ]` — and a single canonical `## Progress` section at the bottom owns the checkbox state, see `references/progress-format.md` for the contract):

````markdown
# [Feature/Task Name] Implementation Plan

## Overview

[Brief description of what we're implementing and why]

## Current State Analysis

[What exists now, what's missing, key constraints discovered]

## Desired End State

[A Specification of the desired end state after this plan is complete, and how to verify it]

### Key Discoveries:

- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## What We're NOT Doing

[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach

[High-level strategy and reasoning]

## Critical Implementation Details

This section captures **constraints, gotchas, and ordering requirements that the implementer needs to know before they touch the code** — facts the AI assistant determines during Research & Discovery (Step 2) that aren't visible from the file paths alone.

This is NOT a place to pre-decide implementation. Default: **omit** the entire section. Include a heading below ONLY when something genuinely surprising or load-bearing applies — and write 1-3 sentences, not bullet templates.

- **Timing & lifecycle** — include only if there's a non-obvious ordering, race, or lifecycle hook the implementer would otherwise miss.
- **User experience spec** — include only when user-visible behavior has constraints not derivable from the user requirements (e.g. specific focus management, scroll preservation).
- **Performance constraints** — include only when there's a real performance budget or known hotspot; skip generic "use memoization" advice.
- **State sequencing** — include only when the order of state changes matters and the obvious order is wrong.
- **Debug & observability** — include only when there's a specific verification method or instrumentation need beyond standard logging.

If none apply, omit the section entirely. A plan without it is not incomplete; a plan that fills it with templated bullets is bloated.

## Phase 1: [Descriptive Name]

### Overview

[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]

**File**: `path/to/file.ext`

**Intent**: [1-2 sentences naming what this change does and why. The implementer will write the actual code.]

**Contract**: [The interface, signature, schema field, route, file-structure delta, or invariant the change touches. For pure-prose edits, name the section or heading affected.

A code snippet appears here ONLY when the change is non-obvious — a tricky regex, an unusual API call, a counterintuitive ordering, a workaround for a known bug, or a signature contract that other parts of the plan depend on. For routine edits (add a field, wire a handler, follow an existing pattern), describe the contract and stop. Default: no snippet.]

### Success Criteria:

#### Automated Verification:

- Migration applies cleanly: `make migrate`
- Unit tests pass: `make test-component`
- Type checking passes: `npm run typecheck`
- Linting passes: `make lint`
- Integration tests pass: `make test-integration`

#### Manual Verification:

- Feature works as expected when tested via UI
- Performance is acceptable under load
- Edge case handling verified manually
- No regressions in related features

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase. Phase blocks use plain bullets — the corresponding `- [ ]` checkboxes for these items live in the `## Progress` section at the bottom of the plan.

---

## Phase 2: [Descriptive Name]

[Similar structure with both automated and manual success criteria...]

---

## Testing Strategy

### Unit Tests:

- [What to test]
- [Key edge cases]

### Integration Tests:

- [End-to-end scenarios]

### Manual Testing Steps:

1. [Specific step to verify feature]
2. [Another verification step]
3. [Edge case to test manually]

## Performance Considerations

[Any performance implications or optimizations needed]

## Migration Notes

[If applicable, how to handle existing data/systems]

## References

- Related research: `context/changes/<change-id>/research.md`
- Similar implementation: `[file:line]`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: <Phase 1 name>

#### Automated

- [ ] 1.1 <Automated Verification item 1 from Phase 1>
- [ ] 1.2 <Automated Verification item 2 from Phase 1>

#### Manual

- [ ] 1.3 <Manual Verification item 1 from Phase 1>

### Phase 2: <Phase 2 name>

#### Automated

- [ ] 2.1 <…>
````

The Progress section is mechanical — emit one `### Phase N: <name>` per phase, with `#### Automated` / `#### Manual` subsections enumerating every Success Criteria bullet from that phase as `- [ ] <phase>.<index> <title>`. Omit empty subsections. The Phase blocks themselves carry plain `- ` bullets (no checkboxes); the `## Progress` section is the only place `[ ]` / `[x]` appear.

### Step 4.5: Plan Brief (Two-Pager)

After writing the full plan, generate a concise brief that gives the reader the high-level picture before they dive into 500-1000 lines of detail. The brief is the first thing the user reads — it should take under 2 minutes and leave them with a clear mental model of what the plan does, why, and what the key decisions were.

1. **Write the brief** to `context/changes/<change-id>/plan-brief.md` (sibling of `plan.md` in the same change folder).

2. **Use this template**:

```markdown
# [Feature/Task Name] — Plan Brief

> Full plan: `context/changes/<change-id>/plan.md`
> Frame brief: `context/changes/<change-id>/frame.md` (if present — omit line otherwise)
> Research: `context/changes/<change-id>/research.md` (if present — omit line otherwise)

## What & Why

[2-3 sentences: what we're building/doing and the motivation behind it. If a frame brief was the input, lift the Reframed (or Confirmed) Problem Statement here verbatim — that is the "why" in its sharpest form.]

## Starting Point

[1-2 sentences: what exists today that this plan builds on or changes. Ground the reader in the current state so they understand the delta. If a frame investigated this, summarize from its Hypothesis Investigation rather than re-stating.]

## Desired End State

[2-3 sentences: what the world looks like when this plan is done. Describe the concrete, user-visible outcome — not metrics, but the experience or capability that now exists.]

## Key Decisions Made

When a frame brief or research doc was the input, mark the **Source** column to show where the decision came from. This lets readers see the lineage: what was settled upstream vs decided in this planning session.

| Decision                       | Choice            | Why (1 sentence)  | Source           |
| ------------------------------ | ----------------- | ----------------- | ---------------- |
| [Decision area]                | [What was chosen] | [Core rationale]  | Frame / Research / Plan |
| [Decision area]                | [Choice]          | [Rationale]       | Frame / Research / Plan |
| ...                            | ...               | ...               | ...              |

(Omit the `Source` column if no upstream artifacts were provided — every row would be `Plan`.)

## Scope

**In scope:** [Bullet list of what's included]

**Out of scope:** [Bullet list of what's explicitly excluded]

## Architecture / Approach

[1 short paragraph or a simple diagram describing the high-level approach.
For software: key components, data flow, integration points.
For non-software: structure, workflow, key dependencies.]

## Phases at a Glance

| Phase     | What it delivers       | Key risk                  |
| --------- | ---------------------- | ------------------------- |
| 1. [Name] | [One-line deliverable] | [Primary risk or concern] |
| 2. [Name] | [One-line deliverable] | [Primary risk]            |
| ...       | ...                    | ...                       |

**Prerequisites:** [What must be true before starting — dependencies, access, prior work]
**Estimated effort:** [Rough size: e.g., "~2-3 sessions across 3 phases" or "8 weeks, 2-person team"]

## Open Risks & Assumptions

- [Risk or assumption that could change the plan]
- [Another one]

## Success Criteria (Summary)

[2-3 bullet points: how we know the plan succeeded, from the user's perspective]
```

3. **Key principles for the brief**:
   - It must fit on roughly 2 printed pages (~60-80 lines of markdown). If you're going longer, cut.
   - The "Key Decisions" table is the heart — it surfaces what was decided during questioning so anyone reading the plan later understands the choices without re-reading all the questions.
   - "Starting Point" grounds the reader in what exists today — without it, someone unfamiliar with the project can't understand the delta.
   - "Prerequisites & Estimated effort" at the bottom of the Phases table gives the reader a quick feasibility check before committing to read the full plan.
   - Write for someone who wasn't part of the planning conversation — they should understand the plan's shape and rationale from the brief alone.
   - Link to the full plan at the top so the reader can dive deeper on any section.

### Step 5: Sync and Review

1. **Confirm the plan + brief landed in the change folder**:
   - `ls context/changes/<change-id>/plan.md context/changes/<change-id>/plan-brief.md` should both exist.

2. **Copy quick start command to clipboard**:
   - After writing the plan, copy the implementation command to clipboard:

   ```bash
   echo -n "/10x-implement <change-id> phase 1" | pbcopy 2>/dev/null || echo -n "/10x-implement <change-id> phase 1" | clip.exe 2>/dev/null || echo -n "/10x-implement <change-id> phase 1" | xclip -selection clipboard 2>/dev/null || true
   ```

   ```powershell
   # PowerShell (Windows)
   Set-Clipboard "/10x-implement <change-id> phase 1"
   ```

3. **Present both the brief and full plan**:

   ```
   I've created the implementation plan:

   📋 Brief (start here): `context/changes/<change-id>/plan-brief.md`
   📄 Full plan: `context/changes/<change-id>/plan.md`

   → /10x-implement <change-id> phase 1 (✓ copied)

   Review the brief first, then check the full plan for anything that needs adjustment:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   - Missing edge cases or considerations?
   ```

4. **Iterate based on feedback** - be ready to:
   - Add missing phases
   - Adjust technical approach
   - Clarify success criteria (both automated and manual)
   - Add/remove scope items

5. **Continue refining** until the user is satisfied

## Important Guidelines

1. **Be Skeptical**:
   - Question vague requirements
   - Identify potential issues early
   - Ask "why" and "what about"
   - Don't assume - verify with code, files, or context

2. **Be Interactive**:
   - Don't write the full plan in one shot
   - Get buy-in at each major step
   - Allow course corrections
   - Work collaboratively

3. **Be Thorough**:
   - Read all context files COMPLETELY before planning
   - Research patterns using parallel sub-tasks (codebase for software, context files and prior work for non-software)
   - Include specific references (file:line for code, document paths for content)
   - Write measurable success criteria with clear automated vs manual distinction

4. **Be Practical**:
   - Focus on incremental, testable changes
   - Consider migration and rollback
   - Think about edge cases
   - Include "what we're NOT doing"

5. **Track Progress**:
   - Use the Task tool to create planning tasks and update them to mark them completed as you progress
   - Tasks appear in the user's status bar for visibility
   - Mark tasks completed as you finish research areas

6. **MANDATORY: Complexity-Scaled Deep Questioning**:
   - **BEFORE** writing any plan, you MUST assess complexity (HIGH/MEDIUM/LOW) and get user confirmation
   - Ask the full number of questions matching complexity: LOW=4-6, MEDIUM=7-10, HIGH=11-15
   - Every option must include a `⭐ Recommended` pick with strength/tradeoff analysis
   - Cover scope, edge cases, architecture, data model, testing, and performance as relevant to complexity
   - Ask in rounds of 1-4 questions — as many rounds as needed to hit the target count
   - DO NOT skip or shorten this step — thorough questioning prevents critical bugs and rework
   - Wait for user answers before proceeding to detailed planning

7. **No Open Questions in Final Plan**:
   - If you encounter open questions during planning, STOP
   - Research or ask for clarification immediately
   - Do NOT write the plan with unresolved questions
   - The implementation plan must be complete and actionable
   - Every decision must be made before finalizing the plan
   - "Critical Implementation Details" subsections are opt-in: include them only when a real constraint, gotcha, or ordering requirement applies. Default to omission. A plan without that section is not incomplete.

8. **Describe intent, not implementation**:
   - The plan tells the implementer **what to change and why**, not how to write the code
   - Each change entry under `### Changes Required:` separates `**Intent**` (what and why) from `**Contract**` (the interface, signature, schema field, route, structure, or invariant the change touches). Code snippets, when needed, live at the tail of `**Contract**`
   - Default to no code snippets. Include a snippet ONLY when the change is non-obvious (tricky regex, unusual API call, counterintuitive ordering, workaround, signature contract that other phases depend on)
   - For routine edits — adding a field, wiring a handler, following an existing pattern — describe the `**Intent**` in 1-2 sentences, name the `**Contract**` in one, and stop. The implementer (human or agent) figures out the code from the file path, the surrounding pattern, and the intent
   - File paths and short Intent/Contract descriptions are usually enough. Resist the urge to pre-write the code

## Success Criteria Guidelines

**Always separate success criteria into two categories:**

1. **Automated Verification** — commands agents can run: `make test`, `npm run lint`, type checks, specific file existence
2. **Manual Verification** — human testing: UI/UX, real-world performance, edge cases, user acceptance

Each phase's success criteria should use `- [ ]` checkboxes under `#### Automated Verification:` and `#### Manual Verification:` headings.

## Common Patterns

- **Database changes**: schema/migration → store methods → business logic → API → clients
- **New features**: research patterns → data model → backend → API → UI
- **Refactoring**: document behavior → incremental changes → backwards compatibility → migration

## Sub-task Spawning Best Practices

- **Spawn multiple tasks in parallel** in a single message for concurrent execution
- **Each task should be focused** on a specific area with detailed instructions (directories, what to extract, expected format)
- **Request specific file:line references** in responses
- **Wait for all tasks to complete** before synthesizing findings
- **Verify sub-task results** — if unexpected, spawn follow-ups and cross-check against actual code

## Context Management

Planning can be context-heavy due to research + iteration. Keep context efficient:

- **Delegate research to sub-agents** — they return summaries, keeping the main context lean. Don't re-read files that sub-agents already analyzed unless you need to verify specific details.
- **Synthesize, don't accumulate** — after sub-agents return, synthesize findings into your understanding rather than quoting large blocks verbatim.
- **If context feels degraded during planning** — if responses become sluggish or repetitive, save the current plan draft to file and offer the user to continue in a fresh context:
  ```
  The plan draft is saved at: context/changes/<change-id>/plan.md
  Would you like to continue refining in a fresh window?
  → /10x-plan <change-id> (✓ copied)
  ```
  This lets `/10x-plan` reload the draft and continue iterating with full context available.

## Example Question Probing by Feature Type

### Example 1: Software / UI Feature — MEDIUM complexity (e.g., Pagination)

Mixed: `Loading UX` is `[S]` (UI behavior — solution detail); `Scale` is `[D]` (problem boundary — how big is the dataset). With a frame brief, ask only `Loading UX`; the scale should already be in the Reframed (or Confirmed) Problem Statement.

Ask the user: "What should the user see while new items load?"
- header: "Loading UX"
- options:
  - label: "Inline spinner"
    description: "Small spinner below existing content. · Strength: User keeps seeing current items, minimal UI work. · Tradeoff: Feels slower than skeleton — users see a generic spinner instead of content shape."
  - label: "⭐ Recommended: Skeleton screens"
    description: "Placeholder shapes matching item layout. · Strength: Perceived performance is 30-40% better — matches existing LoadingSkeleton component pattern. · Tradeoff: Requires a skeleton variant per item type; breaks if layout changes."
  - label: "Full-page spinner"
    description: "Replace content with spinner. · Strength: Simplest to implement — one component, no layout concerns. · Tradeoff: Blocks all interaction; feels broken on slow connections."
    multiSelect: false
Ask the user: "How many items should this handle gracefully?"
- header: "Scale"
- options:
  - label: "⭐ Recommended: Hundreds"
    description: "Standard offset pagination. · Strength: Simple, well-understood, works with existing SQL queries. · Tradeoff: Breaks down past ~5k items — acceptable given current data volumes."
  - label: "Thousands"
    description: "Cursor-based pagination + virtual scrolling. · Strength: Handles growth without performance cliff. · Tradeoff: 2-3x more implementation work; changes API contract."
  - label: "Tens of thousands"
    description: "Server-side filtering + virtual list + search. · Strength: Scales indefinitely. · Tradeoff: Significant complexity; requires search index and new API design."
    multiSelect: false

### Example 2: Content / Education — HIGH complexity (e.g., Course Module Design)

Mixed: `Outcome` is `[D]` (defines what success looks like — pure problem framing); `Levels` is `[S]` (audience-handling strategy — how to structure delivery). With a frame brief, ask only `Levels`; the outcome should be settled.

Ask the user: "What should the learner be able to DO after this module — not just know?"
- header: "Outcome"
- options:
  - label: "⭐ Recommended: Build a working prototype"
    description: "Learner produces a functional artifact using the techniques taught. · Strength: Forces genuine skill transfer — the artifact proves competence. Matches the 'Innovate' lesson format from 10xDevs3. · Tradeoff: Requires well-designed starter templates and clear acceptance criteria; takes 2-3x longer to prep."
  - label: "Complete a guided exercise"
    description: "Step-by-step walkthrough with expected output. · Strength: Low barrier — everyone finishes, builds confidence. · Tradeoff: May produce 'tutorial zombies' who can follow but not apply independently."
  - label: "Pass a knowledge check"
    description: "Quiz or code review proving conceptual understanding. · Strength: Fast to create, easy to grade at scale. · Tradeoff: Tests recognition not production — learner may understand but not be able to execute."
    multiSelect: false
Ask the user: "How should this module handle different skill levels in the audience?"
- header: "Levels"
- options:
  - label: "Single track, advanced"
    description: "One path targeting experienced devs. · Strength: Deep content, no hand-holding, respects expert time. · Tradeoff: Alienates beginners — they'll drop off or flood support channels."
  - label: "⭐ Recommended: Layered depth"
    description: "Core path everyone follows + optional deep-dive sections. · Strength: Everyone gets value; advanced learners self-select into harder material. · Tradeoff: More content to maintain; risk of 'optional' sections being ignored."
  - label: "Separate beginner/advanced tracks"
    description: "Two parallel paths diverging early. · Strength: Each audience gets perfectly targeted content. · Tradeoff: 2x production cost; splitting a small cohort may hurt community dynamics."
    multiSelect: false

### Example 3: Strategy / Process — MEDIUM complexity (e.g., Newsletter Workflow)

`Bottleneck` is `[D]` — pure problem framing (which problem to solve). This is exactly the kind of question a frame exists to settle. With a frame brief, skip this entirely; the leading hypothesis is the bottleneck.

Ask the user: "What's the primary bottleneck in the current newsletter pipeline?"
- header: "Bottleneck"
- options:
  - label: "⭐ Recommended: Curation takes too long"
    description: "Finding and evaluating links is the slow step. · Strength: Directly targets time-to-publish — automating curation yields the biggest time savings based on current pipeline timings. · Tradeoff: Automated curation risks losing the personal editorial voice that subscribers value."
  - label: "Writing the commentary"
    description: "Links are ready but writing around them is slow. · Strength: AI-assisted drafting can cut this in half. · Tradeoff: Heavy AI drafting can make the newsletter feel generic — needs careful voice calibration."
  - label: "Distribution and scheduling"
    description: "Content is ready but publishing is manual. · Strength: Easiest to automate — clear inputs and outputs. · Tradeoff: Lowest impact if curation or writing is still the bottleneck."
    multiSelect: false

**Note**: Questions focus on **WHAT should happen** (requirements, behavior, outcomes) — NOT **HOW to implement it** (code patterns, specific tools). The `⭐ Recommended` pick is grounded in research and context — the user always has the final say.