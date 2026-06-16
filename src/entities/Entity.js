export class Entity {
  constructor({ id, name, type, faction = null, stats = {}, position = { x: 0, y: 0 }, tags = [] }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.faction = faction;
    this.stats = { ...stats };
    this.position = { ...position };
    this.tags = [...tags];
  }

  moveBy(delta) {
    this.position.x += delta.x;
    this.position.y += delta.y;
  }
}
