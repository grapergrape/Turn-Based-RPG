import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const outputDir = path.resolve(process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-runtime/after');
const baseUrl = process.env.RUNTIME_AUDIT_URL ?? 'http://127.0.0.1:8137';
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const errors = [];
const steps = [];
page.on('pageerror', (error) => errors.push(String(error?.stack ?? error)));
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
    errors.push(`console: ${message.text()}`);
  }
});
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    errors.push(`${response.status()} ${response.url()}`);
  }
});

async function screenshot(name) {
  await page.locator('#game').screenshot({ path: path.join(outputDir, `${name}.png`) });
}

async function gameState() {
  return page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    return {
      ready: game.ready,
      levelPath: game.levelPath,
      levelId: game.level?.id,
      mode: game.mode,
      uiScreen: game.uiScreen,
      journalSection: game.journalSection,
      sneakMode: game.sneakMode,
      player: { x: game.player?.x, y: game.player?.y },
      enemies: game.enemies?.length ?? 0
    };
  });
}

async function waitForScreen(screen) {
  await page.waitForFunction((expected) => globalThis.hostDebug.game().uiScreen === expected, screen);
}

try {
  await page.goto(`${baseUrl}/?level=camp&skipIntro=1&noCombat=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(globalThis.hostDebug?.game?.()?.ready), null, { timeout: 60000 });

  const sizing = await page.evaluate(() => {
    const canvas = document.querySelector('#game');
    const rect = canvas.getBoundingClientRect();
    return {
      backing: [canvas.width, canvas.height],
      css: [rect.width, rect.height],
      style: [canvas.style.width, canvas.style.height],
      dpr: devicePixelRatio,
      zoom: visualViewport?.scale ?? 1
    };
  });
  assert.deepEqual(sizing.backing, [1280, 960]);
  assert.deepEqual(sizing.css, [1280, 960]);
  assert.equal(sizing.dpr, 1);
  assert.equal(sizing.zoom, 1);
  steps.push({ id: '100-percent-sizing', ...sizing });
  await screenshot('01-field-100-percent');

  await page.keyboard.press('i');
  await waitForScreen('inventory');
  await screenshot('02-keyboard-inventory');
  steps.push({ id: 'keyboard-inventory', state: await gameState() });
  await page.keyboard.press('Escape');
  await waitForScreen(null);

  await page.keyboard.press('j');
  await waitForScreen('journal');
  await screenshot('03-keyboard-journal');
  steps.push({ id: 'keyboard-journal', state: await gameState() });
  await page.keyboard.press('Escape');
  await waitForScreen(null);

  await page.keyboard.press('m');
  await waitForScreen('journal');
  assert.equal((await gameState()).journalSection, 1);
  await screenshot('04-keyboard-map');
  steps.push({ id: 'keyboard-map', state: await gameState() });
  await page.keyboard.press('Escape');
  await waitForScreen(null);

  await page.keyboard.press('c');
  await page.waitForFunction(() => globalThis.hostDebug.game().sneakMode === true);
  await screenshot('05-keyboard-sneak');
  steps.push({ id: 'keyboard-sneak', state: await gameState() });
  await page.keyboard.press('c');

  const interactionTarget = await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    const object = game.level.interactables.find((entry) =>
      entry.interactionMarker &&
      (entry.interactionMarker.x !== entry.x || entry.interactionMarker.y !== entry.y) &&
      !entry.consumed &&
      !game._isCellHidden(entry.x, entry.y)
    );
    if (!object) throw new Error('No separate-use-cell interaction found in camp');
    game.player.moveTo(object.interactionMarker.x, object.interactionMarker.y);
    game.input.mouse = null;
    game.areaTitleTimer = 0;
    game.render();
    return {
      id: object.id,
      anchor: { x: object.x, y: object.y },
      marker: { ...object.interactionMarker },
      screen: game.renderer.toScreen(object.x, object.y),
      logicalCanvas: [640, 480]
    };
  });

  await page.keyboard.down('Tab');
  await page.evaluate(() => globalThis.hostDebug.game().render());
  const highlightCount = await page.evaluate(() => globalThis.hostDebug.game().renderer.interactionHighlightHitboxes.length);
  assert.ok(highlightCount > 0, 'Tab should expose real interaction labels');
  await screenshot('06-tab-interaction-labels');
  await page.keyboard.up('Tab');
  steps.push({ id: 'interaction-labels', highlightCount, target: interactionTarget.id });

  const hoverCanvasBox = await page.locator('#game').boundingBox();
  const hoverScaleX = hoverCanvasBox.width / interactionTarget.logicalCanvas[0];
  const hoverScaleY = hoverCanvasBox.height / interactionTarget.logicalCanvas[1];
  await page.mouse.move(
    hoverCanvasBox.x + interactionTarget.screen.x * hoverScaleX,
    hoverCanvasBox.y + interactionTarget.screen.y * hoverScaleY
  );
  await page.evaluate(() => globalThis.hostDebug.game().render());
  const hovered = await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    return {
      target: game._hoveredWorldTarget(),
      shadowMasks: game.renderer.shadowMasks.stats.masks
    };
  });
  assert.equal(hovered.target.identity, interactionTarget.id);
  assert.notDeepEqual(hovered.target.anchor, hovered.target.interactionCell);
  assert.ok(hovered.shadowMasks > 0, 'hover should prepare a hard silhouette rim');
  await screenshot('06a-hover-rim-and-use-cell');
  steps.push({ id: 'hover-rim-and-use-cell', ...hovered });

  await page.mouse.move(hoverCanvasBox.x - 4, hoverCanvasBox.y - 4);
  const keyboardTarget = await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    game.input.mouse = null;
    game.render();
    return game._hoveredWorldTarget();
  });
  assert.equal(keyboardTarget.identity, interactionTarget.id);
  steps.push({ id: 'keyboard-world-target', target: keyboardTarget });

  const dialogue = await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    const object = game.level.interactables.find((entry) => entry.interact?.dialogue && game.dialogueDefs[entry.interact.dialogue]);
    if (!object) throw new Error('No dialogue object found in camp');
    game._openDialogueById(object.interact.dialogue);
    game.render();
    return { id: object.interact.dialogue, screen: game.uiScreen, title: game.dialogue?.title };
  });
  assert.equal(dialogue.screen, 'dialogue');
  await screenshot('07-real-dialogue');
  steps.push({ id: 'dialogue', ...dialogue });

  const trade = await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    game._closeUiScreen();
    const trader = game.npcs.find((actor) => actor.trade?.stock?.length);
    if (!trader) throw new Error('No trader found in camp');
    const opened = game._openTradeScreen(trader.id);
    game.render();
    return { opened, trader: trader.id, screen: game.uiScreen, stock: game._tradeStockEntries().length };
  });
  assert.equal(trade.opened, true);
  assert.equal(trade.screen, 'trade');
  assert.ok(trade.stock > 0);
  await screenshot('08-real-trade');
  steps.push({ id: 'trade', ...trade });

  const loot = await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    game._closeUiScreen();
    const object = game.level.interactables.find((entry) =>
      game._lootSourceHasItems({ sourceType: 'object', source: entry })
    );
    if (!object) throw new Error('No loot container found in camp');
    game._openObjectLootScreen(object, { log: false });
    game.render();
    return { object: object.id, screen: game.uiScreen, entries: game._currentLootEntries().length };
  });
  assert.equal(loot.screen, 'loot');
  assert.ok(loot.entries > 0);
  await screenshot('09-real-loot');
  steps.push({ id: 'loot', ...loot });

  await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    game._closeUiScreen();
    game.render();
    game.loop.stop();
  });
  const canvasBox = await page.locator('#game').boundingBox();
  await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
  await page.mouse.down();
  const pointer1x = await page.evaluate(() => {
    const input = globalThis.hostDebug.game().input;
    return { mouse: input.mouse, click: input.pendingClick };
  });
  await page.mouse.up();
  assert.deepEqual(pointer1x.mouse, { x: 320, y: 240 });
  assert.equal(pointer1x.click.x, 320);
  assert.equal(pointer1x.click.y, 240);
  steps.push({ id: 'pointer-1x-css', ...pointer1x });

  await page.setViewportSize({ width: 2800, height: 2100 });
  await page.waitForTimeout(100);
  const scaledBox = await page.locator('#game').boundingBox();
  assert.equal(scaledBox.width, 2560);
  assert.equal(scaledBox.height, 1920);
  await page.mouse.move(scaledBox.x + scaledBox.width / 2, scaledBox.y + scaledBox.height / 2);
  const pointer2x = await page.evaluate(() => globalThis.hostDebug.game().input.mouse);
  assert.deepEqual(pointer2x, { x: 320, y: 240 });
  steps.push({ id: 'pointer-2x-css', css: [scaledBox.width, scaledBox.height], mouse: pointer2x });
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.waitForTimeout(100);

  const combat = await page.evaluate(async () => {
    const game = globalThis.hostDebug.game();
    game.levelPath = './data/levels/ash_chapel_breach.json';
    await game.boot({ skipIntro: true, noCombat: false });
    game.loop.stop();
    const enemy = game.enemies.find((actor) => !actor.dormant) ?? game.enemies[0];
    if (!enemy) throw new Error('No combat enemy loaded');
    game._startCombat(enemy.encounter ?? null);
    const { gridToScreen } = await import('/src/render/isoMath.js');
    const occupied = new Set(game.actors.map((actor) => `${actor.x},${actor.y}`));
    const cell = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1]]
      .map(([dx, dy]) => ({ x: game.player.x + dx, y: game.player.y + dy }))
      .find((point) => game.grid.isWalkable(point.x, point.y) && !occupied.has(`${point.x},${point.y}`));
    if (cell) game.input.mouse = gridToScreen(cell.x, cell.y, 0, game.renderer.worldOrigin);
    game.render();
    return {
      mode: game.mode,
      encounter: game.activeEncounter,
      enemies: game.enemies.length,
      playerTurn: game.turnManager.isPlayerTurn(),
      hoverCell: cell
    };
  });
  assert.equal(combat.mode, 'combat');
  assert.equal(combat.playerTurn, true);
  await screenshot('10-real-combat-path');
  steps.push({ id: 'combat', ...combat });

  const overlays = await page.evaluate(() => {
    const game = globalThis.hostDebug.game();
    game.mode = 'explore';
    game.turnManager.active = false;
    const speaker = game.npcs[0] ?? game.enemies[0];
    if (speaker) speaker.speech = { text: 'Keep the bell line clear.', ttl: 4, kind: 'audit' };
    game.effects = [{ type: 'muzzle', text: '7', x: game.player.x + 1, y: game.player.y, rise: 2 }];
    game.render();
    return { speaker: speaker?.id ?? null, effects: game.effects.length };
  });
  await screenshot('11-world-overlays');
  steps.push({ id: 'world-overlays', ...overlays });

  const transition = await page.evaluate(async () => {
    const game = globalThis.hostDebug.game();
    const beforeItems = game.inventory.entries().reduce((sum, entry) => sum + entry.count, 0);
    await game._transitionLevel({
      path: './data/levels/ash_chapel_cellar.json',
      player: { x: 12, y: 13, facing: 'n' }
    });
    game.loop.stop();
    game.areaTitleTimer = 0;
    game.render();
    const afterItems = game.inventory.entries().reduce((sum, entry) => sum + entry.count, 0);
    return {
      path: game.levelPath,
      level: game.level.id,
      player: { x: game.player.x, y: game.player.y, facing: game.player.facing },
      ready: game.ready,
      beforeItems,
      afterItems,
      canvas: [game.canvas.width, game.canvas.height]
    };
  });
  assert.equal(transition.path, './data/levels/ash_chapel_cellar.json');
  assert.equal(transition.ready, true);
  assert.deepEqual(transition.player, { x: 12, y: 13, facing: 'n' });
  assert.deepEqual(transition.canvas, [1280, 960]);
  assert.equal(transition.afterItems, transition.beforeItems);
  await screenshot('12-real-level-transition');
  steps.push({ id: 'transition', ...transition });

  assert.deepEqual(errors, []);
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify({ steps, errors }, null, 2)}\n`);
} finally {
  await browser.close();
}

console.log(`verified ${steps.length} real-browser sizing, input, UI, interaction, combat, overlay, and transition checks in ${outputDir}`);
