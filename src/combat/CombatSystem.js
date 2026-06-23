// Resolves attacks and the win/lose condition. Returns plain results that the
// game loop turns into log lines, animation states, and visual effects. It
// never draws anything itself.

export function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Chebyshev distance: the natural "tiles away" measure for 8-direction
// movement, so diagonals count as one tile (melee range 1 reaches diagonals).
export function chebyshev(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export class CombatSystem {
  // Can `attacker` hit `target` with `attack` from its current tile?
  canAttack(attacker, target, attack) {
    if (!attack || target.isDead) return false;
    if (attacker.ap < attack.apCost) return false;
    return chebyshev(attacker.position, target.position) <= attack.range;
  }

  // Apply an attack. Returns { logs, effect } describing what happened.
  performAttack(attacker, target, attack, options = {}) {
    if (options.spendAp !== false) attacker.ap -= attack.apCost;
    attacker.render.state = 'attack';
    attacker.render.timer = 0;

    const multiplier = Number.isFinite(options.damageMultiplier) ? options.damageMultiplier : 1;
    const damage = Math.max(0, Math.round(attack.damage * multiplier));
    const killed = target.takeDamage(damage);
    target.render.state = killed ? 'dead' : 'hit';
    target.render.timer = 0;

    const ranged = attack.range > 1;
    const effect = {
      type: ranged ? 'muzzle' : 'slash',
      x: target.position.x,
      y: target.position.y,
      age: 0,
      text: `-${damage}`
    };

    const verb = ranged ? 'fires' : 'strikes';
    const logs = options.opening === 'sneak'
      ? [`Sneak attack: ${attacker.name} ${verb} for ${damage} damage to ${target.name}.`]
      : [`${attacker.name} ${verb}: ${damage} damage to ${target.name}.`];
    if (killed) logs.push(`${target.name} falls.`);

    return { logs, effect };
  }

  // 'victory' (all enemies dead), 'defeat' (player dead), or null.
  outcome(player, enemies) {
    if (player.isDead) return 'defeat';
    if (enemies.every((enemy) => enemy.isDead)) return 'victory';
    return null;
  }
}
