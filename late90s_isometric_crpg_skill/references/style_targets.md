# Style Targets

## Target phrase

Original late-1990s isometric post-apocalyptic CRPG.

This means:

- fixed isometric camera
- low internal resolution
- high screen density
- small realistic characters
- pre-rendered-style sprites
- dirty tile-based environments
- muted palette
- baked lighting
- hard shadows
- heavy UI
- branching quest presentation

It does not mean direct copying of Fallout, Fallout 2, or any other protected game.

## Screenshot read

The screen should feel like a tactical diorama viewed from above at an oblique angle. Characters should be important but not huge. The environment should dominate the frame.

A good screenshot has:

- room layout readable at a glance
- character silhouettes readable within 1 second
- interactable objects slightly emphasized through contrast or placement
- environmental story implied by prop placement
- dark corners and light pools
- gritty low-resolution texture
- no modern smoothing

## Camera

Use a fixed orthographic isometric camera.

Recommended target:

```text
Projection: orthographic
Tile projection: 2:1 isometric diamond
Tile size: 64x32 px or 48x24 px
Visible area: 10–16 tile rows deep, 14–24 tile columns wide
Camera movement: pixel-snapped
Zoom: fixed or limited to one/two approved scales
```

Avoid:

- close-up action camera
- smooth rotating camera
- dramatic 3D perspective
- large characters filling the screen
- over-the-shoulder view

## Resolution

Preferred internal resolutions:

```text
640x480  = strongest late-90s CRPG feel
800x600  = more detail while still period-authentic
960x540  = acceptable widescreen compromise if pixel discipline is strict
```

The final output can be larger, but only through nearest-neighbor/integer upscale.

## Pixel scale

Everything must use one consistent pixel scale.

Do not mix:

- pixelated characters with high-resolution UI
- high-res lighting with low-res tiles
- chunky voxel props with pre-rendered-style humans
- smooth modern icons with dirty CRPG panels
- tiny 1x details with oversized 4x details in the same scene

## Character screen scale

Recommended native human scale:

```text
Height:        50–64 px
Width:         32–48 px
Head:          7–10 px tall
Shoulders:     16–24 px wide
Shadow:        24–36 px wide, 10–18 px tall
```

The head should be small. The silhouette should carry the identity.

## Palette

Use low-saturation post-apocalyptic colors.

Primary colors:

- ash gray
- dark umber
- dusty brown
- dried blood red
- faded olive
- sickly tan
- dirty beige
- old bone
- oxidized metal
- rust orange
- dull amber
- blackened steel

Accent colors should be rare.

Possible accent colors:

- red armband
- dull brass badge
- yellow hazard stripe
- green terminal glow
- pale blue medical glass

Avoid:

- bright saturated fantasy colors
- neon cyberpunk palette
- clean modern white
- candy colors
- large bright UI highlights

## Lighting

Lighting should feel baked, painted, and low-resolution.

Use:

- dim global ambient
- warm local pools from candles/fires/lamps
- hard contact shadows
- dithered gradients
- dirty occlusion near walls and props
- stronger darkness at edges of rooms
- subtle flicker for flame sources

Avoid:

- realistic PBR lighting
- glossy reflections
- heavy bloom
- volumetric modern fog
- soft high-resolution radial gradients
- screen-space reflection effects

## Floor style

Floors should be readable but aged.

Good details:

- cracks
- chipped tile corners
- stains
- old burn marks
- dust in seams
- debris clusters
- faded markings
- traffic-worn paths
- blood specks with narrative logic

Bad details:

- random uniform speckles everywhere
- high-contrast dirt that competes with characters
- repeating tile patterns too obvious
- clean checkerboard floors with no age

## Wall style

Walls should be darker and more oppressive than floors.

Use:

- vertical grime streaks
- chipped corners
- rust leaks
- broken panels
- bullet marks
- exposed rebar
- dark wall-floor contact grime
- occlusion under ledges

## Prop style

Props must not be simple cubes.

Every prop needs:

- readable top/side planes
- bevels or chipped edges
- material detail
- underside darkness
- contact shadow
- scale consistency
- story context

Crates should have straps, nail heads, labels, chipped corners, grime at base, and shadow.

Benches should have thin legs, worn planks, broken surfaces, and a dark underside.

Candles should have 2–4 frame flicker, melted wax, soot marks, and warm light pools.

## UI style

UI should feel heavy and old.

Use:

- dark metal panels
- aged brass borders
- scratched glass
- leather/wood/oxidized surfaces
- compact bitmap font
- dull amber/tan text
- small inset boxes
- low-res iconography
- mechanical click sounds

Avoid:

- vector icons
- clean flat design
- mobile rounded cards
- glossy buttons
- large modern sans-serif text
- bright white interface elements

## Mood

The mood should be:

- dry
- dusty
- lonely
- dangerous
- morally ambiguous
- strange
- slightly absurd
- tactile
- decayed
- consequential

The world should feel old enough that every object has outlived its original purpose.
