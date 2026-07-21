import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const outputDir = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-performance'
);
const baseUrl = process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8137';
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1 });
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

const report = await page.evaluate(async () => {
  const [{ SPRITE_CATALOG }, { PropSpriteCache }, { NATIVE_SCALE }] = await Promise.all([
    import('/src/render/spriteCatalog.js'),
    import('/src/render/PropSpriteCache.js'),
    import('/src/render/renderConfig.js')
  ]);
  const logicalWidth = 320;
  const logicalHeight = 256;
  const anchorX = 160;
  const anchorY = 192;
  const makeCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = logicalWidth * NATIVE_SCALE;
    canvas.height = logicalHeight * NATIVE_SCALE;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(NATIVE_SCALE, 0, 0, NATIVE_SCALE, 0, 0);
    return { canvas, ctx };
  };
  const direct = makeCanvas();
  const cached = makeCanvas();
  const cache = new PropSpriteCache();
  const failures = [];
  let draws = 0;

  for (const [kind, entry] of Object.entries(SPRITE_CATALOG)) {
    if (entry.flat) continue;
    for (let seed = 0; seed < 6; seed += 1) {
      const prop = {
        kind,
        x: 5,
        y: 7,
        seed,
        orient: ['se', 'sw', 'nw', 'ne'][seed % 4],
        height: 64,
        interact: { lock: {} },
        opened: seed % 2 === 0,
        consumed: seed % 3 === 0,
        defiled: seed % 2 === 1,
        dry: seed % 3 === 1,
        dim: seed % 2 === 0,
        active: seed % 2 === 0,
        damaged: seed % 3 === 0,
        connected: { xPlus: false, yPlus: false, xMinus: false, yMinus: false }
      };
      const drawState = {
        prop,
        anim: { tick: 5, pulse: 0.5, flicker: 0.5 },
        pulse: 0.5,
        flicker: 0.5,
        player: null
      };

      for (const target of [direct, cached]) {
        target.ctx.setTransform(1, 0, 0, 1, 0, 0);
        target.ctx.clearRect(0, 0, target.canvas.width, target.canvas.height);
        target.ctx.setTransform(NATIVE_SCALE, 0, 0, NATIVE_SCALE, 0, 0);
      }
      entry.draw(direct.ctx, anchorX, anchorY, seed, drawState);
      cache.draw(cached.ctx, entry, prop, seed, drawState, anchorX, anchorY);

      const left = direct.ctx.getImageData(0, 0, direct.canvas.width, direct.canvas.height).data;
      const right = cached.ctx.getImageData(0, 0, cached.canvas.width, cached.canvas.height).data;
      let changedPixels = 0;
      let maxChannelDelta = 0;
      let firstDifference = null;
      for (let offset = 0; offset < left.length; offset += 4) {
        let changed = false;
        for (let channel = 0; channel < 4; channel += 1) {
          const delta = Math.abs(left[offset + channel] - right[offset + channel]);
          maxChannelDelta = Math.max(maxChannelDelta, delta);
          changed ||= delta !== 0;
        }
        if (changed) {
          changedPixels += 1;
          if (!firstDifference) {
            const pixel = offset / 4;
            firstDifference = {
              x: pixel % direct.canvas.width,
              y: Math.floor(pixel / direct.canvas.width),
              direct: Array.from(left.slice(offset, offset + 4)),
              cached: Array.from(right.slice(offset, offset + 4))
            };
          }
        }
      }
      if (changedPixels > 0) failures.push({ kind, seed, changedPixels, maxChannelDelta, firstDifference });
      draws += 1;
    }
  }
  return { draws, failures, cache: cache.stats };
});

await browser.close();
await writeFile(
  path.join(outputDir, 'prop-cache-catalog.json'),
  `${JSON.stringify(report, null, 2)}\n`
);
if (report.failures.length > 0) {
  throw new Error(`${report.failures.length}/${report.draws} cached catalog draws changed pixels`);
}
console.log(
  `${report.draws} cached catalog variants matched direct transparent renders exactly; `
  + `${report.cache.entries} live entries use ${(report.cache.bytes / 1048576).toFixed(2)} MiB.`
);
