# Art Direction Goal Prompt

Use this prompt when asking an agent or art model to restyle the game direction.

```text
Create an original late-1990s isometric post-apocalyptic CRPG art direction. Do not copy any exact assets, characters, UI, icons, maps, factions, or symbols from existing games. Capture only the period technique and mood: fixed orthographic isometric camera, low internal resolution, nearest-neighbor pixel scale, small realistic pre-rendered-style sprites, muted dusty palette, baked lighting, hard contact shadows, dirty hand-placed textures, heavy utilitarian UI, compact bitmap text, and grounded low-FPS animation.

Target technical style:
- internal resolution: 640x480 or 800x600
- tile size: 64x32 px isometric diamond or 48x24 px for tighter lo-fi scale
- human sprite height: 50–64 px native
- 8-direction facings: n/ne/e/se/s/sw/w/nw
- walk: 8–12 frames per direction, 10–12 fps, planted feet, no sliding
- idle: 4–8 frames, subtle breathing/weight shift only
- all sprites pixel-snapped, no smooth filtering, no bloom, no glossy PBR

Visual mood:
Dusty, dry, grim, quiet, morally ambiguous, tactile, decayed, old machinery mixed with ruined religious/industrial spaces. Use ash gray, rust brown, faded olive, dirty beige, oxidized metal, dried blood, dull amber candlelight, bone white, soot black.

Environment rules:
Floors have cracks, stains, chipped corners, dust paths, and story-driven debris. Walls are darker with grime at the base, chipped panels, rust streaks, and occlusion. Props are not cubes: they have top/side/front planes, bevels, chipped edges, straps, labels, nails, dark undersides, and contact shadows.

Character rules:
Characters are tiny realistic adults, not chibi or voxel. Small heads, narrow shoulders, readable boots, distinct arms/legs, layered clothes, belts, pouches, holsters, masks, backpacks, scarves, coats, robes, or armor plates. Faces are minimal pixel clusters. Silhouette matters more than detail.

UI rules:
Dark metal/leather/brass panels, thin aged borders, compact bitmap font, dull amber/tan text, old terminal/log feel, no modern vector UI, no mobile rounded panels.

Negative style:
No voxel art, no Minecraft bodies, no chibi, no anime faces, no glossy modern 3D, no neon cyberpunk, no clean vector UI, no over-zoomed camera, no smooth 60fps animation, no random uniform noise, no copied Fallout assets.
```
