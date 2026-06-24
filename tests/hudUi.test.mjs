import { UIRenderer } from '../src/render/UIRenderer.js';

function mockCtx() {
  return {
    canvas: { width: 640, height: 480 },
    imageSmoothingEnabled: false,
    save() {},
    restore() {},
    fillRect() {},
    drawImage() {},
    set fillStyle(value) { this._fillStyle = value; },
    get fillStyle() { return this._fillStyle; }
  };
}

const renderer = new UIRenderer();

renderer.draw(mockCtx(), {
  screen: null,
  levelName: 'Ash Chapel Breach',
  actorName: 'Mara Vey',
  role: 'Cult-Breaker, Ashen Censure',
  mode: 'EXPLORE',
  sneakMode: false,
  hp: 14,
  maxHp: 14,
  ap: 6,
  maxAp: 6,
  action: 'Service Knife',
  target: '-',
  inventoryItems: [],
  carryWeight: 0,
  maxCarryWeight: 10,
  controls: ['Click Move/Use', 'WASD Move'],
  log: [
    'The chapel air tastes of old ash.',
    'Quest updated: ring the upper bell.'
  ],
  cursor: null
});
