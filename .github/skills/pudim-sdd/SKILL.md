---
name: pudim-sdd
description: "Run Pudim Spec-Driven Development workflow. Use when: creating a new spec, decomposing into tasks, validating acceptance criteria, and closing a task in STATUS.md."
---

# Pudim SDD

Use this workflow to execute one task with specification first, implementation second.

## Inputs

- Task ID (ex.: TASK-001)
- Task title
- Scope constraints
- Main risk

## Workflow

1. Create spec pack at pudim/specs/TASK-XYZ/:
   - SPEC.md
   - TASKS.md
   - VALIDATION.md
2. Fill SPEC with objective, in-scope, out-of-scope, acceptance criteria, and risks.
3. Break work in TASKS with dependencies and execution order.
4. Implement only after SPEC status is Approved.
5. Fill VALIDATION with evidence for each acceptance criterion.
6. Update STATUS.md checkbox when validation passes.

## Mandatory Rules

- No implementation starts before SPEC is Approved.
- No task closes without VALIDATION evidence.
- Keep scope aligned with AGENTS.md priorities.
- Keep each subtask small and testable.

## Output Format

1. Spec summary
2. Task breakdown summary
3. Validation outcome
4. STATUS.md update recommendation
