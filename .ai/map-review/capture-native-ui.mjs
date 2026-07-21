import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const outputDir = path.resolve(process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-ui/after');
const baseUrl = process.env.UI_AUDIT_URL ?? 'http://127.0.0.1:8137';
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error?.stack ?? error)));
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    errors.push(`${response.status()} ${response.url()}`);
  }
});

async function openReady(url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.title === 'CAPTURE-READY' || document.title === 'CAPTURE-ERROR');
  if (await page.title() !== 'CAPTURE-READY') {
    throw new Error(`UI capture failed at ${url}: ${await page.locator('body').innerText()}`);
  }
}

async function capture(name, url) {
  await openReady(url);
  await page.locator('#c').screenshot({ path: path.join(outputDir, `${name}.png`) });
}

try {
  const harness = `${baseUrl}/.ai/map-review/preview-native-ui.html`;
  await openReady(`${harness}?case=hud`);
  const cases = await page.evaluate(() => globalThis.__NATIVE_UI_CASES);
  for (const name of cases) {
    await capture(`ui-${name}`, `${harness}?case=${encodeURIComponent(name)}`);
  }

  const journal = `${baseUrl}/.ai/map-review/preview-journal.html`;
  for (const [section, selected] of [
    ['QUESTS', 0], ['MAP', 0], ['NOTES', 0], ['FACTIONS', 3],
    ['CHARACTER', 4], ['SCARS', 0], ['TECHNIQUES', 7]
  ]) {
    await capture(
      `journal-${section.toLowerCase()}`,
      `${journal}?section=${section}&selected=${selected}`
    );
  }
  for (const direction of [-1, 1]) {
    for (const progress of [0.2, 0.5, 0.8]) {
      await capture(
        `journal-turn-${direction < 0 ? 'back' : 'forward'}-${String(progress).replace('.', '')}`,
        `${journal}?section=MAP&turn=${progress}&direction=${direction}`
      );
    }
  }

  if (errors.length > 0) throw new Error(`browser errors:\n${errors.join('\n')}`);
  console.log(`captured ${cases.length + 13} native UI screens in ${outputDir}`);
} finally {
  await browser.close();
}
