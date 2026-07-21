import { PALETTE } from '../palette.js';
import { directionSide } from './spriteBake.js';

function brokenCrescent({ ctx, px, meta, c, headY, pulse = 0, radius = 11 }) {
  const side = directionSide(meta);
  const openSide = meta.view === 'side' ? side : -1;
  for (let i = 0; i < 11; i += 1) {
    if (i === 3 || i === 7 || i === 8) continue;
    const angle = Math.PI * (0.18 + i * 0.075);
    const x = c + openSide * 2 + Math.round(Math.cos(angle) * radius);
    const y = headY + 6 - Math.round(Math.sin(angle) * (radius - 1)) + ((i + pulse) % 6 === 0 ? 1 : 0);
    px(ctx, x, y, i === 5 ? PALETTE.hostGold : PALETTE.hostBone, i % 4 === 0 ? 2 : 1, 1);
  }
  px(ctx, c + openSide * (radius - 1), headY + 6, PALETTE.hostBone, 2, 2);
}

function drawStageIvLureDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, headY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const near = meta.view === 'side' ? side : 1;
  const far = -near;
  const pulse = pose.bob ? 1 : 0;

  brokenCrescent({ ctx, px, meta, c, headY, pulse, radius: 10 });

  // The head remains recognizably human. One horn bud has lifted the hair and
  // the other temple is untouched, keeping the silhouette deliberately uneven.
  linePx(ctx, c + far * 3, headY + 1, c + far * 6, headY - 5, PALETTE.outline, 3);
  linePx(ctx, c + far * 3, headY, c + far * 6, headY - 5, PALETTE.hostBone, 1);
  px(ctx, c + far * 6, headY - 5, PALETTE.hostGold, 1, 1);

  // A thin Vale seam moves beneath the jaw and into a small rib wound. It is
  // narrow enough that the old coat and the person inside it still read first.
  if (!meta.back) {
    linePx(ctx, c + near * 2, headY + 6, c + near, shoulderY + 6, PALETTE.hostBlack, 2);
    linePx(ctx, c + near * 2, headY + 6, c + near, shoulderY + 6, PALETTE.hostGold, 1);
    px(ctx, c - 3, shoulderY + 8, PALETTE.hostBlack, 7, 5);
    px(ctx, c - 2, shoulderY + 9, PALETTE.hostRed, 5, 3);
    px(ctx, c, shoulderY + 9 + pulse, PALETTE.hostGold, 1, 2);
    linePx(ctx, c - 3, shoulderY + 9, c - 7, shoulderY + 7, PALETTE.hostBone, 1);
    linePx(ctx, c + 3, shoulderY + 10, c + 7, shoulderY + 8, PALETTE.hostBone, 1);
  } else {
    linePx(ctx, c + 1, shoulderY + 2, c - 2, hipY - 3, PALETTE.hostGold, 1);
    px(ctx, c - 4, shoulderY + 5, PALETTE.hostBone, 2, 1);
    px(ctx, c + 2, shoulderY + 10, PALETTE.hostBone, 2, 1);
  }

  // Her right wrist has become a closed prayer-hand. Fingers are still
  // visible around the edge, but the palm is one fused piece.
  const wristX = c + near * (Math.floor(torso.shoulderW / 2) + 2);
  const wristY = hipY - 3 + pulse;
  linePx(ctx, c + near * 4, shoulderY + 6, wristX, wristY, PALETTE.hostBlack, 4);
  linePx(ctx, c + near * 4, shoulderY + 6, wristX, wristY, PALETTE.skinDark, 2);
  px(ctx, wristX - 2, wristY - 2, PALETTE.hostBone, 5, 5);
  px(ctx, wristX - 1, wristY - 1, PALETTE.skinDark, 3, 3);
  for (let i = 0; i < 4; i += 1) {
    px(ctx, wristX - 2 + i, wristY + 2, i === 2 ? PALETTE.hostGold : PALETTE.hostBone, 1, 2 + (i & 1));
  }
  detailLinePx(ctx, c + far * 3.5, headY + 0.5, c + far * 6.5, headY - 4.5, PALETTE.hostBone);
  detailLinePx(ctx, c + near * 1.5, headY + 6.5, c + near * 0.5, shoulderY + 6.5, PALETTE.hostGold);
  detailLinePx(ctx, wristX - 1.5, wristY - 1.5, wristX + 1.5, wristY + 1.5, PALETTE.hostBone);
  detailPx(ctx, wristX + near * 0.5, wristY + 2.5, PALETTE.hostGold);
}

