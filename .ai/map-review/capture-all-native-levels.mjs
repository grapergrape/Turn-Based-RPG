import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const levelDir = path.join(repoRoot, 'data/levels');
const outputDir = path.resolve(process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-levels/runtime');
const baseUrl = process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8137';
await mkdir(outputDir, { recursive: true });

const files = (await readdir(levelDir)).filter((name) => name.endsWith('.json')).sort();
const definitions = await Promise.all(files.map(async (file) => ({
  file,
  json: JSON.parse(await readFile(path.join(levelDir, file), 'utf8'))
})));

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error?.stack ?? error)));
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
    errors.push(`console: ${message.text()}`);
  }
});
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
    errors.push(`${response.status()} ${response.url()}`);
  }
});

const first = definitions[0];
await page.goto(
  `${baseUrl}/?level=data/levels/${encodeURIComponent(first.file)}&skipIntro=1&noCombat=1`,
  { waitUntil: 'networkidle' }
);
await page.waitForFunction(() => Boolean(globalThis.hostDebug?.game?.()?.ready), null, { timeout: 60000 });
await page.evaluate(() => globalThis.hostDebug.game().loop.stop());

const report = [];
try {
  for (let index = 0; index < definitions.length; index += 1) {
    const { file, json } = definitions[index];
    const levelPath = `./data/levels/${file}`;
    if (index > 0) {
      await page.evaluate(async (nextPath) => {
        const game = globalThis.hostDebug.game();
        game.loop.stop();
        game.levelPath = nextPath;
        await game.boot({ skipIntro: true, noCombat: true });
        game.loop.stop();
      }, levelPath);
    }

    const metrics = await page.evaluate(({ expectedPath, expectedName }) => {
      const game = globalThis.hostDebug.game();
      game.loop.stop();
      game.areaTitleTimer = 0;
      game.render();
      const canvas = document.querySelector('#game');
      const rect = canvas.getBoundingClientRect();
      const samples = [];
      for (let i = 0; i < 20; i += 1) {
        game.anim.tick += 0.25;
        const start = performance.now();
        game.render();
        samples.push(performance.now() - start);
      }
      samples.sort((a, b) => a - b);
      const averageMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
      const p95Ms = samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))];
      const cache = game.renderer.staticScene;
      return {
        expectedPath,
        expectedName,
        actualPath: game.levelPath,
        id: game.level?.id,
        name: game.level?.name,
        ready: game.ready,
        mode: game.mode,
        uiScreen: game.uiScreen,
        canvas: {
          width: canvas.width,
          height: canvas.height,
          cssWidth: rect.width,
          cssHeight: rect.height,
          styleWidth: canvas.style.width,
          styleHeight: canvas.style.height
        },
        browser: {
          innerWidth: innerWidth,
          innerHeight: innerHeight,
          devicePixelRatio: devicePixelRatio,
          visualScale: visualViewport?.scale ?? 1
        },
        player: { x: game.player?.x, y: game.player?.y },
        actors: game.actors.length,
        props: game.level?.props?.length ?? 0,
        interactables: game.level?.interactables?.length ?? 0,
        cache: {
          width: cache?.canvas?.width,
          height: cache?.canvas?.height,
          logicalWidth: cache?.logicalWidth,
          logicalHeight: cache?.logicalHeight
        },
        render: { averageMs, p95Ms, samples },
        heapBytes: performance.memory?.usedJSHeapSize ?? null
      };
    }, { expectedPath: levelPath, expectedName: json.name });

    if (!metrics.ready || metrics.actualPath !== levelPath) throw new Error(`${file}: wrong runtime level`);
    if (metrics.canvas.width !== 1280 || metrics.canvas.height !== 960) throw new Error(`${file}: wrong backing size`);
    if (metrics.canvas.cssWidth !== 1280 || metrics.canvas.cssHeight !== 960) throw new Error(`${file}: wrong 100% CSS size`);
    if (metrics.browser.devicePixelRatio !== 1 || metrics.browser.visualScale !== 1) throw new Error(`${file}: browser zoom is not 100%`);
    if (metrics.uiScreen !== null || metrics.mode !== 'explore') throw new Error(`${file}: did not reach field view`);
    if (metrics.cache.width > 2048 || metrics.cache.height > 1408) throw new Error(`${file}: static cache exceeded bound`);

    await page.locator('#game').screenshot({ path: path.join(outputDir, `${file.replace('.json', '')}.png`) });
    report.push(metrics);
    console.log(
      `${String(index + 1).padStart(2, '0')}/${definitions.length} ${file} `
      + `${metrics.render.averageMs.toFixed(2)}ms avg ${metrics.render.p95Ms.toFixed(2)}ms p95`
    );
  }

  if (errors.length > 0) throw new Error(`browser errors:\n${errors.join('\n')}`);
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
}

const worstAverage = [...report].sort((a, b) => b.render.averageMs - a.render.averageMs)[0];
const worstP95 = [...report].sort((a, b) => b.render.p95Ms - a.render.p95Ms)[0];
console.log(
  `verified ${report.length} real levels at 1280x960 and 100% browser zoom; `
  + `worst average ${worstAverage.render.averageMs.toFixed(2)}ms (${worstAverage.id}), `
  + `worst p95 ${worstP95.render.p95Ms.toFixed(2)}ms (${worstP95.id}).`
);
