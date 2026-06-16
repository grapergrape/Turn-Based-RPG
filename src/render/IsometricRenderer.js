// Isometric scene compositor with a classic isometric CRPG scrolling camera.
//
// The entire level is baked ONCE into a large offscreen "static scene" canvas
// (floor + flat ground decals + map-edge darkening) at the level's true
// 64x32-tile scale. Each frame the camera centres on the player, clamps to the
// map, and blits the visible sub-region; volumetric props + actors are then
// drawn over it in a single depth-sorted pass, followed by tactical overlays,
// effects, a dim screen vignette, and the interface bar.

import { PALETTE } from './palette.js';
import { RENDER_CONFIG, VIEWPORT, WALL_HEIGHT, TILE_WIDTH, TILE_HEIGHT } from './renderConfig.js';
import { computeSceneBounds, gridToScreen, screenToGrid, sortKey } from './isoMath.js';
import * as P from './PixelPrimitives.js';
import { UIRenderer } from './UIRenderer.js';
import { getFrame } from './SpriteAtlas.js';

const FLAT_KINDS = new Set([
  'road-dust',
  'blood-stain',
  'rubble-decal',
  'glass-debris',
  'dust',
  'floor-crack',
  'scorch-mark',
  'wax-stain'
]);

export class IsometricRenderer {
  constructor(canvas, atlas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.atlas = atlas;
    this.ui = new UIRenderer();

    this.scene = document.createElement('canvas');
    this.sceneCtx = this.scene.getContext('2d');
    this.sceneCtx.imageSmoothingEnabled = false;

    this.sceneOrigin = { x: 0, y: 0 };
    this.worldOrigin = { x: 0, y: 0 };
    this.camera = { x: 0, y: 0 };
    this.grid = null;
    this.props = [];
    this.flatProps = [];
    this.volumeProps = [];
  }

  // Bake the static background for a level. `level` = { grid, props }.
  rebuildStaticScene(level) {
    this.grid = level.grid;
    this.props = level.props ?? [];
    this.flatProps = this.props.filter((p) => FLAT_KINDS.has(p.kind));
    this.volumeProps = this.props.filter((p) => !FLAT_KINDS.has(p.kind));

    const bounds = computeSceneBounds(this.grid.width, this.grid.height);
    this.sceneBounds = bounds;
    this.sceneOrigin = bounds.origin;
    this.scene.width = bounds.width;
    this.scene.height = bounds.height;

    const ctx = this.sceneCtx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.scene.width, this.scene.height);

    // Floor cells (skip under walls — wall blocks cover them).
    for (let y = 0; y < this.grid.height; y += 1) {
      for (let x = 0; x < this.grid.width; x += 1) {
        const def = this.grid.getTileDef(x, y);
        if (!def || def.kind === 'wall') continue;
        const s = gridToScreen(x, y, 0, this.sceneOrigin);
        const variant = P.hash2D(x, y) % 6;
        P.drawRuinedStoneFloorCell(ctx, s.x, s.y, variant, P.hash2D(x, y));
        const wallPressure = this.#wallPressure(x, y);
        if (wallPressure > 0) {
          P.drawFloorGrime(ctx, s.x, s.y, P.hash2D(x + 33, y + 41), Math.min(1.35, 0.55 + wallPressure * 0.22));
        }
      }
    }

