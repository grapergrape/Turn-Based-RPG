// Isometric scene compositor with a classic isometric CRPG scrolling camera.
//
// The entire level is baked ONCE into a large offscreen "static scene" canvas
// (floor + flat ground decals + map-edge darkening) at the level's true
// 64x32-tile scale. Each frame the camera centres on the player, clamps to the
// map, and blits the visible sub-region; volumetric props + actors are then
// drawn over it in a single depth-sorted pass, followed by tactical overlays,
// effects, a dim screen vignette, and the interface bar.

import { PALETTE } from './palette.js';
import { RENDER_CONFIG, VIEWPORT, TILE_WIDTH, TILE_HEIGHT } from './renderConfig.js';
import { computeSceneBounds, gridToScreen, screenToGrid, sortKey } from './isoMath.js';
import * as P from './PixelPrimitives.js';
import { getSprite, FLAT_KINDS } from './spriteCatalog.js';
import { UIRenderer } from './UIRenderer.js';
import { getFrame } from './SpriteAtlas.js';

// Which `kind`s are flat ground decals vs volumetric props is owned by the
// sprite catalog (spriteCatalog.js), the single source of truth for all kinds.
const SPEECH_MAX_TEXT_WIDTH = 168;
const SPEECH_PAD_X = 7;
const SPEECH_PAD_Y = 5;
const SPEECH_LINE_HEIGHT = 11;
const SPEECH_VIEWPORT_PAD = 4;

export class IsometricRenderer {
  constructor(canvas, atlas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.atlas = atlas;
    this.ui = new UIRenderer(atlas);

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
    this.hiddenTiles = new Set();
  }

