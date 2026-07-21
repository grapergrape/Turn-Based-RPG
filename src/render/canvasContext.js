// Central Canvas 2D context policy for every runtime render surface.
//
// Firefox's accelerated Canvas2D path can wedge the AMDGPU graphics ring on
// this workload. The standards-defined willReadFrequently attribute requests a
// software-backed 2D canvas. We do not read pixels here; the attribute is used
// deliberately so the visible canvas and every raster cache share one stable
// backend instead of copying between software and accelerated surfaces.

export const SOFTWARE_CANVAS_2D_OPTIONS = Object.freeze({
  willReadFrequently: true
});

export function getSoftwareCanvasContext2D(canvas) {
  const ctx = canvas?.getContext?.('2d', SOFTWARE_CANVAS_2D_OPTIONS) ?? null;
  if (ctx) ctx.imageSmoothingEnabled = false;
  return ctx;
}
