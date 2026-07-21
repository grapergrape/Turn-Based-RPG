import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const outputDir = path.resolve(process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-levels');
const url = process.env.LEVEL_CONTACT_URL ?? 'http://127.0.0.1:8137/.ai/map-review/native-level-contact-sheet.html';
const auditRoot = process.env.LEVEL_CONTACT_ROOT ?? path.basename(outputDir);
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1236, height: 900 }, deviceScaleFactor: 1 });
try {
  for (const type of ['runtime-levels', 'full-maps']) {
    for (const group of ['chapel', 'camp', 'longash', 'pilgrim', 'south']) {
      const params = new URLSearchParams({ type, group, root: auditRoot });
      await page.goto(`${url}?${params}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.title === 'CAPTURE-READY');
      await page.screenshot({
        path: path.join(outputDir, `contact-${type}-${group}.png`),
        fullPage: true
      });
    }
  }
} finally {
  await browser.close();
}
console.log(`captured 10 level contact sheets in ${outputDir}`);