function drawRunnerHead({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, style, x, y }) {
  const side = directionSide(meta);
  const hit = pose.hit ? side : 0;
  const yaw = meta.view === 'side' ? side : meta.view === 'three' ? side : 0;
  const c = x + hit + yaw;
  const hornSide = meta.view === 'side' ? -side : (style.hostVariant === 'road' ? -1 : 1);
  const pulse = pose.bob ? 1 : 0;

  // A long, exposed neck separates the small ruined head from the shoulders.
  // The outline stays narrow enough to read as tendon instead of a second torso.
  const neckBaseX = x + Math.round(yaw * 0.25);
  linePx(ctx, c, y + 6, neckBaseX, y + style.headHeight, PALETTE.outline, 3);
  linePx(ctx, c, y + 6, neckBaseX, y + style.headHeight, PALETTE.skinDark, 1);
  detailLinePx(ctx, c - 0.5, y + 6.5, neckBaseX - 0.5, y + style.headHeight - 0.5, PALETTE.skinMid);
  detailLinePx(ctx, c + 0.5, y + 7.5, neckBaseX + 0.5, y + style.headHeight - 1.5, PALETTE.hostGold);

  const widths = meta.view === 'side'
    ? [3, 4, 5, 5, 4, 4, 3, 2]
    : [4, 5, 6, 6, 5, 5, 4, 3];
  for (let row = 0; row < widths.length; row += 1) {
    const width = widths[row];
    const rowYaw = Math.round(yaw * row / 8);
    const sx = c + rowYaw - Math.floor(width / 2);
    px(ctx, sx - 1, y - 1 + row, PALETTE.outline, width + 2, 1);
    px(ctx, sx, y - 1 + row, row < 2 ? PALETTE.skinMid : PALETTE.skinDark, width, 1);
    if (row > 0 && row < 4) px(ctx, sx, y - 1 + row, row === 1 ? PALETTE.hostBone : PALETTE.skinMid, 1, 1);
    if (row > 4) px(ctx, sx + width - 1, y - 1 + row, PALETTE.hostBlack, 1, 1);
  }

  if (meta.back) {
    linePx(ctx, c - 1, y, c + 1, y + 5, PALETTE.hostBone, 1);
    px(ctx, c + hornSide * 2, y + 2, PALETTE.hostBlack, 2, 2);
  } else if (meta.view === 'side') {
    px(ctx, c + side, y + 2, PALETTE.void, 2, 2);
    detailPx(ctx, c + side * 1.5, y + 2.5, pulse ? PALETTE.hostGlow : PALETTE.hostGold);
    px(ctx, c + side, y + 5, PALETTE.void, 2, 1);
    detailPx(ctx, c + side * 1.5, y + 5.5, PALETTE.hostBone);
  } else {
    px(ctx, c - 2 + yaw, y + 2, PALETTE.void, 2, 2);
    px(ctx, c + 1 + yaw, y + 2, PALETTE.void, 1, 2);
    detailPx(ctx, c + 1.5 + yaw, y + 2.5, pulse ? PALETTE.hostGlow : PALETTE.hostGold);
    px(ctx, c - 1 + yaw, y + 5, PALETTE.void, 3, 2);
    px(ctx, c - 1 + yaw, y + 5, PALETTE.hostBone, 1, 2);
  }

  // One horn has only begun to lift from the temple. The other side is a torn
  // bone bud, so the head reads as a damaged person before a demon mask.
  const hornRootX = c + hornSide * 2;
  linePx(ctx, hornRootX, y, c + hornSide * 3, y - 3, PALETTE.outline, 2);
  linePx(ctx, hornRootX, y - 1, c + hornSide * 3, y - 3, PALETTE.hostBone, 1);
  px(ctx, c - hornSide * 2, y, PALETTE.stoneDust, 1, 1);
  detailLinePx(ctx, hornRootX + hornSide * 0.5, y - 1.5, c + hornSide * 2.5, y - 2.5, PALETTE.hostBone);
}

