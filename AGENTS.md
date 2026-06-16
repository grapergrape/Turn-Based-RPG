# Agent Instructions

These instructions apply to the entire repository.

## Required Reading

Before making changes, AI development agents must read:

1. `README.md`
2. `.ai/README.md`
3. Relevant files in `.ai/memory/`
4. Relevant files in `docs/`

## Documentation Requirements

Every development agent must document meaningful work. For each session:

- Add or update a log entry under `.ai/logs/`.
- Update `.ai/memory/` when durable facts, systems, content, or project direction change.
- Update `docs/` when changing story, characters, quests, enemies, items, combat, progression, maps, art/audio direction, or technical architecture.
- Add an ADR-style decision file under `.ai/decisions/` for major design, content-structure, or technical decisions.

## Style Guidelines

- Use Markdown for documentation.
- Keep headings descriptive and consistent.
- Prefer small, focused changes.
- Do not introduce undocumented gameplay, narrative, or architecture changes.
- Include open questions when decisions are incomplete.
- Keep project memory concise, durable, and useful for future agents.

## Testing and Handoff

When implementing code or content pipelines, include testing or verification notes in the session log and final handoff. If no automated tests exist, document manual checks or explain why verification was not applicable.
