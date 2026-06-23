# Refactor Checklist

Goal: keep the game easier to extend without changing gameplay behavior during extraction.

## Size Targets

- `src/core/Game.js`: target under 2,000 lines.
- `src/render/UIRenderer.js`: target under 600 lines.
- `src/render/PixelPrimitives.js`: split by art category, with no single primitive module over roughly 1,000 lines.
- `src/render/SpriteAtlas.js`: split actor baking from appearance rules.

## Validation Cadence

Before each extraction slice:

```bash
npm run check
npm test
```

After each extraction slice:

```bash
npm run check
npm test
```

## Phase Order

1. Extract low-risk runtime systems from `Game.js`.
2. Split UI rendering behind the existing `UIRenderer.js` facade.
3. Split pixel art primitives behind the existing `PixelPrimitives.js` facade.
4. Split sprite baking behind the existing `SpriteAtlas.js` facade.
5. Split the content validator after runtime and render files are smaller.
6. Add tutorial-path regression harnesses as cheap Node tests.

## Extraction Rules

- Do not rewrite gameplay during extraction.
- Keep `Game.js` as the coordinator.
- Keep current data formats unless a format is actively hurting content work.
- Keep facade files where useful so imports stay stable.
- Do not add a framework, ECS, TypeScript migration, or new dependency as part of this work.
- Split by gameplay or rendering responsibility, not by generic helper type.
