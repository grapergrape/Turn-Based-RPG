// Runtime shadow contracts for animated atlas actors. Static world props keep
// their authored contract on the sprite catalog entry.

export function actorShadowProfile(actor, sprite, stateName) {
  const opacityThreshold = 128;
  const cast = {
    mode: 'silhouette',
    referenceHeight: sprite?.airborne ? 48 : actor?.isDead ? 24 : 56,
    alphaScale: 1,
    opacityThreshold
  };
  if (sprite?.airborne && !actor?.isDead) {
    return {
      contact: {
        mode: 'custom',
        custom: 'airborne',
        depth: sprite.height,
        spread: 1,
        offsetX: 0,
        offsetY: 8,
        alphaScale: 0.24,
        opacityThreshold,
        compression: 0.2
      },
      cast
    };
  }
  if (actor?.isDead || stateName === 'workKneel') {
    return {
      contact: {
        mode: 'full-silhouette',
        depth: sprite?.height ?? 64,
        spread: 1,
        offsetX: 0,
        offsetY: 1,
        alphaScale: 0.32,
        opacityThreshold
      },
      cast
    };
  }
  return {
    contact: {
      mode: 'ground-band',
      depth: 9,
      spread: 1,
      offsetX: 0,
      offsetY: 1,
      alphaScale: 0.3,
      opacityThreshold
    },
    cast
  };
}

export function actorFrameSource(sprite, frame) {
  if (!sprite || !frame) return null;
  return {
    surface: frame,
    offsetX: -sprite.anchorX,
    offsetY: -sprite.anchorY,
    logicalWidth: sprite.width,
    logicalHeight: sprite.height
  };
}
