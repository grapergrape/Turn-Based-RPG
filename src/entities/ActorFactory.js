// Builds Entity instances from loaded JSON data + spawn positions.
//
// Keeps the wiring between data files and runtime entities in one place. Sprite
// ids default to the actor id (our actor ids match SpriteAtlas keys), but data
// may override with an explicit `spriteId`.

import { Entity } from './Entity.js';

export function createActor(data, position) {
  return new Entity({
    id: data.id,
    name: data.name,
    type: data.type,
    faction: data.faction ?? null,
    role: data.role ?? null,
    background: data.background ?? null,
    stats: data.stats ?? {},
    tags: data.tags ?? [],
    spriteId: data.spriteId ?? data.id,
    attacks: data.attacks ?? [],
    inspect: data.inspect ?? null,
    loot: data.loot ?? [],
    progression: data.progression ?? defaultProgressionFor(data),
    position
  });
}

function defaultProgressionFor(data) {
  if (data.type === 'enemy') {
    const tags = new Set(Array.isArray(data.tags) ? data.tags : []);
    if (tags.has('host') || tags.has('vale-imprint')) return { level: 1, build: 'host-threat' };
    if (tags.has('ranged')) return { level: 1, build: 'gunhand' };
    return { level: 1, build: 'breaker' };
  }
  if (data.type === 'player' || data.type === 'npc') return { level: 1, build: 'field-agent' };
  return null;
}
