#!/bin/bash
set -e
REF="${1:?Usage: ./fetch-lesson.sh m1l1}"
./node_modules/.bin/10x get "$REF" --tool generic

# Sync skills to opencode location
mkdir -p .opencode/skills
for skill_dir in .ai/skills/*/; do
  [ -d "$skill_dir" ] || continue
  name=$(basename "$skill_dir")
  cp -R "$skill_dir" ".opencode/skills/$name"
done

# Sync rules to OPENCODE.md
if [ -f AGENTS.md ]; then
  cp AGENTS.md OPENCODE.md
fi

echo "Done. Skills synced to .opencode/skills/"
