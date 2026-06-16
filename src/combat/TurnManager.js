export class TurnManager {
  constructor() {
    this.turnNumber = 1;
    this.activeSide = 'player';
  }

  endTurn() {
    if (this.activeSide === 'player') {
      this.activeSide = 'enemy';
      return;
    }

    this.activeSide = 'player';
    this.turnNumber += 1;
  }

  isPlayerTurn() {
    return this.activeSide === 'player';
  }
}
