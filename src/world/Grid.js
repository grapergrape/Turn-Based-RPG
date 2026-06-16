export class Grid {
  constructor(mapData) {
    this.id = mapData.id;
    this.name = mapData.name;
    this.width = mapData.width;
    this.height = mapData.height;
    this.tileSize = mapData.tileSize;
    this.tiles = mapData.tiles;
    this.legend = mapData.legend;
  }

  isInside(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getTileChar(x, y) {
    if (!this.isInside(x, y)) return null;
    return this.tiles[y][x];
  }

  getTileDef(x, y) {
    const tileChar = this.getTileChar(x, y);
    if (tileChar === null) return null;
    return this.legend[tileChar] ?? null;
  }

  isWalkable(x, y) {
    const tile = this.getTileDef(x, y);
    return Boolean(tile?.walkable);
  }
}
