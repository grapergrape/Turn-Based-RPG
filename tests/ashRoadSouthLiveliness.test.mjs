import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { ASH_ROAD_SOUTH_INSPECTIONS } from '../scripts/content/ash-road-south-inspections.mjs';
import { ASH_ROAD_SOUTH_NPC_ROUTINES } from '../scripts/content/ash-road-south-routines.mjs';
import { SPRITE_POSE_FRAME_COUNTS } from '../src/render/SpriteAtlas.js';
import { getSprite } from '../src/render/spriteCatalog.js';
import {
  NPC_ACTIVITY_MOTIONS,
  NPC_ACTIVITY_RESPONSES,
  NPC_ACTIVITY_SOUNDS,
  activityFrameIndex,
  activityRenderState,
  activitySoundFrame
} from '../src/world/NpcActivity.js';
import { Grid } from '../src/world/Grid.js';
import { findPath } from '../src/world/Pathfinder.js';

const level = JSON.parse(await readFile(new URL('../data/levels/ash_road_south.json', import.meta.url), 'utf8'));
const objectsById = new Map(level.objects.map((object) => [object.id, object]));
const npcsById = new Map(level.spawns.npcs.map((spawn) => [spawn.actor ?? spawn.id, spawn]));
const routineActivities = Object.values(ASH_ROAD_SOUTH_NPC_ROUTINES).flat();
const generatedRoutineActivities = [...npcsById.values()].flatMap((spawn) =>
  (spawn.patrol?.path ?? []).flatMap((point) => point.activity ? [point.activity] : [])
);

assert.equal(Object.keys(ASH_ROAD_SOUTH_NPC_ROUTINES).length, 15, 'fifteen civilians keep authored daily routines');
assert.equal(routineActivities.length, 27, 'the routine pass keeps twenty-seven object-linked work stops');
assert.equal(generatedRoutineActivities.length, 27, 'all work stops survive generation into level data');
assert.deepEqual(
  [...new Set(routineActivities.map((activity) => activity.motion))].sort(),
  ['kneel', 'lift', 'mark', 'pump'],
  'the first motion pass uses all four physical work families'
);
assert.deepEqual(
  [...new Set(routineActivities.map((activity) => activity.sound))].sort(),
  [...NPC_ACTIVITY_SOUNDS].sort(),
  'the work routes exercise all twelve authored one-shot cues'
);

for (const [actorId, routine] of Object.entries(ASH_ROAD_SOUTH_NPC_ROUTINES)) {
  const spawn = npcsById.get(actorId);
  assert.ok(spawn?.patrol, `${actorId} has a generated patrol`);
  const generated = spawn.patrol.path.filter((point) => point.activity).map((point) => point.activity);
  assert.equal(generated.length, routine.length, `${actorId} keeps every work stop`);
}

for (const activity of generatedRoutineActivities) {
  assert.ok(NPC_ACTIVITY_MOTIONS.includes(activity.motion), `${activity.target} uses a known motion`);
  assert.ok(NPC_ACTIVITY_RESPONSES.includes(activity.response), `${activity.target} uses a known prop response`);
  assert.ok(NPC_ACTIVITY_SOUNDS.includes(activity.sound), `${activity.target} uses a known sound`);
  const target = objectsById.get(activity.target);
  assert.ok(target, `${activity.target} resolves to a stable object`);
  assert.equal(typeof getSprite(target.kind)?.drawLiveOverlay, 'function', `${target.kind} exposes a live work-response layer`);
}

assert.equal(SPRITE_POSE_FRAME_COUNTS.workPump, 8);
assert.equal(SPRITE_POSE_FRAME_COUNTS.workMark, 6);
assert.equal(SPRITE_POSE_FRAME_COUNTS.workLift, 8);
assert.equal(SPRITE_POSE_FRAME_COUNTS.workKneel, 6);
assert.equal(activityRenderState({ motion: 'pump' }), 'workPump');
assert.equal(activityFrameIndex({ motion: 'lift' }, 1), 7);
assert.equal(activitySoundFrame({ motion: 'lift', sound: 'crate-shift' }, 2), true);
assert.equal(activitySoundFrame({ motion: 'lift', sound: 'crate-shift' }, 3), false);

