# Screenshot Review Checklist

Use this checklist to review a screenshot against the target style.

## First impression

Answer in one paragraph:

- What style does the image currently read as?
- What is the biggest mismatch with late-90s isometric CRPG style?
- What is already working?

## Severity tags

```text
S0 = style-breaking, fix now
S1 = major, fix this pass
S2 = noticeable, fix before vertical slice
S3 = polish
S4 = optional flavor
```

## Camera and scale

- Is the camera fixed isometric/orthographic?
- Does the player look small enough for tactical CRPG exploration?
- Are visible tiles dense enough?
- Does the room show enough surrounding context?
- Are tiles too large?
- Are characters too blocky or too close-up?

## Pixel rendering

- Are all pixels crisp?
- Is anything blurry from filtering?
- Are all assets using the same pixel scale?
- Does UI match the in-world pixel scale?
- Are lighting effects too smooth/high-res?

## Characters

- Are bodies realistic rather than chibi/blocky?
- Is the head small?
- Are arms, boots, torso, gear readable?
- Is the silhouette clear at gameplay zoom?
- Is the character grounded with a contact shadow?
- Are facings clear?

## Environment

- Are floor tiles varied but readable?
- Is grime placed logically?
- Are wall bases darker and dirtier?
- Are props grounded with shadows?
- Are props shaped like real isometric objects, not cubes?
- Does the room imply a story?
- Is there too much random speckle noise?

## Lighting

- Does lighting feel baked?
- Are shadows hard/dithered enough?
- Are there contact shadows under every object?
- Do light pools guide attention?
- Is there unwanted bloom or glossy modern light?

## UI

- Does UI feel old, heavy, and utilitarian?
- Is font bitmap/pixel-compatible?
- Are colors muted amber/tan/green/gray?
- Are panels too clean, flat, or modern?
- Is the UI too large or too minimal?

## Suggested review output format

```text
Overall read:

Top 5 fixes:
1. [S0/S1] ...
2. [S0/S1] ...
3. [S1/S2] ...
4. [S2] ...
5. [S2/S3] ...

Camera/scale:
Characters:
Environment:
Lighting:
UI:
Animation notes:

Next production pass:
- ...
```
