import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const baseUrl = process.env.WEAPON_AUDIT_URL ?? 'http://127.0.0.1:8138';
const outputDir = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-18-weapons'
);
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 960 },
  deviceScaleFactor: 1
});
const errors = [];
page.on('pageerror', (error) => errors.push(String(error?.stack ?? error)));
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    errors.push(`${response.status()} ${response.url()}`);
  }
});

try {
  await page.goto(`${baseUrl}/?level=camp&pos=34,46&noCombat=1&skipIntro=1`, {
    waitUntil: 'networkidle'
  });
  await page.waitForFunction(() => Boolean(window.hostDebug?.game?.()?.level?.id === 'censure-road-camp'), null, {
    timeout: 30000
  });

  await page.evaluate(async () => {
    await window.hostDebug.give('penitent-coil-sidearm', 1, { loaded: 3 });
    await window.hostDebug.give('compact-armature-ammo', 12);
  });

  const groundAuditWeapons = [
    'ash-road-carbine',
    'foundry-support-gun',
    'penitent-engine-railgun',
    'processional-pike',
    'bellfounder-hammer'
  ];

  await page.evaluate(() => {
    const game = window.hostDebug.game();
    game._toggleInventory();
    const entries = game._inventoryEntries();
    const selected = entries.findIndex((entry) => entry.itemId === 'penitent-coil-sidearm');
    game.inventoryFocus = 'items';
    game.inventoryIndex = Math.max(0, selected);
  });
  await page.waitForTimeout(350);
  await page.locator('#game').screenshot({
    path: path.join(outputDir, 'live-inventory.png')
  });

  for (const itemId of groundAuditWeapons) {
    await page.evaluate(async (id) => window.hostDebug.give(id, 1, { loaded: 3 }), itemId);
  }

  await page.evaluate(() => {
    const game = window.hostDebug.game();
    game._toggleInventory();
    const layout = [
      ['penitent-coil-sidearm', -2, -1],
      ['ash-road-carbine', -1, -2],
      ['foundry-support-gun', 0, -2],
      ['penitent-engine-railgun', 1, -2],
      ['processional-pike', 2, -1],
      ['bellfounder-hammer', 2, 0]
    ];
    for (const [itemId, dx, dy] of layout) {
      const entry = game.inventory.entries().find((candidate) => candidate.itemId === itemId);
      if (!entry) throw new Error(`Missing audit weapon ${itemId}`);
      if (!game._dropItemFromInventory(entry.id)) throw new Error(`Could not drop audit weapon ${itemId}`);
      const dropped = game.groundItems.at(-1);
      dropped.x = game.player.x + dx;
      dropped.y = game.player.y + dy;
      dropped.droppedAt = null;
    }
  });
  await page.waitForTimeout(550);
  await page.locator('#game').screenshot({
    path: path.join(outputDir, 'live-ground-weapons.png')
  });

  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log(`Captured live inventory and ground weapons in ${outputDir}`);
} finally {
  await browser.close();
}