assert.equal(level.tableaux.length, 6, 'six recurring multi-NPC tableaux are authored');
const tableauActors = level.tableaux.flatMap((tableau) => tableau.participants.map((entry) => entry.actor));
assert.equal(tableauActors.length, 18, 'the tableaux coordinate eighteen participant roles');
assert.equal(new Set(tableauActors).size, 18, 'each tableau role belongs to a distinct NPC');

const grid = new Grid(level);
for (const object of level.objects) {
  if (object.blocking) grid.addBlocked(object.x, object.y);
}

for (const tableau of level.tableaux) {
  assert.equal(tableau.participants.length, 3, `${tableau.id} has three coordinated participants`);
  assert.equal(tableau.barks.length, 2, `${tableau.id} has two short work barks`);
  assert.ok(findPath(grid, level.spawns.player, tableau.participants[0].slot), `${tableau.id} remains reachable from the arrival road`);
  for (const participant of tableau.participants) {
    assert.ok(npcsById.has(participant.actor), `${participant.actor} resolves to a surface NPC`);
    assert.equal(grid.isWalkable(participant.slot.x, participant.slot.y), true, `${tableau.id} reserves a clear work slot`);
    assert.ok(
      Math.max(
        Math.abs(participant.slot.x - tableau.center.x),
        Math.abs(participant.slot.y - tableau.center.y)
      ) <= 5,
      `${participant.actor} stays inside the shared ${tableau.id} composition`
    );
    const target = objectsById.get(participant.activity.target);
    assert.ok(target, `${participant.activity.target} resolves for ${tableau.id}`);
    assert.equal(
      Math.max(Math.abs(participant.slot.x - target.x), Math.abs(participant.slot.y - target.y)),
      1,
      `${participant.actor} works beside the physical target`
    );
  }
}

assert.equal(level.soundscape.ambientBeds.length, 4, 'four district-scale ambient beds are authored');
assert.deepEqual(
  level.soundscape.ambientBeds.map((bed) => bed.profile).sort(),
  ['freight-yard', 'receiving-canvas', 'rope-rows', 'waterworks']
);
assert.deepEqual([...level.soundscape.activityCues].sort(), [...NPC_ACTIVITY_SOUNDS].sort());
assert.equal(level.soundscape.maxOneShots, 4, 'one-shot polyphony is explicitly bounded');

assert.equal(ASH_ROAD_SOUTH_INSPECTIONS.length, 30, 'thirty new environmental inspections are authored');
const inspectionObjects = ASH_ROAD_SOUTH_INSPECTIONS.map((spec) => objectsById.get(spec.id));
assert.equal(inspectionObjects.every(Boolean), true, 'every authored inspection resolves after generation');
assert.equal(inspectionObjects.every((object) => object.interact?.type === 'note'), true, 'inspections are evidence, not loot containers');
assert.equal(inspectionObjects.every((object) => object.interact?.loot === undefined), true, 'inspection pass adds no incidental loot');
assert.equal(
  inspectionObjects.filter((object) => object.interact?.logVariants?.length > 0).length,
  13,
  'thirteen inspections react to settlement outcome flags'
);
assert.equal(level.objects.filter((object) => object.interact).length, 53, 'the surface now carries fifty-three total interactables');

const compositionIds = [
  'arrival-registry',
  'water-court-issue',
  'freight-loading-bay',
  'old-gate-weighing',
  'compact-screening',
  'charity-linen-court'
];
for (const id of compositionIds) {
  const objects = level.objects.filter((object) => object.id?.startsWith(`ash-road-south-${id}-`));
  assert.equal(objects.length, 6, `${id} contains six deliberately grouped details`);
  assert.ok(objects.filter((object) => object.blocking).length >= 3, `${id} includes functional volume, not only decals`);
  assert.ok(objects.filter((object) => !object.blocking).length >= 2, `${id} includes local wear and handled debris`);
}
assert.equal(level.objects.length, 575, 'the selective density pass remains stable at the reviewed composition count');

console.log('ashRoadSouthLiveliness: all six settlement-life passes and their data contracts passed.');
