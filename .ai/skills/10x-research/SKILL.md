---
name: 10x-research
description: Research codebase comprehensively using parallel sub-agents
---

# Research Codebase

You are tasked with conducting comprehensive research across the codebase to answer user questions by spawning parallel sub-agents and synthesizing their findings.

## Initial Setup:

When this command is invoked, respond with:

```
I'm ready to research the codebase. Please provide your research question or area of interest, and I'll analyze it thoroughly by exploring relevant components and connections.
```

Then wait for the user's research query.

## Steps to follow after receiving the research query:

1.  **Read any directly mentioned files first:**
    *   If the user mentions specific files (tickets, docs, JSON), read them FULLY first (no limit/offset)
    *   **CRITICAL**: Read these files yourself in the main context before spawning any sub-tasks
    *   Read `context/foundation/lessons.md` if present and treat its entries as known-pattern priors when shaping the research areas — recurring rules already accepted by the team narrow what's worth re-investigating.

2.  **Analyze and decompose the research question:**
    *   Break down the user's query into composable research areas
    *   Take time to ultrathink about the underlying patterns, connections, and architectural implications the user might be seeking
    *   Identify specific components, patterns, or concepts to investigate
    *   Create research tasks using your AI coding assistant's task management features to track each research area (these appear in the user's status bar). Update them as each area completes.
    *   Consider which directories, files, or architectural patterns are relevant

3.  **Clarify research scope using the AI assistant's question-asking feature**:

    After decomposing the research question, ask the user to align on scope and focus before spawning sub-agents.

    **Rules for structuring questions:**
    *   Each question should have 2-4 concrete options (not vague)
    *   Add a clear `description` to each option explaining what it means for the research
    *   Keep `header` short (max 12 chars): "Scope", "Depth", "Focus"
    *   The user can always choose "Other" for free-form input
    *   Skip this step if the research query is unambiguous and tightly scoped

    **What to ask about** (pick 1-3 based on the query):
    *   **Scope**: How broadly to search — just this feature, or related systems too?
    *   **Depth**: Surface-level overview vs deep architectural dive
    *   **Focus areas**: Which specific aspects matter most (performance, patterns, history, integration points)
    *   **Output format**: Quick summary vs comprehensive research document

    **Example** — for an ambiguous query like "how does authentication work":
    Ask the user:
    - "How deep should this research go?"
      - Options:
        - "Quick overview": High-level flow, key files, entry points. ~10 min research.
        - "Detailed analysis": Full architecture, edge cases, security considerations. Comprehensive doc.
        - "Specific question": I have a focused question — I'll clarify what exactly I need.
    - "Which aspects matter most?"
      - Options:
        - "Architecture & patterns": How it's structured, design decisions, conventions used.
        - "Integration points": How it connects to other systems, API boundaries, data flow.
        - "History & evolution": How it changed over time, past decisions from `context/changes/**/` and `context/archive/**/`.

    For a clear, scoped query like "find all files using the TaskCreate tool":
    *   Skip asking questions entirely — the query is unambiguous.

4.  **Spawn parallel sub-agent tasks for comprehensive research:**
    *   Create multiple sub-agents to research different aspects concurrently

    Use your AI coding assistant's sub-agent or parallel task execution features:
    *   **Explore agent** (`subagent_type: "Explore"`) — fast file/pattern search, code structure analysis. Use for finding files, tracing code paths, searching for patterns.
    *   **general-purpose agent** (`subagent_type: "general-purpose"`) — deep analysis requiring reading many files and multi-step reasoning. Use for understanding complex systems.

    Spawn 2-4 agents in parallel in a single message for concurrent execution:
    *   Each focused on a specific research dimension
    *   Request specific file:line references in responses
    *   Example: one Explore for "find all files related to X", another for "find prior decisions about Y in `context/changes/**/` and `context/archive/**/`", a general-purpose for "analyze how Z system works"

5.  **Wait for all sub-agents to complete and synthesize findings:**
    *   IMPORTANT: Wait for ALL sub-agent tasks to complete before proceeding
    *   Compile results: prioritize live codebase findings, use `context/changes/**/` and `context/archive/**/` as supplementary historical context
    *   Connect findings across components with specific file:line references
    *   Answer the user's questions with concrete evidence and architectural patterns

