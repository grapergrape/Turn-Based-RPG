// Isometric scene compositor with a classic isometric CRPG scrolling camera.
//
// Floor cells and flat decals are baked into a bounded native-resolution cache
// that follows the scrolling camera. Volumetric props and actors are then drawn
// over it in a single depth-sorted pass, followed by tactical overlays, effects,
// a dim screen vignette, and the interface bar.

import { PALETTE } from './palette.js';
import { NATIVE_PIXEL, NATIVE_SCALE, VIEWPORT, TILE_WIDTH, TILE_HEIGHT, toNativePixels } from './renderConfig.js';
import { getSoftwareCanvasContext2D } from './canvasContext.js';
import { gridToScreen, screenToGrid, sortKey } from './isoMath.js';
import * as P from './PixelPrimitives.js';
import { getSprite, FLAT_KINDS } from './spriteCatalog.js';
import { UIRenderer } from './UIRenderer.js';
import { getFrame } from './SpriteAtlas.js';
import { StaticSceneCache } from './StaticSceneCache.js';
import { PropSpriteCache } from './PropSpriteCache.js';
import { ShadowMaskCache } from './ShadowMaskCache.js';
import { actorFrameSource, actorShadowProfile } from './shadowProfiles.js';
import {
  clipUiText,
  detailRect as uiDetailRect,
  rect as uiRect,
  text as uiText,
  textWidth as uiTextWidth
} from './ui/UiPrimitives.js';

// Which `kind`s are flat ground decals vs volumetric props is owned by the
// sprite catalog (spriteCatalog.js), the single source of truth for all kinds.
const SPEECH_MAX_TEXT_WIDTH = 168;
const SPEECH_PAD_X = 7;
const SPEECH_PAD_Y = 5;
const SPEECH_LINE_HEIGHT = 11;
const SPEECH_VIEWPORT_PAD = 4;
const TIME_OF_DAY_WASHES = Object.freeze({
  dawn: Object.freeze([
    Object.freeze({ color: PALETTE.clothBlueDark, alpha: 0.1 }),
    Object.freeze({ color: PALETTE.hostBone, alpha: 0.04 })
  ]),
  morning: Object.freeze([
    Object.freeze({ color: PALETTE.hostBone, alpha: 0.03 })
  ]),
  noon: Object.freeze([]),
  afternoon: Object.freeze([
    Object.freeze({ color: PALETTE.woodLight, alpha: 0.035 })
  ]),
  dusk: Object.freeze([
    Object.freeze({ color: PALETTE.rustDark, alpha: 0.12 })
  ]),
  night: Object.freeze([
    Object.freeze({ color: PALETTE.clothBlueDark, alpha: 0.22 }),
    Object.freeze({ color: PALETTE.void, alpha: 0.08 })
  ]),
  'deep-night': Object.freeze([
    Object.freeze({ color: PALETTE.clothBlueDark, alpha: 0.28 }),
    Object.freeze({ color: PALETTE.void, alpha: 0.14 })
  ])
});
const TIME_OF_DAY_VIGNETTE = Object.freeze({
  dawn: 0.18,
  morning: 0,
  noon: 0,
  afternoon: 0.04,
  dusk: 0.24,
  night: 0.5,
  'deep-night': 0.72
});
const IDLE_FRAME_COUNT = 4;

export function actorIdleFrameIndex(actor, globalFrame = 0) {
  const identity = String(actor?.spawnId ?? actor?.id ?? 'actor');
  let phase = 0;
  for (let index = 0; index < identity.length; index += 1) {
    phase = (Math.imul(phase, 31) + identity.charCodeAt(index)) >>> 0;
  }
  const frame = Number.isFinite(globalFrame) ? Math.floor(globalFrame) : 0;
  return ((frame + phase) % IDLE_FRAME_COUNT + IDLE_FRAME_COUNT) % IDLE_FRAME_COUNT;
}

