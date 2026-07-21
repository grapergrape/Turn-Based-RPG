import { PALETTE } from '../palette.js';
import {
  FACINGS,
  FACING_META,
  POSES,
  createCanvas,
  detailLinePx,
  detailPx,
  linePx,
  makeLazyFrameList,
  px
} from './spriteBake.js';

const WIDTH = 46;
const HEIGHT = 52;
const BODY_Y = 18;

const IDLE_HOVER = Object.freeze([0, -1, -2, -1]);
const TRAVEL_HOVER = Object.freeze([-1, -2, -2, -1, 0, -1, -2, -1]);
const TRAVEL_BANK = Object.freeze([0, -1, -1, 0, 1, 1, 0, 0]);

export function bakeUtilityDrone(attachment = null) {
  const frames = {};
  for (const [state, poses] of Object.entries(POSES)) {
    frames[state] = {};
    for (const facing of FACINGS) {
      frames[state][facing] = makeLazyFrameList(poses.length, (frame) =>
        composeDrone((ctx) => drawUtilityDrone(ctx, facing, state, frame, attachment))
      );
    }
  }
  const death = makeLazyFrameList(10, (frame) =>
    composeDrone((ctx) => drawDisabledDrone(ctx, frame, attachment))
  );
  return {
    width: WIDTH,
    height: HEIGHT,
    anchorX: Math.floor(WIDTH / 2),
    anchorY: HEIGHT - 4,
    airborne: true,
    shadowScale: 0.42,
    shadowHeightRatio: 0.28,
    frames,
    death
  };
}

function composeDrone(draw) {
  const { canvas, ctx } = createCanvas(WIDTH, HEIGHT);
  draw(ctx);
  return canvas;
}

function drawUtilityDrone(ctx, facing, state, frame, attachment) {
  const meta = FACING_META[facing] ?? FACING_META.se;
  const side = meta.side || (meta.back ? -1 : 1);
  const traveling = state === 'walk' || state === 'sneak';
  const quiet = state === 'sneak' || state === 'sneakIdle';
  const hover = traveling
    ? TRAVEL_HOVER[frame % TRAVEL_HOVER.length]
    : IDLE_HOVER[frame % IDLE_HOVER.length];
  const hit = state === 'hit' ? (frame < 2 ? side * 2 : side) : 0;
  const attack = state === 'attack' ? [0, 2, 5, 8, 4, 0][frame % 6] : 0;
  const interact = state === 'interact' ? [0, 1, 3, 5, 2, 0][frame % 6] : 0;
  const travelLean = traveling && frame > 0 && frame < 4 ? side : 0;
  const bank = traveling ? TRAVEL_BANK[frame % TRAVEL_BANK.length] * side : 0;
  const cx = Math.floor(WIDTH / 2) + hit + travelLean;
  const bodyY = BODY_Y + hover + (quiet ? 1 : 0);
  const spread = meta.view === 'side' ? 13 : meta.view === 'three' ? 15 : 16;
  const farX = cx - side * spread;
  const nearX = cx + side * spread;
  const farY = bodyY + 4 - bank;
  const nearY = bodyY + 4 + bank;
  const rotorPhase = traveling ? frame % 4 : (frame * 2) % 4;
  const shellW = meta.view === 'side' ? 16 : meta.view === 'three' ? 20 : 22;

  drawTailVane(ctx, cx, bodyY, side, meta);
  drawLiftPod(ctx, farX, farY, rotorPhase + 2, { far: true, quiet });
  drawLiftYoke(ctx, cx, bodyY, farX, farY, nearX, nearY, side);
  drawFarToolArm(ctx, cx, bodyY + 9, side, attack, interact);
  drawShell(ctx, cx, bodyY, shellW, meta, frame, state);
  drawAttachment(ctx, cx, bodyY, side, attachment, meta);
  drawLiftPod(ctx, nearX, nearY, rotorPhase, { quiet });
  drawServiceKeel(ctx, cx, bodyY, frame, state);
  drawNearToolArm(ctx, cx, bodyY + 10, side, attack, interact);
  drawAntenna(ctx, cx, bodyY, side, frame, state);
}

