import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const baseUrl = process.env.ASH_ROAD_AUDIT_URL ?? 'http://127.0.0.1:8128';
const outputDir = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-21-ash-road-south-prop-audit'
);

const groups = {
  repeated: [
    'measure-boundary-fence',
    'south-measure-queue-rail',
    'south-measure-drain-reeds',
    'measure-grave-plot',
    'south-measure-water-vessels',
    'intake-screening-frame',
    'south-measure-repair-rack',
    'south-measure-notice-board'
  ],
  water: [
    'south-measure-water-vessels',
    'south-measure-hand-pump',
    'south-measure-pipe-gantry',
    'public-tap-stand',
    'south-measure-settling-vat',
    'south-measure-water-lesson',
    'water-condenser',
    'collapsed-culvert'
  ],
  civic: [
    'measure-boundary-fence',
    'south-measure-queue-rail',
    'intake-screening-frame',
    'south-measure-repair-rack',
    'south-measure-notice-board',
    'mesh-cage-panel',
    'relief-machine',
    'south-measure-receiving-shelter',
    'south-measure-door',
    'service-hatch',
    'north-chain-gate',
    'south-chain-gate',
    'south-measure-brass-hook-memorial'
  ],
  freight: [
    'grain-cage',
    'freight-wagon',
    'fixed-hoist',
    'freight-scale',
    'south-measure-storage',
    'south-measure-return-stall',
    'service-pipe-run',
    'south-measure-service-pack',
    'south-measure-medicine-cart',
    'south-measure-sample-burner'
  ],
  domestic: [
    'charity-cot',
    'laundry-line',
    'south-measure-sleeping-pallet',
    'wash-wall',
    'cloth-partition',
    'shared-oven',
    'south-measure-arrival-hearth',
    'south-measure-charity-canopy'
  ],
  verge: [
    'south-measure-drain-reeds',
    'measure-grave-plot',
    'south-measure-grave-family-rail',
    'south-measure-tumbleweed',
    'south-measure-berm-block',
    'south-measure-tally-scraps',
    'south-measure-work-grit',
    'south-measure-service-stain',
    'south-measure-service-pack'
  ]
};

const scenes = [
  ['arrival', 24, 63, 46, 79],
  ['south_chain', 55, 63, 78, 79],
  ['charity', 87, 62, 108, 79],
  ['water_court', 53, 46, 76, 63],
  ['morrow_yard', 13, 41, 43, 62],
  ['old_gates', 54, 25, 78, 43],
  ['rope_rows', 91, 40, 123, 61],
  ['compact', 102, 19, 129, 39],
  ['annex', 18, 19, 44, 39],
  ['graves', 107, 0, 129, 21],
  ['north_verge', 52, 1, 77, 18]
];

const runtimeViews = [
  ['arrival', 35, 70],
  ['charity', 97, 72],
  ['water_court', 64, 54],
  ['morrow_yard', 28, 52],
  ['old_gates', 65, 34],
  ['rope_rows', 107, 51],
  ['compact', 114, 29]
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/opt/google/chrome/chrome',
  headless: true,
  args: ['--disable-dev-shm-usage']
});
const sheetPage = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const scenePage = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const runtimePage = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const browserErrors = [];

for (const page of [sheetPage, scenePage, runtimePage]) {
  page.on('pageerror', (error) => browserErrors.push(String(error?.stack ?? error)));
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      browserErrors.push(`${response.status()} ${response.url()}`);
    }
  });
}

async function waitForCapture(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(
    () => document.title === 'CAPTURE-READY' || document.title === 'CAPTURE-ERROR',
    null,
    { timeout: 60000 }
  );
  if (await page.title() !== 'CAPTURE-READY') {
    throw new Error(`Capture failed at ${url}: ${await page.locator('body').innerText()}`);
  }
}

