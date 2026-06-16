# Animation QC Checklist

## Universal animation QC

Check every animation for:

- consistent pivot
- consistent canvas size
- no outline jitter
- no accidental scale changes
- no broken shadow
- no frame with missing gear
- no color flicker
- readable key poses
- correct direction/facing
- low-FPS frame-based feel

## Walk cycle QC

For each direction:

- left/right foot alternation is readable
- planted foot does not slide
- stride length matches movement speed
- torso bob is subtle
- arms counter-swing
- head remains mostly stable
- shadow stays grounded
- diagonal facings do not look like side facings reused lazily
- no floating during foot lift

## Idle QC

- motion is subtle
- no cartoon bouncing
- no large head movement
- no distracting loop pop
- breathing/weight shift is readable but restrained

## Attack QC

- anticipation pose is clear
- impact frame is clear
- recovery is not too long
- weapon stays attached to hand
- muzzle flash is 1–2 frames if firearm
- melee arc reads by silhouette
- body weight shifts correctly

## Hit/death QC

- hit reaction is quick and readable
- death collapse has weight
- corpse lands in correct perspective
- corpse shadow and contact are correct
- death does not look too smooth or modern

## Timing targets

```text
Idle:        4–8 frames, 6–10 fps
Walk:        8–12 frames, 10–12 fps normal
Heavy walk:  8–12 frames, 6–8 fps
Interact:    6–12 frames
Melee:       8–14 frames
Firearm:     6–10 frames
Hurt:        3–6 frames
Death:       10–18 frames
```