    // Flat decals baked on top of the floor.
    for (const prop of this.flatProps) {
      const s = gridToScreen(prop.x, prop.y, 0, this.sceneOrigin);
      this.#drawFlatDecal(ctx, prop, s);
    }
  }

  // Centre the camera on the focus tile, clamped to the scene; if the scene is
  // smaller than the viewport on an axis, centre it on that axis.
  #updateCamera(focus) {
    const fs = gridToScreen(focus.x, focus.y, 0, this.sceneOrigin);
    const fx = fs.x + (focus.pxOffset?.x ?? 0);
    const fy = fs.y + (focus.pxOffset?.y ?? 0);

    const axis = (target, span, viewSpan) => {
      const max = span - viewSpan;
      if (max <= 0) return Math.round(max / 2);
      return Math.round(Math.max(0, Math.min(target, max)));
    };

    this.camera.x = axis(fx - VIEWPORT.width / 2, this.scene.width, VIEWPORT.width);
    // Bias slightly so the (tall) player sprite sits just below centre.
    this.camera.y = axis(fy - VIEWPORT.height * 0.58, this.scene.height, VIEWPORT.height);

    this.worldOrigin = {
      x: this.sceneOrigin.x - this.camera.x,
      y: this.sceneOrigin.y - this.camera.y
    };
  }

  renderFrame(state) {
    const ctx = this.ctx;
    this.#updateCamera(state.focus ?? { x: 0, y: 0 });

    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(VIEWPORT.x, VIEWPORT.y, VIEWPORT.width, VIEWPORT.height);
    ctx.clip();

    ctx.drawImage(this.scene, -this.camera.x, -this.camera.y);

    if (state.overlay?.debugGrid) this.#drawDebugGrid(ctx);
    this.#drawDepthSorted(ctx, state);
    this.#drawOverlays(ctx, state.overlay ?? {});
    this.#drawEffects(ctx, state.effects ?? []);
    this.#drawVignette(ctx);

    ctx.restore();

    this.ui.draw(ctx, state.ui ?? {});
  }

  #drawDepthSorted(ctx, state) {
    const anim = state.anim ?? {};
    const queue = [];

    for (const prop of this.volumeProps) {
      const zLayer = prop.kind === 'wall' ? 0 : 2;
      queue.push({ key: sortKey(prop.x, prop.y, zLayer), draw: () => this.#drawProp(ctx, prop, anim) });
    }
    for (const actor of state.actors ?? []) {
      const zLayer = actor.isDead ? 1 : 3;
      queue.push({ key: sortKey(actor.x, actor.y, zLayer), draw: () => this.#drawActor(ctx, actor, anim) });
    }

    queue.sort((a, b) => a.key - b.key);
    for (const item of queue) item.draw();
  }

  #drawProp(ctx, prop, anim) {
    const s = gridToScreen(prop.x, prop.y, 0, this.worldOrigin);
    if (!this.#onScreen(s, 120)) return;
    const seed = prop.seed ?? P.hash2D(prop.x + 1, prop.y + 1);
    const pulse = anim.pulse ?? 0;
    const flicker = anim.flicker ?? 0;

    switch (prop.kind) {
      case 'wall':
        P.drawIsoWallBlock(ctx, s.x, s.y, prop.height ?? WALL_HEIGHT, seed);
        break;
      case 'wall-broken':
        P.drawIsoWallBlock(ctx, s.x, s.y, prop.height ?? Math.round(WALL_HEIGHT * 0.55), seed);
        break;
      case 'broken-pew':
        P.drawBrokenPew(ctx, s.x, s.y, seed);
        break;
      case 'rusted-reliquary':
        P.drawRustedReliquary(ctx, s.x, s.y, seed);
        break;
      case 'field-satchel':
        P.drawFieldSatchel(ctx, s.x, s.y, seed);
        break;
      case 'corpse':
        P.drawCorpseSilhouette(ctx, s.x, s.y, seed);
        break;
      case 'quarantine-sign':
        P.drawQuarantineSign(ctx, s.x, s.y, seed);
        break;
      case 'damaged-altar':
        P.drawDamagedAltar(ctx, s.x, s.y, seed, pulse);
        break;
      case 'host-growth':
        P.drawShadowBlob(ctx, s.x, s.y + 2, 30, 14);
        P.drawHostGrowth(ctx, s.x, s.y, seed, pulse);
        break;
      case 'candle-cluster':
        P.drawWarmLightPool(ctx, s.x, s.y, seed, flicker);
        P.drawCandleCluster(ctx, s.x, s.y, seed, flicker);
        break;
      case 'rubble-pile':
        P.drawRubblePile(ctx, s.x, s.y, seed);
        break;
      case 'rusted-crate':
        P.drawRustedCrate(ctx, s.x, s.y, seed);
        break;
      case 'cracked-column':
        P.drawCrackedColumn(ctx, s.x, s.y, seed);
        break;
      case 'quarantine-barricade':
        P.drawQuarantineBarricade(ctx, s.x, s.y, seed);
        break;
      default:
        break;
    }
  }

  #drawFlatDecal(ctx, prop, s) {
    const seed = prop.seed ?? P.hash2D(prop.x + 5, prop.y + 5);
    switch (prop.kind) {
      case 'road-dust':
        P.drawNoisePixels(ctx, s.x - 30, s.y - 11, 60, 22, [PALETTE.stoneDust, PALETTE.stoneMid], 0.1, seed);
        break;
      case 'blood-stain':
        P.drawNoisePixels(ctx, s.x - 18, s.y - 8, 36, 16, [PALETTE.hostRed, PALETTE.rustDark], 0.16, seed);
        break;
      case 'rubble-decal':
        P.drawRubbleCluster(ctx, s.x, s.y, seed, 9);
        break;
      case 'glass-debris':
        P.drawNoisePixels(ctx, s.x - 18, s.y - 8, 36, 16, [PALETTE.hostBone, PALETTE.stoneLight], 0.07, seed);
        break;
      case 'floor-crack':
        P.drawCracks(ctx, s.x, s.y, seed, 5);
        break;
      case 'scorch-mark':
        P.drawScorchMark(ctx, s.x, s.y, seed);
        break;
      case 'wax-stain':
        P.drawWaxStain(ctx, s.x, s.y, seed);
        break;
      case 'dust':
      default:
        P.drawNoisePixels(ctx, s.x - 22, s.y - 9, 44, 18, [PALETTE.stoneDust], 0.05, seed);
        break;
    }
  }

  #wallPressure(x, y) {
    let count = 0;
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 }
    ];
    for (const dir of dirs) {
      const nx = x + dir.x;
      const ny = y + dir.y;
      if (!this.grid.isInside(nx, ny) || this.grid.getTileDef(nx, ny)?.kind === 'wall') {
        count += 1;
      }
    }
    return count;
  }

  #drawActor(ctx, actor, anim) {
    const base = gridToScreen(actor.x, actor.y, 0, this.worldOrigin);
    const fx = base.x + (actor.pxOffset?.x ?? 0);
    const fy = base.y + (actor.pxOffset?.y ?? 0);
    if (!this.#onScreen({ x: fx, y: fy }, 160)) return;

    const stateName = actor.render?.state ?? 'idle';
    let frameIndex = actor.render?.frameIndex ?? 0;
    if (stateName === 'idle') {
      frameIndex = anim.idleFrame ?? anim.bob ?? frameIndex; // breathing
    }

    const resolved = getFrame(this.atlas, actor.spriteId, actor.isDead ? 'dead' : stateName, actor.facing ?? 'se', frameIndex);
    if (!resolved || !resolved.frame) return;
    const { sprite, frame, mirror } = resolved;

    const shadowW = Math.round(sprite.width * (actor.isDead ? 0.9 : 0.6));
    P.drawShadowBlob(ctx, fx, fy, shadowW, Math.round(shadowW * 0.42));

    if (mirror) {
      // Mirror horizontally about the foot anchor column.
      ctx.save();
      ctx.translate(Math.round(fx), Math.round(fy - sprite.anchorY));
      ctx.scale(-1, 1);
      ctx.drawImage(frame, -sprite.anchorX, 0);
      ctx.restore();
    } else {
      ctx.drawImage(frame, Math.round(fx - sprite.anchorX), Math.round(fy - sprite.anchorY));
    }
  }

  #onScreen(s, margin) {
    return (
      s.x >= -margin && s.x <= VIEWPORT.width + margin &&
      s.y >= -margin && s.y <= VIEWPORT.height + margin
    );
  }

  // ----- Overlays ---------------------------------------------------------

  #drawOverlays(ctx, overlay) {
    if (overlay.mode === 'COMBAT') {
      if (overlay.attackRange) {
        for (const key of overlay.attackRange) this.#tileRing(ctx, key, PALETTE.rustMid, 0.28);
      }
      if (overlay.pathCells) {
        const color = overlay.pathAffordable ? PALETTE.uiGood : PALETTE.uiBad;
        for (const key of overlay.pathCells) this.#pip(ctx, key, color);
      }
      if (overlay.selectedTile) this.#selectedMarker(ctx, overlay.selectedTile);
      if (overlay.targetTile) this.#targetBracket(ctx, overlay.targetTile);
      if (overlay.pathTile && overlay.pathCost != null) {
        this.#moveCost(ctx, overlay.pathTile, overlay.pathCost, overlay.pathAffordable);
      }
    } else {
      if (overlay.footTile) this.#footMarker(ctx, overlay.footTile, 0.32);
      if (overlay.hoverTile) this.#footMarker(ctx, overlay.hoverTile, 0.18);
    }
  }

  #keyToScreen(key) {
    const [x, y] = key.split(',').map(Number);
    return gridToScreen(x, y, 0, this.worldOrigin);
  }

  #pip(ctx, key, color = PALETTE.uiGood) {
    const s = this.#keyToScreen(key);
    ctx.fillStyle = PALETTE.outline;
    ctx.fillRect(s.x - 3, s.y - 1, 7, 4);
    ctx.fillStyle = color;
    ctx.fillRect(s.x - 2, s.y, 5, 2);
  }

  // Destination marker + AP cost near the cursor.
  #moveCost(ctx, key, cost, affordable) {
    const s = this.#keyToScreen(key);
    const color = affordable ? PALETTE.uiGood : PALETTE.uiBad;
    this.#tileRing(ctx, key, color, 0.7);
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = PALETTE.outline;
    ctx.fillText(`${cost}`, s.x + 7, s.y - 17);
    ctx.fillStyle = color;
    ctx.fillText(`${cost}`, s.x + 6, s.y - 18);
  }

  #footMarker(ctx, key, alpha) {
    const s = this.#keyToScreen(key);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PALETTE.uiText;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 8);
    ctx.lineTo(s.x + 14, s.y);
    ctx.lineTo(s.x, s.y + 8);
    ctx.lineTo(s.x - 14, s.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  #selectedMarker(ctx, key) {
    const s = this.#keyToScreen(key);
    ctx.strokeStyle = PALETTE.uiWarn;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - TILE_HEIGHT / 2);
    ctx.lineTo(s.x + TILE_WIDTH / 2, s.y);
    ctx.lineTo(s.x, s.y + TILE_HEIGHT / 2);
    ctx.lineTo(s.x - TILE_WIDTH / 2, s.y);
    ctx.closePath();
    ctx.stroke();
  }

  #targetBracket(ctx, key) {
    const s = this.#keyToScreen(key);
    ctx.strokeStyle = PALETTE.uiBad;
    ctx.lineWidth = 1;
    const w = 16;
    const top = s.y - 56;
    const bottom = s.y + 6;
    const corners = [
      [s.x - w, top, 1, 1], [s.x + w, top, -1, 1],
      [s.x - w, bottom, 1, -1], [s.x + w, bottom, -1, -1]
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + 7 * dy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + 7 * dx, cy);
      ctx.stroke();
    }
  }

  #tileRing(ctx, key, color, alpha) {
    const s = this.#keyToScreen(key);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - TILE_HEIGHT / 2);
    ctx.lineTo(s.x + TILE_WIDTH / 2, s.y);
    ctx.lineTo(s.x, s.y + TILE_HEIGHT / 2);
    ctx.lineTo(s.x - TILE_WIDTH / 2, s.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  #drawDebugGrid(ctx) {
    for (let y = 0; y < this.grid.height; y += 1) {
      for (let x = 0; x < this.grid.width; x += 1) {
        this.#tileRing(ctx, `${x},${y}`, PALETTE.uiBorderLight, 0.22);
      }
    }
  }

  // ----- Effects ----------------------------------------------------------

  #drawEffects(ctx, effects) {
    for (const fx of effects) {
      const s = gridToScreen(fx.x, fx.y, 0, this.worldOrigin);
      if (fx.type === 'muzzle') {
        ctx.fillStyle = PALETTE.flash;
        ctx.fillRect(s.x - 2, s.y - 34, 5, 5);
        ctx.fillStyle = PALETTE.ember;
        ctx.fillRect(s.x, s.y - 38, 3, 3);
      } else if (fx.type === 'slash') {
        ctx.strokeStyle = PALETTE.flash;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x - 10, s.y - 44);
        ctx.lineTo(s.x + 10, s.y - 22);
        ctx.stroke();
      } else if (fx.type === 'spark') {
        ctx.fillStyle = PALETTE.ember;
        ctx.fillRect(s.x - 3, s.y - 30, 3, 3);
        ctx.fillRect(s.x + 3, s.y - 38, 3, 3);
      }
      if (fx.text) {
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = PALETTE.flash;
        ctx.fillText(fx.text, s.x - 6, s.y - 52 - (fx.rise ?? 0));
      }
    }
  }

  // ----- Vignette ---------------------------------------------------------

  #drawVignette(ctx) {
    // Stepped translucent void bands at the viewport edges dim the scene like
    // baked old CRPG lighting: no smooth gradient, just a few hard bands.
    const w = VIEWPORT.width;
    const h = VIEWPORT.height;
    for (let i = 0; i < 6; i += 1) {
      const inset = i * 8;
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = PALETTE.void;
      ctx.fillRect(0, inset, w, 5);
      ctx.fillRect(0, h - inset - 5, w, 5);
      ctx.fillRect(inset, 0, 5, h);
      ctx.fillRect(w - inset - 5, 0, 5, h);
      ctx.restore();
    }
  }

  // Map an internal-canvas pixel to a grid cell (for mouse hover).
  toGrid(internalX, internalY) {
    return screenToGrid(internalX, internalY, this.worldOrigin);
  }
}
