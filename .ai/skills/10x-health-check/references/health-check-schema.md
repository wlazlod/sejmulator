# Health check schema

The shape of `context/foundation/health-check.md`. Health-check writes one of these per run, at Step 4, after all three execution gates (pre-check, in-check, post-check) have completed. The file is human-readable; `/10x-stack-assess`'s output (`stack-assessment.md`) is the companion artifact — together they give a brownfield learner full context about their project's agent-readiness before agent onboarding.

## File path

```
context/foundation/health-check.md
```

If `context/foundation/` does not exist, health-check creates it. If `health-check.md` already exists, health-check runs a collision guard (overwrite / version / abort) before writing.

## Frontmatter

YAML frontmatter at the top of the file:

```yaml
---
project: <project name — from package.json name, Cargo.toml [package].name, directory name, etc.>
checked_at: <ISO 8601 timestamp, e.g. 2026-05-08T14:23:11Z>
health_status: <healthy | needs-attention | critical-issues>
context_type: brownfield
language_family: <js | python | rust | go | ruby | php | dotnet | dart | java | multi>
stack_assessment_available: <true | false>
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: <N>
  high: <N>
  moderate: <N>
  low: <N>
test_runner_detected: <true | false>
ci_provider: <provider name or null>
recommended_fixes: <N>
---
```

`health_status` values:

- `healthy` — no CRITICAL/HIGH audit findings, test runner working, no high-severity Category A config gaps. Missing CI/AGENTS.md (Category B) does not affect this verdict.
- `needs-attention` — some Category A findings, all addressable. Typical: a few HIGH advisories, missing formatter, missing type strictness.
- `critical-issues` — CRITICAL audit findings, no test runner, or compounding high-severity Category A gaps.

## Body sections

In this exact order:

### `## Dependency Health`

Findings from Step 1 (pre-check). Three subsections:

#### `### Lockfile`

```
Status: <present (lockfile name) | missing>
Package manager: <npm | yarn | pnpm | bun | pip | poetry | uv | cargo | go | bundler | composer | dotnet | pub>
```

If missing, include the fix recommendation inline.

#### `### Security Audit`

```
Tool: <audit command used, or "skipped — <reason>">
Summary: <C> CRITICAL, <H> HIGH, <M> MODERATE, <L> LOW
Direct vs transitive: <breakdown if available, or "not distinguished by this tool">
```

If findings exist, list them grouped by severity:

```
#### CRITICAL findings

- **<package>** <version> — <advisory id>: <brief description>. Fix: update to <version>.

#### HIGH findings

- **<package>** <version> — <advisory id>: <brief description>. Fix: update to <version>.
```

MODERATE and LOW findings are listed without detail headers — count and one-line summary per finding.

If the audit was skipped (tool not installed or unsupported language):

```
Tool: skipped — no built-in audit tool for <language_family>
Recommended external tool: <ecosystem-specific recommendation>
```

If the audit failed to run:

```
Tool: <command>
Status: failed to run
Reason: <captured error>
```

#### `### Outdated Dependencies`

```
Packages with major version gaps: <N>
```

If any, list the most impactful (direct dependencies with 2+ major versions behind):

```
- **<package>**: <current> → <latest> (<N> major versions behind)
```

If the check was skipped or failed, note it.

### `## Test Suite`

Findings from Step 2a (in-check).

```
Test runner: <runner name | not detected>
Tests found: <N tests | unable to enumerate | not applicable>
Test execution: <passing | failing | not attempted>
```

If a test runner was detected, include details:

```
Configuration: <config file path>
Framework: <framework name and version if available>
```

If no test runner was detected:

```
⚠ No test runner detected. The agent cannot verify its own changes.
Recommended: <ecosystem-appropriate test runner recommendation with setup command>
```

### `## CI/CD`

Findings from Step 2b (in-check).

```
Provider: <GitHub Actions | GitLab CI | Jenkins | CircleCI | Cloud Build | Bitbucket Pipelines | Travis CI | not detected>
Configuration: <file path | not found>
```

Stage coverage table:

