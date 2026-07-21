import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const baseUrl = process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8123';
const outputDir = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-21-ash-road-south-liveliness-passes-02-06'
);
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1480, height: 1100 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(String(error?.stack ?? error)));
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    browserErrors.push(`${response.status()} ${response.url()}`);
  }
});

async function captureDetached(view, filename) {
  const url = new URL('/.ai/map-review/preview-ash-road-south-liveliness.html', baseUrl);
  url.searchParams.set('view', view);
  await page.goto(url.href, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => document.title === 'CAPTURE-READY', null, { timeout: 60000 });
  await page.locator('#c').screenshot({ path: path.join(outputDir, filename) });
}

await captureDetached('motions', 'detached-work-motions.png');
await captureDetached('responses', 'detached-prop-responses.png');

const gameUrl = new URL('/', baseUrl);
gameUrl.searchParams.set('level', 'ash-road-south');
gameUrl.searchParams.set('skipIntro', '1');
gameUrl.searchParams.set('noCombat', '1');
gameUrl.searchParams.set('playtest', 'fresh');
await page.goto(gameUrl.href, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction(
  () => Boolean(globalThis.hostDebug?.game?.()?.ready && globalThis.hostDebug.game().level?.id === 'ash-road-south'),
  null,
  { timeout: 60000 }
);

await page.evaluate(() => {
  const game = globalThis.hostDebug.game();
  game.loop.stop();
  game.areaTitleTimer = 0;
  game.areaTitle = null;
  game.journalNotice = null;
  game.uiScreen = null;
  game.mode = 'explore';
  game.debugGrid = false;
  game.pathQueue = [];
  game.pendingExploreTarget = null;
  game.preCombatTarget = null;
  game.input.consume();
  game.input.consumeClick();
});
await page.locator('#game').click({ position: { x: 20, y: 20 } });
await page.waitForTimeout(150);
const audioState = await page.evaluate(async () => {
  const game = globalThis.hostDebug.game();
  await game.worldAudio.unlock();
  game.input.consume();
  game.input.consumeClick();
  return {
    unlocked: game.worldAudio.settings.unlocked,
    beds: game.worldAudio.beds.length,
    cues: game.level.soundscape.activityCues.length
  };
});

const tableauIds = await page.evaluate(() => globalThis.hostDebug.game().tableauSystem.states.map((state) => state.definition.id));
const tableauReports = [];
for (const [index, tableauId] of tableauIds.entries()) {
  const activeReport = await page.evaluate((requestedId) => {
    const game = globalThis.hostDebug.game();
    const system = game.tableauSystem;
    const state = system.states.find((candidate) => candidate.definition.id === requestedId);
    if (!state) throw new Error(`Missing runtime tableau ${requestedId}`);
    system.cancelAll('capture-reset');
    game.patrolSystem.cancelAllActivities();
    game.explorationMovements.clear();
    for (const actor of game.actors) actor.speech = null;
    game.uiScreen = null;
    game.mode = 'explore';
    for (const candidate of system.states) candidate.timer = candidate === state ? 0 : 9999;

    const forbidden = new Set(state.definition.participants.map((entry) => `${entry.slot.x},${entry.slot.y}`));
    const center = state.definition.center;
    let focus = null;
    for (let radius = 0; radius <= 7 && !focus; radius += 1) {
      for (let dy = -radius; dy <= radius && !focus; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const x = center.x + dx;
          const y = center.y + dy;
          if (!game.grid.isWalkable(x, y) || forbidden.has(`${x},${y}`)) continue;
          if (game.actors.some((actor) => actor !== game.player && actor.x === x && actor.y === y)) continue;
          focus = { x, y };
          break;
        }
      }
    }
    if (!focus) throw new Error(`No clear camera focus for ${requestedId}`);
    game.player.moveTo(focus.x, focus.y);
    game.player.pxOffset = { x: 0, y: 0 };

    for (let tick = 0; tick < 500 && state.active?.phase !== 'perform'; tick += 1) {
      game._advanceExplorationMovements(1);
      system.advanceExplore(0.5);
    }
    if (state.active?.phase !== 'perform') {
      throw new Error(`Tableau ${requestedId} did not gather; phase ${state.active?.phase ?? 'inactive'}`);
    }
    system.advanceExplore(2.4);
    game.render();
    return {
      id: requestedId,
      focus,
      phase: state.active.phase,
      elapsed: state.active.elapsed,
      participants: state.active.participants.map(({ actor, definition }) => ({
        actor: definition.actor,
        position: { x: actor.x, y: actor.y },
        slot: { ...definition.slot },
        renderState: actor.render.state,
        frameIndex: actor.render.frameIndex,
        target: definition.activity.target,
        response: definition.activity.response,
        propFrame: game.level.props.find((prop) => prop.id === definition.activity.target)?.workActivity?.frame ?? null
      })),
      reservations: system.reservations.size
    };
  }, tableauId);

  const filename = `runtime-tableau-${String(index + 1).padStart(2, '0')}-${tableauId}.png`;
  await page.locator('#game').screenshot({ path: path.join(outputDir, filename) });

  const completion = await page.evaluate((requestedId) => {
    const game = globalThis.hostDebug.game();
    const system = game.tableauSystem;
    const state = system.states.find((candidate) => candidate.definition.id === requestedId);
    const targetCycle = state.cycle + 1;
    for (let tick = 0; tick < 500 && state.cycle < targetCycle; tick += 1) {
      game._advanceExplorationMovements(1);
      system.advanceExplore(0.5);
    }
    const participants = state.definition.participants.map((definition) => {
      const actor = game.npcs.find((candidate) => (candidate.spawnId ?? candidate.id) === definition.actor || candidate.id === definition.actor);
      return {
        actor: definition.actor,
        reserved: Boolean(actor?.tableauReservation),
        activity: Boolean(actor?.npcActivityVisual)
      };
    });
    return {
      cycle: state.cycle,
      active: Boolean(state.active),
      reservations: system.reservations.size,
      participants
    };
  }, tableauId);
  if (completion.active || completion.reservations !== 0 || completion.participants.some((entry) => entry.reserved || entry.activity)) {
    throw new Error(`Tableau ${tableauId} did not release cleanly: ${JSON.stringify(completion)}`);
  }
  tableauReports.push({ ...activeReport, completion, filename });
}

if (browserErrors.length > 0) {
  throw new Error(`Browser errors:\n${browserErrors.join('\n')}`);
}

await writeFile(path.join(outputDir, 'runtime-report.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  gameUrl: gameUrl.href,
  audioState,
  tableauReports,
  browserErrors
}, null, 2)}\n`);

await browser.close();
console.log(`Captured detached work sheets and ${tableauReports.length} completed runtime tableaux in ${outputDir}.`);
