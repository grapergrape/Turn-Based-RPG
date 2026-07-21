import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  ACCELERATOR_WEAPONS,
  AMMUNITION_FAMILIES,
  BALLISTIC_LONG_GUNS,
  BALLISTIC_PISTOLS,
  buildAmmoItem,
  buildWeaponItem,
  MELEE_WEAPONS,
  WEAPON_CATALOG
} from './content/weapon-catalog-content.mjs';

const root = process.cwd();
const itemDir = join(root, 'data', 'items');
const catalogDir = join(root, 'data', 'catalogs');

await mkdir(itemDir, { recursive: true });
await mkdir(catalogDir, { recursive: true });

for (const [index, seed] of WEAPON_CATALOG.entries()) {
  await writeJson(join(itemDir, `${seed.id}.json`), buildWeaponItem(seed, index));
}

const ammunition = AMMUNITION_FAMILIES.map(buildAmmoItem);
for (const item of ammunition) {
  await writeJson(join(itemDir, `${item.id}.json`), item);
}

await writeJson(join(catalogDir, 'weapons.json'), {
  counts: {
    ballisticLongGuns: BALLISTIC_LONG_GUNS.length,
    ballisticPistols: BALLISTIC_PISTOLS.length,
    accelerators: ACCELERATOR_WEAPONS.length,
    melee: MELEE_WEAPONS.length,
    total: WEAPON_CATALOG.length
  },
  groups: {
    ballisticLongGuns: BALLISTIC_LONG_GUNS.map((entry) => entry.id),
    ballisticPistols: BALLISTIC_PISTOLS.map((entry) => entry.id),
    accelerators: ACCELERATOR_WEAPONS.map((entry) => entry.id),
    melee: MELEE_WEAPONS.map((entry) => entry.id)
  },
  ammunition: Object.fromEntries(ammunition.map((item) => [item.ammo.family, item.id])),
  actOne: [
    'censure-sidearm', 'censure-knife', 'ash-road-carbine', 'parish-ward-pistol',
    'iron-vow-revolver', 'pilgrim-break-shotgun', 'remnant-service-rifle',
    'cinder-watch-submachine-gun', 'chapel-breaching-axe', 'ash-road-knife',
    'censer-sabre', 'pilgrim-mace', 'processional-pike', 'trench-shovel',
    'gatewarden-falchion', 'penitent-coil-sidearm', 'penitent-engine-carbine',
    'vesper-armature-pistol', 'confessor-rail-rifle', 'bastion-spike-driver'
  ]
});

await writeJson(join(catalogDir, 'ammunition.json'), {
  families: Object.fromEntries(ammunition.map((item) => [item.ammo.family, item.id]))
});

console.log(`Generated ${WEAPON_CATALOG.length} weapons and ${ammunition.length} ammunition items.`);

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
