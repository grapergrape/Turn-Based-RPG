import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const levelDir = path.join(repoRoot, 'data/levels');
const outputDir = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-performance'
);
const baseUrl = process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8137';
const files = (await readdir(levelDir)).filter((file) => file.endsWith('.json')).sort();

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(
  `${baseUrl}/?level=data/levels/${files[0]}&skipIntro=1&noCombat=1`,
  { waitUntil: 'networkidle' }
);
await page.waitForFunction(() => Boolean(globalThis.hostDebug?.game?.()?.ready), null, { timeout: 60000 });

const report = [];
try {
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const levelPath = `./data/levels/${file}`;
    if (index > 0) {
      await page.evaluate(async (nextPath) => {
        const game = globalThis.hostDebug.game();
        game.loop.stop();
        game.levelPath = nextPath;
        await game.boot({ skipIntro: true, noCombat: true });
      }, levelPath);
    }

    const comparison = await page.evaluate(() => {
      const game = globalThis.hostDebug.game();
      game.loop.stop();
      game.areaTitleTimer = 0;
      const canvas = game.canvas;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const cache = game.renderer.propSprites;
      cache.clear();

      const cachedDraw = cache.draw;
      cache.draw = (_ctx, entry, prop, seed, drawState, x, y) => {
        entry.draw(_ctx, x, y, seed, drawState);
        return false;
      };
      game.render();
      const direct = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      cache.draw = cachedDraw;
      game.render();
      const cached = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      game.render();
      const warm = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      const compare = (left, right) => {
        let changedPixels = 0;
        let maxChannelDelta = 0;
        let totalChannelDelta = 0;
        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = -1;
        let maxY = -1;
        for (let offset = 0; offset < left.length; offset += 4) {
          let changed = false;
          for (let channel = 0; channel < 4; channel += 1) {
            const delta = Math.abs(left[offset + channel] - right[offset + channel]);
            maxChannelDelta = Math.max(maxChannelDelta, delta);
            totalChannelDelta += delta;
            changed ||= delta !== 0;
          }
          if (!changed) continue;
          const pixel = offset / 4;
          const x = pixel % canvas.width;
          const y = Math.floor(pixel / canvas.width);
          changedPixels += 1;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        return {
          changedPixels,
          changedRatio: changedPixels / (canvas.width * canvas.height),
          maxChannelDelta,
          totalChannelDelta,
          bounds: changedPixels > 0 ? [minX, minY, maxX + 1, maxY + 1] : null
        };
      };

      return {
        levelId: game.level.id,
        levelName: game.level.name,
        directToCached: compare(direct, cached),
        cachedToWarm: compare(cached, warm),
        cache: cache.stats
      };
    });
    report.push({ file, ...comparison });
    console.log(
      `${String(index + 1).padStart(2, '0')}/${files.length} ${file}: `
      + `${comparison.directToCached.changedPixels} direct/cached, `
      + `${comparison.cachedToWarm.changedPixels} cached/warm changed pixels`
    );
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDir, 'prop-cache-parity.json'),
  `${JSON.stringify({ levels: report }, null, 2)}\n`
);
const exactWarm = report.filter((entry) => entry.cachedToWarm.changedPixels === 0).length;
const unstable = report.filter((entry) => entry.cachedToWarm.changedPixels > 0);
const excessiveBlendDelta = report.filter((entry) => entry.directToCached.changedRatio > 0.04);
const maxBlendDelta = Math.max(...report.map((entry) => entry.directToCached.changedRatio));
if (unstable.length > 0) {
  throw new Error(`${unstable.length} levels changed between cached warm frames`);
}
if (excessiveBlendDelta.length > 0) {
  throw new Error(`${excessiveBlendDelta.length} levels exceeded the 4% premultiplied-alpha comparison bound`);
}
console.log(
  `${exactWarm}/${report.length} cached level renders are byte-stable; `
  + `premultiplied-alpha edge deltas stay at or below ${(maxBlendDelta * 100).toFixed(2)}% of frame pixels`
);