function drawRunnerHand({ ctx, px, linePx, detailLinePx, wrist, direction, far, fused }) {
  const flesh = far ? PALETTE.woodDark : PALETTE.skinDark;
  const bone = far ? PALETTE.stoneDust : PALETTE.hostBone;
  px(ctx, wrist.x - 1, wrist.y - 1, PALETTE.outline, 3, 3);
  px(ctx, wrist.x, wrist.y, flesh, 1, 2);
  if (fused) {
    linePx(ctx, wrist.x + direction, wrist.y, wrist.x + direction * 4, wrist.y - 1, PALETTE.outline, 2);
    linePx(ctx, wrist.x + direction, wrist.y, wrist.x + direction * 4, wrist.y - 1, bone, 1);
    linePx(ctx, wrist.x + direction, wrist.y + 1, wrist.x + direction * 3, wrist.y + 2, bone, 1);
  } else {
    for (let finger = -1; finger <= 1; finger += 1) {
      const length = finger === 0 ? 4 : 3;
      linePx(
        ctx,
        wrist.x + direction,
        wrist.y + finger,
        wrist.x + direction * length,
        wrist.y + finger * 2,
        bone,
        1
      );
    }
  }
  detailLinePx(ctx, wrist.x + direction * 0.5, wrist.y - 0.5, wrist.x + direction * 2.5, wrist.y - 0.5, bone);
}

function drawRunnerArm({ ctx, px, linePx, detailLinePx, style, shoulder, elbow, wrist, far, handDirection, fused }) {
  const flesh = far ? PALETTE.woodDark : PALETTE.skinDark;
  const highlight = far ? PALETTE.skinDark : PALETTE.skinMid;
  const sleeve = far ? style.coatLo : style.coat;

  px(ctx, shoulder.x - 1, shoulder.y - 1, PALETTE.outline, 4, 4);
  px(ctx, shoulder.x, shoulder.y, sleeve, 2, 3);
  px(ctx, shoulder.x + (handDirection < 0 ? -2 : 1), shoulder.y + 2, style.coatDk, 2, 2);
  linePx(ctx, shoulder.x, shoulder.y + 2, elbow.x, elbow.y, PALETTE.outline, 2);
  linePx(ctx, elbow.x, elbow.y, wrist.x, wrist.y, PALETTE.outline, 2);
  linePx(ctx, shoulder.x, shoulder.y + 2, elbow.x, elbow.y, flesh, 1);
  linePx(ctx, elbow.x, elbow.y, wrist.x, wrist.y, flesh, 1);
  px(ctx, elbow.x - 1, elbow.y - 1, PALETTE.outline, 3, 3);
  px(ctx, elbow.x, elbow.y, PALETTE.hostBone, 1, 1);
  detailLinePx(ctx, shoulder.x - 0.5, shoulder.y + 1.5, elbow.x - 0.5, elbow.y - 0.5, highlight);
  detailLinePx(ctx, elbow.x - 0.5, elbow.y - 0.5, wrist.x - 0.5, wrist.y - 0.5, PALETTE.hostBone);
  drawRunnerHand({ ctx, px, linePx, detailLinePx, wrist, direction: handDirection, far, fused });
}

