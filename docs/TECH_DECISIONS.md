# Technical Decisions

This file records why the project uses certain technical choices. Update it whenever the repo adopts a new dependency, rendering approach, build tool, or major architecture change.

## Decision 001: Browser JavaScript modules

**Choice:** Use standard browser JavaScript modules under `src/`.

**Why:**

- Easy to run locally.
- No build step required at the start.
- Good enough for early prototypes and vertical slices.
- Keeps the project understandable.

**Tradeoff:**

- No TypeScript checking yet.
- No bundling/minification yet.
- Some browser module paths must be explicit.

**Review later when:**

- The codebase becomes large enough that type checking prevents real bugs.
- Build optimization matters.
- Asset bundling becomes necessary.

## Decision 002: Canvas 2D first

**Choice:** Use Canvas 2D rendering.

**Why:**

- Fits pixelated top-down RPG graphics.
- Simple mental model.
- No engine lock-in.
- Enough for tile maps, sprites, UI, and tactical combat.

**Tradeoff:**

- More custom work than using a game engine.
- Animation and camera systems must be built intentionally.
- Very large maps may need batching/culling later.

**Review later when:**

- Rendering performance becomes a bottleneck.
- Lighting/shader effects become essential.
- The game needs complex animation tooling.

## Decision 003: No dependency by default

**Choice:** Start with no runtime dependencies.

**Why:**

- Prevents dependency bloat.
- Keeps local hosting simple.
- Makes the architecture visible instead of hidden inside frameworks.

**Tradeoff:**

- We must write basic systems ourselves.
- Some tooling conveniences are missing early.

**Rule:**

Any new package must be justified in this file with:

- Package name.
- Problem it solves.
- Why simple code cannot solve it.
- Risks or lock-in.

## Decision 004: Data-driven content

**Choice:** Keep maps, actors, enemies, and future content in `data/`.

**Why:**

- Allows non-engine content editing.
- Prevents hardcoded quest/enemy sprawl.
- Makes validation possible.
- Helps AI assistants safely add content without touching engine code.

**Tradeoff:**

- Need content loaders and validators.
- JSON schemas must be documented.

## Decision 005: No full ECS yet

**Choice:** Use simple classes/objects for now, not a full Entity Component System.

**Why:**

- The early game does not need ECS complexity.
- A small RPG prototype benefits from direct, readable code.
- Premature ECS often creates boilerplate before gameplay exists.

**Review later when:**

- Many entity types share complex composable behavior.
- Status effects, equipment, AI, and interactions become difficult to model directly.

## Decision 006: Local static server

**Choice:** Use `scripts/serve.mjs`, a small Node static server.

**Why:**

- Browser modules generally need HTTP serving instead of opening `index.html` directly.
- Avoids installing Vite or another dev server at the start.
- Keeps `npm run dev` simple.

**Tradeoff:**

- No hot reload.
- No bundling.
- No dev overlay.

**Review later when:**

- Hot reload would save significant time.
- Asset processing is needed.
- TypeScript/bundling is adopted.

## Decision 007: Runtime-baked isometric pixel art

**Choice:** Keep the current slice's art as Canvas 2D runtime-baked sprites and props, drawn at native 640x480 scale.

**Why:**

- The playable slice can establish scale, camera distance, animation timing, and palette before external asset production begins.
- Runtime-baked frames keep all current assets original and inspectable in source.
- Eight-facing actors and hard-banded lighting can be tested without adding a build step.

**Current constraints:**

- Use 64x32 isometric floor diamonds and a 384 px world viewport.
- Draw actor frames at native pixel resolution. Do not smooth-scale sprite sheets.
- Keep movement frame-quantized so walking reads as low-fps isometric CRPG animation.
- If the project later imports PNG sprite sheets, they must match the same pivot, frame count, facing names, and nearest-neighbor render rules.

**Review later when:**

- A real asset pipeline exports PNG sheets from an art tool.
- Sprite memory or startup bake time becomes a measurable problem.
- Animation authoring needs per-frame metadata that is too awkward to keep in code.
