// Fixed-initiative turn order for the encounter.
//
// Initiative is the order the actors are handed in (the player, then the Cutthroat,
// then the Penitent). Dead actors are skipped. Each actor's AP refreshes when
// its turn begins.

export class TurnManager {
  constructor() {
    this.order = [];
    this.index = 0;
    this.round = 1;
    this.active = false;
  }

  begin(actors) {
    this.order = actors;
    this.index = 0;
    this.round = 1;
    this.active = true;
    this.current()?.resetAp();
  }

  current() {
    return this.order[this.index] ?? null;
  }

  isPlayerTurn() {
    const actor = this.current();
    return actor?.type === 'player' || actor?.control === 'player';
  }

  // Advance to the next living actor, refreshing its AP. Returns it, or null
  // if no living actor remains.
  endTurn() {
    const living = this.order.filter((actor) => !actor.isDead);
    if (living.length === 0) {
      this.active = false;
      return null;
    }

    for (let step = 0; step < this.order.length; step += 1) {
      this.index = (this.index + 1) % this.order.length;
      if (this.index === 0) this.round += 1;
      const actor = this.current();
      if (actor && !actor.isDead) {
        actor.resetAp();
        return actor;
      }
    }
    return null;
  }
}
