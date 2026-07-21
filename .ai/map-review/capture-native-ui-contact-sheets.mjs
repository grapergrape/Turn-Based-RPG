import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const outputDir = path.resolve(process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-ui/after');
const url = process.env.UI_CONTACT_URL ?? 'http://127.0.0.1:8137/.ai/map-review/native-ui-contact-sheet.html';
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1236, height: 900 }, deviceScaleFactor: 1 });
try {
  for (const group of ['core', 'inventory', 'cursors', 'journal', 'turns']) {
    await page.goto(`${url}?group=${group}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.title === 'CAPTURE-READY');
    await page.screenshot({ path: path.join(outputDir, `contact-${group}.png`), fullPage: true });
  }
} finally {
  await browser.close();
}
console.log(`captured 5 UI contact sheets in ${outputDir}`);
