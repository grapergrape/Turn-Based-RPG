# Art and Audio Direction

Use this folder to document visual style, animation needs, UI direction, sound effects, music, and asset pipeline conventions.

## Visual direction

The current slice targets an original late-1990s isometric post-apocalyptic CRPG look:

- Fixed 640x480 internal canvas, upscaled through CSS with integer nearest-neighbor scaling.
- 64x32 isometric floor diamonds, 64 px wall height, and a 384 px world viewport above a 96 px command panel.
- Runtime-drawn original sprites and props. No external copied art, palette, UI frame, map, icon, or character design.
- Small human actors: Mara is baked at 42x62 px, the cutthroat at 44x64 px, and the Host-touched penitent at 52x68 px.
- Actor sprite states use eight facings, four idle frames, eight walk frames, six attack frames, four hit frames, one interact set, and ten death frames.
- Movement is quantized to the walk frames. The renderer snaps sprite positions to whole pixels.
- Floors use dirty stone diamonds with localized grime near walls and props, not uniform speckle.
- Lighting uses hard-banded candle pools, contact shadows, edge darkening, and no bloom or smooth post-processing.
- UI uses aged brown/black panels with brass borders, rivets, scratched inset panes, amber bitmap text, AP pips, a message log, player status, command hints, a field pack inventory screen, a readout panel, hover text, and drawn old-CRPG cursor states.

## Current prop set

Level data can use these rendered object kinds: `broken-pew`, `rusted-reliquary`, `field-satchel`, `corpse`, `quarantine-sign`, `damaged-altar`, `host-growth`, `candle-cluster`, `rubble-pile`, `rusted-crate`, `cracked-column`, `quarantine-barricade`, `blood-stain`, `floor-crack`, `rubble-decal`, `glass-debris`, `dust`, `road-dust`, `scorch-mark`, and `wax-stain`.
