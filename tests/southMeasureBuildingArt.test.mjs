import assert from 'node:assert/strict';

import {
  southMeasureBuildingGeometry,
  southMeasureRoofPerimeterEdges
} from '../src/render/primitives/southMeasure.js';

function mixPoint(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t
  ];
}

function roofCourse(geometry, t) {
  return {
    start: mixPoint(geometry.roof.left, geometry.roof.top, t),
    end: mixPoint(geometry.roof.bottom, geometry.roof.right, t)
  };
}

const wallHeights = [34, 36, 37, 40, 42, 43, 48];

for (const wallHeight of wallHeights) {
  const center = southMeasureBuildingGeometry(0, 0, wallHeight);
  const xNeighbor = southMeasureBuildingGeometry(32, 16, wallHeight);
  const yNeighbor = southMeasureBuildingGeometry(-32, 16, wallHeight);

  assert.equal(center.roofLift, wallHeight + 5, `${wallHeight}px wall keeps the five-pixel fascia`);
  for (const point of ['top', 'right', 'bottom', 'left']) {
    assert.equal(
      center.wallTop[point][0],
      center.roof[point][0],
      `${wallHeight}px ${point} roof point has no horizontal offset from its wall cap`
    );
    assert.equal(
      center.wallTop[point][1] - center.roof[point][1],
      5,
      `${wallHeight}px ${point} roof point is lifted by the fascia thickness`
    );
  }

  assert.deepEqual(center.roof.right, xNeighbor.roof.top, `${wallHeight}px x-adjacent roof cells share their upper endpoint`);
  assert.deepEqual(center.roof.bottom, xNeighbor.roof.left, `${wallHeight}px x-adjacent roof cells share their lower endpoint`);
  assert.deepEqual(center.roof.left, yNeighbor.roof.top, `${wallHeight}px y-adjacent roof cells share their upper endpoint`);
  assert.deepEqual(center.roof.bottom, yNeighbor.roof.right, `${wallHeight}px y-adjacent roof cells share their lower endpoint`);

  for (const t of [0.25, 0.5, 0.75]) {
    const course = roofCourse(center, t);
    assert.deepEqual(
      course.end,
      roofCourse(xNeighbor, t).start,
      `${wallHeight}px roof course ${t} continues across the x-axis join`
    );
  }
}

const center = southMeasureBuildingGeometry(0, 0, 36);

assert.deepEqual(
  southMeasureRoofPerimeterEdges(center.roof, { xMinus: true }).map((edge) => edge.side),
  ['yMinus', 'yPlus', 'xPlus'],
  'an x-minus neighbor must suppress the top-left shared roof edge'
);
assert.deepEqual(
  southMeasureRoofPerimeterEdges(center.roof, { yMinus: true }).map((edge) => edge.side),
  ['xMinus', 'yPlus', 'xPlus'],
  'a y-minus neighbor must suppress the top-right shared roof edge'
);
assert.deepEqual(
  southMeasureRoofPerimeterEdges(center.roof, { xMinus: true, xPlus: true, yMinus: true, yPlus: true }),
  [],
  'an interior roof cell must draw no perimeter edges'
);

console.log('southMeasureBuildingArt: fascia, roof courses, shared geometry, and edge ownership passed.');
