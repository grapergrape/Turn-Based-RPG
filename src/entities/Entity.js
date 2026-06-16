// A single actor in the world (player or enemy).
//
// Holds position, combat stats, the equipped attacks, and lightweight render
// state (animation name/frame and a sub-tile pixel offset used for stepped
// movement). Systems mutate this; it contains no rendering or rule logic.

export class Entity {
  constructor({
    id,
    name,
    type,
    faction = null,
    stats = {},
    position = { x: 0, y: 0 },
    tags = [],
    spriteId = null,
    attacks = []
  }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.faction = faction;
    this.tags = [...tags];
    this.position = { ...position };
    this.spriteId = spriteId ?? id;
    this.attacks = attacks.map((attack) => ({ ...attack }));

    this.maxHp = stats.maxHp ?? stats.hp ?? 1;
    this.hp = stats.hp ?? this.maxHp;
    this.maxAp = stats.actionPoints ?? stats.ap ?? 0;
    this.ap = this.maxAp;
    this.moveCost = stats.moveCost ?? 1;

    this.isDead = false;
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

  resetAp() {
    this.ap = this.maxAp;
  }
}
