# Character and Animation Reference

## Character construction

Characters should look like tiny realistic humans rendered into low-resolution sprites.

Avoid:

- square block heads
- cube torsos
- chibi proportions
- oversized heads
- noodle limbs
- smooth modern skeletal tweening
- high-res faces
- cartoon eyes

Use:

- narrow shoulders
- small head
- readable boots
- angled torso
- distinct arms
- believable clothing layers
- straps and pouches
- asymmetrical gear
- compact silhouette
- hard shadow side
- tiny highlights on head, shoulders, boots, weapon, metal

## Human proportions

Recommended native pixel proportions:

```text
Total height:       50–64 px
Head height:        7–10 px
Neck:               1–2 px implied
Shoulder width:     16–24 px
Torso height:       14–20 px
Legs:               18–26 px
Boots:              3–6 px
Hands:              2–4 px clusters
Weapon thickness:   1–3 px depending type
```

At this size, the silhouette is more important than face detail.

## Character classes by silhouette

### Wasteland explorer

- medium coat or vest
- scarf or collar
- small backpack
- boots
- tool belt or sling
- neutral upright stance

### Guard / warden

- squared shoulders
- baton or rifle silhouette
- helmet or cap
- armband/badge
- rigid posture

### Scavenger

- hunched posture
- big bag/backpack
- mismatched boots
- dangling tools
- low-contrast patched clothing

### Priest / chapel survivor

- long triangular robe/coat
- narrow shoulders
- candle/book/staff silhouette
- slow idles

### Infected / feral humanoid

- broken posture
- uneven arms
- dragging leg
- head tilted
- irregular gait

### Mechanic / technician

- goggles or mask
- tool belt
- gloves
- hunched inspecting idle
- small metal highlights

## Sprite directions

Use 8 directions:

```text
n, ne, e, se, s, sw, w, nw
```

Every direction should feel authored.

Mirroring is allowed for production speed, but correct:

- belts
- holsters
- shoulder pads
- packs
- scars
- hair part
- weapon side
- shadow side

## Idle animations

Idle should be subtle.

Recommended:

```text
Frames: 4–8
FPS:    6–10
Motion: 1–2 px maximum vertical breathing
```

Possible idle details:

- weight shift
- tiny shoulder rise
- head turn
- hand flex
- strap adjustment
- robe edge movement
- weapon grip change
- cough
- glance over shoulder

Avoid bouncy idle loops.

## Walk animation

The walk cycle is one of the most important style markers.

Recommended:

```text
Frames: 8–12 per direction
FPS:    10–12 normal walk
FPS:    6–8 heavy/armored walk
FPS:    12–14 nervous/light walk
```

Required walk features:

- alternating feet
- clear planted frames
- small torso bob
- subtle hip shift
- shoulder counter-swing
- arms swing with weight
- head mostly stable
- coat/robe lag by 1 frame if loose
- no sliding
- no floating

## Foot planting test

To review a walk cycle:

1. Place sprite on a high-contrast isometric grid.
2. Mark the pivot point.
3. Scrub frame by frame.
4. Identify planted foot frames.
5. Ensure the planted foot remains fixed relative to the ground during contact.
6. Match movement speed to stride length.
7. Check every direction separately.

## Turning

When changing direction:

- use immediate facing change for simple old-school feel, or
- use 1–2 transitional frames for higher polish.

Do not rotate a sprite smoothly. Use discrete facings.

## Interaction animations

### Inspect

```text
Frames: 6–10
Action: lean/head-down/hand point/return
```

### Pickup

```text
Frames: 8–12
Action: bend/reach/grab/return
```

### Door use

```text
Frames: 8–14
Action: step close/reach/pause/door changes/return
```

### Terminal use

```text
Start: 6–10 frames
Loop:  4–8 frames typing/adjusting
```

## Combat animation

Combat should be pose-driven and readable.

### Melee

```text
Frames: 8–14
Phases: ready, anticipation, wind-up, swing, impact, follow-through, recovery
```

### Firearm

```text
Frames: 6–10
Phases: raise, aim, muzzle flash, recoil, settle
Muzzle flash: 1–2 frames
```

### Hurt

```text
Frames: 3–6
Motion: small snap, shoulder jerk, torso recoil, head movement
```

### Death

```text
Frames: 10–18
Motion: heavy collapse, knees buckle, twist/fall, corpse remains
```

## Corpse sprites

Every killable character needs a corpse sprite.

Corpse requirements:

- correct perspective
- ground contact shadow
- damage state if relevant
- not too high contrast unless important
- lootable state if gameplay supports it

## Animation events

Mark event frames:

- footstep left
- footstep right
- impact
- muzzle flash
- shell eject
- item pickup
- door latch
- hit reaction start
- death final pose

## Common animation errors

### Sliding

Fix by matching movement speed to foot plant frames.

### Floating

Fix shadow and pivot. Add stronger contact under boots.

### Jitter

Fix inconsistent sprite canvas, pivot, and silhouette cleanup.

### Too modern

Lower FPS, remove tweening, emphasize key poses, add harder pixel clusters.