function drawLiftYoke(ctx, cx, bodyY, farX, farY, nearX, nearY, side) {
  linePx(ctx, cx - side * 6, bodyY + 4, farX + side * 5, farY, PALETTE.outline, 3);
  linePx(ctx, cx - side * 6, bodyY + 3, farX + side * 5, farY, PALETTE.rustDark, 1);
  linePx(ctx, cx + side * 6, bodyY + 4, nearX - side * 5, nearY, PALETTE.outline, 3);
  linePx(ctx, cx + side * 6, bodyY + 3, nearX - side * 5, nearY, PALETTE.stoneLight, 1);
  detailLinePx(ctx, cx - side * 5.5, bodyY + 2.5, farX + side * 4.5, farY - 0.5, PALETTE.stoneMid);
  detailLinePx(ctx, cx + side * 5.5, bodyY + 2.5, nearX - side * 4.5, nearY - 0.5, PALETTE.stoneDust);
}

function drawLiftPod(ctx, x, y, phase, { far = false, quiet = false } = {}) {
  const top = far ? PALETTE.stoneMid : PALETTE.stoneDust;
  const mid = far ? PALETTE.stoneDark : PALETTE.stoneMid;
  const edge = far ? PALETTE.rustDark : PALETTE.rustMid;
  const aperture = quiet ? 7 : 11;

  // A thick, open duct must remain legible around the moving blade. The blade
  // changes hard-pixel phase instead of becoming a soft blur.
  px(ctx, x - 6, y - 4, PALETTE.outline, 13, 2);
  px(ctx, x - 8, y - 2, PALETTE.outline, 17, 5);
  px(ctx, x - 6, y + 3, PALETTE.outline, 13, 2);
  px(ctx, x - 5, y - 3, top, 11, 1);
  px(ctx, x - 7, y - 1, mid, 15, 3);
  px(ctx, x - Math.floor(aperture / 2), y - 1, PALETTE.void, aperture, 2);
  px(ctx, x - 5, y + 2, edge, 11, 1);
  px(ctx, x - 7, y - 1, top, 2, 2);

  const bladeTone = far ? PALETTE.rustMid : PALETTE.stoneLight;
  switch (phase & 3) {
    case 0:
      px(ctx, x - 4, y, bladeTone, 9, 1);
      px(ctx, x, y - 1, PALETTE.rustLight, 1, 3);
      break;
    case 1:
      linePx(ctx, x - 4, y + 1, x + 4, y - 1, bladeTone, 1);
      break;
    case 2:
      px(ctx, x, y - 1, bladeTone, 1, 3);
      px(ctx, x - 2, y, PALETTE.rustLight, 5, 1);
      break;
    default:
      linePx(ctx, x - 4, y - 1, x + 4, y + 1, bladeTone, 1);
      break;
  }
  px(ctx, x - 2, y + 4, PALETTE.outline, 5, 3);
  px(ctx, x - 1, y + 4, far ? PALETTE.rustDark : PALETTE.rustLight, 3, 2);
  detailLinePx(ctx, x - 4.5, y - 3.5, x + 4.5, y - 3.5, top);
  detailPx(ctx, x - 6.5, y - 0.5, far ? PALETTE.stoneMid : PALETTE.stoneDust);
}

function drawTailVane(ctx, cx, y, side, meta) {
  const tail = meta.view === 'front' ? -1 : meta.view === 'back' ? 1 : -side;
  linePx(ctx, cx + tail * 5, y + 4, cx + tail * 13, y + 1, PALETTE.outline, 3);
  linePx(ctx, cx + tail * 5, y + 3, cx + tail * 13, y + 1, PALETTE.rustDark, 1);
  px(ctx, cx + tail * 14 - 2, y - 2, PALETTE.outline, 5, 7);
  px(ctx, cx + tail * 14 - 1, y - 1, PALETTE.rustMid, 3, 5);
  px(ctx, cx + tail * 14 - 1, y - 1, PALETTE.rustLight, 1, 3);
}

