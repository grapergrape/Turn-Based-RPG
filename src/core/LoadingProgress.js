export function clampLoadingProgress(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function mapLoadingProgress(value, start = 0, end = 1) {
  const s = clampLoadingProgress(start);
  const e = clampLoadingProgress(end);
  return clampLoadingProgress(s + (e - s) * clampLoadingProgress(value));
}

export function loadingPercent(value) {
  return `${Math.round(clampLoadingProgress(value) * 100)}%`;
}

export function normalizeLoadingState(state = {}) {
  const progress = clampLoadingProgress(state.progress ?? state.value ?? 0);
  const message = cleanLoadingText(state.message ?? state.label ?? 'Loading');
  const detail = cleanLoadingText(state.detail ?? '');
  return {
    progress,
    message: message || 'Loading',
    detail
  };
}

function cleanLoadingText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}