function drawRunnerArms({ ctx, px, linePx, detailLinePx, meta, pose, style, shoulderY, torso }) {
  const c = torso.bodyCx;
  const side = directionSide(meta);
  const shoulderHalf = Math.max(4, Math.floor(torso.shoulderW / 2));
  const openSide = meta.view === 'side' ? side : (style.hostVariant === 'road' ? -1 : 1);
  const action = Math.max(pose.attack ?? 0, pose.reach ?? 0);
  const attackReach = Math.min(4, Math.round(action * 0.4));
  const swayA = Math.max(-1, Math.min(1, Math.round((pose.armA ?? 0) * 0.5)));
  const swayB = Math.max(-1, Math.min(1, Math.round((pose.armB ?? 0) * 0.5)));

  if (meta.view === 'side') {
    const farShoulder = { x: c - side * 2, y: shoulderY + 4 };
    const farElbow = { x: c + side * 4, y: shoulderY + 4 + swayA };
    const farWrist = { x: c + side * (9 + Math.floor(attackReach * 0.45)), y: shoulderY - 3 + swayA };
    const nearShoulder = { x: c + side * shoulderHalf, y: shoulderY + 3 };
    const nearElbow = { x: c + side * (shoulderHalf + 5), y: shoulderY + 7 + swayB };
    const nearWrist = { x: c + side * (shoulderHalf + 9 + attackReach), y: shoulderY + 4 + swayB };
    drawRunnerArm({
      ctx, px, linePx, detailLinePx, style,
      shoulder: farShoulder, elbow: farElbow, wrist: farWrist,
      far: true, handDirection: side, fused: openSide !== side
    });
    drawRunnerArm({
      ctx, px, linePx, detailLinePx, style,
      shoulder: nearShoulder, elbow: nearElbow, wrist: nearWrist,
      far: false, handDirection: side, fused: false
    });
    return;
  }

  const leftReach = openSide < 0 ? attackReach : 0;
  const rightReach = openSide > 0 ? attackReach : 0;
  const leftArm = {
    shoulder: { x: c - shoulderHalf, y: shoulderY + 3 },
    elbow: { x: c - shoulderHalf - 5, y: shoulderY + 8 + swayA },
    wrist: { x: c - shoulderHalf - 9 - leftReach, y: shoulderY + 2 + swayA }
  };
  const rightArm = {
    shoulder: { x: c + shoulderHalf, y: shoulderY + 3 },
    elbow: { x: c + shoulderHalf + 5, y: shoulderY + 7 + swayB },
    wrist: { x: c + shoulderHalf + 9 + rightReach, y: shoulderY + 5 + swayB }
  };
  const farIsLeft = meta.view === 'three' ? side > 0 : meta.back;
  const first = farIsLeft ? leftArm : rightArm;
  const second = farIsLeft ? rightArm : leftArm;
  const firstDirection = farIsLeft ? -1 : 1;
  const secondDirection = -firstDirection;
  drawRunnerArm({
    ctx, px, linePx, detailLinePx, style, ...first,
    far: true, handDirection: firstDirection, fused: firstDirection !== openSide
  });
  drawRunnerArm({
    ctx, px, linePx, detailLinePx, style, ...second,
    far: false, handDirection: secondDirection, fused: secondDirection !== openSide
  });
}

