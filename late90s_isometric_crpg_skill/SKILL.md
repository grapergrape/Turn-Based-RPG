---
name: late90s-isometric-crpg
version: 1.0.0
description: Use when designing, writing, reviewing, or implementing an original late-1990s isometric post-apocalyptic CRPG: fixed isometric camera, low-resolution pre-rendered-style sprites, gritty textures, grounded 8-direction animation, old CRPG UI, branching quests, and IP-safe Fallout-era inspiration.
---

# Late-90s Isometric Post-Apocalyptic CRPG Skill

## When to use this skill

Use this skill when the user wants any of the following:

- A game that feels like an original late-1990s isometric post-apocalyptic CRPG.
- Art direction close to the era and presentation of classic Fallout-like CRPGs without copying protected IP.
- Guidance for isometric camera, sprite scale, pixelation, low-resolution rendering, character models, textures, props, UI, animation, quests, and writing.
- Review of screenshots, sprite sheets, walk cycles, tilesets, inventory UI, dialogue, quests, or combat readability.
- Production prompts for image generation, 3D-to-2D sprite rendering, tileset creation, NPC design, or UI design.

Do not use this skill to reproduce exact copyrighted game assets, UI, characters, maps, icons, symbols, dialogue, or faction designs. The target is original work with period-authentic technique and mood.

## Core result

Every output should push the project toward this target:

> A crisp, low-resolution, fixed-isometric, late-1990s post-apocalyptic CRPG with small realistic human sprites, baked lighting, dirty hand-placed textures, hard contact shadows, muted colors, low-FPS grounded animation, heavy utilitarian UI, branching dialogue, and consequences-driven quests.

## Main references to load only when needed

Read the following files as needed:

- `references/style_targets.md` — visual target, camera, scale, palette, environment, UI.
- `references/technical_rendering.md` — resolution, pixel snapping, engine settings, sprite export, depth sorting.
- `references/character_animation.md` — character construction, 8-direction sprites, walk cycles, idles, combat animation.
- `references/writing_and_quest_design.md` — tone, dialogue, quests, NPCs, factions, consequences.
- `references/ip_safety.md` — how to use classic CRPG references safely without copying.
- `references/source_bibliography.md` — public references and production sources.
- `checklists/screenshot_review.md` — use when reviewing a screenshot.
- `checklists/asset_definition_of_done.md` — use when approving sprites, props, tiles, UI, FX.
- `checklists/animation_qc.md` — use when reviewing walk cycles, attacks, death, idles.
- `prompts/` — use when generating art prompts, task prompts, or production prompts.
- `schemas/` — use when creating structured asset specs.

## Non-negotiable style laws

1. Use a fixed orthographic isometric presentation.
2. Target a low internal resolution such as 640x480 or 800x600, then upscale with nearest-neighbor/integer scaling.
3. Disable smoothing, bilinear filtering, texture filtering, motion blur, bloom-heavy lighting, and glossy modern post-processing.
4. Characters must be small, readable, and realistically proportioned, not chibi or blocky.
5. Human sprites should feel like downsampled pre-rendered 3D or carefully hand-painted pixel sprites.
6. Use 8-direction sprites whenever possible.
7. Walk cycles must have planted feet and no sliding.
8. All objects need believable contact shadows.
9. Dirt, grime, cracks, blood, dust, and damage must be hand-placed and story-driven, not random noise.
10. UI must feel like old machinery, terminal panels, oxidized metal, dark leather, brass borders, or heavy CRPG interface panels.
11. Writing must support branching choices, skill checks, moral ambiguity, and consequences.
12. Never copy exact Fallout assets, UI frames, Pip-Boy designs, Vault symbols, faction names, characters, maps, or dialogue.

## Visual defaults

Use these values unless the project already has stronger constraints:

```text
Internal resolution:        640x480 or 800x600
Output scale:               2x, 3x, or 4x nearest-neighbor
Ground tile:                64x32 px isometric diamond
Alternate ground tile:      48x24 px for tighter lo-fi scale
Human sprite height:        50–64 px native
Human sprite width:         32–48 px native
Head height:                7–10 px native
Ground shadow:              24–36 px wide, 10–18 px tall
Walk cycle:                 8–12 frames per direction
Walk playback:              10–12 fps normal, 6–8 fps heavy
Idle cycle:                 4–8 frames, subtle breathing only
Directions:                 n, ne, e, se, s, sw, w, nw
Sprite pivot:               bottom-center between feet
Depth sorting:              base/pivot point, not sprite center
Palette:                    muted browns, ash gray, olive, rust, bone, dull amber, dried red
Lighting:                   baked-looking, hard/dithered shadows, warm local pools
```

## How to respond when reviewing art

When reviewing an image or screenshot:

1. Identify the current style clearly.
2. Compare it against the late-90s isometric CRPG target.
3. Call out the highest-impact mismatches first.
4. Separate fixes into camera, character scale, sprite construction, environment texture, lighting, props, UI, and animation.
5. Give concrete numeric targets where possible.
6. Include a short production checklist.
7. Avoid vague praise. Be useful and direct.
8. Do not tell the user to simply “make it more Fallout.” Translate the goal into original, actionable production rules.

## How to respond when generating prompts

When writing art-generation or task prompts:

- State that the work must be original and not copied from any existing IP.
- Describe the era and rendering method, not exact copyrighted designs.
- Include camera angle, internal resolution, tile size, character pixel height, palette, lighting, texture rules, UI rules, and animation requirements.
- Include negative prompts: no voxel, no chibi, no modern smooth 3D, no glossy PBR, no neon, no mobile UI, no copied icons.
- Include acceptance criteria.

## How to respond when designing assets

When designing an asset, always specify:

- purpose in gameplay
- native pixel size
- silhouette requirements
- material palette
- texture detail
- lighting direction
- contact shadow
- variants needed
- animation states if any
- interaction states if any
- export format and pivot
- definition of done

## How to respond when designing characters

Characters must be built around silhouette first.

For every human NPC or player character, specify:

- faction/function
- readable silhouette at gameplay zoom
- body proportions
- clothing layers
- gear and asymmetry
- palette ramps
- sprite directions
- idle animation
- walk animation
- interaction/combat animation requirements
- corpse sprite if death is possible
- portrait requirements if applicable

## How to respond when designing quests

Every important quest should support multiple solution paths.

Minimum quest design:

- premise
- location
- conflict
- involved NPCs/factions
- clues visible in environment
- at least three solution paths
- at least one non-combat solution
- at least one skill check
- reward/consequence options
- journal text
- inspection text
- failure states
- world-state changes

## Art review severity scale

Use this scale when useful:

```text
S0: Style-breaking — must fix before expanding content.
S1: Major mismatch — fix during current pass.
S2: Noticeable issue — fix before vertical slice.
S3: Polish issue — fix after core read is correct.
S4: Optional flavor — only if time allows.
```

## Definition of success

A screenshot succeeds when:

- It looks like it could plausibly belong to an original late-1990s isometric CRPG.
- The player is small, grounded, and readable.
- The world feels large, dusty, aged, and tactical.
- The UI feels heavy, old, and functional.
- The animation feels frame-based, grounded, and deliberate.
- The game remains visually original and does not copy protected designs.
