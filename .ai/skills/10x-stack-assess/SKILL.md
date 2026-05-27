---
name: 10x-stack-assess
description: >
  Assess an existing project's stack for agent-friendliness using the 4 quality
  gates (typed, convention-based, popular in training data, well-documented) as
  an evaluation lens. Detects stack components from cwd, scores each against the
  gates, identifies compensation strategies for failures, and writes
  context/foundation/stack-assessment.md with per-component scores, gap analysis,
  and ready-to-paste CLAUDE.md/AGENTS.md entries. Use when the user has an
  existing project and wants to evaluate how well their stack supports AI agent
  workflows. Trigger phrases: "assess my stack", "evaluate my project",
  "is my stack agent-friendly", "oceń mój stack", "sprawdź projekt",
  "stack assessment", "brownfield assessment".
  Use AFTER /10x-prd (brownfield), BEFORE /10x-health-check.
---

# Stack Assess: Evaluate an Existing Stack for Agent-Friendliness

This skill is the brownfield counterpart to `/10x-tech-stack-selector`. Where tech-stack-selector helps greenfield users **choose** a stack, stack-assess helps brownfield users **evaluate** theirs. It reuses the same four agent-friendly quality gates (`references/agent-friendly-criteria.md`) but applies them as an evaluation lens rather than a selection filter.

The skill sits in the brownfield chain: `/10x-shape → /10x-prd → /10x-stack-assess → /10x-health-check`. Its single job: evaluate the existing stack against the quality gates and produce a structured assessment with concrete compensation strategies.

The core brownfield value is the **compensation path** — when a gate fails, the skill doesn't recommend replacing the stack. It documents what to add to instruction files (CLAUDE.md / AGENTS.md) so the agent can work effectively despite the gap.

## When to use, when to skip

**Use when**: the user has an existing project and wants to evaluate how well their stack supports AI agent workflows. The project directory should contain recognizable project markers (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `Gemfile`, `composer.json`, `*.csproj`, `pubspec.yaml`). Optionally, `context/foundation/prd.md` (brownfield) exists — if present, the skill uses it to contextualize the assessment (e.g., which components are in the change scope).

**Skip when**: the user is starting a new project from scratch — redirect to `/10x-tech-stack-selector`. Skip also when the user just wants a dependency audit or security scan without the quality-gate framing — that is `/10x-health-check` territory.

## Relationship to other skills

- `/10x-shape` — upstream. Produces `shape-notes.md` with `context_type: brownfield`.
- `/10x-prd` — upstream. Produces `context/foundation/prd.md` (brownfield template). Optional input — the skill can run without a PRD.
- `/10x-tech-stack-selector` — greenfield parallel. Same quality gates, different job (selection vs evaluation).
- `/10x-health-check` — downstream consumer. Reads `context/foundation/stack-assessment.md` to focus health checks on identified gaps.

## Required inputs

1. An existing codebase in cwd with at least one recognizable project marker.
2. `references/agent-friendly-criteria.md` — bundled. The four quality gates and compensation path.

## Optional inputs

1. `context/foundation/prd.md` — if present and has `context_type: brownfield`, the skill uses the PRD's `## Scope of Change` and `## Current System Overview` to focus the assessment on the relevant stack components.

## Initial Response

When this skill is invoked:

1. **If a path argument was provided** (e.g. `/10x-stack-assess @context/foundation/prd.md`), strip a leading `@` if present and use the path as the PRD location for this run. The PRD is optional context, not a precondition — the skill runs without it.
2. **If no argument was provided**, check for `context/foundation/prd.md`. If present and has `context_type: brownfield`, load it for context. If absent, proceed without PRD context.

## Workflow

### Step 0 — Cwd precondition

Detect project markers:

```bash
find . -maxdepth 1 \( -name "package.json" -o -name "Cargo.toml" -o -name "pyproject.toml" -o -name "go.mod" -o -name "Gemfile" -o -name "composer.json" -o -name "*.csproj" -o -name "pubspec.yaml" \) 2>/dev/null
```

If **no markers found**, print:

```
No project markers found in the current directory. /10x-stack-assess requires an existing codebase.
If you're starting from scratch, use /10x-tech-stack-selector instead.
```