6.  **Resolve change folder and gather metadata for the research document:**
    *   Determine the change-id:
        *   If invoked as `/10x-research <change-id>` and `context/changes/<change-id>/` exists, use it.
        *   Otherwise derive a kebab-case change-id from the topic and create the folder + `change.md` (mirroring `/10x-new` semantics) before writing.
        *   Refuse if the resolved path starts with `context/archive/` — print: "This change is archived. Open a new change with `/10x-new` instead." and STOP.
    *   Update `change.md`: set `updated: <today>` and, only if current `status` is `new`, advance to `status: preparing`.
    *   Filename: `context/changes/<change-id>/research.md` (single artifact per change).
    *   Generate the metadata listed below for the frontmatter.

7.  **Generate research document:**
    *   Use the metadata gathered in step 5
    *   Structure the document with YAML frontmatter followed by content:

        ```markdown
        ---
        date: [Current date and time with timezone in ISO format]
        researcher: [Researcher name]
        git_commit: [Current commit hash]
        branch: [Current branch name]
        repository: [Repository name]
        topic: "[User's Question/Topic]"
        tags: [research, codebase, relevant-component-names]
        status: complete
        last_updated: [Current date in YYYY-MM-DD format]
        last_updated_by: [Researcher name]
        ---

        # Research: [User's Question/Topic]

        **Date**: [Current date and time with timezone from step 5]
        **Researcher**: [Researcher name]
        **Git Commit**: [Current commit hash from step 5]
        **Branch**: [Current branch name from step 5]
        **Repository**: [Repository name]

        ## Research Question

        [Original user query]

        ## Summary

        [High-level findings answering the user's question]

        ## Detailed Findings

        ### [Component/Area 1]

        - Finding with reference ([file.ext:line](link))
        - Connection to other components
        - Implementation details

        ### [Component/Area 2]

        ...

        ## Code References

        - `path/to/file.py:123` - Description of what's there
        - `another/file.ts:45-67` - Description of the code block

        ## Architecture Insights

        [Patterns, conventions, and design decisions discovered]

        ## Historical Context (from prior changes)

        [Relevant insights from `context/changes/**/` and `context/archive/**/` with references]

        - `context/changes/<other-change>/plan.md` - Historical decision about X
        - `context/archive/YYYY-MM-DD-<other-change>/research.md` - Past exploration of Y

        ## Related Research

        [Links to other research artifacts under `context/changes/**/research.md` or `context/archive/**/research.md`]

        ## Open Questions

        [Any areas that need further investigation]
        ```

8.  **Add GitHub permalinks (if applicable):**
    *   Check if on main branch or if commit is pushed: `git branch --show-current` and `git status`
    *   If on main/master or pushed, generate GitHub permalinks:
        *   Get repo info: `gh repo view --json owner,name`
        *   Create permalinks: `https://github.com/{owner}/{repo}/blob/{commit}/{file}#L{line}`
    *   Replace local file references with permalinks in the document

9.  **Sync and present findings:**
    *   Present a concise summary of findings to the user
    *   Include key file references for easy navigation
    *   Ask if they have follow-up questions or need clarification

10. **Handle follow-up questions:**

    *   If the user has follow-up questions, append to the same research document
    *   Update the frontmatter fields `last_updated` and `last_updated_by` to reflect the update
    *   Add `last_updated_note: "Added follow-up research for [brief description]"` to frontmatter
    *   Add a new section: `## Follow-up Research [timestamp]`
    *   Spawn new sub-agents as needed for additional investigation
    *   Continue updating the document and syncing

## Important notes:

*   Use parallel sub-agents for efficiency — main agent synthesizes, sub-agents do deep reading
*   Sub-agent prompts should be specific, read-only, requesting file:line references and usage patterns (not just definitions)
*   Always run fresh codebase research; use `context/changes/**/` and `context/archive/**/` as supplementary historical context
*   Research documents should be self-contained with file paths, line numbers, cross-component patterns, and temporal context
*   Link to GitHub permalinks when possible for permanent references
*   **Research scoping**: Ask the user to clarify scope/depth/focus before spawning agents, unless the query is already tight and unambiguous
*   **Progress tracking**: Use your AI coding assistant's task management features at the start to create research area tasks, and update them to mark them completed — this gives the user visible progress in their status bar
*   **File reading**: Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks
*   **Critical ordering**: Follow the numbered steps exactly
    *   ALWAYS read mentioned files first before spawning sub-tasks (step 1)
    *   ALWAYS wait for all sub-agents to complete before synthesizing (step 5)
    *   ALWAYS gather metadata before writing the document (step 6 before step 7)
    *   NEVER write the research document with placeholder values
*   **Frontmatter consistency**: Always include YAML frontmatter, keep fields consistent across documents, use snake_case for multi-word fields, update when adding follow-up research