export class IsometricRenderer {
  constructor(canvas, atlas) {
    this.canvas = canvas;
    this.ctx = getSoftwareCanvasContext2D(canvas);
    this.atlas = atlas;
    this.ui = new UIRenderer(atlas);

    this.staticScene = new StaticSceneCache();
    this.propSprites = new PropSpriteCache();
    this.shadowMasks = new ShadowMaskCache();
    this.castShadowLayer = document.createElement('canvas');
    this.castShadowLayer.width = toNativePixels(VIEWPORT.width);
    this.castShadowLayer.height = toNativePixels(VIEWPORT.height);
    this.castShadowCtx = getSoftwareCanvasContext2D(this.castShadowLayer);
    this.castShadowLayer.addEventListener?.('contextlost', (event) => {
      event.preventDefault?.();
      this.shadowMasks.clear();
    });
    this.castShadowLayer.addEventListener?.('contextrestored', () => {
      this.castShadowCtx = getSoftwareCanvasContext2D(this.castShadowLayer);
      this.shadowMasks.clear();
    });
    // Kept as aliases for diagnostic tools and older tests that inspect the
    // offscreen surface directly. Its size is the bounded cache, not the map.
    this.scene = this.staticScene.canvas;
    this.sceneCtx = this.staticScene.ctx;

    this.sceneOrigin = { x: 0, y: 0 };
    this.worldOrigin = { x: 0, y: 0 };
    this.camera = { x: 0, y: 0 };
    this.grid = null;
    this.props = [];
    this.flatProps = [];
    this.volumeProps = [];
    this.hiddenTiles = new Set();
    this.interactionHighlightHitboxes = [];
    this.contextLost = false;

    this.canvas.addEventListener?.('contextlost', (event) => {
      event.preventDefault?.();
      this.contextLost = true;
    });
    this.canvas.addEventListener?.('contextrestored', () => {
      this.ctx = getSoftwareCanvasContext2D(this.canvas);
      this.contextLost = false;
      this.recoverVisualCaches();
    });
  }

  // Configure the static background for a level. The first camera window is
  // baked lazily during renderFrame so loading never allocates a full-map 2x
  // surface. `level` = { grid, props, mood, hiddenTiles }.
  rebuildStaticScene(level) {
    this.propSprites.clear();
    this.shadowMasks.clear();
    this.grid = level.grid;
    this.props = level.props ?? [];
    this.mood = level.mood ?? null;
    this.hiddenTiles = level.hiddenTiles instanceof Set
      ? new Set(level.hiddenTiles)
      : new Set(level.hiddenTiles ?? []);
    this.flatProps = this.props.filter((p) => FLAT_KINDS.has(p.kind));
    this.volumeProps = this.props.filter((p) => !FLAT_KINDS.has(p.kind));

    const bounds = this.staticScene.setLevel(level);
    this.sceneBounds = bounds;
    this.sceneOrigin = bounds.origin;
  }

  // Browser resize, tab restoration, and canvas context restoration can drop
  // detached canvas backings while leaving the JavaScript cache records alive.
  // Rebuild both world layers on the next frame instead of requiring a reload.
  recoverVisualCaches() {
    this.staticScene.invalidate();
    this.propSprites.clear();
    this.shadowMasks.clear();
    this.castShadowCtx = getSoftwareCanvasContext2D(this.castShadowLayer);
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

    const sceneWidth = this.sceneBounds?.width ?? this.scene.width;
    const sceneHeight = this.sceneBounds?.height ?? this.scene.height;
    this.camera.x = axis(fx - VIEWPORT.width / 2, sceneWidth, VIEWPORT.width);
    // Bias slightly so the (tall) player sprite sits just below centre.
    this.camera.y = axis(fy - VIEWPORT.height * 0.58, sceneHeight, VIEWPORT.height);

    this.worldOrigin = {
      x: this.sceneOrigin.x - this.camera.x,
      y: this.sceneOrigin.y - this.camera.y
    };
  }

  // Full-screen opening writ shown before the player is dropped into the level.
  renderBriefing(data) {
    const ctx = this.ctx;
    if (!ctx || this.contextLost || ctx.isContextLost?.()) return;
    resetTransform(ctx);
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    setLogicalTransform(ctx);
    this.ui.drawBriefing(ctx, data);
    ctx.restore();
  }

  renderLoading(data) {
    const ctx = this.ctx;
    if (!ctx || this.contextLost || ctx.isContextLost?.()) return;
    resetTransform(ctx);
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    setLogicalTransform(ctx);
    this.ui.drawLoading(ctx, data);
    ctx.restore();
  }

  renderMenu(data) {
    const ctx = this.ctx;
    if (!ctx || this.contextLost || ctx.isContextLost?.()) return;
    resetTransform(ctx);
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    setLogicalTransform(ctx);
    this.ui.draw(ctx, data);
    ctx.restore();
  }

