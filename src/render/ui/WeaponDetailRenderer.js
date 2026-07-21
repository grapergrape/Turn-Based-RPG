import { PALETTE } from '../palette.js';

export function buildWeaponDetailRows(item = {}) {
  const attacks = Array.isArray(item.attackModes) ? item.attackModes : [];
  if (!attacks.length) return [];

  const rows = [];
  const capacity = finiteWhole(item.magazineCapacity);
  if (item.ammoName || item.ammoFamily || capacity != null) {
    const ammoName = item.ammoName || humanizeId(item.ammoFamily) || 'Ammunition';
    const parts = [`AMMO: ${ammoName}`];
    const loaded = finiteWhole(item.loaded);
    if (capacity != null) parts.push(loaded == null ? `MAG ${capacity}` : `LOADED ${loaded}/${capacity}`);
    const reserve = finiteWhole(item.reserveAmmo);
    if (reserve != null) parts.push(`RESERVE ${reserve}`);
    const reloadAp = finiteWhole(item.reloadAp);
    if (reloadAp != null) parts.push(`RELOAD ${reloadAp} AP`);
    rows.push({ kind: 'ammo', text: parts.join('  ') });
  }

  for (const [index, attack] of attacks.entries()) {
    const damage = finiteWhole(attack.damage) ?? 0;
    const baseDamage = finiteWhole(attack.baseDamage);
    const damageText = baseDamage != null && baseDamage !== damage
      ? `DMG ${damage} BASE ${baseDamage}`
      : `DMG ${damage}`;
    const parts = [
      damageText,
      `${finiteWhole(attack.apCost) ?? 0} AP`,
      `RANGE ${finiteWhole(attack.range) ?? 0}`,
      `ACC ${signedWhole(attack.accuracyBonus)}%`
    ];
    const ammoCost = finiteWhole(attack.ammoCost);
    if (ammoCost) parts.push(`USES ${ammoCost}`);
    if (attack.requiresStationary) parts.push('STATIONARY');
    rows.push({
      kind: 'attack',
      text: `${attack.name ?? `Attack ${index + 1}`}: ${parts.join('  ')}`
    });
  }

  return rows;
}

export function drawWeaponDetailRows(ctx, item, options, tools) {
  const maxRows = Math.max(0, Math.floor(Number(options.maxRows) || 0));
  let y = options.y;
  for (const row of buildWeaponDetailRows(item).slice(0, maxRows)) {
    const color = row.kind === 'ammo' ? PALETTE.uiWarn : PALETTE.uiText;
    tools.text(ctx, tools.clip(row.text, options.maxChars), options.x, y, color);
    y += 9;
  }
  return y;
}

function finiteWhole(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
}

function signedWhole(value) {
  const number = Number.isFinite(value) ? Math.round(value) : 0;
  return number > 0 ? `+${number}` : String(number);
}

function humanizeId(value) {
  return typeof value === 'string' ? value.replace(/-/g, ' ') : '';
}
