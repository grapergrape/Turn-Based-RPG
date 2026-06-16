# Turn-Based RPG

A turn-based role-playing videogame project prepared for collaborative human and AI development. The game concept, engine choice, story, systems, enemies, items, maps, and production process will evolve through documented design work.

## Current Status

The repository is in early foundation setup. Before gameplay implementation begins, this repo establishes documentation, memory, and agent workflow conventions so future contributors can build consistently.

## Repository Structure

```text
.ai/                 AI agent workspace, durable memory, logs, and decisions
docs/                Game design, story, content, systems, and technical documentation
README.md            Project overview and contributor entry point
AGENTS.md            Required workflow instructions for AI development agents
```

## AI Development Workflow

All AI or human-assisted development sessions must:

1. Read relevant `.ai/memory/` files before making changes.
2. Document work in `.ai/logs/` using the provided template style.
3. Update durable memory when project facts, design decisions, systems, or content change.
4. Update `docs/` whenever story, enemies, items, systems, maps, quests, art direction, audio direction, or technical architecture changes.
5. Add decision records under `.ai/decisions/` when introducing major conventions or architectural/design choices.

## Getting Started

The engine and runtime have not been selected yet. Once chosen, update:

- `docs/technical/README.md`
- `.ai/memory/project.md`
- `.ai/memory/systems.md`
- this README

## Documentation Entry Points

- Story and worldbuilding: `docs/story/`
- Enemies and bosses: `docs/enemies/`
- Items and equipment: `docs/items/`
- Gameplay systems: `docs/systems/`
- Maps and locations: `docs/maps/`
- Art and audio direction: `docs/art-audio/`
- Technical architecture: `docs/technical/`
- Reusable content templates: `docs/templates/`