function drawRunnerDetails({ ctx, px, linePx, detailPx, detailLinePx, meta, pose, shoulderY, hipY, footY, torso, style }) {
  const c = torso.bodyCx;
  const openSide = meta.view === 'side' ? directionSide(meta) : (style.hostVariant === 'road' ? -1 : 1);
  const brokenSide = -openSide;
  const pulse = pose.bob ? 1 : 0;
  const shoulderHalf = Math.max(4, Math.floor(torso.shoulderW / 2));

  // A single scapular thorn interrupts the human outline. Its mate broke close
  // to the shoulder, keeping the form lopsided and bodily rather than armored.
  linePx(ctx, c + openSide * shoulderHalf, shoulderY + 2, c + openSide * (shoulderHalf + 4), shoulderY - 3, PALETTE.outline, 2);
  linePx(ctx, c + openSide * shoulderHalf, shoulderY + 2, c + openSide * (shoulderHalf + 4), shoulderY - 3, PALETTE.hostBone, 1);
  px(ctx, c + brokenSide * shoulderHalf, shoulderY + 1, PALETTE.hostBone, 2, 2);

  if (!meta.back) {
    const profile = meta.view === 'side';
    const cavityTop = shoulderY + 2;
    const cavityBottom = hipY - 1;
    const cavityH = Math.max(10, cavityBottom - cavityTop);
    const cavityW = profile ? 5 : 9;
    const cavityX = c - Math.floor(cavityW / 2) + (profile ? openSide : 0);
    px(ctx, cavityX - 1, cavityTop, PALETTE.outline, cavityW + 2, cavityH + 1);
    px(ctx, cavityX, cavityTop + 1, PALETTE.hostBlack, cavityW, cavityH - 1);
    px(ctx, cavityX + 1, cavityTop + 2, PALETTE.hostRed, Math.max(2, cavityW - 2), cavityH - 4);

    const woundY = cavityTop + 5 + pulse;
    px(ctx, c - 1 + (profile ? openSide : 0), woundY, pulse ? PALETTE.hostGlow : PALETTE.hostGold, 2, 2);
    px(ctx, c + (profile ? openSide : 0), woundY, PALETTE.hostBone, 1, 1);

    for (let rib = 0; rib < 4; rib += 1) {
      const ribY = cavityTop + 1 + rib * 3;
      const spread = 5 + rib;
      if (!profile) {
        linePx(ctx, c - 2, ribY, c - spread, ribY - 1 + (rib & 1), PALETTE.outline, 2);
        linePx(ctx, c + 2, ribY + (rib & 1), c + spread + (rib === 2 ? 1 : 0), ribY - (rib & 1), PALETTE.outline, 2);
        linePx(ctx, c - 2, ribY, c - spread, ribY - 1 + (rib & 1), PALETTE.hostBone, 1);
        linePx(ctx, c + 2, ribY + (rib & 1), c + spread + (rib === 2 ? 1 : 0), ribY - (rib & 1), PALETTE.hostBone, 1);
        px(ctx, c - spread, ribY - 1 + (rib & 1), PALETTE.hostRed, 1, 1);
        if (rib !== 1) px(ctx, c + spread + (rib === 2 ? 1 : 0), ribY - (rib & 1), PALETTE.skinDark, 1, 1);
      } else {
        linePx(ctx, c + openSide, ribY, c + openSide * spread, ribY - 1 + (rib & 1), PALETTE.outline, 2);
        linePx(ctx, c + openSide, ribY, c + openSide * spread, ribY - 1 + (rib & 1), PALETTE.hostBone, 1);
        px(ctx, c + openSide * spread, ribY - 1 + (rib & 1), PALETTE.hostRed, 1, 1);
      }
    }

    linePx(ctx, c, cavityTop, c + (profile ? openSide : 0), cavityBottom, PALETTE.hostBone, 1);
    detailLinePx(ctx, c - 0.5, cavityTop + 0.5, c + (profile ? openSide : 0) - 0.5, cavityBottom - 0.5, PALETTE.stoneDust);
    detailLinePx(ctx, c + openSide * 0.5, woundY + 0.5, c + openSide * 4.5, cavityBottom - 0.5, PALETTE.hostGold);

    // Narrow strips of the old coat remain caught behind the opened ribs.
    linePx(ctx, c - shoulderHalf, shoulderY + 3, c - 4, hipY, style.coatHi, 1);
    linePx(ctx, c + shoulderHalf, shoulderY + 4, c + 4, hipY - 1, style.coatDk, 1);
    px(ctx, c - 5, hipY - 1, style.coat, 2, 5);
    px(ctx, c + 4, hipY - 2, style.coatLo, 2, 3);
  } else {
    // The rear view exposes a narrow vertebral track and ribs punched through
    // the back. It keeps the same starved mass without pretending the chest is
    // transparent from every direction.
    linePx(ctx, c, shoulderY + 1, c + openSide, hipY - 1, PALETTE.outline, 3);
    linePx(ctx, c, shoulderY + 1, c + openSide, hipY - 1, PALETTE.hostBlack, 1);
    for (let bone = 0; bone < 5; bone += 1) {
      const boneY = shoulderY + 2 + bone * 3;
      px(ctx, c - (bone & 1), boneY, PALETTE.hostBone, 2, 1);
      const spurSide = bone === 3 ? brokenSide : openSide;
      linePx(ctx, c + spurSide, boneY, c + spurSide * (4 + (bone & 1)), boneY - 1, PALETTE.hostBone, 1);
    }
    detailLinePx(ctx, c + openSide * 0.5, shoulderY + 2.5, c + openSide * 1.5, hipY - 1.5, PALETTE.hostGold);
  }

  // One ankle has opened to tendon and heel bone. The surviving shoe on the
  // other foot keeps the victim's old clothing legible.
  const openedAnkleX = c + brokenSide * 5;
  linePx(ctx, openedAnkleX, footY - 7, openedAnkleX + openSide, footY - 2, PALETTE.hostBlack, 2);
  linePx(ctx, openedAnkleX, footY - 7, openedAnkleX + openSide, footY - 2, PALETTE.hostBone, 1);
  px(ctx, openedAnkleX - 2, footY - 2, PALETTE.hostBone, 5, 2);
  detailPx(ctx, openedAnkleX + openSide * 0.5, footY - 3.5, PALETTE.hostGold);
}