function drawShell(ctx, cx, y, width, meta, frame, state) {
  const left = Math.round(cx - width / 2);
  const blink = state === 'idle' && frame === 1;

  // The tapered service canister hangs between the lift ducts. Its lower edge
  // ends well above the actor anchor, leaving an unmistakable air gap.
  px(ctx, left + 5, y - 3, PALETTE.outline, width - 10, 2);
  px(ctx, left + 2, y - 1, PALETTE.outline, width - 4, 3);
  px(ctx, left, y + 2, PALETTE.outline, width, 8);
  px(ctx, left + 2, y + 10, PALETTE.outline, width - 4, 4);
  px(ctx, left + 5, y + 14, PALETTE.outline, width - 10, 2);

  px(ctx, left + 6, y - 2, PALETTE.stoneDust, width - 12, 2);
  px(ctx, left + 3, y, PALETTE.stoneLight, width - 6, 3);
  px(ctx, left + 1, y + 3, PALETTE.stoneMid, width - 2, 6);
  px(ctx, left + 3, y + 9, PALETTE.stoneDark, width - 6, 4);
  px(ctx, left + 6, y + 13, PALETTE.rustDark, width - 12, 2);
  px(ctx, left + 2, y + 3, PALETTE.stoneLight, 3, 5);
  px(ctx, left + width - 5, y + 5, PALETTE.rustMid, 3, 4);
  px(ctx, left + 5, y + 1, PALETTE.stoneDust, Math.max(3, Math.floor(width * 0.32)), 2);
  detailLinePx(ctx, left + 5.5, y - 1.5, left + width - 6.5, y - 1.5, PALETTE.stoneDust);
  detailLinePx(ctx, left + 1.5, y + 3.5, left + 1.5, y + 8.5, PALETTE.stoneLight);

  const lensSide = meta.side || (meta.back ? -1 : 1);
  const lensX = cx + lensSide * Math.max(1, Math.floor(width * 0.18));
  if (!meta.back || meta.view === 'three') {
    px(ctx, lensX - 3, y + 4, PALETTE.outline, 7, 5);
    px(ctx, lensX - 2, y + 5, PALETTE.rustDark, 5, 3);
    if (blink) {
      px(ctx, lensX - 1, y + 6, PALETTE.hostGold, 3, 1);
    } else {
      px(ctx, lensX - 1, y + 5, PALETTE.hostGold, 3, 2);
      detailPx(ctx, lensX - 0.5, y + 4.5, PALETTE.flash);
    }
  } else {
    for (let vent = -1; vent <= 1; vent += 1) {
      px(ctx, cx - 5, y + 5 + vent * 2, PALETTE.rustDark, 10, 1);
      detailLinePx(ctx, cx - 4.5, y + 4.5 + vent * 2, cx + 3.5, y + 4.5 + vent * 2, PALETTE.stoneLight);
    }
  }

  const plateX = cx - lensSide * Math.max(2, Math.floor(width * 0.2));
  px(ctx, plateX - 3, y + 6, PALETTE.clothTan, 5, 4);
  px(ctx, plateX - 2, y + 7, PALETTE.clothRed, 1, 2);
  px(ctx, plateX, y + 7, PALETTE.clothRed, 1, 2);
  detailPx(ctx, plateX + 1.5, y + 6.5, PALETTE.hostBone);
}

function drawServiceKeel(ctx, cx, y, frame, state) {
  const swing = state === 'walk' || state === 'sneak'
    ? [0, 1, 1, 0, -1, -1, 0, 0][frame % 8]
    : 0;
  px(ctx, cx - 4, y + 13, PALETTE.outline, 9, 6);
  px(ctx, cx - 3, y + 14, PALETTE.stoneDark, 7, 4);
  px(ctx, cx - 2, y + 14, PALETTE.stoneLight, 3, 2);
  linePx(ctx, cx, y + 18, cx + swing, y + 22, PALETTE.outline, 3);
  linePx(ctx, cx, y + 18, cx + swing, y + 21, PALETTE.rustLight, 1);
  px(ctx, cx + swing - 3, y + 21, PALETTE.outline, 7, 4);
  px(ctx, cx + swing - 2, y + 22, PALETTE.rustDark, 5, 2);
  detailPx(ctx, cx + swing + 1.5, y + 21.5, PALETTE.stoneDust);
}

function drawAntenna(ctx, cx, y, side, frame, state) {
  const twitch = state === 'idle' && frame === 2 ? side : state === 'hit' ? -side : 0;
  linePx(ctx, cx - 4 * side, y - 1, cx - 7 * side + twitch, y - 9, PALETTE.outline, 2);
  linePx(ctx, cx - 4 * side, y - 2, cx - 7 * side + twitch, y - 9, PALETTE.rustLight, 1);
  px(ctx, cx - 8 * side + twitch, y - 11, PALETTE.outline, 3, 3);
  detailPx(ctx, cx - 7.5 * side + twitch, y - 10.5, PALETTE.hostGold);
}

