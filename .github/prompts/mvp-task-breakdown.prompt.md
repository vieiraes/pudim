---
agent: ask
description: "Break down an editor feature into MVP tasks with acceptance criteria, dependencies, and test checklist."
---

# MVP Task Breakdown

You are planning work for the markdown visual editor project.

Feature: ${input:featureName:Name of the feature}
Constraint: ${input:constraint:Main technical or product constraint}

Produce:

1. A short feature goal.
2. Task list ordered for implementation in MVP format.
3. Acceptance criteria per task.
4. Test checklist per task.
5. Risks and fallback plan.

Rules:

- Follow AGENTS.md priorities and quality criteria.
- Keep tasks small enough to complete in one focused iteration.
- Mark dependencies explicitly.
- Use clear completion language so a coding agent can execute directly.
