import { mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const levelDir = path.resolve('data/levels');
const outputDir = path.resolve(process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-levels/full-maps');
const baseUrl = process.env.MAP_AUDIT_URL ?? 'http://127.0.0.1:8137/.ai/map-review/capture-scene.html';
await mkdir(outputDir, { recursive: true });

const files = (await readdir(levelDir)).filter((name) => name.endsWith('.json')).sort();
const levels = await Promise.all(files.map(async (file) => ({
  file,
  data: JSON.parse(await readFile(path.join(levelDir, file), 'utf8'))
})));

function sceneBounds(width, height) {
  return {
    width: (width + height - 1) * 32 + 64 + 96,
    height: (width + height - 2) * 16 + 32 + 64 + 96
  };
}

const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error?.stack ?? error)));
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    errors.push(`${response.status()} ${response.url()}`);
  }
});

try {
  for (let index = 0; index < levels.length; index += 1) {
    const { file, data } = levels[index];
    const bounds = sceneBounds(data.width, data.height);
    const scale = Math.min(0.7, 1660 / bounds.width, 960 / bounds.height);
    const groups = new Set((data.hiddenRegions ?? []).map((region) => region.doorGroup).filter(Boolean));
    for (const object of data.objects ?? []) {
      if (object.doorGroup) groups.add(object.doorGroup);
    }
    const params = new URLSearchParams({
      level: `./data/levels/${file}`,
      scale: String(scale),
      includeDormant: '1'
    });
    if (groups.size) params.set('openDoorGroups', [...groups].join(','));
    await page.goto(`${baseUrl}?${params}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.title === 'CAPTURE-READY' || document.title === 'CAPTURE-ERROR', null, { timeout: 60000 });
    if (await page.title() !== 'CAPTURE-READY') {
      throw new Error(`${file}: ${await page.locator('body').innerText()}`);
    }
    await page.locator('#out').screenshot({ path: path.join(outputDir, `${file.replace('.json', '')}.png`) });
    console.log(`${String(index + 1).padStart(2, '0')}/${levels.length} ${file} scale ${scale.toFixed(3)}`);
  }
  if (errors.length) throw new Error(`browser errors:\n${errors.join('\n')}`);
} finally {
  await browser.close();
}

console.log(`captured ${levels.length} complete level compositions in ${outputDir}`);
