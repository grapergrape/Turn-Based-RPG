// Resolves attacks and the win/lose condition. Returns plain results that the
// game loop turns into log lines, animation states, and visual effects. It
// never draws anything itself.

import { isRangedAttack } from './AttackMode.js';

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

    const hit = options.hit !== false;
    const chanceInfo = chanceSummary(options);
    const tags = Array.isArray(options.chanceTags) ? options.chanceTags : [];
    const damageTags = Array.isArray(options.damageTags) ? options.damageTags : [];
    const ranged = isRangedAttack(attack);

    if (!hit) {
      return {
        logs: [
          `${attackPrefix(attacker, attack, options)} missed.${chanceInfo}${tagSummary(tags)}`
        ],
        effect: {
          type: 'miss',
          x: target.position.x,
          y: target.position.y,
          age: 0,
          text: 'MISS'
        }
      };
    }

    const multiplier = Number.isFinite(options.damageMultiplier) ? options.damageMultiplier : 1;
    const damage = Number.isFinite(options.damage)
      ? Math.max(0, Math.round(options.damage))
      : Math.max(0, Math.round(attack.damage * multiplier));
    const killed = target.takeDamage(damage);
    target.render.state = killed ? 'dead' : 'hit';
    target.render.timer = 0;

    const effect = {
      type: ranged ? 'muzzle' : 'slash',
      x: target.position.x,
      y: target.position.y,
      age: 0,
      text: `-${damage}`
    };

    const logs = [
      `${attackPrefix(attacker, attack, options)} hit.${chanceInfo}${tagSummary([...tags, ...damageTags])} ${damage} damage to ${target.name}.`
    ];
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

function attackPrefix(attacker, attack, options) {
  if (options.opening === 'sneak') return 'Sneak attack';
  return `${possessive(attacker.name)} ${attack.name}`;
}

function chanceSummary(options) {
  if (!Number.isFinite(options.chance) || !Number.isFinite(options.roll)) return '';
  return ` Chance ${Math.round(options.chance)}%, roll ${Math.round(options.roll)}.`;
}

function tagSummary(tags) {
  const cleaned = tags
    .map((tag) => sentenceCase(tag))
    .filter(Boolean);
  if (cleaned.length === 0) return '';
  return ` ${cleaned.join('. ')}.`;
}

function sentenceCase(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return '';
  return text[0].toUpperCase() + text.slice(1);
}

function possessive(name) {
  const text = String(name ?? 'Attacker');
  return text.endsWith('s') ? `${text}'` : `${text}'s`;
}