function drawRunnerDeath({ ctx, w, h, style, frame, px, linePx, detailPx, detailLinePx }) {
  const c = Math.floor(w / 2);
  const groundY = h - 6;
  const fall = Math.min(1, frame / 4);
  const settle = Math.min(1, Math.max(0, (frame - 3) / 6));
  const bodyY = groundY - 9 - Math.round((1 - fall) * 18);
  const openSide = style.hostVariant === 'road' ? -1 : 1;

  if (settle > 0) {
    const poolW = Math.round(20 + settle * 18);
    for (let row = 0; row < 5; row += 1) {
      const width = Math.max(4, poolW - Math.abs(row - 2) * 5);
      px(ctx, c - Math.floor(width / 2), groundY - 2 + row, row & 1 ? PALETTE.rustDark : PALETTE.hostRed, width, 1);
    }
    detailLinePx(ctx, c - 10.5, groundY + 0.5, c + 10.5, groundY + 0.5, PALETTE.hostBlack);
  }

  // Thin legs stay full length instead of collapsing into a small Host icon.
  linePx(ctx, c + 5, bodyY + 3, c + 18, bodyY + 1, PALETTE.outline, 3);
  linePx(ctx, c + 5, bodyY + 5, c + 18, bodyY + 7, PALETTE.outline, 3);
  linePx(ctx, c + 5, bodyY + 3, c + 18, bodyY + 1, style.pants, 1);
  linePx(ctx, c + 5, bodyY + 5, c + 18, bodyY + 7, style.pantsLo, 1);
  px(ctx, c + 16, bodyY - 1, style.bootLo, 8, 3);
  px(ctx, c + 16, bodyY + 6, style.boot, 8, 3);

  // Ragged coat panels remain caught under the opened torso.
  px(ctx, c - 8, bodyY, PALETTE.outline, 17, 8);
  px(ctx, c - 7, bodyY + 1, style.coatLo, 15, 6);
  px(ctx, c - 7, bodyY + 1, style.coatHi, 8, 1);
  px(ctx, c + 5, bodyY + 2, style.coatDk, 3, 6);
  px(ctx, c - 8, bodyY + 6, style.coat, 4, 4);
  px(ctx, c + 1, bodyY + 6, style.coatLo, 3, 3);

  // The raised arms fall at different angles and keep their rake-like hands.
  linePx(ctx, c - 5, bodyY + 3, c - 11, bodyY - 4, PALETTE.outline, 2);
  linePx(ctx, c - 11, bodyY - 4, c - 17, bodyY - 3, PALETTE.outline, 2);
  linePx(ctx, c - 5, bodyY + 3, c - 11, bodyY - 4, PALETTE.skinDark, 1);
  linePx(ctx, c - 11, bodyY - 4, c - 17, bodyY - 3, PALETTE.skinDark, 1);
  linePx(ctx, c + 4, bodyY + 4, c + 9, bodyY + 10, PALETTE.outline, 2);
  linePx(ctx, c + 9, bodyY + 10, c + 15, bodyY + 11, PALETTE.outline, 2);
  linePx(ctx, c + 4, bodyY + 4, c + 9, bodyY + 10, PALETTE.skinDark, 1);
  linePx(ctx, c + 9, bodyY + 10, c + 15, bodyY + 11, PALETTE.skinMid, 1);
  for (const [hx, hy, dir] of [[c - 17, bodyY - 3, -1], [c + 15, bodyY + 11, 1]]) {
    for (let finger = -1; finger <= 1; finger += 1) {
      linePx(ctx, hx, hy + finger, hx + dir * (3 + (finger === 0 ? 1 : 0)), hy + finger * 2, PALETTE.hostBone, 1);
    }
  }

  // A narrow neck and small human head remain attached at the left end.
  linePx(ctx, c - 7, bodyY + 3, c - 14, bodyY + 2, PALETTE.outline, 3);
  linePx(ctx, c - 7, bodyY + 3, c - 14, bodyY + 2, PALETTE.skinDark, 1);
  px(ctx, c - 19, bodyY - 1, PALETTE.outline, 7, 7);
  px(ctx, c - 18, bodyY, PALETTE.skinDark, 5, 5);
  px(ctx, c - 18, bodyY, PALETTE.skinMid, 2, 1);
  px(ctx, c - 17, bodyY + 2, PALETTE.void, 2, 2);
  px(ctx, c - 15, bodyY + 4, PALETTE.hostBone, 2, 1);
  linePx(ctx, c - 17, bodyY, c - 17 + openSide * 2, bodyY - 3, PALETTE.hostBone, 1);

  // The split sternum lies open like broken chapel doors. Bone stays the main
  // material, with only one small black-gold wound in the cavity.
  px(ctx, c - 6, bodyY, PALETTE.void, 13, 8);
  px(ctx, c - 5, bodyY + 1, PALETTE.hostRed, 11, 6);
  linePx(ctx, c - 5, bodyY + 4, c + 6, bodyY + 4, PALETTE.hostBone, 1);
  for (let rib = 0; rib < 3; rib += 1) {
    const ribX = c - 4 + rib * 4;
    linePx(ctx, ribX, bodyY + 4, ribX - 3 + rib, bodyY - 3 - (rib & 1), PALETTE.hostBone, 1);
    linePx(ctx, ribX, bodyY + 4, ribX + 3 - (rib === 2 ? 1 : 0), bodyY + 9 + (rib & 1), PALETTE.hostBone, 1);
  }
  px(ctx, c, bodyY + 3, PALETTE.hostBlack, 2, 2);
  detailLinePx(ctx, c - 4.5, bodyY + 4.5, c + 5.5, bodyY + 4.5, PALETTE.stoneDust);
  detailPx(ctx, c + 0.5, bodyY + 3.5, PALETTE.stoneDark);
}

