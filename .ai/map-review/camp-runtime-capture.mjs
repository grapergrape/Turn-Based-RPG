import fs from 'node:fs/promises';

const CDP_HTTP = 'http://127.0.0.1:9341';
const GAME_URL = 'http://127.0.0.1:8765/?level=camp&noCombat=1&skipIntro=1';
const OUT_DIR = '/home/gaspersk/projects/Turn-Based-RPG/.ai/visual-audit/long-ash-censure-rpg-passes';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CdpClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (!msg.id) return;
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(`${entry.method}: ${JSON.stringify(msg.error)}`));
      else entry.resolve(msg.result);
    };
  }

  async open() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

const target = await fetch(`${CDP_HTTP}/json/new?about:blank`, { method: 'PUT' }).then((res) => res.json());
const cdp = new CdpClient(target.webSocketDebuggerUrl);
await cdp.open();
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 960,
  deviceScaleFactor: 1,
  mobile: false
});

async function evaluate(expression, { awaitPromise = true } = {}) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description
      ?? result.exceptionDetails.text
      ?? JSON.stringify(result.exceptionDetails);
    throw new Error(detail);
  }
  return result.result?.value;
}

async function waitFor(expression, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < end) {
    try {
      if (await evaluate(expression)) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${expression}${lastError ? `: ${lastError.message}` : ''}`);
}

async function freshGame(pos = null) {
  const url = pos ? `${GAME_URL}&pos=${pos[0]},${pos[1]}` : GAME_URL;
  await cdp.send('Page.navigate', { url });
  await waitFor("document.readyState === 'complete'");
  await waitFor("Boolean(window.hostDebug?.game?.()?.level?.id === 'censure-road-camp')", 30000);
  await sleep(700);
}

async function setupGame({ fields = {}, primaries = {}, flags = [], pos = null } = {}) {
  await evaluate(`(() => {
    const g = window.hostDebug.game();
    g.__auditFields = ${JSON.stringify(fields)};
    g.__auditPrimaries = ${JSON.stringify(primaries)};
    g._fieldRating = (id) => Object.prototype.hasOwnProperty.call(g.__auditFields, id) ? g.__auditFields[id] : 0;
    g._primaryRating = (id) => Object.prototype.hasOwnProperty.call(g.__auditPrimaries, id) ? g.__auditPrimaries[id] : 0;
    for (const flag of ${JSON.stringify(flags)}) g.flags.add(flag);
    g._syncFlagConditionalObjects?.();
    ${pos ? `window.hostDebug.teleport(${pos[0]}, ${pos[1]});` : ''}
    return { id: g.level.id, npcs: g.npcs.map((n) => n.id), flags: [...g.flags] };
  })()`);
  await sleep(250);
}

async function setRatings({ fields = null, primaries = null } = {}) {
  await evaluate(`(() => {
    const g = window.hostDebug.game();
    ${fields ? `g.__auditFields = ${JSON.stringify(fields)};` : ''}
    ${primaries ? `g.__auditPrimaries = ${JSON.stringify(primaries)};` : ''}
    return true;
  })()`);
}

async function addFlags(flags) {
  await evaluate(`(() => {
    const g = window.hostDebug.game();
    for (const flag of ${JSON.stringify(flags)}) g.flags.add(flag);
    g._syncFlagConditionalObjects?.();
    return [...g.flags];
  })()`);
}

async function openObject(objectId) {
  await evaluate(`(() => {
    const g = window.hostDebug.game();
    const object = g.level.interactables.find((o) => o.id === ${JSON.stringify(objectId)});
    if (!object) throw new Error('Missing interactable: ' + ${JSON.stringify(objectId)});
    g._interactWithObject(object);
    return { screen: g.uiScreen, title: g.dialogue?.title, choices: g.dialogue?.choices?.map((c) => c.label) };
  })()`);
  await sleep(250);
}

async function chooseSearch(objectId, methodId) {
  return evaluate(`(() => {
    const g = window.hostDebug.game();
    const object = g.level.interactables.find((o) => o.id === ${JSON.stringify(objectId)});
    if (!object) throw new Error('Missing interactable: ' + ${JSON.stringify(objectId)});
    g._chooseSearchOption({ object, methodId: ${JSON.stringify(methodId)} });
    return { screen: g.uiScreen, title: g.dialogue?.title, lines: g.dialogue?.lines, flags: [...g.flags] };
  })()`);
}

async function chooseLock(objectId, methodId) {
  return evaluate(`(() => {
    const g = window.hostDebug.game();
    const object = g.level.interactables.find((o) => o.id === ${JSON.stringify(objectId)});
    if (!object) throw new Error('Missing interactable: ' + ${JSON.stringify(objectId)});
    g._chooseLockOption({ object, methodId: ${JSON.stringify(methodId)} });
    return { screen: g.uiScreen, title: g.dialogue?.title, lines: g.dialogue?.lines, flags: [...g.flags] };
  })()`);
}

async function openDialogue(dialogueId, nodeId = 'start', actorId = null) {
  return evaluate(`(() => {
    const g = window.hostDebug.game();
    const actor = ${actorId ? `g.npcs.find((n) => n.id === ${JSON.stringify(actorId)}) ?? null` : 'null'};
    g._openDialogueById(${JSON.stringify(dialogueId)}, ${JSON.stringify(nodeId)}, actor);
    return { screen: g.uiScreen, node: g.dialogue?.nodeId, title: g.dialogue?.title, choices: g.dialogue?.choices?.map((c) => c.label) };
  })()`);
}

async function chooseDialogue(index) {
  return evaluate(`(() => {
    const g = window.hostDebug.game();
    g._chooseDialogueOption(${index});
    return { screen: g.uiScreen, node: g.dialogue?.nodeId, title: g.dialogue?.title, choices: g.dialogue?.choices?.map((c) => c.label), flags: [...g.flags] };
  })()`);
}

async function screenshot() {
  await sleep(350);
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false
  });
  return Buffer.from(result.data, 'base64');
}

async function saveSingle(pass, frame) {
  const path = `${OUT_DIR}/pass-${String(pass).padStart(3, '0')}.png`;
  await fs.writeFile(path, frame);
  console.log(`PASS ${pass}: ${frame.length} bytes`);
}

async function saveComposite(pass, frames) {
  const sections = frames.map(({ label, frame }) => `
    <section>
      <div class="label">${escapeHtml(label)}</div>
      <img src="data:image/png;base64,${frame.toString('base64')}" alt="">
    </section>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;background:#090a0b;color:#ded8c4;font-family:monospace;width:1280px}
    section{margin:0;padding:0;border-bottom:2px solid #9b8254}
    .label{height:34px;box-sizing:border-box;padding:8px 14px;background:#151619;color:#ded8c4;font:bold 16px monospace;letter-spacing:.5px}
    img{display:block;width:1280px;height:960px;object-fit:contain;background:#000;image-rendering:pixelated}
  </style>${sections}`;
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await waitFor("document.readyState === 'complete'");
  const tree = await cdp.send('Page.getFrameTree');
  await cdp.send('Page.setDocumentContent', { frameId: tree.frameTree.frame.id, html });
  await waitFor(`document.images.length === ${frames.length} && [...document.images].every((img) => img.complete)`);
  const height = frames.length * 996;
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 1280, height, scale: 1 }
  });
  const frame = Buffer.from(result.data, 'base64');
  await saveSingle(pass, frame);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

async function searchBoundary({ pass, pos, objectId, methodId, field, low, high, primary = false }) {
  await freshGame(pos);
  await setupGame({
    fields: primary ? {} : { [field]: low },
    primaries: primary ? { [field]: low } : {},
    pos
  });
  await openObject(objectId);
  await chooseSearch(objectId, methodId);
  const failed = await screenshot();
  await setRatings(primary ? { primaries: { [field]: high } } : { fields: { [field]: high } });
  await chooseSearch(objectId, methodId);
  const success = await screenshot();
  await saveComposite(pass, [
    { label: `${field.toUpperCase()} ${low}: FAILED, METHOD REMAINS`, frame: failed },
    { label: `${field.toUpperCase()} ${high}: SUCCEEDED, RESULT PERSISTS`, frame: success }
  ]);
}

async function dialogueBoundary({ pass, pos, dialogueId, actorId, nodeId = 'start', field, low, high, successIndex, flags = [], otherFields = {} }) {
  await freshGame(pos);
  await setupGame({ fields: { ...otherFields, [field]: low }, flags, pos });
  await openDialogue(dialogueId, nodeId, actorId);
  const failed = await screenshot();
  await setRatings({ fields: { ...otherFields, [field]: high } });
  await openDialogue(dialogueId, nodeId, actorId);
  await chooseDialogue(successIndex);
  const success = await screenshot();
  await saveComposite(pass, [
    { label: `${field.toUpperCase()} ${low}: ROUTE NOT OFFERED`, frame: failed },
    { label: `${field.toUpperCase()} ${high}: ROUTE COMPLETED`, frame: success }
  ]);
}

async function main() {
  const only = new Set(process.argv.slice(2).map(Number).filter(Number.isFinite));
  const should = (pass) => only.size === 0 || only.has(pass);

  if (should(53)) await searchBoundary({ pass: 53, pos: [15, 25], objectId: 'censure-road-writ-board', methodId: 'find-erased-road-name', field: 'search', low: 39, high: 40 });
  if (should(54)) await searchBoundary({ pass: 54, pos: [15, 25], objectId: 'censure-road-writ-board', methodId: 'test-forged-board-correction', field: 'guile', low: 49, high: 50 });
  if (should(55)) await searchBoundary({ pass: 55, pos: [33, 17], objectId: 'censure-road-bell-mast', methodId: 'read-bell-rope-splice', field: 'engineering', low: 39, high: 40 });
  if (should(56)) await searchBoundary({ pass: 56, pos: [33, 17], objectId: 'censure-road-bell-mast', methodId: 'restore-bell-peal-rule', field: 'doctrine', low: 44, high: 45 });

  if (should(57)) {
    await freshGame([33, 18]);
    await setupGame({
      fields: { engineering: 40, doctrine: 45 },
      flags: ['censure-road-bell-splice-found', 'censure-road-bell-peal-found', 'long-ash-old-bell-peal-rule-read'],
      pos: [33, 18]
    });
    await openDialogue('censure-road-camp-sera', 'start', 'censure-bell-clerk-sera');
    const bothBranches = await screenshot();
    await chooseDialogue(1);
    const joined = await screenshot();
    await saveComposite(57, [
      { label: 'LOCAL SPLICE AND ROAD PEAL ARE BOTH RECOGNIZED', frame: bothBranches },
      { label: 'JOINED BELL REPORT RECORDED', frame: joined }
    ]);
  }

  if (should(58)) await dialogueBoundary({
    pass: 58, pos: [45, 26], dialogueId: 'censure-road-camp-caldus', actorId: 'censure-brother-caldus',
    field: 'melee', low: 39, high: 40, successIndex: 0, otherFields: { unarmed: 39 }
  });
  if (should(59)) await dialogueBoundary({
    pass: 59, pos: [45, 26], dialogueId: 'censure-road-camp-caldus', actorId: 'censure-brother-caldus',
    field: 'unarmed', low: 39, high: 40, successIndex: 0, otherFields: { melee: 39 }
  });
  if (should(60)) {
    await freshGame([45, 26]);
    await setupGame({ fields: { melee: 40, unarmed: 40 }, pos: [45, 26] });
    await openDialogue('censure-road-camp-caldus', 'start', 'censure-brother-caldus');
    await chooseDialogue(0);
    const completed = await screenshot();
    await openDialogue('censure-road-camp-caldus', 'start', 'censure-brother-caldus');
    const exclusive = await screenshot();
    await saveComposite(60, [
      { label: 'ONE CLOSE-DRILL ROUTE COMPLETES THE SHARED FLAG', frame: completed },
      { label: 'BOTH ALTERNATIVE ROUTES DISAPPEAR AFTER COMPLETION', frame: exclusive }
    ]);
  }

  if (should(61)) await searchBoundary({ pass: 61, pos: [58, 25], objectId: 'censure-road-shooting-range-target-center', methodId: 'read-useful-shot-pattern', field: 'firearms', low: 44, high: 45 });
  if (should(62)) await searchBoundary({ pass: 62, pos: [58, 25], objectId: 'censure-road-shooting-range-target-center', methodId: 'spot-hidden-clerk-mark', field: 'eye', low: 6, high: 7, primary: true });
  if (should(63)) {
    await freshGame([48, 27]);
    await setupGame({ pos: [48, 27] });
    await openObject('censure-road-drill-yard-satchel');
    const locked = await screenshot();
    await addFlags(['censure-road-drill-close-complete', 'censure-road-drill-range-complete']);
    await openObject('censure-road-drill-yard-satchel');
    await chooseLock('censure-road-drill-yard-satchel', 'claim-earned-drill-issue');
    const earned = await screenshot();
    await saveComposite(63, [
      { label: 'BEFORE BOTH DRILLS: NO METHOD THROUGH THE KNOT', frame: locked },
      { label: 'AFTER BOTH DRILLS: EARNED ISSUE OPENS AS REAL LOOT', frame: earned }
    ]);
  }

  if (should(64)) await searchBoundary({ pass: 64, pos: [27, 31], objectId: 'censure-road-quartermaster-table', methodId: 'find-ledger-weight-mismatch', field: 'search', low: 44, high: 45 });
  if (should(65)) await dialogueBoundary({
    pass: 65, pos: [29, 32], dialogueId: 'censure-road-camp-runa', actorId: 'censure-quartermaster-runa',
    field: 'command', low: 49, high: 50, successIndex: 2, otherFields: { guile: 0 }
  });
  if (should(66)) await dialogueBoundary({
    pass: 66, pos: [29, 32], dialogueId: 'censure-road-camp-runa', actorId: 'censure-quartermaster-runa',
    field: 'guile', low: 59, high: 60, successIndex: 2, otherFields: { command: 0 }
  });
  if (should(67)) {
    await freshGame([29, 32]);
    await setupGame({ fields: { command: 50, guile: 60 }, pos: [29, 32] });
    await openDialogue('censure-road-camp-runa', 'start', 'censure-quartermaster-runa');
    await chooseDialogue(2);
    const authorized = await screenshot();
    await openObject('censure-road-quartermaster-sealed-storage-crate-31-30');
    await chooseLock('censure-road-quartermaster-sealed-storage-crate-31-30', 'claim-authorized-field-issue');
    const oneBundle = await screenshot();
    await evaluate(`window.hostDebug.game()._takeAllLoot()`);
    await openDialogue('censure-road-camp-runa', 'start', 'censure-quartermaster-runa');
    const routesGone = await screenshot();
    await saveComposite(67, [
      { label: 'ONE AUTHORIZATION ROUTE CREATES THE SHARED ISSUE MARK', frame: authorized },
      { label: 'THE SINGLE AUTHORIZED BUNDLE OPENS', frame: oneBundle },
      { label: 'AFTER CLAIM: COMMAND AND FORGERY ROUTES ARE BOTH GONE', frame: routesGone }
    ]);
  }

  if (should(68)) await searchBoundary({ pass: 68, pos: [58, 43], objectId: 'censure-road-medic-field-kit', methodId: 'identify-reused-dressing', field: 'medicine', low: 44, high: 45 });
  if (should(69)) await searchBoundary({ pass: 69, pos: [58, 43], objectId: 'censure-road-medic-field-kit', methodId: 'identify-isolated-host-stain', field: 'hostSigns', low: 59, high: 60 });
  if (should(70)) {
    await freshGame([60, 44]);
    await setupGame({ fields: { medicine: 45 }, flags: ['long-ash-kill-site-wounds-read'], pos: [60, 44] });
    await openDialogue('censure-road-camp-hanne', 'start', 'censure-sister-hanne');
    const offered = await screenshot();
    await chooseDialogue(0);
    const reported = await screenshot();
    await saveComposite(70, [
      { label: 'LONG ASH CASUALTY FLAG OPENS HANNE\'S REPORT ROUTE', frame: offered },
      { label: 'MEDICAL REPORT AND SAFE DRESSING RECORDED', frame: reported }
    ]);
  }

  if (should(71)) await searchBoundary({ pass: 71, pos: [58, 40], objectId: 'censure-road-evidence-shed-door', methodId: 'classify-low-risk-sack', field: 'containment', low: 49, high: 50 });
  if (should(72)) await searchBoundary({ pass: 72, pos: [58, 40], objectId: 'censure-road-evidence-shed-door', methodId: 'find-active-evidence-packet', field: 'hostSigns', low: 59, high: 60 });
  if (should(73)) await searchBoundary({ pass: 73, pos: [58, 40], objectId: 'censure-road-evidence-shed-door', methodId: 'steady-sounding-sack', field: 'nerve', low: 6, high: 7, primary: true });
  if (should(74)) {
    await freshGame([58, 40]);
    await setupGame({ fields: { containment: 50, hostSigns: 60 }, primaries: { nerve: 7 }, pos: [58, 40] });
    await openObject('censure-road-evidence-shed-door');
    await chooseSearch('censure-road-evidence-shed-door', 'classify-low-risk-sack');
    await chooseSearch('censure-road-evidence-shed-door', 'find-active-evidence-packet');
    await chooseSearch('censure-road-evidence-shed-door', 'steady-sounding-sack');
    const noLoot = await screenshot();
    await saveComposite(74, [
      { label: 'ALL EVIDENCE CHECKS COMPLETE: ONLY READ OR LEAVE, NO LOOT', frame: noLoot }
    ]);
  }

  if (should(75)) {
    await freshGame([44, 37]);
    await setupGame({ fields: { engineering: 45 }, flags: ['long-ash-cart-sabotage-proved'], pos: [44, 37] });
    await openDialogue('censure-road-camp-joric', 'start', 'censure-ash-porter-joric');
    const offered = await screenshot();
    await chooseDialogue(0);
    const reported = await screenshot();
    await saveComposite(75, [
      { label: 'LONG ASH CART EVIDENCE OPENS JORIC\'S ROUTE', frame: offered },
      { label: 'PORTER REPORT AND DISPUTED FEE RECORDED', frame: reported }
    ]);
  }
  if (should(76)) {
    await freshGame([14, 27]);
    await setupGame({ fields: { guile: 45 }, flags: ['censure-road-writ-board-erasure-found'], pos: [14, 27] });
    await openDialogue('censure-road-camp-pell', 'start', 'censure-writ-runner-pell');
    const offered = await screenshot();
    await chooseDialogue(1);
    const reported = await screenshot();
    await saveComposite(76, [
      { label: 'WRIT-BOARD EVIDENCE OPENS PELL\'S CLERK ROUTE', frame: offered },
      { label: 'PELL RECORDS THE WRIT REPORT', frame: reported }
    ]);
  }

  if (should(77)) await dialogueBoundary({
    pass: 77, pos: [20, 19], dialogueId: 'censure-road-camp-odran', actorId: 'censure-father-odran', nodeId: 'absolution-routes',
    field: 'doctrine', low: 44, high: 45, successIndex: 1, otherFields: { speech: 0, guile: 0 }
  });
  if (should(78)) await dialogueBoundary({
    pass: 78, pos: [20, 19], dialogueId: 'censure-road-camp-odran', actorId: 'censure-father-odran', nodeId: 'absolution-routes',
    field: 'speech', low: 44, high: 45, successIndex: 1, otherFields: { doctrine: 0, guile: 0 }
  });
  if (should(79)) await dialogueBoundary({
    pass: 79, pos: [20, 19], dialogueId: 'censure-road-camp-odran', actorId: 'censure-father-odran', nodeId: 'absolution-routes',
    field: 'guile', low: 54, high: 55, successIndex: 1, otherFields: { doctrine: 0, speech: 0 }
  });
  if (should(80)) {
    await freshGame([20, 19]);
    await setupGame({ fields: { doctrine: 0, speech: 0, guile: 0 }, pos: [20, 19] });
    await evaluate(`(() => {
      const g = window.hostDebug.game();
      const count = g.inventory.count('ducat');
      if (count > 0) g.inventory.remove('ducat', count);
      return count;
    })()`);
    await openDialogue('censure-road-camp-odran', 'price-low', 'censure-father-odran');
    const noStatOffer = await screenshot();
    await chooseDialogue(0);
    const chit = await screenshot();
    await saveComposite(80, [
      { label: 'NO FIELD GATE AND NO COIN: PRAY FIVE TIMES REMAINS AVAILABLE', frame: noStatOffer },
      { label: 'NO-STAT ROUTE GRANTS THE REQUIRED ABSOLUTION CHIT', frame: chit }
    ]);
  }

  if (should(81)) await dialogueBoundary({
    pass: 81, pos: [46, 14], dialogueId: 'censure-road-camp-voss', actorId: 'censure-preceptor-voss', nodeId: 'route-clearance',
    field: 'doctrine', low: 44, high: 45, successIndex: 1, otherFields: { search: 0, command: 0 }
  });
  if (should(82)) await dialogueBoundary({
    pass: 82, pos: [46, 14], dialogueId: 'censure-road-camp-voss', actorId: 'censure-preceptor-voss', nodeId: 'route-clearance',
    field: 'search', low: 44, high: 45, successIndex: 1, otherFields: { doctrine: 0, command: 0 },
    flags: ['long-ash-cart-sabotage-proved', 'long-ash-kill-site-wounds-read', 'long-ash-old-bell-peal-rule-read']
  });
  if (should(83)) await dialogueBoundary({
    pass: 83, pos: [46, 14], dialogueId: 'censure-road-camp-voss', actorId: 'censure-preceptor-voss', nodeId: 'route-field-options',
    field: 'command', low: 54, high: 55, successIndex: 0, otherFields: { doctrine: 0, search: 0 }
  });
  if (should(84)) {
    await freshGame([46, 14]);
    await setupGame({
      fields: { doctrine: 0, search: 0, command: 0 },
      flags: ['censure-road-report-sera-bell', 'censure-road-report-hanne-medical', 'censure-road-report-joric-route'],
      pos: [46, 14]
    });
    await openDialogue('censure-road-camp-voss', 'route-clearance', 'censure-preceptor-voss');
    const offered = await screenshot();
    await chooseDialogue(1);
    const cleared = await screenshot();
    await saveComposite(84, [
      { label: 'THREE PROFESSION REPORTS OFFER THE NO-STAT REPORT ROUTE', frame: offered },
      { label: 'JOINED REPORT AUTHORIZES EAST-ROAD TRAVEL', frame: cleared }
    ]);
  }
  if (should(85)) {
    await freshGame([46, 14]);
    await setupGame({ fields: { doctrine: 0, search: 0, command: 0 }, pos: [46, 14] });
    await openDialogue('censure-road-camp-voss', 'route-field-options', 'censure-preceptor-voss');
    await chooseDialogue(0);
    const account = await screenshot();
    await chooseDialogue(0);
    const cleared = await screenshot();
    await saveComposite(85, [
      { label: 'PLAIN FIELD ACCOUNT HAS NO STAT GATE', frame: account },
      { label: 'SIGNING THE SHORT ACCOUNT AUTHORIZES TRAVEL', frame: cleared }
    ]);
  }
  if (should(86)) {
    await freshGame([46, 14]);
    await setupGame({ pos: [46, 14] });
    await openDialogue('censure-road-camp-voss', 'report-q30', 'censure-preceptor-voss');
    await chooseDialogue(0);
    const perfect = await screenshot();
    await openDialogue('censure-road-camp-maev', 'start', 'censure-sutler-maev');
    const bonus = await screenshot();
    await saveComposite(86, [
      { label: 'FORM C-17 PERFECT FINISH ALSO CLEARS THE ROUTE', frame: perfect },
      { label: 'PERFECT FLAG UNLOCKS ONLY THE OPTIONAL SUPERIOR ISSUE', frame: bonus }
    ]);
  }
  if (should(87)) {
    await freshGame([66, 16]);
    await setupGame({ pos: [66, 16] });
    await openDialogue('censure-road-camp-hallowfen-gate', 'start');
    await saveSingle(87, await screenshot());
  }
  if (should(88)) {
    await freshGame([66, 16]);
    await setupGame({ flags: ['censure-road-voss-route-cleared'], pos: [66, 16] });
    await openDialogue('censure-road-camp-hallowfen-gate', 'start');
    await saveSingle(88, await screenshot());
  }
}

try {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await main();
} finally {
  cdp.close();
}