function drawFarToolArm(ctx, cx, y, side, attack, interact) {
  const reach = Math.max(interact, Math.floor(attack / 2));
  const far = -side;
  const elbowX = cx + far * 9;
  const elbowY = y + (reach ? 5 : 3);
  const tipX = cx + far * (11 + reach);
  const tipY = y + (reach ? 10 : 6);
  linePx(ctx, cx + far * 6, y, elbowX, elbowY, PALETTE.outline, 3);
  linePx(ctx, elbowX, elbowY, tipX, tipY, PALETTE.outline, 3);
  linePx(ctx, cx + far * 6, y, elbowX, elbowY, PALETTE.rustDark, 1);
  linePx(ctx, elbowX, elbowY, tipX, tipY, PALETTE.stoneMid, 1);
  px(ctx, tipX - 1, tipY - 1, PALETTE.outline, 3, 4);
  detailPx(ctx, elbowX - 0.5, elbowY - 0.5, PALETTE.rustLight);
}

function drawNearToolArm(ctx, cx, y, side, attack, interact) {
  const reach = Math.max(attack, interact);
  const folded = reach === 0;
  const elbowX = cx + side * (9 + Math.floor(reach / 3));
  const elbowY = y + (folded ? 3 : attack ? 2 : 6);
  const tipX = folded ? cx + side * 8 : cx + side * (12 + reach);
  const tipY = y + (folded ? 7 : attack ? 1 : 11);
  linePx(ctx, cx + side * 6, y, elbowX, elbowY, PALETTE.outline, 3);
  linePx(ctx, elbowX, elbowY, tipX, tipY, PALETTE.outline, 3);
  linePx(ctx, cx + side * 6, y - 1, elbowX, elbowY, PALETTE.stoneLight, 1);
  linePx(ctx, elbowX, elbowY, tipX, tipY, PALETTE.rustLight, 1);
  px(ctx, tipX - 2, tipY - 2, PALETTE.outline, 5, 5);
  px(ctx, tipX - 1, tipY - 1, attack ? PALETTE.hostGold : PALETTE.stoneDust, 3, 2);
  if (attack >= 5) detailPx(ctx, tipX + side * 2.5, tipY - 1.5, PALETTE.flash);
}

function drawAttachment(ctx, cx, y, side, attachment, meta) {
  if (!attachment) return;
  if (attachment === 'energy') {
    px(ctx, cx - side * 3 - 3, y - 6, PALETTE.outline, 7, 4);
    px(ctx, cx - side * 3 - 2, y - 5, PALETTE.hostGold, 5, 2);
    detailLinePx(ctx, cx - side * 3 - 1.5, y - 5.5, cx - side * 3 + 1.5, y - 5.5, PALETTE.flash);
  } else if (attachment === 'bulwark') {
    const x = cx + side * 10;
    px(ctx, x - 3, y + 3, PALETTE.outline, 7, 12);
    px(ctx, x - 2, y + 4, PALETTE.rustMid, 5, 9);
    px(ctx, x - 1, y + 4, PALETTE.rustLight, 2, 7);
  } else if (attachment === 'medical') {
    const x = cx - side * 8;
    px(ctx, x - 3, y + 5, PALETTE.outline, 7, 10);
    px(ctx, x - 2, y + 6, PALETTE.clothTan, 5, 8);
    px(ctx, x, y + 8, PALETTE.clothRed, 1, 4);
    px(ctx, x - 1, y + 9, PALETTE.clothRed, 3, 1);
  } else if (attachment === 'veil') {
    if (!meta.back) {
      px(ctx, cx + side * 2 - 5, y + 3, PALETTE.outline, 10, 7);
      px(ctx, cx + side * 2 - 4, y + 4, PALETTE.clothBlueDark, 8, 5);
      px(ctx, cx + side * 2 - 1, y + 5, PALETTE.clothBlue, 3, 2);
    }
  } else if (attachment === 'fieldworks') {
    px(ctx, cx - 8, y + 13, PALETTE.outline, 17, 4);
    px(ctx, cx - 7, y + 14, PALETTE.woodDark, 15, 2);
    for (const x of [cx - 5, cx, cx + 5]) px(ctx, x, y + 11, PALETTE.rustLight, 2, 4);
  } else if (attachment === 'core') {
    px(ctx, cx - 7, y - 4, PALETTE.outline, 15, 4);
    px(ctx, cx - 6, y - 3, PALETTE.stoneDust, 13, 2);
    detailLinePx(ctx, cx - 5.5, y - 3.5, cx + 4.5, y - 3.5, PALETTE.hostBone);
  }
}

function drawDisabledDrone(ctx, frame, attachment) {
  if (frame < 4) {
    drawFallingDrone(ctx, frame, attachment);
    return;
  }
  drawDroneWreck(ctx, frame, attachment);
}

