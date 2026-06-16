import { Game } from './core/Game.js';

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function start() {
  const canvas = document.querySelector('#game');
  const statusElement = document.querySelector('#status');

  if (!canvas) {
    throw new Error('Missing #game canvas element.');
  }

  const [mapData, playerData, penitentBastion] = await Promise.all([
    loadJson('./data/maps/demo-map.json'),
    loadJson('./data/actors/player.json'),
    loadJson('./data/enemies/host-penitent-bastion.json')
  ]);

  const game = new Game({
    canvas,
    mapData,
    playerData,
    enemyData: [penitentBastion],
    statusElement
  });

  game.start();
}

start().catch((error) => {
  console.error(error);
  const statusElement = document.querySelector('#status');
  if (statusElement) {
    statusElement.textContent = `Startup failed: ${error.message}`;
  }
});