  // Bake the static background for a level. `level` = { grid, props, mood }.
  rebuildStaticScene(level) {
    this.grid = level.grid;
    this.props = level.props ?? [];
    this.mood = level.mood ?? null;
    this.hiddenTiles = level.hiddenTiles instanceof Set
      ? new Set(level.hiddenTiles)
      : new Set(level.hiddenTiles ?? []);
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

    // Floor cells (skip under walls; wall blocks cover them).
    for (let y = 0; y < this.grid.height; y += 1) {
      for (let x = 0; x < this.grid.width; x += 1) {
        const def = this.grid.getTileDef(x, y);
        if (!def || def.kind === 'wall') continue;
        if (this.#isHiddenCell(x, y)) continue;
        const s = gridToScreen(x, y, 0, this.sceneOrigin);
        P.drawStyledFloorCell(ctx, s.x, s.y, x, y, def.floor ?? 'stone');
        const wallPressure = this.#wallPressure(x, y);
        if (wallPressure > 0) {
          P.drawFloorGrime(ctx, s.x, s.y, P.hash2D(x + 33, y + 41), Math.min(1.35, 0.55 + wallPressure * 0.22));
        }
      }
    }

    // Flat decals baked on top of the floor.
    for (const prop of this.flatProps) {
      if (this.#isHiddenCell(prop.x, prop.y)) continue;
      const s = gridToScreen(prop.x, prop.y, 0, this.sceneOrigin);
      this.#drawFlatDecal(ctx, prop, s);
    }

    // Per-level mood: multiply a cold/warm shade over the whole baked floor so
    // a place like the cellar reads as a different, colder space than the nave.
    if (this.mood?.floorShade) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = this.mood.floorShadeAlpha ?? 0.5;
      ctx.fillStyle = this.mood.floorShade;
      ctx.fillRect(0, 0, this.scene.width, this.scene.height);
      ctx.restore();
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

  // Full-screen opening writ shown before the player is dropped into the level.
  renderBriefing(data) {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ui.drawBriefing(ctx, data);
  }

  renderLoading(data) {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ui.drawLoading(ctx, data);
  }

  renderFrame(state) {
    const ctx = this.ctx;
    if (state.hiddenTiles) this.hiddenTiles = state.hiddenTiles;
    this.#updateCamera(state.focus ?? { x: 0, y: 0 });

    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(VIEWPORT.x, VIEWPORT.y, VIEWPORT.width, VIEWPORT.height);
    ctx.clip();

    ctx.drawImage(this.scene, -this.camera.x, -this.camera.y);

    if (state.overlay?.debugGrid) this.#drawDebugGrid(ctx);
    this.#drawVisionCones(ctx, state.overlay?.enemyVisionCones ?? []);
    this.#drawDepthSorted(ctx, state);
    this.#drawPlayerVisibilityHalo(ctx, state);
    // Actors and ambient props (e.g. the whispering cross) share one speech pass.
    this.#drawActorSpeech(ctx, [...(state.actors ?? []), ...(state.ambientSpeakers ?? [])]);
    this.#drawOverlays(ctx, state.overlay ?? {});
    this.#drawEffects(ctx, state.effects ?? []);
    this.#drawAmbientTint(ctx);
    this.#drawVignette(ctx);

    ctx.restore();

    this.ui.draw(ctx, state.ui ?? {});
  }

  #drawDepthSorted(ctx, state) {
    const anim = state.anim ?? {};
    const queue = [];
    const player = (state.actors ?? []).find((actor) => actor.type === 'player') ?? null;

    for (const prop of this.volumeProps) {
      if (this.#isHiddenCell(prop.x, prop.y)) continue;
      const zLayer = getSprite(prop.kind)?.layer ?? 2;
      queue.push({ key: sortKey(prop.x, prop.y, zLayer), draw: () => this.#drawProp(ctx, prop, anim, player) });
    }
    for (const prop of state.groundItems ?? []) {
      if (this.#isHiddenCell(prop.x, prop.y)) continue;
      const zLayer = getSprite(prop.kind)?.layer ?? 2;
      queue.push({ key: sortKey(prop.x, prop.y, zLayer), draw: () => this.#drawProp(ctx, prop, anim, player) });
    }
    for (const actor of state.actors ?? []) {
      if (actor.type !== 'player' && this.#isHiddenCell(actor.x, actor.y)) continue;
      const zLayer = actor.isDead ? 1 : 3;
      queue.push({ key: sortKey(actor.x, actor.y, zLayer), draw: () => this.#drawActor(ctx, actor, anim) });
    }

    queue.sort((a, b) => a.key - b.key);
    for (const item of queue) item.draw();
  }

  #drawProp(ctx, prop, anim, player = null) {
    const s = gridToScreen(prop.x, prop.y, 0, this.worldOrigin);
    if (!this.#onScreen(s, 120)) return;
    const seed = prop.seed ?? P.hash2D(prop.x + 1, prop.y + 1);
    const pulse = anim.pulse ?? 0;
    const flicker = anim.flicker ?? 0;
    const alpha = this.#occludingPropAlpha(prop, player);

    if (alpha < 1) {
      ctx.save();
      ctx.globalAlpha *= alpha;
    }

    // Dispatch through the sprite catalog (single source of truth for kinds).
    // Flat decals are handled in their own floor pass; skip them here.
    const entry = getSprite(prop.kind);
    if (entry && !entry.flat) {
      entry.draw(ctx, s.x, s.y, seed, { prop, anim, pulse, flicker, player });
    }

    if (alpha < 1) ctx.restore();
  }

  // Fade anything solid (wall, broken wall, or volumetric prop) that sits within
  // one tile of the player AND in front of them (closer to the camera, i.e. a
  // larger x+y), so interior walls and columns cut away instead of hiding the
  // figure. Tall full walls fade a little harder than low props.
  #occludingPropAlpha(prop, player) {
    if (!player || player.isDead) return 1;
    const dx = Math.abs(prop.x - player.x);
    const dy = Math.abs(prop.y - player.y);
    const entry = getSprite(prop.kind);
    const canopyRadius = entry?.canopyRadius ?? 0;
    if (canopyRadius > 0 && Math.max(dx, dy) <= canopyRadius) {
      return entry.canopyAlpha ?? 0.4;
    }
    if (Math.max(dx, dy) > 1) return 1;
    if (prop.x + prop.y < player.x + player.y) return 1; // behind the player
    return prop.kind === 'wall' ? 0.4 : 0.5;
  }

  #drawFlatDecal(ctx, prop, s) {
    const seed = prop.seed ?? P.hash2D(prop.x + 5, prop.y + 5);
    // Dispatch through the sprite catalog. `dust` is also the fallback for any
    // flat kind without its own entry.
    const entry = getSprite(prop.kind);
    if (entry && entry.flat) {
      entry.draw(ctx, s.x, s.y, seed, { prop });
    } else {
      P.drawNoisePixels(ctx, s.x - 22, s.y - 9, 44, 18, [PALETTE.stoneDust], 0.05, seed);
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
    if (stateName === 'idle' || stateName === 'sneakIdle') {
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

  #drawActorSpeech(ctx, actors) {
    ctx.save();
    ctx.font = '9px "Courier New", monospace';
    ctx.textBaseline = 'top';

    for (const actor of actors) {
      if (!actor.speech?.text || actor.isDead) continue;
      if (actor.type !== 'player' && this.#isHiddenCell(actor.x, actor.y)) continue;
      const base = gridToScreen(actor.x, actor.y, 0, this.worldOrigin);
      const x = base.x + (actor.pxOffset?.x ?? 0);
      const y = base.y + (actor.pxOffset?.y ?? 0) - 78;
      if (!this.#onScreen({ x, y }, 180)) continue;

      const maxTextWidth = Math.min(
        SPEECH_MAX_TEXT_WIDTH,
        VIEWPORT.width - SPEECH_VIEWPORT_PAD * 2 - SPEECH_PAD_X * 2
      );
      const lines = this.#wrapSpeech(ctx, actor.speech.text, maxTextWidth);
      const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
      const width = Math.ceil(Math.min(VIEWPORT.width - SPEECH_VIEWPORT_PAD * 2, textWidth + SPEECH_PAD_X * 2));
      const height = lines.length * SPEECH_LINE_HEIGHT + SPEECH_PAD_Y * 2;
      const left = Math.round(clamp(
        x - width / 2,
        VIEWPORT.x + SPEECH_VIEWPORT_PAD,
        VIEWPORT.x + VIEWPORT.width - width - SPEECH_VIEWPORT_PAD
      ));
      const top = Math.round(clamp(
        y - height,
        VIEWPORT.y + SPEECH_VIEWPORT_PAD,
        VIEWPORT.y + VIEWPORT.height - height - SPEECH_VIEWPORT_PAD
      ));
      const fade = Math.min(1, Math.max(0.25, actor.speech.ttl / 0.35));

      ctx.globalAlpha = 0.84 * fade;
      ctx.fillStyle = PALETTE.void;
      ctx.fillRect(left, top, width, height);
      ctx.globalAlpha = 0.96 * fade;
      ctx.strokeStyle = PALETTE.uiBorderLight;
      ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
      ctx.fillStyle = PALETTE.uiText;
      for (let i = 0; i < lines.length; i += 1) {
        ctx.fillText(lines[i], left + SPEECH_PAD_X, top + SPEECH_PAD_Y + i * SPEECH_LINE_HEIGHT);
      }
    }

    ctx.restore();
  }

  #wrapSpeech(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
      if (ctx.measureText(word).width > maxWidth) {
        if (line) {
          lines.push(line);
          line = '';
        }
        lines.push(...this.#splitSpeechWord(ctx, word, maxWidth));
        continue;
      }
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [''];
  }

  #splitSpeechWord(ctx, word, maxWidth) {
    const parts = [];
    let part = '';
    for (const ch of word) {
      const next = part + ch;
      if (part && ctx.measureText(next).width > maxWidth) {
        parts.push(part);
        part = ch;
      } else {
        part = next;
      }
    }
    if (part) parts.push(part);
    return parts;
  }

  #drawPlayerVisibilityHalo(ctx, state) {
    const player = (state.actors ?? []).find((actor) => actor.type === 'player');
    if (!player || player.isDead) return;

    const base = gridToScreen(player.x, player.y, 0, this.worldOrigin);
    const x = base.x + (player.pxOffset?.x ?? 0);
    const y = base.y + (player.pxOffset?.y ?? 0);
    if (!this.#onScreen({ x, y }, 80)) return;

    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = PALETTE.hostBone;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 16, y);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x - 16, y);
    ctx.closePath();
    ctx.stroke();

    ctx.globalAlpha = 0.52;
    ctx.fillStyle = PALETTE.hostBone;
    ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 3);
    ctx.restore();
  }

  #onScreen(s, margin) {
    return (
      s.x >= -margin && s.x <= VIEWPORT.width + margin &&
      s.y >= -margin && s.y <= VIEWPORT.height + margin
    );
  }

  #isHiddenCell(x, y) {
    return this.hiddenTiles?.has?.(`${x},${y}`) ?? false;
  }

  #isHiddenKey(key) {
    return this.hiddenTiles?.has?.(key) ?? false;
  }

  // ----- Overlays ---------------------------------------------------------

  #drawOverlays(ctx, overlay) {
    if (overlay.mode === 'COMBAT') {
      if (overlay.attackRange) {
        for (const key of overlay.attackRange) {
          if (!this.#isHiddenKey(key)) this.#tileRing(ctx, key, PALETTE.rustMid, 0.28);
        }
      }
      if (overlay.pathCells) {
        const color = overlay.pathAffordable ? PALETTE.uiGood : PALETTE.uiBad;
        for (const key of overlay.pathCells) {
          if (!this.#isHiddenKey(key)) this.#pip(ctx, key, color);
        }
      }
      if (overlay.selectedTile && !this.#isHiddenKey(overlay.selectedTile)) this.#selectedMarker(ctx, overlay.selectedTile);
      if (overlay.targetTile && !this.#isHiddenKey(overlay.targetTile)) this.#targetBracket(ctx, overlay.targetTile);
      if (overlay.pathTile && overlay.pathCost != null && !this.#isHiddenKey(overlay.pathTile)) {
        this.#moveCost(ctx, overlay.pathTile, overlay.pathCost, overlay.pathAffordable);
      }
    } else {
      if (overlay.footTile && !this.#isHiddenKey(overlay.footTile)) this.#footMarker(ctx, overlay.footTile, 0.32);
      if (overlay.hoverTile && !this.#isHiddenKey(overlay.hoverTile)) this.#footMarker(ctx, overlay.hoverTile, 0.18);
      if (overlay.targetTile && !this.#isHiddenKey(overlay.targetTile)) this.#targetBracket(ctx, overlay.targetTile);
    }
  }

  #drawVisionCones(ctx, cones) {
    if (!Array.isArray(cones) || cones.length === 0) return;
    for (const cone of cones) {
      const alpha = cone.state === 'alerted' ? 0.2 : cone.state === 'investigating' ? 0.16 : 0.12;
      for (const key of cone.cells ?? []) {
        if (!this.#isHiddenKey(key)) this.#visionTile(ctx, key, alpha);
      }
    }
  }

  #visionTile(ctx, key, alpha) {
    const s = this.#keyToScreen(key);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.uiFailure;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - TILE_HEIGHT / 2);
    ctx.lineTo(s.x + TILE_WIDTH / 2, s.y);
    ctx.lineTo(s.x, s.y + TILE_HEIGHT / 2);
    ctx.lineTo(s.x - TILE_WIDTH / 2, s.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = Math.min(0.24, alpha + 0.06);
    ctx.strokeStyle = PALETTE.uiBad;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
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
        if (this.#isHiddenCell(x, y)) continue;
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

  // A faint, flat colour wash over the whole viewport — used by mood-tinted
  // levels (e.g. the cold cellar) to shift the temperature of the air itself.
  #drawAmbientTint(ctx) {
    if (!this.mood?.ambient) return;
    ctx.save();
    ctx.globalAlpha = this.mood.ambientAlpha ?? 0.15;
    ctx.fillStyle = this.mood.ambient;
    ctx.fillRect(VIEWPORT.x, VIEWPORT.y, VIEWPORT.width, VIEWPORT.height);
    ctx.restore();
  }

  #drawVignette(ctx) {
    // Stepped translucent void bands at the viewport edges dim the scene like
    // baked old CRPG lighting: no smooth gradient, just a few hard bands.
    const w = VIEWPORT.width;
    const h = VIEWPORT.height;
    const strength = this.mood?.vignette ?? 1;
    for (let i = 0; i < 6; i += 1) {
      const inset = i * 8;
      ctx.save();
      ctx.globalAlpha = 0.1 * strength;
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