function drawFallingDrone(ctx, frame, attachment) {
  const meta = FACING_META.se;
  const side = 1;
  const cx = Math.floor(WIDTH / 2) + frame;
  const bodyY = BODY_Y + frame * 4;
  const farX = cx - 15;
  const nearX = cx + 15;
  const farY = bodyY + 3 - frame;
  const nearY = bodyY + 5 + frame;

  drawLiftPod(ctx, farX, farY, Math.min(2, frame), { far: true });
  drawLiftYoke(ctx, cx, bodyY, farX, farY, nearX, nearY, side);
  drawFarToolArm(ctx, cx, bodyY + 9, side, 0, 0);
  drawShell(ctx, cx, bodyY, 20, meta, frame, 'hit');
  drawAttachment(ctx, cx, bodyY, side, attachment, meta);
  drawLiftPod(ctx, nearX, nearY, frame < 2 ? frame : 2);
  drawServiceKeel(ctx, cx, bodyY, frame, 'hit');
  drawNearToolArm(ctx, cx, bodyY + 10, side, 0, 0);
  drawAntenna(ctx, cx, bodyY, side, frame, 'hit');
}

function drawDroneWreck(ctx, frame, attachment) {
  const cx = Math.floor(WIDTH / 2);
  const groundY = HEIGHT - 5;
  const blink = frame < 7 ? PALETTE.hostGold : PALETTE.rustDark;

  // Both lift ducts and the full canister remain in the wreck. Disabling the
  // attendant changes its posture, not its apparent mass.
  drawWreckedLiftPod(ctx, cx - 16, groundY - 3, true);
  drawWreckedLiftPod(ctx, cx + 15, groundY - 6, false);
  px(ctx, cx - 12, groundY - 12, PALETTE.outline, 25, 11);
  px(ctx, cx - 10, groundY - 11, PALETTE.stoneDark, 21, 8);
  px(ctx, cx - 9, groundY - 11, PALETTE.stoneLight, 10, 2);
  px(ctx, cx + 2, groundY - 8, PALETTE.rustMid, 7, 4);
  px(ctx, cx - 8, groundY - 3, PALETTE.rustDark, 17, 2);
  px(ctx, cx + 6, groundY - 7, blink, 2, 1);
  linePx(ctx, cx - 9, groundY - 3, cx - 16, groundY + 1, PALETTE.rustDark, 2);
  linePx(ctx, cx + 7, groundY - 3, cx + 17, groundY, PALETTE.stoneLight, 2);
  linePx(ctx, cx - 1, groundY - 2, cx + 2, groundY + 2, PALETTE.rustDark, 2);
  linePx(ctx, cx - 7, groundY - 12, cx - 13, groundY - 18, PALETTE.outline, 2);
  linePx(ctx, cx - 7, groundY - 12, cx - 12, groundY - 17, PALETTE.rustLight, 1);
  detailLinePx(ctx, cx - 8.5, groundY - 10.5, cx - 0.5, groundY - 10.5, PALETTE.stoneDust);

  if (attachment === 'medical') px(ctx, cx - 11, groundY - 14, PALETTE.clothTan, 6, 4);
  if (attachment === 'energy') detailPx(ctx, cx + 10.5, groundY - 10.5, PALETTE.hostGold);
  if (attachment === 'bulwark') px(ctx, cx + 9, groundY - 13, PALETTE.rustMid, 5, 9);
  if (attachment === 'veil') px(ctx, cx - 2, groundY - 13, PALETTE.clothBlueDark, 7, 3);
  if (attachment === 'fieldworks') px(ctx, cx - 8, groundY - 15, PALETTE.woodDark, 15, 3);
  if (attachment === 'core') px(ctx, cx - 7, groundY - 14, PALETTE.stoneDust, 14, 2);
}

function drawWreckedLiftPod(ctx, x, y, broken) {
  px(ctx, x - 7, y - 2, PALETTE.outline, 15, 5);
  px(ctx, x - 6, y - 1, PALETTE.stoneDark, 13, 3);
  px(ctx, x - 4, y, PALETTE.void, broken ? 5 : 9, 1);
  px(ctx, x - 5, y - 1, PALETTE.stoneLight, broken ? 3 : 6, 1);
  if (broken) {
    linePx(ctx, x + 2, y - 2, x + 8, y - 6, PALETTE.rustDark, 2);
  } else {
    linePx(ctx, x - 4, y + 1, x + 4, y - 1, PALETTE.rustMid, 1);
  }
}
