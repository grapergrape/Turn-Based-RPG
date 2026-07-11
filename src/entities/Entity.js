// A single actor in the world (player or enemy).
//
// Holds position, combat stats, the equipped attacks, and lightweight render
// state (animation name/frame and a sub-tile pixel offset used for stepped
// movement). Systems mutate this; it contains no rendering or rule logic.

import { scaleStatsForProgression } from '../core/Progression.js';

export class Entity {
  constructor({
    id,
    name,
    type,
    faction = null,
    role = null,
    background = null,
    stats = {},
    position = { x: 0, y: 0 },
    tags = [],
    spriteId = null,
    attacks = [],
    inspect = null,
    loot = [],
    trade = null,
    appearance = null,
    progression = null
  }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.faction = faction;
    this.role = role;
    this.background = background;
    // Dialogue id shown when the player inspects this actor's corpse, if any.
    this.inspect = inspect;
    this.inspectShownBeforeLoot = false;
    this.loot = Array.isArray(loot) ? loot.map((entry) => ({ ...entry })) : [];
    this.lootClaimed = false;
    this.trade = trade ? JSON.parse(JSON.stringify(trade)) : null;
    this.tags = [...tags];
    this.position = { ...position };
    this.spriteId = spriteId ?? id;
    this.appearance = appearance ? JSON.parse(JSON.stringify(appearance)) : null;
    this.baseAttacks = attacks.map((attack) => ({ ...attack }));
    this.attacks = this.baseAttacks.map((attack) => ({ ...attack }));
    this.baseStats = { ...stats };
    this.progression = progression ? JSON.parse(JSON.stringify(progression)) : null;

    const scaledStats = scaleStatsForProgression(this.baseStats, this.progression);
    this.maxHp = scaledStats.maxHp ?? scaledStats.hp ?? 1;
    this.hp = scaledStats.hp ?? this.maxHp;
    this.maxAp = scaledStats.actionPoints ?? scaledStats.ap ?? 0;
    this.ap = this.maxAp;
    this.moveCost = scaledStats.moveCost ?? 1;

    this.isDead = false;
    this.statuses = [];
    this.facing = 'se';
    // Render state consumed by IsometricRenderer.
    this.render = { state: 'idle', frameIndex: 0, timer: 0 };
    // Sub-tile pixel offset for the stepped glide between cells.
    this.pxOffset = { x: 0, y: 0 };
  }

  get x() {
    return this.position.x;
  }

  get y() {
    return this.position.y;
  }

  moveTo(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  getAttack(attackId) {
    return this.attacks.find((attack) => attack.id === attackId) ?? null;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.isDead = true;
    return this.isDead;
  }

  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }

  refreshProgressionStats() {
    const previousMaxHp = this.maxHp;
    const previousHp = this.hp;
    const previousAp = this.ap;
    const scaledStats = scaleStatsForProgression(this.baseStats, this.progression);

    this.maxHp = scaledStats.maxHp ?? scaledStats.hp ?? 1;
    this.maxAp = scaledStats.actionPoints ?? scaledStats.ap ?? 0;
    this.moveCost = scaledStats.moveCost ?? 1;

    if (this.isDead) {
      this.hp = 0;
    } else {
      const gainedMaxHp = Math.max(0, this.maxHp - previousMaxHp);
      this.hp = Math.max(1, Math.min(this.maxHp, previousHp + gainedMaxHp));
    }
    this.ap = Math.min(previousAp ?? this.maxAp, this.maxAp);
  }

  resetAp() {
    this.ap = this.maxAp;
  }
}
