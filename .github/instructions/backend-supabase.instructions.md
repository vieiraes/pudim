---
applyTo: "**/*.{ts,tsx,js,jsx,sql}"
description: "Use when: implementing Supabase auth, database, storage, RLS, and BFF routes for markdown documents and block persistence."
---

# Backend Supabase Instructions

## Architecture Rules

- Keep business rules in BFF endpoints, not in frontend components.
- Treat Supabase as source of truth for auth, document records, and media storage.
- Enforce row-level security for all document and block tables.

## Data Modeling

- Separate document metadata from block content records.
- Preserve stable ordering fields for blocks to support drag-and-drop persistence.
- Track update timestamps and actor identifiers for auditing.

## Security and Access

- Every read/write path must map to explicit ownership or collaboration checks.
- Never bypass RLS with service role usage in client-exposed paths.
- Validate payload shape at BFF boundary before persistence.

## API Conventions

- Design CRUD endpoints for documents, blocks, and media references.
- Return predictable error payloads with actionable messages.
- Keep API responses minimal but sufficient for editor rehydration.

## Quality Checks

- Add tests for authorization boundaries and document ownership.
- Cover block reorder persistence and conflict scenarios.
- Verify storage upload flow and URL association with markdown content.
