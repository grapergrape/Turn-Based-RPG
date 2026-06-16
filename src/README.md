# `src/` Source Code Guide

Runtime JavaScript lives here.

Keep this folder clean. Do not put lore documents, map JSON, sprites, audio, or generated files in `src/`.

## Folder responsibilities

```text
src/
├── main.js       # Tiny entry point
├── core/         # Game orchestration, loop, input, loading
├── render/       # Canvas rendering and visual presentation
├── world/        # Grid, maps, collision, pathfinding later
├── combat/       # Turn order, actions, status effects later
├── entities/     # Entity/actor classes and state models
└── util/         # Tiny general helpers only
```

## Rules

- `main.js` should stay small.
- Systems should not know more lore than they need.
- Rendering draws state; it does not decide rules.
- Combat decides combat results; it does not draw UI.
- Content should come from `data/`, not hardcoded objects.
- Use named exports unless a module truly has one main class.
