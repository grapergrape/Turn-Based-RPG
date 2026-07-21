import { mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';
import {
  isHumanAppearance,
  spriteIdForHumanAppearance,
  SPRITE_ATLAS_IDS
} from '../../src/render/SpriteAtlas.js';

const outputDir = path.resolve(process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-actors/after');
const baseUrl = process.env.ACTOR_AUDIT_URL ?? 'http://127.0.0.1:8137/.ai/map-review/preview-catalog.html';
await mkdir(outputDir, { recursive: true });

async function jsonFilesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFilesUnder(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(target);
  }
  return files;
}

function collectHumanAppearances(value, appearances) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const child of value) collectHumanAppearances(child, appearances);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'appearance' && isHumanAppearance(child)) {
      appearances.set(spriteIdForHumanAppearance(child), child);
    }
    collectHumanAppearances(child, appearances);
  }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtimeAppearances = new Map();
for (const file of await jsonFilesUnder(path.join(repoRoot, 'data'))) {
  collectHumanAppearances(JSON.parse(await readFile(file, 'utf8')), runtimeAppearances);
}

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
await page.addInitScript((appearances) => {
  globalThis.__NATIVE_ACTOR_APPEARANCES = appearances;
}, [...runtimeAppearances.values()]);
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error?.stack ?? error)));
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    pageErrors.push(`${response.status()} ${response.url()}`);
  }
});

async function capture(name, query) {
  const url = `${baseUrl}?${new URLSearchParams({
    section: 'actors',
    seeds: '1',
    cols: '8',
    cellW: '160',
    cellH: '155',
    ...query
  })}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.title === 'CAPTURE-READY' || document.title === 'CAPTURE-ERROR');
  if (await page.title() !== 'CAPTURE-READY') {
    throw new Error(`actor sheet failed at ${url}: ${await page.locator('body').innerText()}`);
  }
  await page.locator('#c').screenshot({ path: path.join(outputDir, `${name}.png`) });
}

try {
  for (const facing of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
    await capture(`idle-${facing}-inspection-2x`, {
      facing,
      state: 'idle',
      frame: '2',
      scale: '2'
    });
  }
  const stateFrames = [
    ['idle', 2],
    ['walk', 4],
    ['sneakIdle', 2],
    ['sneak', 4],
    ['attack', 3],
    ['hit', 1],
    ['interact', 3]
  ];
  for (const [state, frame] of stateFrames) {
    for (const facing of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
      await capture(`matrix-${state}-${facing}-native`, {
        facing,
        state,
        frame: String(frame),
        scale: '1'
      });
    }
  }
  for (const frame of [0, 3, 6, 9]) {
    await capture(`death-${frame}-native`, {
      facing: 'se',
      state: 'dead',
      frame: String(frame),
      scale: '1'
    });
  }
  for (const [name, kinds] of [
    ['closeup-humans', [
      'player', 'settlement-man', 'settlement-woman', 'settlement-child',
      'human-field-nurse-compact', 'human-scarred-veteran', 'choir-bone-lector', 'red-tithe-hook-carrier'
    ]],
    ['closeup-bespoke', [
      'host-penitent-bastion', 'host-sava-rell', 'south-measure-false-catechist', 'south-measure-intake-clerk',
      'brother-tarn', 'stage-iv-lure', 'stage-iv-runner-ash', 'stage-iv-runner-road'
    ]],
    ['closeup-beasts', [
      'host-rat-sixlegs', 'host-rat-throat-maw', 'host-rat-tendril-walker',
      'host-wolf-spider', 'host-wolf-maw', 'host-wolf-ribsplit'
    ]]
  ]) {
    await capture(`${name}-idle-se`, {
      kinds: kinds.join(','),
      cols: '4',
      cellW: '220',
      cellH: '205',
      facing: 'se',
      state: 'idle',
      frame: '2',
      scale: '4'
    });
    await capture(`${name}-attack-se`, {
      kinds: kinds.join(','),
      cols: '4',
      cellW: '220',
      cellH: '205',
      facing: 'se',
      state: 'attack',
      frame: '3',
      scale: '4'
    });
    await capture(`${name}-death-9`, {
      kinds: kinds.join(','),
      cols: '4',
      cellW: '220',
      cellH: '205',
      facing: 'se',
      state: 'dead',
      frame: '9',
      scale: '4'
    });
  }
  for (const facing of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
    await capture(`runtime-idle-${facing}-inspection-2x`, {
      runtime: '1',
      facing,
      state: 'idle',
      frame: '2',
      scale: '2'
    });
  }
  for (const [state, frame] of stateFrames) {
    for (const facing of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
      await capture(`runtime-matrix-${state}-${facing}-native`, {
        runtime: '1',
        facing,
        state,
        frame: String(frame),
        scale: '1'
      });
    }
  }
  for (const frame of [0, 3, 6, 9]) {
    await capture(`runtime-death-${frame}-native`, {
      runtime: '1',
      facing: 'se',
      state: 'dead',
      frame: String(frame),
      scale: '1'
    });
  }
  if (pageErrors.length > 0) throw new Error(`browser errors:\n${pageErrors.join('\n')}`);
} finally {
  await browser.close();
}

console.log(
  `captured 145 actor sheets for ${SPRITE_ATLAS_IDS.length} registered models and ${runtimeAppearances.size} runtime appearances in ${outputDir}`
);