Then STOP.

If markers are found, proceed to Step 1.

### Step 1 — Detect stack components

Read project files to identify the stack. The detection is file-driven — read what's on disk, don't guess.

**Detection sources by language family:**

| Language family | Marker files | What to extract |
|---|---|---|
| JS/TS | `package.json`, `tsconfig.json`, `next.config.*`, `astro.config.*`, `vite.config.*`, `svelte.config.*`, `nuxt.config.*`, `angular.json`, `.eslintrc*`, `prettier.config.*`, `jest.config.*`, `vitest.config.*`, `playwright.config.*` | Language (JS vs TS — presence of `tsconfig.json`), framework, build tool, test runner, linter, formatter, package manager (from lockfile: `package-lock.json` → npm, `yarn.lock` → yarn, `pnpm-lock.yaml` → pnpm, `bun.lockb` → bun) |
| Python | `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements.txt`, `Pipfile`, `poetry.lock`, `uv.lock` | Framework (Django, FastAPI, Flask — from deps), type checking (mypy/pyright in deps or config), test runner (pytest/unittest), package manager |
| Rust | `Cargo.toml` | Edition, dependencies for web framework (Actix, Axum, Rocket), test framework |
| Go | `go.mod` | Go version, web framework (Gin, Echo, Fiber, Chi, stdlib), test framework |
| Ruby | `Gemfile` | Framework (Rails, Sinatra), Ruby version, type checking (Sorbet/RBS), test framework (RSpec, Minitest) |
| PHP | `composer.json` | Framework (Laravel, Symfony), PHP version, type checking (PHPStan/Psalm), test framework (PHPUnit, Pest) |
| .NET | `*.csproj`, `*.sln` | Framework (.NET version, ASP.NET), language (C#/F#), test framework (xUnit, NUnit) |
| Dart | `pubspec.yaml` | Framework (Flutter, Dart server), test framework |

**Additional signals to check:**

- CI/CD: `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/config.yml`, `cloudbuild.yaml`
- Deployment: `Dockerfile`, `docker-compose.yml`, `fly.toml`, `vercel.json`, `netlify.toml`, `wrangler.toml`, `render.yaml`, `railway.json`, `Procfile`
- Instruction files: `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, `.github/copilot-instructions.md`
- Config quality: `.editorconfig`, `.prettierrc*`, `.eslintrc*`, `tsconfig.json` (strict mode check)

Echo the detected stack back to the user:

```
Detected stack:
  Language:        <language> (<typed: yes/no>)
  Framework:       <framework> (<version if detectable>)
  Build tool:      <build tool>
  Test runner:     <test runner or "not detected">
  Package manager: <package manager>
  CI/CD:           <provider or "not detected">
  Deployment:      <target or "not detected">
  Instruction files: <list or "none">
```

Ask the user:
- question: "Is this detection accurate? Anything missing or wrong?"
  header: "Stack"
  options:
  - label: "Accurate — proceed (Recommended)"
    description: "Continue with this detected stack."
  - label: "Correct something"
    description: "I'll fix the detection before scoring."
  multiSelect: false

If "Correct something": ask which component to correct, apply the override in memory, proceed.

### Step 2 — Score against quality gates

Load `references/agent-friendly-criteria.md`.

For each detected component (language, framework, build tool, test runner), score against the four gates. The scoring is component-level, not project-level — a project can have a typed language but a non-convention-based framework.

**Scoring rules:**

#### Gate 1: Typed

- **Pass**: the language uses explicit types by default (TypeScript, Rust, Go, Java, Kotlin, C#, Dart) OR the project has type-checking configured (Python + mypy/pyright in deps/config, Ruby + Sorbet/RBS, PHP + PHPStan/Psalm).
- **Fail**: JavaScript without TypeScript, Python without type checking configured, Ruby without Sorbet/RBS, PHP without static analysis.
- **Evidence**: cite the specific file/config that proves the score (e.g., "`tsconfig.json` present with `strict: true`" or "no `mypy` in `pyproject.toml [tool.mypy]` or dev dependencies").

#### Gate 2: Convention-based

- **Pass**: the framework ships strong opinions about folder layout, routing, configuration (Next.js App Router, Rails, Django, Spring Boot, Astro, Angular, Laravel, .NET).
- **Fail**: the framework is minimal/unopinionated and the project has no documented conventions (Express, Koa, Flask without blueprints, Sinatra, raw Vite + React).
- **Partial pass**: minimal framework BUT the project has documented conventions in instruction files (CLAUDE.md, AGENTS.MD) or a visible conventions document. Score as pass-with-note.
- **Evidence**: cite the framework's convention strength or the absence of it.

#### Gate 3: Popular in training data

- **Per-language-family assessment** (load-bearing — see `references/agent-friendly-criteria.md`). Assess within the language family, not globally.
- **Pass**: the framework is a mainstream choice within its language ecosystem (React, Next.js, Vue, Angular in JS; Django, FastAPI, Flask in Python; Rails in Ruby; Spring in Java; Laravel in PHP; .NET in C#; Flutter in Dart).
- **Fail**: niche or very new framework with limited training data within its own language family.
- **Evidence**: name the framework and its standing within the language ecosystem.

#### Gate 4: Well-documented

- **Pass**: the framework has current, versioned official docs.
- **Fail**: docs are scattered, outdated, or community-maintained wiki out of sync.
- **Evidence**: note the doc quality observation.

**Output the scoring matrix:**

```
Quality Gate Assessment:

| Component  | Typed | Convention | Training Data | Documented | Verdict    |
|------------|-------|------------|---------------|------------|------------|
| Language   | ✓/✗   | —          | —             | —          | pass/fail  |
| Framework  | —     | ✓/✗        | ✓/✗           | ✓/✗        | pass/fail  |
| Build tool | —     | ✓/✗        | ✓/✗           | ✓/✗        | pass/fail  |
| Test runner| —     | —          | ✓/✗           | ✓/✗        | pass/fail  |

Legend: ✓ = pass, ✗ = fail, ~ = partial, — = not applicable
```

### Step 3 — Identify compensation strategies

For each failed gate, produce a concrete compensation strategy. Compensation means specific entries to add to instruction files (CLAUDE.md / AGENTS.md) so the agent can work effectively despite the gap.

**Compensation templates by gate failure:**

**Typed: fail** →
- Add explicit type annotations convention to CLAUDE.md ("All new code must include type annotations at function boundaries")
- Add validation-at-boundaries rule ("Use Zod/Pydantic/JSON Schema at API boundaries")
- If Python: add mypy configuration recommendation
- If JS: add TypeScript migration path or JSDoc type hints

**Convention-based: fail** →
- Document folder structure conventions in CLAUDE.md ("Routes live in src/routes/, middleware in src/middleware/, ...")
- Document naming conventions ("Files: kebab-case, exports: PascalCase for components, camelCase for functions")
- Document middleware/plugin registration order
- Document error handling pattern

**Popular in training data: fail** →
- Add framework-specific idiom examples to CLAUDE.md
- Link to official docs in instruction file
- Add "prefer X pattern over Y" rules for framework-specific choices
- Note that the agent may need more steering for this framework

**Well-documented: fail** →
- Pin framework version in instruction file
- Add links to the best available docs
- Include inline examples of common patterns
- Note version-specific quirks

Each compensation entry must be **ready to paste** into an instruction file — not generic advice, but actual rule text.

### Step 4 — Determine overall verdict

Based on the scoring matrix and available compensation:

- **ready**: all gates pass for all components. The stack is agent-friendly out of the box.
- **ready-with-compensation**: some gates fail but all failures have clear compensation strategies. The stack works with documented conventions.
- **significant-friction**: multiple gates fail AND compensation is heavy (e.g., untyped language + non-convention framework + niche in training data). The agent will need substantial steering.

The verdict is informational, not blocking. Even `significant-friction` doesn't mean "switch stacks" — it means "budget more time for instruction file authoring and expect more agent correction cycles."

### Step 5 — Write assessment

Check for collision by attempting to read `context/foundation/stack-assessment.md`.

If the file exists, ask the user:
- question: "context/foundation/stack-assessment.md already exists. How would you like to proceed?"
  header: "Collision"
  options:
  - label: "Overwrite (Recommended)"
    description: "Replace the existing assessment. The prior version is lost unless committed."
  - label: "Save as stack-assessment-v2.md"
    description: "Preserve history. New assessment lands at the next available version slot."
  - label: "Abort"
    description: "Exit without writing. The conversation assessment is preserved in chat only."
  multiSelect: false

Build the output file:

```markdown
---
project: <project name from package.json/Cargo.toml/etc or directory name>
assessed_at: <ISO 8601 timestamp>
agent_readiness: <ready | ready-with-compensation | significant-friction>
context_type: brownfield
stack_components:
  language: <language>
  framework: <framework>
  build_tool: <build tool>
  test_runner: <test runner or null>
  package_manager: <package manager>
  ci_provider: <provider or null>
  deployment_target: <target or null>
gates_passed: <N>
gates_failed: <N>
---

## Stack Components

<detected stack details — one paragraph per component, noting version where detectable>

## Quality Gate Assessment

<the scoring matrix from Step 2, with evidence for each score>

### Gate Details

<per-gate breakdown with evidence citations — which file/config proved each score>

## Gaps & Compensation

<for each failed gate: what failed, why it matters for agent workflows, and the concrete compensation strategy>

### Recommended Instruction File Additions

<ready-to-paste CLAUDE.md/AGENTS.md entries for each compensation strategy, formatted as markdown rule blocks the user can copy directly>

## Summary

<overall verdict, key strengths, key gaps, and recommended next step (/10x-health-check)>
```

Write to `context/foundation/stack-assessment.md` (creating `context/foundation/` if it doesn't exist).

After the write, copy the next-step command and announce:

```bash
echo -n "/10x-health-check" | pbcopy 2>/dev/null || echo -n "/10x-health-check" | clip.exe 2>/dev/null || echo -n "/10x-health-check" | xclip -selection clipboard 2>/dev/null || true
```

```powershell
# PowerShell (Windows)
Set-Clipboard "/10x-health-check"
```

Print:

```
═══════════════════════════════════════════════════════════
  STACK ASSESSED
═══════════════════════════════════════════════════════════

  Project:       <project name>
  Readiness:     <ready | ready-with-compensation | significant-friction>
  Gates passed:  <N> / <total>

  ► Assessment:  context/foundation/stack-assessment.md
  ► Next:        /10x-health-check  (✓ copied to clipboard)
═══════════════════════════════════════════════════════════
```

STOP. Do not chain into `/10x-health-check` automatically — the user runs it when ready.

## Output

Single file written: `context/foundation/stack-assessment.md` (or `stack-assessment-vN.md` if a versioned save was picked).

## References

- `references/agent-friendly-criteria.md` — the four quality gates, per-language-family caveat, compensation path.

## Critical guardrails

1. **Cwd is a precondition.** The skill requires an existing codebase with recognizable project markers. No assessment from conversation context alone.

2. **Evaluate, don't recommend replacing.** The skill never recommends switching stacks. It assesses what exists and provides compensation strategies. The user chose their stack for reasons the skill doesn't know — respect that choice.

3. **Per-language-family assessment for gate 3.** Assess "popular in training data" within the language family, not globally. Django is popular in Python; that it has fewer npm downloads than React is irrelevant.

4. **Compensation is concrete, not generic.** Every compensation entry must be a ready-to-paste instruction file rule. "Add better documentation" is not compensation; "Add to CLAUDE.md: `## Routing — Routes are registered in src/routes/index.ts. Each route file exports a default Hono handler. Middleware runs in registration order.`" is compensation.

5. **Evidence for every score.** Every gate pass or fail must cite the specific file, config section, or absence thereof that justifies the score. No vibes-based assessment.

6. **Skill-internal labels stay internal.** When speaking to the user, never reference gate numbers ("Gate 1"), step letters ("Step 2"), or internal field names (`agent_readiness`, `gates_passed`). Use plain language: "your stack's type safety", "overall agent-readiness", "how many criteria your stack meets."

7. **Universal language only.** No private vault paths or organization-specific branding in shipped content.