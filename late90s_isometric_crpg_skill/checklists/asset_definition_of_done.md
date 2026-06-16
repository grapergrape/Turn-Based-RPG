# Asset Definition of Done

## Universal asset requirements

An asset is done only when:

- It matches the project's pixel scale.
- It is crisp at native resolution.
- It uses the approved palette family.
- It has correct isometric perspective.
- It has a contact shadow or correct shadow integration.
- It is readable at gameplay zoom.
- It does not look copied from an existing game.
- It has correct pivot/anchor metadata.
- It has source files stored in the correct folder.
- It has export files named consistently.

## Character sprite done

A character sprite is done only when:

- height is within approved range
- head is not oversized
- silhouette reads by role/faction
- gear is readable but not noisy
- all required directions exist
- pivot is consistent
- shadow is grounded
- walk cycle has no sliding
- idle is subtle
- hurt/death/corpse exist if killable
- palette ramps are controlled
- sprite tested in a real scene

## Tile done

A tile is done only when:

- shape matches tile projection
- edges align with neighbors
- variation is useful but subtle
- detail does not overpower characters
- repeated use does not create obvious patterning
- grime placement makes sense
- tile has at least 3–5 variants if common

## Prop done

A prop is done only when:

- top/side/front planes are readable
- underside is dark enough
- contact shadow exists
- material age is visible
- silhouette is distinct
- scale is believable next to human sprite
- interaction states exist if needed
- broken/looted/open variants exist if gameplay requires them

## UI element done

A UI element is done only when:

- font is readable at native resolution
- panel style matches the world
- colors are muted
- icon is pixel-compatible
- states exist for normal/hover/pressed/disabled if interactive
- no vector-clean or modern glossy appearance
- layout works at 640x480 or 800x600

## FX done

An FX asset is done only when:

- frame count is low and deliberate
- colors match palette
- no high-res particles are visible
- effect does not obscure gameplay
- timing has impact
- light influence is pixel-compatible
- final frame/loop is clean