  renderFrame(state) {
    const ctx = this.ctx;
    if (!ctx || this.contextLost || ctx.isContextLost?.()) return;
    this.timeOfDay = state.time ?? null;
    if (state.hiddenTiles) this.hiddenTiles = state.hiddenTiles;
    this.#updateCamera(state.focus ?? { x: 0, y: 0 });

    resetTransform(ctx);
    ctx.fillStyle = PALETTE.void;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    setLogicalTransform(ctx);
    ctx.save();
    ctx.beginPath();
    ctx.rect(VIEWPORT.x, VIEWPORT.y, VIEWPORT.width, VIEWPORT.height);
    ctx.clip();

    this.staticScene.draw(ctx, this.camera, VIEWPORT);
    if (this.staticScene.consumeRecovery()) this.propSprites.clear();

    this.#drawCastShadowLayer(ctx, state);
    if (state.overlay?.debugGrid) this.#drawDebugGrid(ctx);
    this.#drawVisionCones(ctx, state.overlay?.enemyVisionCones ?? []);
    this.#drawDepthSorted(ctx, state);
    this.#drawPlayerVisibilityHalo(ctx, state);
    // Actors and ambient props (e.g. the whispering cross) share one speech pass.
    this.#drawActorSpeech(ctx, [...(state.actors ?? []), ...(state.ambientSpeakers ?? [])]);
    this.#drawOverlays(ctx, state.overlay ?? {});
    this.#drawEffects(ctx, state.effects ?? []);
    this.#drawAmbientTint(ctx);
    this.#drawTimeOfDayTint(ctx);
    this.#drawVignette(ctx);
    this.#drawHoveredWorldTarget(ctx, state);
    this.#drawInteractionHighlights(ctx, state.overlay?.interactionHighlights ?? []);

    ctx.restore();

    this.ui.draw(ctx, this.#resolveWorldAnchoredUi(state.ui ?? {}));
    ctx.restore();
  }

  #resolveWorldAnchoredUi(ui) {
    const tray = ui.combatAbilityTray;
    const actor = tray?.actor;
    if (!tray || !actor) return ui;
    return {
      ...ui,
      combatAbilityTray: {
        ...tray,
        anchor: this.toScreen(actor.x, actor.y, actor.pxOffset)
      }
    };
  }

  #drawDepthSorted(ctx, state) {
    const anim = state.anim ?? {};
    const queue = [];
    const player = (state.actors ?? []).find((actor) => actor.type === 'player') ?? null;

