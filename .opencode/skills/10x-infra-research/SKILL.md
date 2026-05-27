---
name: 10x-infra-research
description: >
  Research and recommend an MVP deployment platform by combining tech-stack
  context, a short developer interview, and parallel web research scored against
  five agent-friendly platform criteria. Cross-checks the top recommendation
  through three anti-bias lenses (devil's advocate, pre-mortem, unknown unknowns)
  before writing context/foundation/infrastructure.md with a scored platform
  comparison, rationale, and risk register. Use when the user needs to pick a
  hosting / deployment / maintenance platform for an MVP and wants a
  well-researched, bias-checked decision rather than a gut call.
  Trigger phrases: "choose a platform", "where should I deploy", "infra research",
  "deployment platform for my MVP", "wybierz platformę", "gdzie deployować",
  "infrastructure decision", "hosting choice", "jaka platforma do deploymentu".
  Use AFTER /10x-prd or /10x-tech-stack-selector, BEFORE /10x-implement.
---

# Platform Research: Conscious Deployment Platform for MVP

This skill produces a **conscious infrastructure decision** — not a recommendation from vibes, but one grounded in the project's tech stack, the developer's operational constraints, fresh web research, and three anti-bias lenses that stress-test the winning platform before the decision is recorded.

The single deliverable is `context/foundation/infrastructure.md` — the third decision contract in the foundation chain after `prd.md` (what and for whom) and `tech-stack.md` (what to build with). It captures: a scored platform comparison, the rationale for the recommendation, an operational story (preview / secrets / rollback / approval / logs), and a risk register with pre-populated mitigation notes.

## When to use, when to skip

**Use when**: the user needs to pick a deployment/hosting platform for an MVP and wants a structured, researched decision. The skill works best when `context/foundation/tech-stack.md` exists — it uses the stack as a hard constraint when evaluating platforms.

**Skip when**: the platform is already decided and the user wants help configuring CI/CD or writing Dockerfiles — those are out of scope for this skill (see Non-Goals). Skip also when the user asks about production-scale architecture; this skill focuses on MVP deployments.

## Relationship to other skills

- `/10x-prd` — upstream. Produces `context/foundation/prd.md` with product context. Optional input.
- `/10x-tech-stack-selector` — upstream. Produces `context/foundation/tech-stack.md`. The primary hard-constraint input — load it if present.
- `/10x-stack-assess` — sibling. Assesses the existing stack for agent-friendliness. Infrastructure research is the deployment complement.
- `/10x-implement` — downstream. Reads `context/foundation/infrastructure.md` to inform deployment steps during implementation.

## Non-goals

This skill does **not**:
- Build Docker images or write Dockerfiles.
- Configure CI/CD pipelines.
- Plan beyond MVP scope (medium-term cost projections are fine; multi-region HA is out of scope).

## Required inputs

1. `references/agent-friendly-criteria.md` — bundled. The five platform criteria used as the evaluation lens.

## Optional inputs

1. `context/foundation/tech-stack.md` — if present, the skill reads the language, framework, and runtime to filter out platforms that don't support them.
2. `context/foundation/prd.md` — if present, the skill reads product context (user scale, latency requirements) to weight research.

## Initial Response

When this skill is invoked:

1. **If a path argument was provided** (e.g. `/10x-infra-research @context/foundation/tech-stack.md`), strip a leading `@` if present and use the path as the tech-stack location for this run.
2. **If no argument**, check for `context/foundation/tech-stack.md`. Load it if present; proceed without it if absent.

## Workflow

### Step 0 — Setup & context load

Load context files. For each that exists, read it and extract the relevant fields:

- `context/foundation/tech-stack.md` → language, framework, runtime, database (hard constraints for platform compatibility)
- `context/foundation/prd.md` → expected user scale, latency/uptime requirements (soft weights for platform scoring)

Load `references/agent-friendly-criteria.md` — this is the evaluation lens used in Step 3.

Echo what was loaded:

```
Context loaded:
  Tech stack:    <language> / <framework> / <runtime>  [or "not found — will infer from cwd"]
  PRD context:   <scale / latency notes>               [or "not found — skipping"]
  Platform criteria: references/agent-friendly-criteria.md ✓
```

### Step 1 — Developer interview (5 questions)

Ask the user five Yes / No / Don't know questions. Ask the user for each, one at a time. Collect all answers before proceeding to research.

**Question 1**

Ask the user: "Does your app require persistent server-side connections — WebSockets, long-polling, or background worker processes that must stay alive between requests?"
  Options:
  - Yes: The app needs always-on processes or long-lived connections.
  - No: Request/response only — each request is stateless.
  - Don't know: I'm not sure yet.

**Question 2**

Ask the user: "Is minimizing monthly cost the top priority at MVP stage, or is developer experience and speed of iteration more important?"
  Options:
  - Minimize cost: I want the cheapest viable option, even if DX is rougher.
  - Prioritize DX: I'll pay a reasonable amount for a smoother development loop.
  - Don't know / roughly equal: No strong preference.

**Question 3**

Ask the user: "Do you or your team already have hands-on experience with any specific platform you'd feel comfortable deploying to?"
  Options:
  - Yes — Vercel / Netlify: Comfortable with JAMstack-style platforms.
  - Yes — Cloudflare (Workers / Pages): Comfortable with edge-first deployment.
  - Yes — Railway / Render / Fly.io: Comfortable with container-based PaaS.
  - Yes — AWS / GCP / Azure: Comfortable with hyperscaler infrastructure.
  - No strong familiarity: Open to whatever fits best.

**Question 4**

Ask the user: "Do you expect the app to serve users globally (edge/CDN matters) or mainly from one region?"
  Options:
  - Global — latency across regions matters: Users will be on different continents.
  - Single region is fine: All users are in one country / region.
  - Don't know yet: Not sure about target geography.

**Question 5**

Ask the user: "Will the deployment need co-located managed services — database, object storage, queues — from the same platform, or are external providers fine?"
  Options:
  - Co-location preferred: I want DB, storage, etc. from the same vendor to keep it simple.
  - External providers are fine: I'll use separate services (e.g., Supabase, Upstash, Cloudflare R2).
  - Don't know yet: Haven't decided on data layer yet.

Store all five answers as research constraints before moving to Step 2.

### Step 2 — Parallel platform research

Use subagents to research platforms in parallel. The goal is to gather enough signal to score each platform against the five criteria in `references/agent-friendly-criteria.md`, filtered by the hard constraints from the tech stack and interview answers.

**Platform candidate pool** (research these, then score and narrow):

| Platform | Primary use case |
|---|---|
| Cloudflare Workers + Pages | Edge-first, serverless JS/TS, global CDN |
| Vercel | Frontend + serverless functions, Next.js-native |
| Netlify | Frontend + serverless, JAMstack, form/auth primitives |
| Fly.io | Container-based PaaS, persistent processes, multi-region |
| Railway | Full-stack PaaS, databases co-located, fast DX |
| Render | Container/static hosting, free tier, cron jobs |

For each platform, spawn a subagent with a focused research prompt. Run all six in parallel:

```
Research [Platform Name] as an MVP deployment target.

Focus on:
1. Supported runtimes and languages (especially: <language from tech stack>)
2. CLI tooling — what commands deploy, rollback, and tail logs?
3. Whether docs are available as markdown/llms.txt on GitHub
4. Free tier and estimated cost at 10k-100k monthly requests
5. Persistent process / WebSocket support (yes / no / limited)
6. Co-located managed services (database, storage, queues)
7. MCP server or your AI coding assistant integration (if any)
8. Known limitations or gotchas for <framework from tech stack>
9. Current status of every feature mentioned above: GA / beta / preview / deprecated / region-limited.
   For any non-GA feature, capture the explicit caveat and the date the status was checked.

Return: a brief factual summary (200-300 words) with evidence links. Mark every
beta/preview/region-limited capability inline so it carries forward into the risk register.
```

Use web search or web fetching tools to find current pricing pages, official docs, and recent community comparisons (look for content from 2024-2025).

After all subagents complete, synthesize their findings into a scoring matrix.

### Step 3 — Score and shortlist

Score each researched platform against the five criteria from `references/agent-friendly-criteria.md`. Apply hard filters first:

**Hard filters** (a platform that fails these is dropped from shortlisting):
- If interview Q1 = "Yes (persistent connections required)" → drop platforms that cannot run persistent processes (Netlify, Vercel serverless-only).
- If tech stack uses a runtime not supported by a platform → drop that platform.

**Scoring** (Pass / Partial / Fail per criterion):

| Platform | CLI-first | Managed/Serverless | Agent-readable docs | Stable deploy API | MCP / Integration | Total |
|---|---|---|---|---|---|---|
| Cloudflare | | | | | | |
| Vercel | | | | | | |
| Netlify | | | | | | |
| Fly.io | | | | | | |
| Railway | | | | | | |
| Render | | | | | | |

Soft-weight the criteria by interview answers:
- Q2 "minimize cost" → penalize platforms with expensive base tiers.
- Q3 "existing familiarity" → break ties in favor of the familiar platform.
- Q4 "global reach" → prefer edge-native platforms.
- Q5 "co-location preferred" → prefer platforms with integrated databases.

**Shortlist the top 3 platforms** by total score (after filters and weights). Present the shortlist with a one-paragraph rationale per platform before proceeding to cross-check.

Print to user:

```
Shortlisted platforms:
  1. <Platform A> — <one-sentence rationale>
  2. <Platform B> — <one-sentence rationale>
  3. <Platform C> — <one-sentence rationale>

Running anti-bias cross-check on the top recommendation (<Platform A>)...
```

### Step 4 — Anti-bias cross-check

Run three cross-check prompts against the top-ranked platform. Execute these yourself (do not spawn subagents) — you are the skeptic.

**Cross-check 1 — Devil's advocate**

Mentally apply this lens and write the output as a numbered list of weaknesses (3-5 items):

> Act as an extremely skeptical and experienced software architect. Your only job is to find all possible weaknesses, hidden costs, technical risks, and reasons why deploying `<tech stack>` on `<Platform A>` could fail in practice for this MVP. Be specific — name the failure modes, not categories.

**Cross-check 2 — Pre-mortem**

Mentally apply this lens and write a short narrative (150-200 words):

> The team deployed `<tech stack>` on `<Platform A>` for their MVP. Six months later, the decision turned out to be a complete disaster. Walk through the incorrect assumptions, technical decisions, and underestimated risks that led to this failure — step by step.

**Cross-check 3 — Unknown unknowns**

Mentally apply this lens and surface 3-5 things the user may not be aware of:

> When deploying `<tech stack>` on `<Platform A>`, what are the 'unknown unknowns' — things the user should know before starting work that are not obvious from the platform's marketing page or docs?

After all three cross-checks, present the findings to the user and ask:

Ask the user: "The anti-bias cross-check surfaced some risks for <Platform A>. How would you like to proceed?"
  Options:
  - Proceed with <Platform A> — risks noted: The risks are manageable. Include them in the output's risk register.
  - Swap to <Platform B> instead: The risks are significant enough to prefer the second option.
  - Swap to <Platform C> instead: The risks are significant enough to prefer the third option.

Apply the user's choice. If they swap to B or C, run the three cross-checks again for the new top pick and present results (no need to ask again — record it and proceed).

### Step 5 — Write output

Check for collision:

```bash
test -f context/foundation/infrastructure.md
```

If the file exists, ask:

Ask the user: "context/foundation/infrastructure.md already exists. How would you like to proceed?"
  Options:
  - Overwrite (Recommended): Replace the existing file. The prior version is lost unless committed.
  - Save as infrastructure-v2.md: Preserve history. New file lands at the next available version slot.
  - Abort: Exit without writing. The recommendation is preserved in chat only.

Build the output file:

```markdown
---
project: <project name from tech-stack.md, prd.md, or cwd directory name>
researched_at: <ISO 8601 date>
recommended_platform: <platform name>
runner_up: <platform name>
context_type: mvp
tech_stack:
  language: <language>
  framework: <framework>
  runtime: <runtime>
---

## Recommendation

**Deploy on <Platform Name>.**

<2-3 sentence rationale: why this platform for this specific tech stack and these specific constraints. Cite the scoring and interview answers that drove the decision.>

## Platform Comparison

<The full scoring matrix from Step 3, with one-paragraph notes per platform explaining each score.>

### Shortlisted Platforms

#### 1. <Platform A> (Recommended)

<Why it won: key strengths relative to the criteria and constraints.>

#### 2. <Platform B>

<Why it scored second: strengths and the gap vs. the recommendation.>

#### 3. <Platform C>

<Why it scored third: strengths and the gap vs. the recommendation.>

## Anti-Bias Cross-Check: <Recommended Platform>

### Devil's Advocate — Weaknesses

<Numbered list of 3-5 specific weaknesses surfaced in cross-check 1.>

### Pre-Mortem — How This Could Fail

<The 150-200 word failure narrative from cross-check 2.>

### Unknown Unknowns

<Bulleted list of 3-5 non-obvious risks from cross-check 3.>

## Operational Story

How the chosen platform actually operates day to day. One concrete answer per line — not a category.

- **Preview deploys**: <how PR / branch builds become preview URLs; whether they need protection (e.g. Cloudflare Access); any conditions on availability such as fork PRs>
- **Secrets**: <where env vars and tokens live (platform vault, GitHub Secrets, Workers Secrets); who can read them; rotation flow>
- **Rollback**: <command or click sequence to revert; typical time-to-revert; any data caveats such as DB migrations that don't roll back automatically>
- **Approval**: <which actions require a human (publish to production, rotate primary secret, drop a database); which an agent may perform unattended>
- **Logs**: <how the agent reads pipeline and runtime logs read-only — concrete CLI commands or MCP tools>

## Risk Register

For each identified risk: name, the cross-check lens that surfaced it, likelihood, impact, and a concrete mitigation step. Tying every risk back to a lens makes the register auditable — a future reader can see *why* each item is on the list.

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| <risk> | Devil's advocate / Pre-mortem / Unknown unknowns / Research finding | <L/M/H> | <L/M/H> | <concrete step> |

## Getting Started

<3-5 concrete first steps to deploy the project to the recommended platform. Specific to the tech stack — not generic. E.g., "Install wrangler: npm i -g wrangler", "Run: wrangler init <project-name>".>

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup
- Production-scale architecture (multi-region, HA, DR)
```

Write to `context/foundation/infrastructure.md` (or the versioned path if chosen). Create `context/foundation/` if it doesn't exist.

After the write, copy the next-step hint to clipboard:

```bash
echo -n "/10x-implement" | pbcopy 2>/dev/null || echo -n "/10x-implement" | clip.exe 2>/dev/null || echo -n "/10x-implement" | xclip -selection clipboard 2>/dev/null || true
```

```powershell
# PowerShell (Windows)
Set-Clipboard "/10x-implement"
```

Print:

```
═══════════════════════════════════════════════════════════
  INFRASTRUCTURE DECISION RECORDED
═══════════════════════════════════════════════════════════

  Platform:      <recommended platform>
  Runner-up:     <runner-up>
  Bias checks:   3 / 3 passed

  ► Decision:    context/foundation/infrastructure.md
  ► Next:        /10x-implement  (✓ copied to clipboard)
═══════════════════════════════════════════════════════════
```

STOP. Do not chain into `/10x-implement` automatically — the user runs it when ready.

## Output

Single file written: `context/foundation/infrastructure.md` (or `infrastructure-vN.md` if a versioned save was picked).

## References

- `references/agent-friendly-criteria.md` — the five platform criteria, scoring guidance, and weight notes.

## Critical guardrails

1. **Research before recommending.** Never recommend a platform based solely on training-data familiarity. Always run the parallel web research (Step 2) with web search / web fetching tools before scoring. Stale impressions about pricing or feature support lead to wrong recommendations.

2. **Tech stack is a hard constraint, not a preference.** If the tech stack requires a runtime that a platform doesn't support (e.g., Python on a JS-only edge runtime), that platform is dropped — no amount of scoring overrides it.

3. **Three candidates, not one.** Always shortlist three platforms. The user needs alternatives in case the top pick is blocked by cost, vendor lock-in, or organizational constraints.

4. **Anti-bias is non-negotiable.** The three cross-check prompts (devil's advocate, pre-mortem, unknown unknowns) run on every invocation. Do not skip them even when the top platform is an obvious fit. The cross-check surfaces risks that obvious fits hide.

5. **Interview answers drive weights, not exclusions.** Except for the hard filter on persistent connections vs. serverless, interview answers adjust weights — they don't disqualify platforms. A cost-sensitive user might still pick Fly.io if the DX score is high enough; the interview answer informs the scoring, not the candidate pool.

6. **Scope is MVP, not production.** The skill optimizes for speed of iteration, low operational overhead, and cost at low traffic. Do not introduce production-scale concerns (multi-region failover, SLA commitments, dedicated support tiers) unless the PRD explicitly calls for them.

7. **Skill-internal labels stay internal.** When speaking to the user, never reference step numbers or internal field names. Use plain language: "the platform comparison", "the recommended option", "the risk register".

8. **Validate "Getting Started" commands against the exact versions in the tech stack, not platform docs in general.** Platform adapters, CLIs, and deployment toolchains evolve rapidly — a workflow that was canonical at one major version may be superseded or actively wrong at the next. Before writing any CLI command or local dev recommendation in the "Getting Started" section, look up what the specific adapter/tool version in `tech-stack.md` actually does today. Pay particular attention to: (a) whether the framework's dev server already provides runtime fidelity for the target platform (making a separate platform-native dev command redundant or legacy), (b) whether APIs, config keys, or environment access patterns changed between major versions, and (c) whether platform tooling was merged, renamed, or deprecated between what the general docs describe and what the project's pinned versions actually ship. Surface any version-driven behavior differences as "Unknown Unknowns" in the cross-check, and reflect only the correct, version-accurate workflow in "Getting Started". Never copy CLI commands verbatim from platform marketing pages or general tutorials without confirming they apply to the exact stack versions in use.