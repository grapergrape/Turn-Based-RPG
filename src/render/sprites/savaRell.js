import { PALETTE } from '../palette.js';

import { directionSide } from './spriteBake.js';

function drawBrokenAureole({ ctx, px, linePx, meta, pose, headY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const turn = meta.view === 'side' ? side * 2 : meta.view === 'three' ? side : 0;
  const bob = pose.bob ?? 0;
  const points = [
    { x: c - 8 + turn, y: headY + 7 + bob },
    { x: c - 11 + turn, y: headY + 3 + bob },
    { x: c - 11 + turn, y: headY - 2 + bob },
    { x: c - 8 + turn, y: headY - 7 + bob },
    { x: c - 3 + turn, y: headY - 9 + bob },
    { x: c + 1 + turn, y: headY - 8 + bob }
  ];

  for (let i = 0; i < points.length - 1; i += 1) {
    if (i === 2) continue;
    const a = points[i];
    const b = points[i + 1];
    linePx(ctx, a.x + 1, a.y + 1, b.x + 1, b.y + 1, PALETTE.stoneDark);
    linePx(ctx, a.x, a.y, b.x, b.y, i < 2 ? PALETTE.stoneDust : PALETTE.hostBone);
    if (i === 0 || i === 3) px(ctx, a.x - 1, a.y, PALETTE.hostBone, 2, 1);
  }

  // The right half never completed. Its remaining piece is canted away from
  // the face, with two loose splinters below the snapped end.
  linePx(ctx, c + 4 + turn, headY - 5 + bob, c + 7 + turn, headY - 1 + bob, PALETTE.stoneDark, 2);
  linePx(ctx, c + 4 + turn, headY - 6 + bob, c + 7 + turn, headY - 2 + bob, PALETTE.hostBone);
  px(ctx, c + 8 + turn, headY + 1 + bob, PALETTE.stoneDust, 1, 3);
  px(ctx, c + 6 + turn, headY + 4 + bob, PALETTE.hostBone, 2, 1);
  px(ctx, c + 7 + turn, headY + 5 + bob, PALETTE.hostGold, 1, 1);
}

function drawLongCalcifiedHead({ ctx, px, linePx, meta, pose, headY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const hit = pose.hit ? side : 0;
  const attackTurn = (pose.attack ?? 0) >= 7 ? side : 0;
  const turn = meta.view === 'side' ? side * 2 : meta.view === 'three' ? side : 0;
  const cant = meta.view === 'side' ? -side : -2;
  const faceX = c + turn + hit + attackTurn + cant;

  if (meta.back && meta.view !== 'side') {
    px(ctx, faceX - 4, headY - 2, PALETTE.stoneDark, 8, 13);
    px(ctx, faceX - 3, headY - 2, PALETTE.stoneDust, 6, 9);
    px(ctx, faceX - 3, headY - 2, PALETTE.hostBone, 3, 1);
    px(ctx, faceX + 2, headY, PALETTE.stoneMid, 1, 9);
    px(ctx, faceX - 2, headY + 7, PALETTE.skinDark, 3, 3);
    linePx(ctx, faceX - 1, headY + 3, faceX + 2, headY + 11, PALETTE.hostGold);
    return;
  }

  const widths = meta.view === 'side'
    ? [4, 5, 5, 6, 6, 5, 5, 5, 4, 4, 3, 2]
    : [5, 6, 7, 7, 7, 6, 6, 5, 5, 4, 3, 2];
  for (let row = 0; row < widths.length; row += 1) {
    const width = widths[row];
    const lean = meta.view === 'side'
      ? Math.round(side * row * 0.18)
      : Math.min(2, Math.floor(row / 4));
    const x = faceX - Math.floor(width / 2) + lean;
    px(ctx, x - 1, headY - 2 + row, PALETTE.stoneDark, width + 2, 1);
    const fill = row === 0
      ? PALETTE.hostBone
      : row < 5
        ? PALETTE.stoneDust
        : row < 9
          ? PALETTE.stoneMid
          : PALETTE.skinDark;
    px(ctx, x, headY - 2 + row, fill, width, 1);
    px(ctx, x, headY - 2 + row, PALETTE.hostBone, 1, 1);
    px(ctx, x + width - 1, headY - 2 + row, PALETTE.stoneMid, 1, 1);
  }

  // A human brow and nose remain inside the stretched stone face. Only the
  // right eye has taken the thin black-gold pin seen in freshly thawing tissue.
  if (meta.view === 'side') {
    const eyeX = faceX + side * 2;
    px(ctx, eyeX, headY + 1, PALETTE.void, 2, 2);
    px(ctx, eyeX + side, headY + 1, PALETTE.hostGold, 1, 1);
    px(ctx, faceX + side * 3, headY + 4, PALETTE.skinMid, 2, 3);
    px(ctx, faceX + side * 2, headY + 6, PALETTE.skinDark, 2, 2);
    linePx(ctx, faceX + side, headY + 8, faceX + side * 2, headY + 10, PALETTE.void);
    return;
  }

  px(ctx, faceX - 3, headY + 1, PALETTE.void, 2, 2);
  px(ctx, faceX + 1, headY + 1, PALETTE.void, 2, 2);
  px(ctx, faceX + 2, headY + 1, PALETTE.hostGold, 1, 1);
  px(ctx, faceX - 1, headY + 3, PALETTE.skinMid, 2, 4);
  px(ctx, faceX, headY + 6, PALETTE.skinDark, 2, 2);
  linePx(ctx, faceX - 2, headY + 8, faceX + 1, headY + 9, PALETTE.void);
  px(ctx, faceX + 2, headY + 9, PALETTE.stoneDark, 1, 2);
}

function drawSavaFront({ ctx, px, linePx, meta, pose, cx: atlasCx, shoulderY, hipY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const openedSide = meta.view === 'front' ? 1 : side;
  const foldedSide = -openedSide;
  const half = Math.max(5, Math.floor(torso.shoulderW / 2));
  const seamX = c + openedSide * 2;
  const seamTop = shoulderY + 5;
  const seamH = Math.max(7, hipY - seamTop - 1);

  // Only one rib line has begun opening. It remains a wound in a man's chest,
  // not the broad symmetrical wings of a fully opened icon.
  const cavityX = seamX - (openedSide < 0 ? 2 : 0);
  px(ctx, cavityX, seamTop, PALETTE.void, 3, seamH);
  px(ctx, seamX, seamTop + 1, PALETTE.hostRed, 1, seamH - 2);
  px(ctx, seamX - openedSide, seamTop + 2, PALETTE.hostBlack, 1, seamH - 4);
  for (let rib = 0; rib < 3; rib += 1) {
    const y = seamTop + 1 + rib * 3;
    const ribEnd = seamX + openedSide * (5 + rib);
    linePx(ctx, seamX + openedSide, y + 1, ribEnd, y, PALETTE.stoneDark, 2);
    linePx(ctx, seamX + openedSide, y, ribEnd - openedSide, y - 2, PALETTE.hostBone);
    px(ctx, ribEnd - openedSide, y - 2, PALETTE.stoneDust, 2, 1);
  }
  px(ctx, seamX, seamTop + 4, pose.bob ? PALETTE.hostGlow : PALETTE.hostGold, 1, 2);

  // The opening shoulder has lifted around a short bone hook. The other hangs
  // under old burial cloth, breaking the calm symmetry of the base figure.
  px(ctx, c + openedSide * (half - 1), shoulderY - 1, PALETTE.stoneDark, 5, 4);
  px(ctx, c + openedSide * half, shoulderY - 2, PALETTE.hostBone, 4, 2);
  linePx(ctx, c + openedSide * (half + 1), shoulderY - 1, c + openedSide * (half + 3), shoulderY - 5, PALETTE.hostBone);
  px(ctx, c + foldedSide * half, shoulderY + 2, PALETTE.clothTan, 3, 8);
  px(ctx, c + foldedSide * (half + 1), shoulderY + 7, PALETTE.stoneDark, 2, 6);

  // One forearm has calcified across the chest. The fingers have fused into a
  // narrow prayer fan while the other hand remains free to rake.
  const shoulderX = c + foldedSide * Math.max(4, half - 1);
  const palmX = c + foldedSide * 3;
  const palmY = hipY - 6;
  linePx(ctx, shoulderX, shoulderY + 4, c + foldedSide * 5, shoulderY + 11, PALETTE.stoneDark, 3);
  linePx(ctx, shoulderX, shoulderY + 3, c + foldedSide * 4, shoulderY + 10, PALETTE.stoneDust, 2);
  linePx(ctx, c + foldedSide * 4, shoulderY + 10, palmX, palmY, PALETTE.hostBone, 2);
  px(ctx, palmX - 1, palmY - 1, PALETTE.stoneDark, 4, 5);
  px(ctx, palmX, palmY - 2, PALETTE.hostBone, 2, 4);
  for (let finger = 0; finger < 4; finger += 1) {
    const fingerX = palmX + foldedSide * Math.floor(finger / 2) + (finger === 3 ? 1 : 0);
    const fingerY = palmY - 5 - (finger === 1 ? 1 : 0);
    linePx(ctx, palmX, palmY - 1, fingerX, fingerY, finger === 2 ? PALETTE.stoneDust : PALETTE.hostBone);
  }
  px(ctx, palmX - openedSide, palmY - 3, PALETTE.void, 1, 3);

  // The free arm has resumed changing before the rest of him. It hangs below
  // the old human wrist, long enough to spoil the upright grave-clerk outline
  // without making Sava larger than a person.
  const attack = pose.attack ?? 0;
  const attackReach = Math.min(6, Math.floor(attack * 0.55));
  const attacking = attackReach > 0;
  const anticipating = attack > 0 && attack <= 2;
  const impacting = attack >= 7;
  const armLag = attacking ? 0 : Math.round((pose.armB ?? 0) * 0.5);
  const dragShoulderX = c + openedSide * half;
  const dragElbowX = anticipating
    ? c + openedSide * (half + 6)
    : c + openedSide * (half + 1 + Math.floor(attackReach / 2) + armLag);
  const dragElbowY = anticipating
    ? shoulderY + 3
    : attacking
      ? shoulderY + 9
      : hipY - 2;
  const rawHandX = anticipating
    ? c + openedSide * (half + 2)
    : c + openedSide * (half + (impacting ? 7 : 4) + attackReach + armLag);
  const dragHandX = Math.max(atlasCx - 15, Math.min(atlasCx + 15, rawHandX));
  const dragHandY = anticipating
    ? shoulderY + 1
    : attacking
      ? shoulderY + 12 + Math.floor(attack / 4)
      : hipY + 7 + (pose.bob ? 1 : 0);
  linePx(ctx, dragShoulderX, shoulderY + 4, dragElbowX, dragElbowY, PALETTE.stoneDark, 3);
  linePx(ctx, dragShoulderX, shoulderY + 3, dragElbowX, dragElbowY - 1, PALETTE.stoneMid, 2);
  linePx(ctx, dragElbowX, dragElbowY, dragHandX, dragHandY, PALETTE.stoneDark, 3);
  linePx(ctx, dragElbowX, dragElbowY - 1, dragHandX, dragHandY - 1, PALETTE.skinDark, 2);
  linePx(ctx, dragElbowX, dragElbowY - 2, dragHandX - openedSide, dragHandY - 2, PALETTE.skinMid);
  px(ctx, dragHandX - 1, dragHandY, impacting ? PALETTE.hostBone : PALETTE.stoneDust, 3, 3);
  if (impacting) {
    // At impact the three calcified fingers open across the direction of travel
    // so the attack reads as a rake, not a pointing arm.
    for (let claw = 0; claw < 3; claw += 1) {
      linePx(ctx,
        dragHandX + openedSide,
        dragHandY + claw,
        dragHandX + openedSide * (3 + claw),
        dragHandY - 2 + claw * 2,
        PALETTE.hostBone,
        claw === 1 ? 2 : 1);
    }
  } else if (anticipating) {
    for (let claw = 0; claw < 3; claw += 1) {
      linePx(ctx,
        dragHandX - 1 + claw,
        dragHandY,
        dragHandX - openedSide * (2 + (claw & 1)),
        dragHandY - 3 + claw,
        PALETTE.hostBone);
    }
  } else {
    for (let claw = 0; claw < 3; claw += 1) {
      linePx(ctx,
        dragHandX - 1 + claw,
        dragHandY + 2,
        dragHandX - 2 + claw + openedSide * (claw - 1),
        dragHandY + 4 + (claw === 1 ? 1 : 0),
        PALETTE.hostBone);
    }
  }

  // Hessa's burial cloth still clings to the other hip. One long torn panel
  // keeps the lower silhouette from resolving into two clean parallel legs.
  const shroudX = c + foldedSide * 4;
  px(ctx, shroudX - 2, hipY, PALETTE.stoneDark, 5, 12);
  px(ctx, shroudX - 1, hipY, PALETTE.stoneMid, 3, 10);
  px(ctx, shroudX - 1, hipY, PALETTE.stoneDust, 1, 8);
  px(ctx, shroudX + foldedSide, hipY + 10, PALETTE.stoneMid, 2, 3);
  px(ctx, shroudX - openedSide, hipY + 3, PALETTE.rustDark, 1, 7);
  if (impacting) {
    linePx(ctx, shroudX, hipY + 7, shroudX + foldedSide * 4, hipY + 12, PALETTE.stoneMid, 2);
    linePx(ctx, shroudX, hipY + 6, shroudX + foldedSide * 3, hipY + 10, PALETTE.stoneDust);
  }

  // Sparse seams stay below the skin. They converge on the single live wound
  // and never drip off the body.
  linePx(ctx, seamX, seamTop + 4, c + openedSide * half, shoulderY + 1, PALETTE.hostGold);
  linePx(ctx, seamX, seamTop + 5, c + openedSide * 4, hipY + 4, PALETTE.hostGold);
  px(ctx, c + foldedSide * (half - 1), shoulderY + 2, PALETTE.skinMid, 2, 3);
}

function drawSavaBack({ ctx, px, linePx, meta, pose, cx: atlasCx, shoulderY, hipY, footY, torso }) {
  const c = torso.bodyCx;
  const rakeSide = directionSide(meta);
  const foldedSide = -rakeSide;
  const half = Math.max(4, Math.floor(torso.shoulderW / 2));

  // The thaw line splits the shroud down the spine, then bends toward the ribs
  // that have started to lift. It stays a thin seam rather than a luminous mark.
  linePx(ctx, c - 1, shoulderY + 1, c + rakeSide * 2, hipY - 2, PALETTE.stoneDark, 2);
  linePx(ctx, c - 1, shoulderY + 1, c + rakeSide * 2, hipY - 2, PALETTE.hostGold);
  px(ctx, c + rakeSide * (half - 1), shoulderY + 3, PALETTE.skinDark, 3, 7);
  px(ctx, c + rakeSide * half, shoulderY + 3, PALETTE.skinMid, 1, 5);

  // Three rib ends show from behind on the changing side. They are uneven and
  // close to the body, the back view of the same one-sided opening.
  for (let rib = 0; rib < 3; rib += 1) {
    const y = shoulderY + 6 + rib * 3;
    linePx(ctx, c + rakeSide * 2, y, c + rakeSide * (5 + rib), y - 1, PALETTE.hostBone);
  }
  px(ctx, c + rakeSide * 2, shoulderY + 8, PALETTE.hostRed, 1, 5);

  // The rake arm remains identifiable from the rear and follows the near side
  // chosen by each facing instead of jumping to the opposite silhouette.
  const attack = pose.attack ?? 0;
  const attackReach = Math.min(6, Math.floor(attack * 0.55));
  const anticipating = attack > 0 && attack <= 2;
  const impacting = attack >= 7;
  const armLag = attack > 0 ? 0 : Math.round((pose.armB ?? 0) * 0.5);
  const shoulderX = c + rakeSide * half;
  const elbowX = anticipating
    ? c + rakeSide * (half + 6)
    : c + rakeSide * (half + 2 + Math.floor(attackReach / 2) + armLag);
  const elbowY = anticipating ? shoulderY + 3 : attack > 0 ? shoulderY + 10 : hipY;
  const rawHandX = anticipating
    ? c + rakeSide * (half + 2)
    : c + rakeSide * (half + (impacting ? 8 : 5) + attackReach + armLag);
  const handX = Math.max(atlasCx - 15, Math.min(atlasCx + 15, rawHandX));
  const handY = anticipating ? shoulderY + 1 : attack > 0 ? shoulderY + 13 : footY - 7 + (pose.bob ?? 0);
  linePx(ctx, shoulderX, shoulderY + 4, elbowX, elbowY, PALETTE.stoneDark, 3);
  linePx(ctx, shoulderX, shoulderY + 3, elbowX, elbowY - 1, PALETTE.skinDark, 2);
  linePx(ctx, elbowX, elbowY, handX, handY, PALETTE.stoneDark, 3);
  linePx(ctx, elbowX, elbowY - 1, handX, handY - 1, PALETTE.skinMid, 1);
  px(ctx, handX - 1, handY, impacting ? PALETTE.hostBone : PALETTE.stoneDust, 3, 2);
  for (let claw = 0; claw < 3; claw += 1) {
    if (impacting) {
      linePx(ctx,
        handX + rakeSide,
        handY + claw,
        handX + rakeSide * (3 + claw),
        handY - 2 + claw * 2,
        PALETTE.hostBone,
        claw === 1 ? 2 : 1);
    } else if (anticipating) {
      linePx(ctx, handX - 1 + claw, handY, handX - rakeSide * (2 + (claw & 1)), handY - 3 + claw, PALETTE.hostBone);
    } else {
      linePx(ctx, handX - 1 + claw, handY + 1, handX + rakeSide * (claw - 1), handY + 4, PALETTE.hostBone);
    }
  }

  // One shoulder hook and the opposite strip of burial cloth preserve the same
  // broken pair seen from the front.
  linePx(ctx, c + foldedSide * (half - 1), shoulderY + 3, c + foldedSide * (half + 2), shoulderY - 3, PALETTE.hostBone);
  px(ctx, c + foldedSide * (half + 2), shoulderY - 4, PALETTE.stoneDust, 2, 2);
  px(ctx, c + foldedSide * 4 - 2, hipY, PALETTE.stoneDark, 5, 11);
  px(ctx, c + foldedSide * 4 - 1, hipY, PALETTE.stoneMid, 3, 9);
}

export function drawSavaRellDetails(args) {
  drawBrokenAureole(args);
  drawLongCalcifiedHead(args);
  if (args.meta.back && args.meta.view !== 'side') {
    drawSavaBack(args);
  } else {
    drawSavaFront(args);
  }
}

function drawDeadSavaHead({ ctx, px, linePx, x, y, fallen = false }) {
  const widths = fallen
    ? [4, 5, 6, 7, 6, 5, 4, 3]
    : [5, 6, 7, 7, 6, 5, 4, 3, 2];
  for (let row = 0; row < widths.length; row += 1) {
    const width = widths[row];
    const lean = fallen ? Math.floor(row / 3) : Math.floor(row / 5);
    const left = x - Math.floor(width / 2) + lean;
    px(ctx, left - 1, y + row, PALETTE.stoneDark, width + 2, 1);
    px(ctx, left, y + row, row === 0 ? PALETTE.hostBone : row < 5 ? PALETTE.stoneDust : PALETTE.stoneMid, width, 1);
    px(ctx, left, y + row, PALETTE.hostBone, 1, 1);
  }
  px(ctx, x - 2, y + 3, PALETTE.void, 2, 2);
  px(ctx, x + 1, y + 3, PALETTE.stoneDark, 2, 2);
  px(ctx, x, y + 5, PALETTE.skinMid, 2, 2);
  linePx(ctx, x - 1, y + 7, x + 2, y + 7 + (fallen ? 1 : 0), PALETTE.void);
}

function drawFallingSava({ ctx, px, linePx, cx, groundY, frame }) {
  const t = frame / 3;
  const hip = {
    x: cx + Math.round(t * 3),
    y: groundY - 23 + Math.round(t * 8)
  };
  const shoulder = {
    x: cx - Math.round(t * 10),
    y: hip.y - 17 + Math.round(t * 5)
  };
  const headX = shoulder.x - Math.round(t * 4);
  const headY = shoulder.y - 12 + Math.round(t * 4);

  // One knee buckles before the other. The feet stay planted through the first
  // four frames, which gives the collapse weight instead of sliding the icon.
  const farKnee = { x: cx - 4 - Math.round(t * 3), y: groundY - 11 + Math.round(t * 2) };
  const nearKnee = { x: cx + 4 + Math.round(t * 4), y: groundY - 10 + Math.round(t * 4) };
  linePx(ctx, hip.x - 2, hip.y, farKnee.x, farKnee.y, PALETTE.void, 5);
  linePx(ctx, farKnee.x, farKnee.y, cx - 5, groundY, PALETTE.stoneDark, 4);
  linePx(ctx, hip.x + 2, hip.y, nearKnee.x, nearKnee.y, PALETTE.stoneDark, 5);
  linePx(ctx, nearKnee.x, nearKnee.y, cx + 6, groundY, PALETTE.stoneMid, 4);
  px(ctx, cx - 8, groundY - 1, PALETTE.void, 8, 3);
  px(ctx, cx + 3, groundY - 1, PALETTE.void, 8, 3);

  linePx(ctx, shoulder.x, shoulder.y, hip.x, hip.y, PALETTE.void, 11);
  linePx(ctx, shoulder.x, shoulder.y - 1, hip.x, hip.y - 1, PALETTE.stoneDark, 9);
  linePx(ctx, shoulder.x - 1, shoulder.y - 2, hip.x - 1, hip.y - 2, PALETTE.stoneMid, 5);
  linePx(ctx, shoulder.x - 2, shoulder.y - 3, hip.x - 2, hip.y - 3, PALETTE.stoneDust);
  px(ctx, hip.x - 5, hip.y - 1, PALETTE.rustDark, 10, 2);

  // The long face stays joined to the falling body. A short calcified neck and
  // the remains of a burial-cloth collar close the dark gap that otherwise
  // makes the first death key read as a detached, floating head.
  const neckTop = { x: headX + 1, y: headY + 7 };
  const neckBase = { x: shoulder.x, y: shoulder.y + 1 };
  linePx(ctx, neckTop.x, neckTop.y, neckBase.x, neckBase.y, PALETTE.stoneDark, 5);
  linePx(ctx, neckTop.x, neckTop.y, neckBase.x, neckBase.y, PALETTE.stoneMid, 3);
  linePx(ctx, neckTop.x - 1, neckTop.y, neckBase.x - 1, neckBase.y - 1, PALETTE.stoneDust);
  linePx(ctx, shoulder.x - 3, shoulder.y - 1, shoulder.x + 4, shoulder.y + 1, PALETTE.stoneDark, 3);
  linePx(ctx, shoulder.x - 3, shoulder.y - 2, shoulder.x + 2, shoulder.y - 1, PALETTE.stoneDust);

  // The changing arm is thrown toward the floor while the calcified prayer
  // hand remains fixed to the sternum.
  const rakeElbow = { x: shoulder.x + 9 + Math.round(t * 4), y: shoulder.y + 9 + Math.round(t * 5) };
  const rakeHand = { x: shoulder.x + 12 + Math.round(t * 8), y: shoulder.y + 16 + Math.round(t * 7) };
  linePx(ctx, shoulder.x + 5, shoulder.y + 3, rakeElbow.x, rakeElbow.y, PALETTE.stoneDark, 4);
  linePx(ctx, rakeElbow.x, rakeElbow.y, rakeHand.x, rakeHand.y, PALETTE.skinDark, 3);
  linePx(ctx, rakeElbow.x, rakeElbow.y - 1, rakeHand.x, rakeHand.y - 1, PALETTE.skinMid);
  px(ctx, rakeHand.x - 1, rakeHand.y, PALETTE.stoneDust, 4, 2);
  for (let finger = 0; finger < 3; finger += 1) {
    linePx(ctx, rakeHand.x + finger, rakeHand.y + 1, rakeHand.x + 2 + finger, rakeHand.y + 4 + (finger & 1), PALETTE.hostBone);
  }
  linePx(ctx, shoulder.x - 4, shoulder.y + 4, shoulder.x + 1, shoulder.y + 11, PALETTE.stoneDust, 3);
  px(ctx, shoulder.x, shoulder.y + 8, PALETTE.hostBone, 3, 6);

  // The right rib seam remains a dark bodily opening throughout the fall.
  linePx(ctx, shoulder.x + 2, shoulder.y + 5, hip.x + 2, hip.y - 3, PALETTE.hostRed, 2);
  for (let rib = 0; rib < 3; rib += 1) {
    const ry = shoulder.y + 6 + rib * 3;
    linePx(ctx, shoulder.x + 3, ry, shoulder.x + 7 + rib, ry - 1, PALETTE.hostBone);
  }
  px(ctx, shoulder.x + 2, shoulder.y + 9, PALETTE.stoneDark, 2, 2);

  drawDeadSavaHead({ ctx, px, linePx, x: headX, y: headY });
  linePx(ctx, headX - 7, headY + 7, headX - 9, headY + 1, PALETTE.hostBone);
  linePx(ctx, headX - 9, headY, headX - 5, headY - 4, PALETTE.stoneDust);
  linePx(ctx, headX - 4, headY - 5, headX, headY - 6, PALETTE.hostBone);
  px(ctx, headX + 5, headY - 2, PALETTE.stoneDust, 2, 2);
}

export function drawSavaRellDeath({ ctx, w, h, frame, px, linePx }) {
  const cx = Math.floor(w / 2);
  const groundY = h - 6;

  if (frame < 4) {
    drawFallingSava({ ctx, px, linePx, cx, groundY, frame });
    return;
  }

  const settle = Math.min(1, Math.max(0, (frame - 3) / 6));
  const impactBounce = frame === 4 ? -3 : 0;
  const bodyY = groundY - 12 + impactBounce;

  if (settle > 0) {
    const spread = Math.round(15 + settle * 5);
    linePx(ctx, cx - spread, groundY + 1, cx + spread, groundY - 1, PALETTE.hostBlack, 3);
    linePx(ctx, cx - spread + 5, groundY + 3, cx + spread - 8, groundY + 2, PALETTE.rustDark, 2);
    px(ctx, cx - 3, groundY - 1, PALETTE.stoneDark, 10, 3);
  }

  // The landed torso keeps the width and cloth mass of the standing man. It is
  // not replaced by the small generic Host slab used for lesser enemies.
  const shoulder = { x: cx - 7, y: bodyY + 2 };
  const hip = { x: cx + 5, y: bodyY + 8 };
  linePx(ctx, shoulder.x, shoulder.y, hip.x, hip.y, PALETTE.void, 10);
  linePx(ctx, shoulder.x, shoulder.y - 1, hip.x, hip.y - 1, PALETTE.stoneDark, 8);
  linePx(ctx, shoulder.x - 1, shoulder.y - 2, hip.x - 1, hip.y - 2, PALETTE.stoneMid, 5);
  linePx(ctx, shoulder.x - 2, shoulder.y - 3, hip.x - 2, hip.y - 3, PALETTE.stoneDust, 2);
  px(ctx, cx - 2, bodyY + 2, PALETTE.rustDark, 10, 2);

  // Hessa's burial cloth pools over the hips and binds the two bent legs into
  // one heavy corpse silhouette without hiding the human joints.
  linePx(ctx, cx - 2, bodyY + 6, cx + 12, bodyY + 10, PALETTE.void, 7);
  linePx(ctx, cx - 2, bodyY + 5, cx + 11, bodyY + 9, PALETTE.stoneDark, 5);
  linePx(ctx, cx - 3, bodyY + 4, cx + 10, bodyY + 8, PALETTE.stoneMid, 3);
  linePx(ctx, cx - 4, bodyY + 3, cx + 8, bodyY + 9, PALETTE.stoneDust);

  const farKnee = { x: cx + 11, y: bodyY + 5 };
  const farFoot = { x: cx + 16, y: bodyY + 5 };
  const nearKnee = { x: cx + 12, y: bodyY + 12 };
  const nearFoot = { x: cx + 18, y: bodyY + 12 };
  linePx(ctx, hip.x, hip.y, farKnee.x, farKnee.y, PALETTE.void, 5);
  linePx(ctx, farKnee.x, farKnee.y, farFoot.x, farFoot.y, PALETTE.stoneDark, 4);
  linePx(ctx, hip.x, hip.y, nearKnee.x, nearKnee.y, PALETTE.stoneDark, 5);
  linePx(ctx, nearKnee.x, nearKnee.y, nearFoot.x, nearFoot.y, PALETTE.stoneMid, 4);
  linePx(ctx, hip.x, hip.y - 1, farKnee.x, farKnee.y - 1, PALETTE.stoneMid, 2);
  linePx(ctx, hip.x + 1, hip.y, nearKnee.x, nearKnee.y, PALETTE.stoneDust);
  px(ctx, farFoot.x - 1, farFoot.y - 1, PALETTE.void, 5, 4);
  px(ctx, nearFoot.x - 1, nearFoot.y - 1, PALETTE.void, 5, 4);
  px(ctx, farFoot.x, farFoot.y - 1, PALETTE.stoneMid, 3, 1);
  px(ctx, nearFoot.x, nearFoot.y - 1, PALETTE.stoneMid, 3, 1);

  // The long rake arm lands below the body with the three fingers spread. The
  // other hand remains fused upright against the sternum.
  const dragElbow = { x: cx - 2, y: bodyY + 9 };
  const dragHand = { x: cx + 7, y: bodyY + 11 };
  linePx(ctx, shoulder.x + 1, shoulder.y + 3, dragElbow.x, dragElbow.y, PALETTE.stoneDark, 5);
  linePx(ctx, dragElbow.x, dragElbow.y, dragHand.x, dragHand.y, PALETTE.skinDark, 4);
  linePx(ctx, dragElbow.x, dragElbow.y - 1, dragHand.x, dragHand.y - 1, PALETTE.skinMid);
  px(ctx, dragHand.x, dragHand.y, PALETTE.stoneDust, 4, 2);
  for (let finger = 0; finger < 3; finger += 1) {
    linePx(ctx, dragHand.x + 1 + finger, dragHand.y + 1, dragHand.x + 3 + finger, dragHand.y + 4 + (finger === 1 ? 1 : 0), PALETTE.hostBone);
  }
  linePx(ctx, shoulder.x + 1, shoulder.y, cx - 1, bodyY + 6, PALETTE.stoneDust, 3);
  px(ctx, cx - 2, bodyY + 2, PALETTE.hostBone, 3, 6);
  px(ctx, cx - 1, bodyY + 1, PALETTE.void, 1, 5);

  // The opened side does not close when he dies. The wound is grey and still,
  // but the three lifted ribs retain their one-sided shape.
  linePx(ctx, cx + 1, bodyY + 1, cx + 5, bodyY + 9, PALETTE.rustDark, 3);
  linePx(ctx, cx + 2, bodyY + 2, cx + 5, bodyY + 8, PALETTE.hostRed);
  for (let rib = 0; rib < 3; rib += 1) {
    const rx = cx + 1 + rib * 2;
    linePx(ctx, rx, bodyY + 2 + rib * 2, rx + 5, bodyY + 1 + rib * 2, PALETTE.hostBone, rib === 1 ? 2 : 1);
  }
  px(ctx, cx + 2, bodyY + 4, PALETTE.stoneDark, 3, 3);

  const headX = cx - 15;
  drawDeadSavaHead({ ctx, px, linePx, x: headX, y: bodyY - 4, fallen: true });
  linePx(ctx, headX - 7, bodyY, headX - 8, bodyY - 5, PALETTE.hostBone);
  linePx(ctx, headX - 8, bodyY - 6, headX - 4, bodyY - 9, PALETTE.stoneDust);
  px(ctx, headX - 2, bodyY - 10, PALETTE.hostBone, 4, 1);
  linePx(ctx, headX + 5, bodyY - 7, headX + 8, bodyY - 3, PALETTE.hostBone);
  px(ctx, headX + 9, bodyY - 1, PALETTE.stoneDust, 1, 3);
}

export const SAVA_RELL_STYLE = {
  shoulders: 16,
  waist: 9,
  torsoLength: 17,
  legLength: 24,
  headHeight: 10,
  legSize: 3,
  armSize: 2,
  coatTail: 8,
  coatHi: PALETTE.stoneDust,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.stoneMid,
  pantsLo: PALETTE.stoneDark,
  pantsDk: PALETTE.void,
  boot: PALETTE.stoneDark,
  bootHi: PALETTE.stoneMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.hostBone,
  skin: PALETTE.stoneDust,
  skinLo: PALETTE.stoneMid,
  skinDk: PALETTE.stoneDark,
  hair: PALETTE.stoneDark,
  hairHi: PALETTE.stoneMid,
  hood: PALETTE.stoneDark,
  hoodHi: PALETTE.stoneMid,
  belt: PALETTE.rustDark,
  weapon: null,
  hunch: 7,
  bareHead: true,
  hostCorpse: true,
  deadWound: PALETTE.stoneDark,
  drawDeath: drawSavaRellDeath,
  decorate: drawSavaRellDetails
};
