import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const beforeDir = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-levels/runtime'
);
const afterDir = path.resolve(
  process.argv[3] ?? '.ai/visual-audit/2026-07-17-native-2x-levels/runtime-cached'
);
const outputPath = path.join(afterDir, 'pixel-comparison.json');
const baseUrl = process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8137';
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

const relativeUrl = (absolutePath) => {
  const relative = path.relative(repoRoot, absolutePath).split(path.sep).join('/');
  return `${baseUrl}/${relative}`;
};

const beforeFiles = (await readdir(beforeDir)).filter((file) => file.endsWith('.png')).sort();
const afterFiles = new Set((await readdir(afterDir)).filter((file) => file.endsWith('.png')));
const missing = beforeFiles.filter((file) => !afterFiles.has(file));
if (missing.length > 0) throw new Error(`missing after images: ${missing.join(', ')}`);

await mkdir(afterDir, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1 });
await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

const results = [];
try {
  for (const file of beforeFiles) {
    const comparison = await page.evaluate(async ({ beforeUrl, afterUrl }) => {
      const load = async (url) => createImageBitmap(await (await fetch(url)).blob());
      const [before, after] = await Promise.all([load(beforeUrl), load(afterUrl)]);
      if (before.width !== after.width || before.height !== after.height) {
        return {
          size: [before.width, before.height],
          afterSize: [after.width, after.height],
          changedPixels: before.width * before.height,
          maxChannelDelta: 255,
          bounds: [0, 0, Math.max(before.width, after.width), Math.max(before.height, after.height)]
        };
      }

      const canvas = document.createElement('canvas');
      canvas.width = before.width;
      canvas.height = before.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(before, 0, 0);
      const left = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(after, 0, 0);
      const right = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      let changedPixels = 0;
      let maxChannelDelta = 0;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      for (let offset = 0; offset < left.length; offset += 4) {
        let changed = false;
        for (let channel = 0; channel < 4; channel += 1) {
          const delta = Math.abs(left[offset + channel] - right[offset + channel]);
          maxChannelDelta = Math.max(maxChannelDelta, delta);
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
      before.close();
      after.close();
      return {
        size: [canvas.width, canvas.height],
        changedPixels,
        changedRatio: changedPixels / (canvas.width * canvas.height),
        maxChannelDelta,
        bounds: changedPixels > 0 ? [minX, minY, maxX + 1, maxY + 1] : null
      };
    }, {
      beforeUrl: relativeUrl(path.join(beforeDir, file)),
      afterUrl: relativeUrl(path.join(afterDir, file))
    });
    results.push({ file, ...comparison });
    console.log(`${file}: ${comparison.changedPixels} changed pixels, max delta ${comparison.maxChannelDelta}`);
  }
} finally {
  await browser.close();
}

const exactMatches = results.filter((result) => result.changedPixels === 0).length;
const changed = results.filter((result) => result.changedPixels > 0);
await writeFile(
  outputPath,
  `${JSON.stringify({ exactMatches, total: results.length, changed }, null, 2)}\n`
);
console.log(`${exactMatches}/${results.length} captures are pixel-identical; wrote ${outputPath}`);
