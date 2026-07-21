// Dependency-free Web Audio soundscape for world ambience and short physical
// activity cues. Sound profiles stay generic; level data decides where they
// exist and which authored activity emits each cue.

const STORAGE_KEY = 'vale-imprint.audio.v1';
const DEFAULT_VOLUME = 0.68;
const DEFAULT_MAX_DISTANCE = 18;
const DEFAULT_MAX_ONE_SHOTS = 4;

const CUE_RECIPES = Object.freeze({
  'chalk-scratch': { duration: 0.16, frequency: 1800, tone: 0.03, noise: 0.42, clicks: 5, decay: 12 },
  'paper-turn': { duration: 0.22, frequency: 760, tone: 0.02, noise: 0.34, clicks: 2, decay: 8 },
  'cup-set': { duration: 0.18, frequency: 920, tone: 0.34, noise: 0.08, clicks: 2, decay: 15 },
  'water-pour': { duration: 0.34, frequency: 240, tone: 0.04, noise: 0.32, clicks: 7, decay: 5 },
  'pump-stroke': { duration: 0.28, frequency: 118, tone: 0.3, noise: 0.13, clicks: 2, decay: 7 },
  'metal-scrape': { duration: 0.3, frequency: 410, tone: 0.2, noise: 0.28, clicks: 4, decay: 5 },
  'tool-tap': { duration: 0.14, frequency: 1260, tone: 0.42, noise: 0.08, clicks: 1, decay: 20 },
  'hoist-chain': { duration: 0.38, frequency: 540, tone: 0.28, noise: 0.16, clicks: 6, decay: 7 },
  'crate-shift': { duration: 0.3, frequency: 92, tone: 0.24, noise: 0.22, clicks: 3, decay: 8 },
  'scale-clack': { duration: 0.2, frequency: 680, tone: 0.38, noise: 0.1, clicks: 2, decay: 13 },
  'cloth-snap': { duration: 0.2, frequency: 360, tone: 0.03, noise: 0.42, clicks: 2, decay: 10 },
  'burner-tick': { duration: 0.16, frequency: 1480, tone: 0.32, noise: 0.12, clicks: 3, decay: 17 }
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rngFor(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function distanceToBounds(point, bounds) {
  if (!point || !bounds) return Number.POSITIVE_INFINITY;
  const dx = point.x < bounds.x0 ? bounds.x0 - point.x : point.x > bounds.x1 ? point.x - bounds.x1 : 0;
  const dy = point.y < bounds.y0 ? bounds.y0 - point.y : point.y > bounds.y1 ? point.y - bounds.y1 : 0;
  return Math.hypot(dx, dy);
}

function safeStorage(target) {
  try {
    return target?.localStorage ?? null;
  } catch {
    return null;
  }
}

export class WorldAudioRuntime {
  constructor({ eventTarget = globalThis.window ?? null, storage = null } = {}) {
    this.eventTarget = eventTarget;
    this.storage = storage ?? safeStorage(eventTarget);
    this.context = null;
    this.master = null;
    this.soundscape = null;
    this.beds = [];
    this.activeOneShots = new Set();
    this.cooldowns = new Map();
    this.sequence = 0;
    this.playerPosition = null;
    this.paused = false;
    this.unlocked = false;
    this.volume = DEFAULT_VOLUME;
    this.muted = false;
    this.#loadSettings();
    this.#installControls();
  }

  get settings() {
    return { volume: this.volume, muted: this.muted, unlocked: this.unlocked };
  }

  setSoundscape(soundscape) {
    this.#stopBeds();
    this.soundscape = soundscape ?? null;
    if (this.unlocked) this.#startBeds();
  }

  async unlock() {
    if (this.unlocked && this.context) {
      if (this.context.state === 'suspended') await this.context.resume?.();
      return true;
    }
    const AudioContextClass = this.eventTarget?.AudioContext ?? this.eventTarget?.webkitAudioContext ?? globalThis.AudioContext;
    if (typeof AudioContextClass !== 'function') return false;
    try {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.unlocked = true;
      this.#applyMasterGain(true);
      if (this.context.state === 'suspended') await this.context.resume?.();
      this.#startBeds();
      return true;
    } catch {
      this.context = null;
      this.master = null;
      this.unlocked = false;
      return false;
    }
  }

  update(_dt, playerPosition, { paused = false } = {}) {
    this.playerPosition = playerPosition ? { x: playerPosition.x, y: playerPosition.y } : null;
    this.paused = Boolean(paused);
    if (!this.context || !this.unlocked) return;
    const now = this.context.currentTime;
    const maxDistance = this.soundscape?.maxDistance ?? DEFAULT_MAX_DISTANCE;
    for (const bed of this.beds) {
      const distance = distanceToBounds(this.playerPosition, bed.definition.bounds);
      const proximity = clamp(1 - distance / maxDistance, 0, 1);
      const pauseScale = this.paused ? 0.32 : 1;
      const gain = (bed.definition.gain ?? 0.2) * proximity * proximity * pauseScale;
      bed.gain.gain.setTargetAtTime(gain, now, 0.14);
    }
  }

  playOneShot(cue, x, y, { sourceId = 'world' } = {}) {
    if (!this.context || !this.unlocked || this.muted || this.volume <= 0) return false;
    if (!this.soundscape?.activityCues?.includes?.(cue)) return false;
    const recipe = CUE_RECIPES[cue];
    if (!recipe) return false;
    const maxVoices = this.soundscape.maxOneShots ?? DEFAULT_MAX_ONE_SHOTS;
    if (this.activeOneShots.size >= maxVoices) return false;

    const now = this.context.currentTime;
    const cooldownKey = `${sourceId}:${cue}`;
    if ((this.cooldowns.get(cooldownKey) ?? 0) > now) return false;
    this.cooldowns.set(cooldownKey, now + 0.12);

    const maxDistance = this.soundscape.maxDistance ?? DEFAULT_MAX_DISTANCE;
    const dx = x - (this.playerPosition?.x ?? x);
    const dy = y - (this.playerPosition?.y ?? y);
    const distance = Math.hypot(dx, dy);
    const attenuation = clamp(1 - distance / maxDistance, 0, 1);
    if (attenuation <= 0) return false;

    const seed = stableHash(`${cue}:${sourceId}:${this.sequence++}`);
    const source = this.context.createBufferSource();
    source.buffer = this.#createCueBuffer(recipe, seed);
    source.playbackRate.value = 0.94 + (seed % 13) / 100;
    const gain = this.context.createGain();
    gain.gain.value = attenuation * attenuation * 0.34;
    source.connect(gain);

    let tail = gain;
    if (typeof this.context.createStereoPanner === 'function') {
      const panner = this.context.createStereoPanner();
      panner.pan.value = clamp(dx / Math.max(1, maxDistance * 0.7), -0.75, 0.75);
      gain.connect(panner);
      tail = panner;
    }
    tail.connect(this.master);
    this.activeOneShots.add(source);
    source.onended = () => {
      this.activeOneShots.delete(source);
      source.disconnect?.();
      gain.disconnect?.();
      if (tail !== gain) tail.disconnect?.();
    };
    source.start(now);
    return true;
  }

  setVolume(value) {
    this.volume = clamp(Number(value) || 0, 0, 1);
    this.#applyMasterGain();
    this.#saveSettings();
    return this.volume;
  }

  toggleMuted() {
    this.muted = !this.muted;
    this.#applyMasterGain();
    this.#saveSettings();
    return this.muted;
  }

  #installControls() {
    const target = this.eventTarget;
    if (!target?.addEventListener) return;
    const unlock = () => { void this.unlock(); };
    target.addEventListener('pointerdown', unlock, { passive: true });
    target.addEventListener('touchstart', unlock, { passive: true });
    target.addEventListener('keydown', (event) => {
      void this.unlock();
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === 'Backslash') {
        this.toggleMuted();
      } else if (event.code === 'BracketLeft') {
        this.setVolume(this.volume - 0.1);
      } else if (event.code === 'BracketRight') {
        this.setVolume(this.volume + 0.1);
      }
    });
  }

  #loadSettings() {
    try {
      const saved = JSON.parse(this.storage?.getItem?.(STORAGE_KEY) ?? 'null');
      if (Number.isFinite(saved?.volume)) this.volume = clamp(saved.volume, 0, 1);
      if (typeof saved?.muted === 'boolean') this.muted = saved.muted;
    } catch {
      // Corrupt or unavailable browser storage falls back to conservative audio.
    }
  }

  #saveSettings() {
    try {
      this.storage?.setItem?.(STORAGE_KEY, JSON.stringify({ volume: this.volume, muted: this.muted }));
    } catch {
      // Audio remains usable when storage is disabled.
    }
  }

  #applyMasterGain(immediate = false) {
    if (!this.master || !this.context) return;
    const value = this.muted ? 0 : this.volume;
    if (immediate) this.master.gain.setValueAtTime(value, this.context.currentTime);
    else this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.035);
  }

  #startBeds() {
    if (!this.context || !this.master || !this.soundscape) return;
    this.#stopBeds();
    for (const definition of this.soundscape.ambientBeds ?? []) {
      const source = this.context.createBufferSource();
      source.buffer = this.#createBedBuffer(definition.profile, stableHash(definition.id));
      source.loop = true;
      const gain = this.context.createGain();
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(this.master);
      source.start();
      this.beds.push({ definition, source, gain });
    }
  }

  #stopBeds() {
    for (const bed of this.beds) {
      try { bed.source.stop(); } catch {}
      bed.source.disconnect?.();
      bed.gain.disconnect?.();
    }
    this.beds = [];
  }

  #createBedBuffer(profile, seed) {
    const sampleRate = this.context.sampleRate;
    const duration = 5.6;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    const random = rngFor(seed);
    let lowNoise = 0;
    for (let index = 0; index < length; index += 1) {
      const time = index / sampleRate;
      lowNoise = lowNoise * 0.985 + (random() * 2 - 1) * 0.015;
      let sample = lowNoise * 0.22;
      if (profile === 'waterworks') {
        sample += Math.sin(time * Math.PI * 2 * 47) * 0.025;
        const drip = (time * 1.7 + 0.2) % 1;
        if (drip < 0.018) sample += Math.sin(time * Math.PI * 2 * 820) * (1 - drip / 0.018) * 0.15;
      } else if (profile === 'freight-yard') {
        sample += Math.sin(time * Math.PI * 2 * 63) * 0.018;
        const knock = (time * 0.82 + 0.53) % 1;
        if (knock < 0.012) sample += Math.sin(time * Math.PI * 2 * 430) * (1 - knock / 0.012) * 0.17;
      } else if (profile === 'receiving-canvas') {
        sample += Math.sin(time * Math.PI * 2 * 31) * 0.012;
        const flap = (time * 0.56 + 0.18) % 1;
        if (flap < 0.045) sample += (random() * 2 - 1) * (1 - flap / 0.045) * 0.12;
      } else if (profile === 'rope-rows') {
        sample += Math.sin(time * Math.PI * 2 * 38) * 0.014;
        if (random() > 0.9982) sample += (random() * 2 - 1) * 0.15;
      }
      const edge = Math.min(1, index / (sampleRate * 0.08), (length - index - 1) / (sampleRate * 0.08));
      data[index] = clamp(sample * edge, -0.4, 0.4);
    }
    return buffer;
  }

  #createCueBuffer(recipe, seed) {
    const sampleRate = this.context.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * recipe.duration));
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    const random = rngFor(seed);
    let filteredNoise = 0;
    for (let index = 0; index < length; index += 1) {
      const time = index / sampleRate;
      const progress = index / length;
      const envelope = Math.exp(-progress * recipe.decay);
      filteredNoise = filteredNoise * 0.58 + (random() * 2 - 1) * 0.42;
      let sample = Math.sin(time * Math.PI * 2 * recipe.frequency) * recipe.tone;
      sample += filteredNoise * recipe.noise;
      if (recipe.clicks > 0) {
        const clickPhase = (progress * recipe.clicks) % 1;
        if (clickPhase < 0.08) sample += (1 - clickPhase / 0.08) * 0.24;
      }
      data[index] = clamp(sample * envelope, -0.85, 0.85);
    }
    return buffer;
  }
}