async function captureSheet(name, params) {
  const url = new URL('/.ai/map-review/preview-ash-road-south-props.html', baseUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  await waitForCapture(sheetPage, url.href);
  await sheetPage.locator('#c').screenshot({ path: path.join(outputDir, `final-${name}.png`) });
  return sheetPage.evaluate(() => globalThis.__AUDIT_ENTRY_COUNT);
}

async function captureScene([name, x0, y0, x1, y1]) {
  const url = new URL('/.ai/map-review/capture-scene.html', baseUrl);
  const params = {
    level: './data/levels/ash_road_south.json',
    scale: 2,
    includeDormant: 1,
    x0,
    y0,
    x1,
    y1
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  await waitForCapture(scenePage, url.href);
  await scenePage.locator('#out').screenshot({ path: path.join(outputDir, `final-scene-${name}.png`) });
}

try {
  const allEntries = await captureSheet('all-models', {
    cols: 6,
    cellW: 220,
    cellH: 190,
    ground: 1
  });
  if (allEntries !== 126) throw new Error(`Expected 126 authored model entries, got ${allEntries}`);

  for (const [name, kinds] of Object.entries(groups)) {
    await captureSheet(name, {
      cols: 4,
      cellW: 220,
      cellH: 190,
      ground: 0,
      kinds: kinds.join(',')
    });
  }
  await captureSheet('ground-items', {
    cols: 6,
    cellW: 160,
    cellH: 150,
    ground: 1,
    onlyGround: 1
  });

  for (const scene of scenes) await captureScene(scene);

  const runtimeUrl = new URL('/', baseUrl);
  runtimeUrl.searchParams.set('level', 'ash-road-south');
  runtimeUrl.searchParams.set('skipIntro', '1');
  runtimeUrl.searchParams.set('noCombat', '1');
  runtimeUrl.searchParams.set('playtest', 'fresh');
  await runtimePage.goto(runtimeUrl.href, { waitUntil: 'networkidle', timeout: 60000 });
  await runtimePage.waitForFunction(
    () => Boolean(globalThis.hostDebug?.game?.()?.ready && globalThis.hostDebug.game().level?.id === 'ash-road-south'),
    null,
    { timeout: 60000 }
  );
  await runtimePage.evaluate(() => {
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
    game.anim.tick = 0;
    game.anim.pulse = 0;
    game.anim.flicker = 0;
    game.anim.idleFrame = 0;
    game.anim.bob = 0;
    game.render();
  });

  for (let index = 0; index < runtimeViews.length; index += 1) {
    const [name, x, y] = runtimeViews[index];
    const result = await runtimePage.evaluate(({ targetX, targetY }) => {
      const game = globalThis.hostDebug.game();
      game.loop.stop();
      const teleported = globalThis.hostDebug.teleport(targetX, targetY);
      if (!teleported?.ok) throw new Error(`Teleport failed: ${teleported?.reason ?? 'unknown reason'}`);
      game.areaTitleTimer = 0;
      game.areaTitle = null;
      game.journalNotice = null;
      game.uiScreen = null;
      game.mode = 'explore';
      game.debugGrid = false;
      game.anim.tick = 0;
      game.anim.pulse = 0;
      game.anim.flicker = 0;
      game.anim.idleFrame = 0;
      game.anim.bob = 0;
      game.render();
      return { x: game.player.x, y: game.player.y, levelId: game.level.id };
    }, { targetX: x, targetY: y });
    if (result.x !== x || result.y !== y || result.levelId !== 'ash-road-south') {
      throw new Error(`Runtime view ${name} did not reach ${x},${y}`);
    }
    await runtimePage.locator('#game').screenshot({
      path: path.join(outputDir, `final-runtime-${String(index + 1).padStart(2, '0')}-${name}.png`)
    });
  }

  if (browserErrors.length) throw new Error(`Browser errors:\n${browserErrors.join('\n')}`);
  console.log(`Captured 126 model entries, ${scenes.length} district scenes, and ${runtimeViews.length} live runtime views.`);
} finally {
  await browser.close();
}