```
| Stage      | Status | Notes                                      |
|------------|--------|--------------------------------------------|
| Lint       | ✓/✗    | <tool name or "not configured">             |
| Test       | ✓/✗    | <runner name or "not configured">           |
| Build      | ✓/✗    | <build command or "not configured">         |
| Type check | ✓/✗    | <tool name or "not configured">             |
| Security   | ✓/✗    | <tool name or "not configured">             |
```

If no CI detected:

```
ℹ No CI/CD configuration detected. You'll set this up in the infrastructure and deployment lesson.
For now, a local test runner is sufficient for agent collaboration.
```

### `## Configuration`

Findings from Step 2c (in-check). List missing or incomplete configuration grouped by severity:

```
### High severity

- **<file>** — <why it matters>. Fix: <action>.

### Medium severity

- **<file>** — <why it matters>. Fix: <action>.

### Low severity

- **<file>** — <why it matters>. Fix: <action>.
```

If all expected configuration is present:

```
All expected configuration files present. No gaps detected.
```

### `## Stack Assessment Cross-Reference`

Present only when `context/foundation/stack-assessment.md` was loaded.

```
Stack assessment: context/foundation/stack-assessment.md
Agent readiness (from stack-assess): <ready | ready-with-compensation | significant-friction>
```

For each quality-gate gap identified in the stack assessment, note whether health-check findings reinforce or mitigate it:

```
| Quality Gate Gap      | Health-Check Finding                              | Status       |
|-----------------------|---------------------------------------------------|--------------|
| typed: fail           | No type-check in CI, tsconfig strict: false        | Reinforced   |
| convention_based: fail| CLAUDE.md present with routing conventions         | Mitigated    |
```

If no stack assessment was available:

```
No stack-assessment.md found. Run /10x-stack-assess for quality-gate analysis.
```

### `## Recommended Fixes`

Split into two subsections:

#### `### Fix before agent work (Category A)`

Prioritized list of findings the learner should address now. Each entry:

```
### <N>. <Finding title>

**Impact**: <why this matters for agent workflows>
**Severity**: <critical | high | medium | low>
**Effort**: <quick (< 5 min) | moderate (15–30 min) | significant (> 1 hour)>
**Fix**:

<concrete command or action — copy-pasteable where possible>
```

Ordering: security vulnerabilities > test runner > lockfile > audit findings > type strictness > formatter/linter > outdated deps > convenience config.

#### `### Addressed in upcoming lessons (Category B)`

Findings that are real but covered in later lessons. Each entry notes what is missing, why it matters, and which lesson addresses it. No urgency framing — these are expected gaps at this stage.

```
### <finding title>

**Lesson**: <lesson title>
**What you'll do there**: <one-sentence description of what the lesson covers>
```

Typical Category B items: missing CI/CD pipeline (infrastructure lesson), missing AGENTS.md/CLAUDE.md (agent onboarding lesson), missing deployment configuration (infrastructure lesson).

When the health-check runs standalone (outside the course chain), all findings go into a single ranked list without the A/B split. When running inside the 10xDevs course chain, enrich lesson references with titles and links per the mapping in SKILL.md.

### `## Summary`

One-paragraph verdict synthesizing all findings:

```
Health status: <healthy | needs-attention | critical-issues>

<2-3 sentence summary: key strengths, key gaps, and the overall picture for agent-assisted development.>

Next step: <context-appropriate recommendation — typically "address the high-priority fixes above, then proceed to agent onboarding" for brownfield, or "your project is healthy — proceed to agent onboarding" for clean reports.>
```

## What this schema does NOT specify

- **Versioning.** v1 has no schema-version field. Future changes either add fields (readers tolerate extras) or break the contract (a v2 marker lands here).
- **Machine-readable interchange format.** The report is markdown for human consumption. No JSON sidecar. If a future skill needs the data structured, it parses the markdown — the section headings above are stable enough to support that.
- **Cross-run history.** One file per run. Re-runs overwrite (or land at `health-check-v2.md` per the collision guard). Health-check does not maintain a chronological log.
- **Auto-fix execution.** The schema documents what to fix and how. It never runs fixes. That is the user's responsibility.
