import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'file:///home/gaspersk/.npm/_npx/705bc6b22212b352/node_modules/playwright/index.mjs';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const outputDir = path.resolve(
  process.argv[2] ?? '.ai/visual-audit/2026-07-17-native-2x-performance'
);
const baseUrl = process.env.GAME_AUDIT_URL ?? 'http://127.0.0.1:8137';
const levels = [
  'ash_road_south.json',
  'long_ash_road_approach.json',
  'censure_road_camp.json',
  'old_pilgrim_novitiate_quarters.json',
  'ash_chapel_bell_room.json',
  'ash_chapel_catacombs.json'
];

await mkdir(outputDir, { recursive: true });

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

await page.goto(
  `${baseUrl}/?level=data/levels/${levels[0]}&skipIntro=1&noCombat=1`,
  { waitUntil: 'networkidle' }
);
await page.waitForFunction(() => Boolean(globalThis.hostDebug?.game?.()?.ready), null, { timeout: 60000 });

const report = [];
try {
  for (let index = 0; index < levels.length; index += 1) {
    const file = levels[index];
    const levelPath = `./data/levels/${file}`;
    if (index > 0) {
      await page.evaluate(async (nextPath) => {
        const game = globalThis.hostDebug.game();
        game.loop.stop();
        game.levelPath = nextPath;
        await game.boot({ skipIntro: true, noCombat: true });
      }, levelPath);
    }

    const metrics = await page.evaluate(async ({ expectedPath, rafFrameCount }) => {
      const game = globalThis.hostDebug.game();
      game.loop.stop();
      game.areaTitleTimer = 0;

      const percentile = (values, ratio) => {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
      };
      const summarize = (values) => ({
        count: values.length,
        averageMs: values.reduce((sum, value) => sum + value, 0) / values.length,
        medianMs: percentile(values, 0.5),
        p95Ms: percentile(values, 0.95),
        maxMs: Math.max(...values)
      });

      game.renderer.staticScene.window = null;
      const coldStart = performance.now();
      game.render();
      const coldMs = performance.now() - coldStart;
      game.render();

      const methodNames = [
        'fillRect', 'clearRect', 'drawImage', 'fill', 'stroke', 'fillText',
        'beginPath', 'moveTo', 'lineTo', 'rect', 'arc', 'clip',
        'save', 'restore', 'translate', 'scale', 'setTransform'
      ];
      const proto = CanvasRenderingContext2D.prototype;
      const originals = new Map();
      const calls = Object.fromEntries(methodNames.map((name) => [name, 0]));
      for (const name of methodNames) {
        if (typeof proto[name] !== 'function') continue;
        const original = proto[name];
        originals.set(name, original);
        proto[name] = function instrumentedCanvasCall(...args) {
          calls[name] += 1;
          return original.apply(this, args);
        };
      }
      const instrumentedStart = performance.now();
      game.render();
      const instrumentedMs = performance.now() - instrumentedStart;
      for (const [name, original] of originals) proto[name] = original;

      const immediate = [];
      for (let sample = 0; sample < 60; sample += 1) {
        game.anim.tick += 0.25;
        const start = performance.now();
        game.render();
        immediate.push(performance.now() - start);
      }

      const oldUpdate = game.loop.update;
      const oldRender = game.loop.render;
      const renderDurations = [];
      const frameStarts = [];
      game.loop.update = () => {};
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          game.loop.stop();
          reject(new Error(`RAF profiling timed out at ${renderDurations.length}/${rafFrameCount} frames`));
        }, 20000);
        game.loop.render = () => {
          const start = performance.now();
          frameStarts.push(start);
          game.render();
          renderDurations.push(performance.now() - start);
          if (renderDurations.length >= rafFrameCount) {
            game.loop.stop();
            clearTimeout(timeout);
            resolve();
          }
        };
        game.loop.start();
      });
      game.loop.update = oldUpdate;
      game.loop.render = oldRender;

      const frameIntervals = frameStarts.slice(1).map((start, i) => start - frameStarts[i]);
      const canvas = document.querySelector('#game');
      const rect = canvas.getBoundingClientRect();
      const totalCalls = Object.values(calls).reduce((sum, count) => sum + count, 0);
      return {
        expectedPath,
        actualPath: game.levelPath,
        levelId: game.level?.id,
        levelName: game.level?.name,
        canvas: {
          backing: [canvas.width, canvas.height],
          css: [rect.width, rect.height],
          dpr: devicePixelRatio,
          visualScale: visualViewport?.scale ?? 1
        },
        scene: {
          actors: game.actors.length,
          props: game.level?.props?.length ?? 0,
          volumeProps: game.renderer.volumeProps.length,
          flatProps: game.renderer.flatProps.length,
          cache: [game.renderer.staticScene.canvas.width, game.renderer.staticScene.canvas.height]
        },
        propCache: game.renderer.propSprites.stats,
        shadowCache: game.renderer.shadowMasks.stats,
        coldCacheRenderMs: coldMs,
        immediateRender: summarize(immediate),
        rafRender: summarize(renderDurations),
        rafInterval: summarize(frameIntervals),
        estimatedFps: 1000 / summarize(frameIntervals).averageMs,
        instrumented: { durationMs: instrumentedMs, totalCalls, calls },
        heapBytes: performance.memory?.usedJSHeapSize ?? null,
        userAgent: navigator.userAgent
      };
    }, { expectedPath: levelPath, rafFrameCount: 90 });

    if (metrics.actualPath !== levelPath) throw new Error(`${file}: wrong level after profile`);
    if (metrics.canvas.backing[0] !== 1280 || metrics.canvas.backing[1] !== 960) {
      throw new Error(`${file}: wrong backing size`);
    }
    if (metrics.canvas.css[0] !== 1280 || metrics.canvas.css[1] !== 960) {
      throw new Error(`${file}: wrong CSS size at 100% zoom`);
    }
    report.push(metrics);
    console.log(
      `${metrics.levelName}: ${metrics.immediateRender.averageMs.toFixed(2)}ms immediate, `
      + `${metrics.rafInterval.averageMs.toFixed(2)}ms RAF interval, `
      + `${metrics.estimatedFps.toFixed(1)} estimated fps, `
      + `${metrics.instrumented.totalCalls} canvas calls`
    );
  }

  if (errors.length > 0) throw new Error(`browser errors:\n${errors.join('\n')}`);
  await writeFile(
    path.join(outputDir, 'report.json'),
    `${JSON.stringify({ environment: 'headless Chrome software-canvas diagnostic', levels: report }, null, 2)}\n`
  );
  console.log(`wrote ${report.length} warm-frame profiles to ${outputDir}`);
} finally {
  await browser.close();
}