const HUMAN_HOST_BASE = {
  shoulders: 15,
  waist: 8,
  torsoLength: 17,
  legLength: 22,
  headHeight: 9,
  legSize: 2,
  armSize: 2,
  coatTail: 8,
  coatHi: PALETTE.stoneDust,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  coatDk: PALETTE.void,
  pantsHi: PALETTE.stoneLight,
  pants: PALETTE.stoneDark,
  pantsLo: PALETTE.void,
  pantsDk: PALETTE.void,
  boot: PALETTE.woodDark,
  bootHi: PALETTE.woodMid,
  bootLo: PALETTE.void,
  skinHi: PALETTE.skinLight,
  skin: PALETTE.skinMid,
  skinLo: PALETTE.skinDark,
  skinDk: PALETTE.hostBlack,
  hair: PALETTE.stoneLight,
  hairHi: PALETTE.stoneDust,
  hood: PALETTE.clothDark,
  hoodHi: PALETTE.stoneDark,
  belt: PALETTE.rustDark,
  weapon: PALETTE.hostBone,
  hostCorpse: true
};

export const STAGE_IV_LURE_STYLE = {
  ...HUMAN_HOST_BASE,
  shoulders: 14,
  waist: 8,
  hipFlare: 2,
  coatHi: PALETTE.stoneLight,
  coat: PALETTE.clothDark,
  coatLo: PALETTE.woodDark,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.stoneMid,
  skinHi: PALETTE.skinMid,
  skin: PALETTE.skinDark,
  skinLo: PALETTE.woodDark,
  hair: PALETTE.stoneDust,
  hairHi: PALETTE.hostBone,
  bareHead: true,
  hairStyle: 'loose',
  faceShape: 'long',
  age: 'elder',
  hunch: 4,
  decorate: drawStageIvLureDetails
};

const RUNNER_BASE = {
  ...HUMAN_HOST_BASE,
  shoulders: 12,
  waist: 5,
  torsoLength: 19,
  legLength: 25,
  legSize: 1,
  armSize: 1,
  coatTail: 3,
  headHeight: 9,
  hunch: 8,
  postureLean: 3,
  drawHead: drawRunnerHead,
  drawArms: drawRunnerArms,
  drawDeath: drawRunnerDeath,
  decorate: drawRunnerDetails
};

export const STAGE_IV_RUNNER_ASH_STYLE = {
  ...RUNNER_BASE,
  hostVariant: 'ash',
  coatHi: PALETTE.stoneDust,
  coat: PALETTE.stoneMid,
  coatLo: PALETTE.stoneDark,
  pantsHi: PALETTE.clothTan,
  pants: PALETTE.stoneDark,
  pantsLo: PALETTE.woodDark,
  belt: PALETTE.rustMid
};

export const STAGE_IV_RUNNER_ROAD_STYLE = {
  ...RUNNER_BASE,
  hostVariant: 'road',
  coatHi: PALETTE.clothBlue,
  coat: PALETTE.clothBlueDark,
  coatLo: PALETTE.stoneDark,
  pantsHi: PALETTE.stoneDust,
  pants: PALETTE.clothDark,
  pantsLo: PALETTE.void,
  belt: PALETTE.clothRed,
  boot: PALETTE.rustDark,
  bootHi: PALETTE.rustMid
};
