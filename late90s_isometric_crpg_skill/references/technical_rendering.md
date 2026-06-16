# Technical Rendering Reference

## Rendering stack

Recommended rendering approach:

```text
Native canvas:         640x480 or 800x600
Game render:           low-res render target
Final upscale:         integer nearest-neighbor
Sprite filtering:      nearest/point
Compression:           none for source sprites if possible
Camera:                orthographic
Camera movement:       pixel-snapped
Sprite movement:       pixel-snapped at final presentation
Lighting:              baked or fake-baked, not glossy realtime
```

## Engine-independent pixel rules

- Render to a fixed low-resolution target.
- Upscale the entire frame, not individual assets at arbitrary scales.
- Use nearest-neighbor/point filtering.
- Disable texture compression for small sprites when possible.
- Disable mipmaps for pixel sprites unless intentionally using special distant LOD rules.
- Disable or heavily restrict antialiasing.
- Avoid fractional scale factors.
- Avoid subpixel camera positions.
- Avoid smooth post-processing that blurs pixel edges.

## Unity notes

Use Unity's pixel-art conventions:

- Sprite Filter Mode: Point.
- Compression: None.
- Consistent Pixels Per Unit.
- Pixel Perfect Camera if using the 2D Pixel Perfect package.
- Orthographic camera.
- Avoid bilinear filtering and post-processing blur.

## Godot notes

Use Godot pixel-art conventions:

- Use nearest texture filtering.
- Snap 2D transforms to pixel where appropriate.
- Use a low-resolution viewport and scale the viewport.
- Avoid fractional scaling.
- Disable smoothing on imported textures.

## 3D-to-2D pre-rendered pipeline

This pipeline best matches the late-90s CRPG look.

1. Model a character or prop in 3D.
2. Keep forms simple but detail-rich in silhouette.
3. Texture with muted hand-painted materials.
4. Use a fixed orthographic camera.
5. Use a fixed light rig matching the game world.
6. Render 8 directions.
7. Render animation frames to transparent PNG.
8. Downsample to final sprite size.
9. Reduce colors/dither if desired.
10. Hand-clean silhouettes, hands, face, weapons, and feet.
11. Add or adjust ground shadow.
12. Pack into sprite sheet.
13. Test in actual game scene at native resolution.

## Orthographic sprite camera

For 3D-rendered sprites:

```text
Projection: orthographic
Rotation:   match isometric direction set
Lighting:   fixed key + ambient + optional rim
Output:     transparent PNG sequence
Scale:      locked per character class
```

Use the same camera and light rig for every character in a character set.

## Direction rendering

Render these facings:

```text
n, ne, e, se, s, sw, w, nw
```

Do not rely on pure mirroring for final art. Mirroring may start production, but adjust asymmetrical details manually.

## Depth sorting

Sort by ground pivot/base point, not sprite center.

Recommended pivot:

```text
Human pivot: bottom-center between feet
Prop pivot:  ground-contact center or front-bottom contact point
Door pivot:  threshold/base line
Wall pivot:  base edge or split sections
```

Tall objects may need:

- split sprites
- manual sorting anchors
- cutaway masks
- player occlusion transparency

## Tile projection

Classic 2:1 diamond tile:

```text
Tile width:  64 px
Tile height: 32 px
```

Coordinate conversion example:

```text
screen_x = (tile_x - tile_y) * tile_width / 2
screen_y = (tile_x + tile_y) * tile_height / 2
```

This is a production convention, not a requirement to copy any specific game.

## Asset export formats

Recommended:

```text
Sprites:       PNG sequence or packed PNG sprite sheet
Metadata:      JSON or engine-native animation data
Palettes:      PNG/ASE palette files where useful
Source art:    PSD/ASE/BLEND files kept separately
UI:            PNG panels + bitmap font files
```

## Sprite sheet packing

For each sprite sheet, store:

- animation name
- direction
- frame count
- frame size
- pivot
- playback FPS
- loop flag
- shadow included or separate
- event frames such as muzzle flash, hit, footstep, impact

## File naming

Recommended naming:

```text
char_player_walk_se_000.png
char_player_walk_se_001.png
char_guard_idle_n_000.png
prop_crate_wood_banded_01.png
tile_chapel_floor_cracked_03.png
ui_panel_log_bottom_01.png
fx_candle_flame_02.png
```

## Low-resolution lighting effects

For light pools:

- create low-resolution masks
- band or dither the gradient
- tint subtly
- avoid smooth high-res radial glow
- let local lights affect mood more than visibility

## Performance notes

A classic-style game can have many sprites on screen. Keep these efficient:

- batch static tiles
- atlas props
- atlas characters by set
- keep animation frame counts deliberate
- avoid per-pixel dynamic lights unless stylized and cheap
- pre-bake shadows when possible

## Screenshot test

Always test at native resolution first.

Open the game at internal 640x480 or 800x600 and ask:

- Are pixels crisp?
- Is anything blurry?
- Is any sprite scaled differently?
- Are UI fonts consistent?
- Do characters look grounded?
- Does the world read before details?
