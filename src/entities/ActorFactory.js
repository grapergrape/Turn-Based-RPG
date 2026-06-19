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
    position
  });
}