    for (const prop of this.volumeProps) {
      if (this.#isPropConcealed(prop)) continue;
      if (this.#isHiddenCell(prop.x, prop.y)) continue;
      const screen = gridToScreen(prop.x, prop.y, 0, this.worldOrigin);
      if (!this.#onScreen(screen, 120)) continue;
      const zLayer = getSprite(prop.kind)?.layer ?? 2;
      queue.push({ key: sortKey(prop.x, prop.y, zLayer), draw: () => this.#drawProp(ctx, prop, anim, player) });
    }
    for (const prop of state.groundItems ?? []) {
      if (this.#isHiddenCell(prop.x, prop.y)) continue;
      const screen = gridToScreen(prop.x, prop.y, 0, this.worldOrigin);
      if (!this.#onScreen(screen, 120)) continue;
      const zLayer = getSprite(prop.kind)?.layer ?? 2;
      queue.push({ key: sortKey(prop.x, prop.y, zLayer), draw: () => this.#drawProp(ctx, prop, anim, player) });
    }
    for (const prop of state.dynamicProps ?? []) {
      if (this.#isHiddenCell(prop.x, prop.y)) continue;
      const screen = gridToScreen(prop.x, prop.y, 0, this.worldOrigin);
      if (!this.#onScreen(screen, 120)) continue;
      const zLayer = getSprite(prop.kind)?.layer ?? 2;
      queue.push({ key: sortKey(prop.x, prop.y, zLayer), draw: () => this.#drawProp(ctx, prop, anim, player) });
    }
    for (const actor of state.actors ?? []) {
      if (actor.type !== 'player' && this.#isHiddenCell(actor.x, actor.y)) continue;
      const base = gridToScreen(actor.x, actor.y, 0, this.worldOrigin);
      const screen = {
        x: base.x + (actor.pxOffset?.x ?? 0),
        y: base.y + (actor.pxOffset?.y ?? 0)
      };
      if (!this.#onScreen(screen, 160)) continue;
      const zLayer = actor.isDead ? 1 : 3;
      queue.push({ key: sortKey(actor.x, actor.y, zLayer), draw: () => this.#drawActor(ctx, actor, anim) });
    }

    queue.sort((a, b) => a.key - b.key);
    for (const item of queue) item.draw();
  }

  #drawCastShadowLayer(ctx, state) {
    const sun = this.mood?.sun;
    if (!sun?.enabled) return;

    const offsetX = finiteNumber(sun.shadowOffsetX, 12);
    const offsetY = finiteNumber(sun.shadowOffsetY, 6);
    const alpha = clamp(finiteNumber(sun.shadowAlpha, 0.16), 0, 0.45);
    if (alpha <= 0) return;

    const layer = this.castShadowCtx;
    if (!layer || layer.isContextLost?.()) return;
    resetTransform(layer);
    layer.globalAlpha = 1;
    layer.globalCompositeOperation = 'source-over';
    layer.clearRect?.(0, 0, this.castShadowLayer.width, this.castShadowLayer.height);
    setLogicalTransform(layer);

    const anim = state.anim ?? {};
    const player = (state.actors ?? []).find((actor) => actor.type === 'player') ?? null;
    const projection = { x: offsetX, y: offsetY };

    for (const prop of this.#allVolumeProps(state)) {
      if (this.#isPropConcealed(prop)) continue;
      if (this.#isHiddenCell(prop.x, prop.y)) continue;
      const entry = getSprite(prop.kind);
      const profile = entry?.shadow?.cast;
      if (!entry || profile?.mode === 'none') continue;
      const s = gridToScreen(prop.x, prop.y, 0, this.worldOrigin);
      if (!this.#onScreen(s, 160)) continue;
      const seed = prop.seed ?? P.hash2D(prop.x + 1, prop.y + 1);
      const drawState = {
        prop,
        anim,
        pulse: anim.pulse ?? 0,
        flicker: anim.flicker ?? 0,
        player
      };
      const prepared = this.propSprites.prepare(entry, prop, seed, drawState);
      if (!prepared?.surface) continue;
      const coverage = this.#occludingPropAlpha(prop, player);
      const mask = this.shadowMasks.prepareCast(prepared, profile, projection, coverage);
      const anchor = preparedAnchor(s, prepared);
      this.shadowMasks.draw(layer, mask, anchor.x, anchor.y);
    }

    for (const actor of state.actors ?? []) {
      if (actor.type !== 'player' && this.#isHiddenCell(actor.x, actor.y)) continue;
      const visual = this.#resolveActorVisual(actor, anim);
      if (!visual || !this.#onScreen({ x: visual.fx, y: visual.fy }, 140)) continue;
      const profile = actorShadowProfile(actor, visual.sprite, visual.stateName).cast;
      const mask = this.shadowMasks.prepareCast(visual.source, profile, projection, 1);
      this.#drawActorMask(layer, mask, visual);
    }

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(
      this.castShadowLayer,
      0,
      0,
      this.castShadowLayer.width,
      this.castShadowLayer.height,
      VIEWPORT.x,
      VIEWPORT.y,
      VIEWPORT.width,
      VIEWPORT.height
    );
    ctx.restore();
  }

  #allVolumeProps(state) {
    return [
      ...this.volumeProps,
      ...(state.groundItems ?? []),
      ...(state.dynamicProps ?? [])
    ];
  }

  #allRenderableProps(state) {
    return [
      ...this.props,
      ...(state.groundItems ?? []),
      ...(state.dynamicProps ?? [])
    ];
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
      const drawState = { prop, anim, pulse, flicker, player };
      const prepared = this.propSprites.prepare(entry, prop, seed, drawState);
      if (prepared) {
        const contact = this.shadowMasks.prepareContact(prepared, entry.shadow?.contact);
        if (contact) {
          ctx.save();
          ctx.globalAlpha *= clamp(finiteNumber(entry.shadow?.contact?.alphaScale, 0.3), 0, 1);
          const anchor = preparedAnchor(s, prepared);
          this.shadowMasks.draw(ctx, contact, anchor.x, anchor.y);
          ctx.restore();
        }
        this.propSprites.composite(ctx, prepared, s.x, s.y);
      } else {
        entry.draw(ctx, s.x, s.y, seed, drawState);
      }
      entry.drawLiveOverlay?.(ctx, s.x, s.y, seed, drawState);
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
    return entry?.block ? 0.4 : 0.5;
  }

  #drawActor(ctx, actor, anim) {
    const visual = this.#resolveActorVisual(actor, anim);
    if (!visual || !this.#onScreen({ x: visual.fx, y: visual.fy }, 160)) return;
    const { sprite, frame, mirror, fx, fy, stateName, source } = visual;

    const profile = actorShadowProfile(actor, sprite, stateName).contact;
    const contact = this.shadowMasks.prepareContact(source, profile);
    if (contact) {
      ctx.save();
      ctx.globalAlpha *= clamp(finiteNumber(profile.alphaScale, 0.3), 0, 1);
      this.#drawActorMask(ctx, contact, visual);
      ctx.restore();
    }

    if (mirror) {
      // Mirror horizontally about the foot anchor column.
      ctx.save();
      ctx.translate(Math.round(fx), Math.round(fy - sprite.anchorY));
      ctx.scale(-1, 1);
      ctx.drawImage(frame, -sprite.anchorX, 0, sprite.width, sprite.height);
      ctx.restore();
    } else {
      ctx.drawImage(
        frame,
        Math.round(fx - sprite.anchorX),
        Math.round(fy - sprite.anchorY),
        sprite.width,
        sprite.height
      );
    }
  }

  #resolveActorVisual(actor, anim) {
    const base = gridToScreen(actor.x, actor.y, 0, this.worldOrigin);
    const fx = base.x + (actor.pxOffset?.x ?? 0);
    const fy = base.y + (actor.pxOffset?.y ?? 0);
    const stateName = actor.render?.state ?? 'idle';
    let frameIndex = actor.render?.frameIndex ?? 0;
    if (stateName === 'idle' || stateName === 'sneakIdle') {
      frameIndex = actorIdleFrameIndex(actor, anim.idleFrame ?? anim.bob ?? frameIndex);
    }
    const resolved = getFrame(
      this.atlas,
      actor.spriteId,
      actor.isDead ? 'dead' : stateName,
      actor.facing ?? 'se',
      frameIndex
    );
    if (!resolved?.frame) return null;
    const { sprite, frame, mirror } = resolved;
    return {
      actor,
      sprite,
      frame,
      mirror,
      fx,
      fy,
      stateName,
      source: actorFrameSource(sprite, frame)
    };
  }

  #drawActorMask(ctx, mask, visual) {
    if (!mask) return;
    if (!visual.mirror) {
      this.shadowMasks.draw(ctx, mask, visual.fx, visual.fy);
      return;
    }
    ctx.save();
    ctx.translate(Math.round(visual.fx), 0);
    ctx.scale(-1, 1);
    this.shadowMasks.draw(ctx, mask, 0, visual.fy);
    ctx.restore();
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
      ctx.fillStyle = PALETTE.outline;
      ctx.fillRect(left - 1, top - 1, width + 2, height + 2);
      ctx.fillRect(Math.round(x) - 4, top + height, 9, 5);
      ctx.fillStyle = PALETTE.uiDark;
      ctx.fillRect(left, top, width, height);
      ctx.fillRect(Math.round(x) - 2, top + height, 5, 3);
      for (let sx = left + 6; sx < left + width - 8; sx += 17) {
        ctx.fillStyle = PALETTE.uiBorderDark;
        ctx.fillRect(sx, top + 4 + (sx % 3), 5, 1);
      }
      ctx.globalAlpha = 0.96 * fade;
      ctx.fillStyle = PALETTE.uiBorderLight;
      ctx.fillRect(left, top, width, 1);
      ctx.fillRect(left, top, 1, height);
      ctx.fillStyle = PALETTE.uiBorderDark;
      ctx.fillRect(left, top + height - 1, width, 1);
      ctx.fillRect(left + width - 1, top, 1, height);
      ctx.fillStyle = PALETTE.uiWarn;
      ctx.fillRect(left + 4, top + 3, 3, 3);
      ctx.fillRect(left + width - 7, top + 3, 3, 3);
      uiDetailRect(ctx, left + 0.5, top + 0.5, width - 1, 0.5, PALETTE.uiText);
      uiDetailRect(ctx, left + 0.5, top + 0.5, 0.5, height - 1, PALETTE.uiBorderLight);
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

  #isPropConcealed(prop) {
    return Boolean(
      prop?.hiddenByFlag ||
      (prop?.hiddenUntilOpened && !prop.opened && !prop.consumed)
    );
  }

  #isHiddenKey(key) {
    return this.hiddenTiles?.has?.(key) ?? false;
  }

  // ----- Overlays ---------------------------------------------------------

  #drawOverlays(ctx, overlay) {
    if (overlay.mode === 'COMBAT') {
      if (overlay.abilityTargets) {
        for (const key of overlay.abilityTargets.invalid ?? []) {
          if (!this.#isHiddenKey(key)) this.#tileRing(ctx, key, PALETTE.uiBad, 0.2);
        }
        for (const key of overlay.abilityTargets.valid ?? []) {
          if (!this.#isHiddenKey(key)) this.#tileRing(ctx, key, PALETTE.uiGood, 0.52);
        }
      }
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
      if (overlay.hazardTiles) {
        for (const hazard of overlay.hazardTiles) {
          if (!this.#isHiddenKey(hazard.key)) this.#hazardMarker(ctx, hazard);
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
      if (overlay.interactionTile && !this.#isHiddenKey(overlay.interactionTile)) this.#interactionMarker(ctx, overlay.interactionTile);
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
    const label = String(cost);
    const badgeWidth = Math.max(18, uiTextWidth(label) + 6);
    this.#tileRing(ctx, key, color, 0.7);
    ctx.fillStyle = PALETTE.outline;
    ctx.fillRect(s.x + 2, s.y - 31, badgeWidth, 14);
    ctx.fillStyle = PALETTE.uiDark;
    ctx.fillRect(s.x + 3, s.y - 30, badgeWidth - 2, 12);
    ctx.fillStyle = color;
    ctx.fillRect(s.x + 3, s.y - 30, badgeWidth - 2, 1);
    ctx.fillRect(s.x + 3, s.y - 30, 1, 12);
    ctx.fillStyle = PALETTE.uiBorderDark;
    ctx.fillRect(s.x + 3, s.y - 19, badgeWidth - 2, 1);
    uiDetailRect(ctx, s.x + 3.5, s.y - 29.5, badgeWidth - 3, 0.5, PALETTE.uiText);
    uiDetailRect(ctx, s.x + 3.5, s.y - 29.5, 0.5, 11, color);
    uiText(ctx, label, s.x + 6, s.y - 28, color);
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

  #interactionMarker(ctx, key, color = PALETTE.uiGood, alpha = 0.64) {
    const s = this.#keyToScreen(key);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = PALETTE.outline;
    ctx.fillRect(s.x - 16, s.y - 1, 6, 3);
    ctx.fillRect(s.x + 10, s.y - 1, 6, 3);
    ctx.fillRect(s.x - 2, s.y - 9, 5, 3);
    ctx.fillRect(s.x - 2, s.y + 6, 5, 3);
    ctx.fillStyle = color;
    ctx.fillRect(s.x - 15, s.y, 4, 1);
    ctx.fillRect(s.x + 11, s.y, 4, 1);
    ctx.fillRect(s.x - 1, s.y - 8, 3, 1);
    ctx.fillRect(s.x - 1, s.y + 7, 3, 1);
    ctx.restore();
  }

  #drawHoveredWorldTarget(ctx, state) {
    const target = state.hoveredWorldTarget;
    if (!target?.identity || !target.type) return;
    const color = this.#interactionHighlightColor(target.action);

    if (target.type === 'actor') {
      const actor = (state.actors ?? []).find((candidate) => worldIdentity(candidate, 'actor') === target.identity);
      if (!actor || (actor.type !== 'player' && this.#isHiddenCell(actor.x, actor.y))) return;
      const visual = this.#resolveActorVisual(actor, state.anim ?? {});
      if (!visual) return;
      const outline = this.shadowMasks.prepareOutline(visual.source, color, 128);
      this.#drawActorMask(ctx, outline, visual);
      this.#drawUseCellPixels(ctx, target, { x: actor.x, y: actor.y }, color);
      return;
    }

    if (target.type !== 'object') return;
    const prop = this.#allRenderableProps(state).find((candidate) =>
      worldIdentity(candidate, 'object') === target.identity ||
      (
        candidate.x === target.anchor?.x &&
        candidate.y === target.anchor?.y &&
        candidate.kind === target.kind
      )
    );
    if (!prop || this.#isPropConcealed(prop) || this.#isHiddenCell(prop.x, prop.y)) return;
    const entry = getSprite(prop.kind);
    if (!entry) return;
    const seed = prop.seed ?? P.hash2D(prop.x + 1, prop.y + 1);
    const anim = state.anim ?? {};
    const drawState = {
      prop,
      anim,
      pulse: anim.pulse ?? 0,
      flicker: anim.flicker ?? 0,
      player: (state.actors ?? []).find((actor) => actor.type === 'player') ?? null
    };
    const prepared = this.propSprites.prepare(entry, prop, seed, drawState);
    if (!prepared?.surface) return;
    const outline = this.shadowMasks.prepareOutline(
      prepared,
      color,
      entry.shadow?.contact?.opacityThreshold ?? 128
    );
    const screen = gridToScreen(prop.x, prop.y, 0, this.worldOrigin);
    const anchor = preparedAnchor(screen, prepared);
    this.shadowMasks.draw(ctx, outline, anchor.x, anchor.y);
    this.#drawUseCellPixels(ctx, target, { x: prop.x, y: prop.y }, color);
  }

  #drawUseCellPixels(ctx, target, anchor, color) {
    const cell = target.interactionCell;
    if (!cell || (cell.x === anchor.x && cell.y === anchor.y)) return;
    if (this.#isHiddenCell(cell.x, cell.y)) return;
    const s = gridToScreen(cell.x, cell.y, 0, this.worldOrigin);
    ctx.fillStyle = color;
    ctx.fillRect(s.x - NATIVE_PIXEL / 2, s.y - 5, NATIVE_PIXEL, NATIVE_PIXEL);
    ctx.fillRect(s.x + 5, s.y - NATIVE_PIXEL / 2, NATIVE_PIXEL, NATIVE_PIXEL);
    ctx.fillRect(s.x - NATIVE_PIXEL / 2, s.y + 5, NATIVE_PIXEL, NATIVE_PIXEL);
    ctx.fillRect(s.x - 5, s.y - NATIVE_PIXEL / 2, NATIVE_PIXEL, NATIVE_PIXEL);
  }

  #drawInteractionHighlights(ctx, highlights) {
    this.interactionHighlightHitboxes = [];
    if (!Array.isArray(highlights) || highlights.length === 0) return;

    const entries = highlights
      .filter((entry) => entry?.key && !this.#isHiddenKey(entry.key))
      .map((entry) => {
        const anchor = this.#keyToScreen(entry.key);
        const label = clipUiText(entry.label ?? 'Interact', 26);
        const width = uiTextWidth(label) + 17;
        return {
          ...entry,
          anchor,
          label,
          width,
          height: 13,
          color: this.#interactionHighlightColor(entry.action)
        };
      })
      .filter((entry) => this.#onScreen(entry.anchor, 36))
      .sort((a, b) => (a.anchor.y - b.anchor.y) || (a.anchor.x - b.anchor.x));

    for (const entry of entries) {
      this.#interactionMarker(ctx, entry.key, entry.color, 0.78);
    }

    const placed = [];
    for (const entry of entries) {
      const baseX = clamp(
        Math.round(entry.anchor.x - entry.width / 2),
        VIEWPORT.x + 3,
        VIEWPORT.x + VIEWPORT.width - entry.width - 3
      );
      const baseY = clamp(
        Math.round(entry.anchor.y - 34),
        VIEWPORT.y + 3,
        VIEWPORT.y + VIEWPORT.height - entry.height - 3
      );
      const offsets = [0, -14, -28, 14, -42, 28];
      let box = null;
      for (const offset of offsets) {
        const candidate = {
          x: baseX,
          y: clamp(
            baseY + offset,
            VIEWPORT.y + 3,
            VIEWPORT.y + VIEWPORT.height - entry.height - 3
          ),
          w: entry.width,
          h: entry.height
        };
        if (!placed.some((other) => this.#boxesOverlap(candidate, other))) {
          box = candidate;
          break;
        }
      }
      box ??= { x: baseX, y: baseY, w: entry.width, h: entry.height };
      placed.push(box);
      this.#drawInteractionLabel(ctx, box, entry.label, entry.color);
      const [targetX, targetY] = String(entry.targetKey ?? entry.key).split(',').map(Number);
      if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
        this.interactionHighlightHitboxes.push({
          x: box.x - 1,
          y: box.y - 1,
          w: box.w + 2,
          h: box.h + 2,
          target: { x: targetX, y: targetY }
        });
      }
    }
  }

  #drawInteractionLabel(ctx, box, label, color) {
    uiRect(ctx, box.x - 1, box.y - 1, box.w + 2, box.h + 2, PALETTE.outline);
    uiRect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
    uiRect(ctx, box.x, box.y, box.w, 1, color);
    uiRect(ctx, box.x, box.y, 1, box.h, color);
    uiRect(ctx, box.x, box.y + box.h - 1, box.w, 1, PALETTE.uiBorderDark);
    uiRect(ctx, box.x + box.w - 1, box.y, 1, box.h, PALETTE.uiBorderDark);
    uiRect(ctx, box.x + 4, box.y + 5, 3, 3, color);
    uiDetailRect(ctx, box.x + 0.5, box.y + 0.5, box.w - 1, 0.5, PALETTE.uiText);
    uiDetailRect(ctx, box.x + 0.5, box.y + 0.5, 0.5, box.h - 1, color);
    uiText(ctx, label, box.x + 11, box.y + 3, PALETTE.uiText);
  }

  #interactionHighlightColor(action) {
    if (action === 'attack') return PALETTE.uiBad;
    if (action === 'loot') return PALETTE.uiGood;
    if (action === 'use') return PALETTE.uiWarn;
    if (action === 'talk') return PALETTE.uiBorderLight;
    return PALETTE.uiText;
  }

  #boxesOverlap(a, b) {
    const gap = 2;
    return !(
      a.x + a.w + gap <= b.x ||
      b.x + b.w + gap <= a.x ||
      a.y + a.h + gap <= b.y ||
      b.y + b.h + gap <= a.y
    );
  }

  #hazardMarker(ctx, hazard) {
    const key = hazard.key;
    const s = this.#keyToScreen(key);
    const burning = hazard.type === 'burning-ground';
    const color = burning ? PALETTE.uiBad : PALETTE.uiWarn;
    this.#tileRing(ctx, key, color, burning ? 0.5 : 0.7);
    ctx.save();
    ctx.globalAlpha = burning ? 0.8 : 0.72;
    ctx.fillStyle = PALETTE.outline;
    ctx.fillRect(s.x - 5, s.y - 2, 11, 5);
    ctx.fillStyle = color;
    if (burning) {
      ctx.fillRect(s.x - 4, s.y, 3, 2);
      ctx.fillRect(s.x, s.y - 1, 2, 3);
      ctx.fillRect(s.x + 3, s.y, 2, 2);
    } else {
      ctx.fillRect(s.x - 3, s.y - 1, 7, 3);
      ctx.fillStyle = PALETTE.uiBorderLight;
      ctx.fillRect(s.x, s.y - 5, 1, 4);
    }
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

  interactionHighlightAt(internalX, internalY) {
    for (let i = this.interactionHighlightHitboxes.length - 1; i >= 0; i -= 1) {
      const hitbox = this.interactionHighlightHitboxes[i];
      if (
        internalX >= hitbox.x && internalX < hitbox.x + hitbox.w &&
        internalY >= hitbox.y && internalY < hitbox.y + hitbox.h
      ) {
        return { ...hitbox.target };
      }
    }
    return null;
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
        const label = String(fx.text);
        const tx = s.x - 8;
        const ty = s.y - 63 - (fx.rise ?? 0);
        const tw = Math.max(16, Math.ceil(ctx.measureText(label).width) + 6);
        ctx.fillStyle = PALETTE.outline;
        ctx.fillRect(tx - 2, ty - 2, tw + 4, 13);
        ctx.fillStyle = PALETTE.uiDark;
        ctx.fillRect(tx - 1, ty - 1, tw + 2, 11);
        ctx.fillStyle = PALETTE.flash;
        ctx.fillRect(tx - 1, ty - 1, tw + 2, 1);
        uiDetailRect(ctx, tx - 0.5, ty - 0.5, tw + 1, 0.5, PALETTE.uiText);
        ctx.fillStyle = PALETTE.flash;
        ctx.fillText(label, tx + 2, ty + 1);
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

  #drawTimeOfDayTint(ctx) {
    if (!this.#usesOutdoorLighting()) return;
    const washes = TIME_OF_DAY_WASHES[this.timeOfDay?.phase] ?? [];
    if (washes.length === 0) return;
    ctx.save();
    for (const wash of washes) {
      ctx.globalAlpha = wash.alpha;
      ctx.fillStyle = wash.color;
      ctx.fillRect(VIEWPORT.x, VIEWPORT.y, VIEWPORT.width, VIEWPORT.height);
    }
    ctx.restore();
  }

  #drawVignette(ctx) {
    // Stepped translucent void bands at the viewport edges dim the scene like
    // baked old CRPG lighting: no smooth gradient, just a few hard bands.
    const w = VIEWPORT.width;
    const h = VIEWPORT.height;
    const timeOfDayStrength = this.#usesOutdoorLighting()
      ? TIME_OF_DAY_VIGNETTE[this.timeOfDay?.phase] ?? 0
      : 0;
    const strength = (this.mood?.vignette ?? 1) + timeOfDayStrength;
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

  #usesOutdoorLighting() {
    return this.mood?.sun?.enabled === true;
  }

  // Map an internal-canvas pixel to a grid cell (for mouse hover).
  toGrid(internalX, internalY) {
    return screenToGrid(internalX, internalY, this.worldOrigin);
  }

  // Map a grid cell to its current logical screen anchor. World-attached UI
  // uses this same projection for drawing and hit testing.
  toScreen(x, y, pxOffset = null) {
    const base = gridToScreen(x, y, 0, this.worldOrigin);
    return {
      x: base.x + (pxOffset?.x ?? 0),
      y: base.y + (pxOffset?.y ?? 0)
    };
  }
}

function worldIdentity(target, type) {
  if (type === 'actor') {
    return String(target?.spawnId ?? target?.id ?? `${target?.spriteId ?? 'actor'}:${target?.x},${target?.y}`);
  }
  return String(target?.id ?? target?.spawnId ?? `${target?.kind ?? 'object'}:${target?.x},${target?.y}`);
}

function preparedAnchor(screen, prepared) {
  return {
    x: screen.x + finiteNumber(prepared?.anchorOffsetX, 0),
    y: screen.y + finiteNumber(prepared?.anchorOffsetY, 0)
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resetTransform(ctx) {
  if (typeof ctx.setTransform === 'function') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else if (typeof ctx.resetTransform === 'function') {
    ctx.resetTransform();
  }
}

function setLogicalTransform(ctx) {
  if (typeof ctx.setTransform === 'function') {
    ctx.setTransform(NATIVE_SCALE, 0, 0, NATIVE_SCALE, 0, 0);
  } else if (typeof ctx.scale === 'function') {
    ctx.scale(NATIVE_SCALE, NATIVE_SCALE);
  }
}
