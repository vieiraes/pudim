---
applyTo: "**/*.{ts,tsx,js,jsx,css,scss,html,vue}"
description: "Use when: building editor UI, block interactions, toolbar formatting, keyboard shortcuts, drag and drop, and live preview behavior."
---

# Frontend Editor Instructions

## Product Focus

- Preserve the block-first editing model.
- Keep UI-driven interactions as default path for formatting and insertion.
- Ensure every visual action maps to valid Markdown output.

## Implementation Rules

- Prefer React + Vite unless a task explicitly requests Vue.
- Build features as vertical slices: UI state, serialization impact, and preview sync together.
- Avoid adding heavy UI libraries unless they reduce complexity materially.
- Keep drag-and-drop deterministic and stable after reordering.
- Do not regress keyboard navigation or focus behavior.

## UX Baseline

- Toolbar actions must provide immediate visible feedback.
- Live preview should update without manual refresh.
- Common actions need keyboard shortcuts and discoverable tooltips.
- Respect responsive behavior on desktop and mobile widths.

## Quality Checks

- Validate Markdown serialization for headings, emphasis, lists, links, images, quotes, and code.
- Confirm block reorder does not corrupt content.
- Add or update focused tests for parser/serializer and ordering logic when touched.
