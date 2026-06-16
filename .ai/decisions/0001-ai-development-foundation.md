# 0001 — AI Development Foundation

## Status

Accepted

## Context

The project is an early turn-based RPG repository with no established structure for AI-assisted development, durable memory, or game design documentation.

## Decision

Create a repository foundation with:

- `.ai/` for agent memory, logs, and decisions
- `docs/` for game design, content, systems, maps, art/audio, and technical documentation
- `AGENTS.md` for mandatory agent workflow rules
- `README.md` for project onboarding

## Consequences

Future agents have a clear place to record what they do, update project memory, and document game content. This adds documentation overhead, but it reduces context loss and improves consistency across AI-assisted development sessions.
