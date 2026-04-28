---
name: plan-feature-slice
description: "Create a vertical-slice implementation plan for this markdown editor. Use when user asks to plan a feature, break down tasks, define acceptance criteria, or sequence delivery."
---

# Plan Feature Slice

Create a concise implementation plan for one feature slice aligned with project rules in AGENTS.md.

## Inputs To Ask Or Infer

- Feature name and user outcome.
- Scope limits for this slice.
- Dependencies on existing components or data model.
- Definition of done.

## Required Output Structure

1. Objective in one sentence.
2. Scope in and scope out.
3. Tasks split by layer:
   - UI and interaction
   - State and serialization
   - Backend and persistence
   - Tests and validation
4. Acceptance criteria checklist.
5. Risks and mitigations.
6. Suggested delivery order in small commits.

## Rules

- Keep each task actionable and testable.
- Prefer incremental delivery over broad refactors.
- Include at least one parser/serializer validation when markdown behavior is affected.
- Include at least one access/security check when persistence is affected.

## Example Trigger Phrases

- plan this feature
- break this into tasks
- create vertical slice plan
- define acceptance criteria
