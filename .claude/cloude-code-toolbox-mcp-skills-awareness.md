# Cloude Code ToolBox — MCP & Skills awareness

_Generated: 2026-08-07T22:15:11.440Z_

## How to use this report

- **Saved copy:** This file is **`.claude/cloude-code-toolbox-mcp-skills-awareness.md`** — refreshed whenever the toolbox runs an MCP & Skills scan (including on workspace open when auto-scan is enabled). It is meant for **Claude Code workspace context** together with `CLAUDE.md` (which gets a shorter replaceable summary when auto-merge is on).
- **MCP:** Lists **configured** servers from Claude Code config (`~/.claude.json` for user scope, `.mcp.json` for project scope). Use `/mcp` in the Claude Code panel to connect servers for your session.
- **Skills:** **On-disk** folders with `SKILL.md`. Claude Code does not auto-load them; attach `SKILL.md` or paths in chat when useful.
- **Task routing:** When the user’s request matches a server’s purpose (e.g. Confluence → Confluence/Atlassian MCP), prefer that **server id** from the tables below.

---

## MCP — workspace

Workspace `mcp.json` _(folder: pudim-framework-desenvolvimento)_

- **/home/bruno_vieira/projects/gh/bruno/pudim-framework-desenvolvimento/.mcp.json** — _File missing_

_No active workspace servers in mcp.json._

## MCP — user profile

- **/home/bruno_vieira/.claude.json** — _File exists — no servers defined_

_No active user-scoped servers in mcp.json._

## Skills (local `SKILL.md` folders)

### Project-scoped

- **plan-feature-slice** — `/home/bruno_vieira/projects/gh/bruno/pudim-framework-desenvolvimento/.github/skills/plan-feature-slice`
  - Create a vertical-slice implementation plan for this markdown editor. Use when user asks to plan a feature, break down tasks, define acceptance criteria, or sequence delivery.

- **pudim-sdd** — `/home/bruno_vieira/projects/gh/bruno/pudim-framework-desenvolvimento/.github/skills/pudim-sdd`
  - Run Pudim Spec-Driven Development workflow. Use when: creating a new spec, decomposing into tasks, validating acceptance criteria, and closing a task in STATUS.md.

### User-scoped

_No user skills shown as **on** in the hub (folders may still be on disk)._

_User skills **off** in hub (still on disk until Turn ON in hub):_

- **find-skills** — `/home/bruno_vieira/.agents/skills/find-skills`
  - Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used w

- **generic-react-ux-designer** — `/home/bruno_vieira/.agents/skills/generic-react-ux-designer`
  - Professional UI/UX design expertise for React applications. Covers design thinking, user psychology (Hick's/Fitts's/Jakob's Law), visual hierarchy, interaction patterns, accessibility, performance-driven design, and desi

- **postman-collection-generator** — `/home/bruno_vieira/.agents/skills/postman-collection-generator`
  - Generates Postman collection JSON files from Express, Next.js, Fastify, Hono, or other API routes. Scans route definitions, extracts endpoints, methods, params, and creates importable collections. Use when users request 

- **prd-writer** — `/home/bruno_vieira/.agents/skills/prd-writer`
  - Generate comprehensive product requirements documents. Use when starting a new feature or product initiative and need structured documentation.


---

## Suggested next steps

- **MCP:** Use this extension’s hub **MCP** tab, or `claude mcp list` in the terminal. In Claude Code, use `/mcp` to connect servers for the session.
- **Edit config:** Open `~/.claude.json` (user MCP) or `<workspace>/.mcp.json` (project MCP) via the extension commands.
- **Refresh this report:** run **Intelligence — scan MCP & Skills awareness** again after changing MCP config or adding skills.

_Report from Cloude Code ToolBox extension._
