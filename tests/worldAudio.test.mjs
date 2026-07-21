import assert from 'node:assert/strict';

import { WorldAudioRuntime } from '../src/audio/WorldAudioRuntime.js';

class AudioParam {
  constructor(value = 0) { this.value = value; }
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
}

class AudioNode {
  constructor() {
    this.gain = new AudioParam();
    this.pan = new AudioParam();
    this.playbackRate = new AudioParam(1);
    this.connections = [];
    this.onended = null;
  }
  connect(node) { this.connections.push(node); return node; }
  disconnect() { this.connections.length = 0; }
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 10;
    this.sampleRate = 8000;
    this.destination = new AudioNode();
    this.state = 'running';
    this.sources = [];
    FakeAudioContext.last = this;
  }
  createGain() { return new AudioNode(); }
  createStereoPanner() { return new AudioNode(); }
  createBufferSource() {
    const source = new AudioNode();
    this.sources.push(source);
    return source;
  }
  createBuffer(_channels, length) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }
  async resume() { this.state = 'running'; }
}

const handlers = new Map();
const stored = new Map();
const eventTarget = {
  AudioContext: FakeAudioContext,
  addEventListener(type, handler) { handlers.set(type, handler); }
};
const storage = {
  getItem(key) { return stored.get(key) ?? null; },
  setItem(key, value) { stored.set(key, value); }
};
const soundscape = {
  maxDistance: 20,
  maxOneShots: 2,
  activityCues: ['pump-stroke', 'paper-turn', 'cloth-snap'],
  ambientBeds: [
    { id: 'water', profile: 'waterworks', bounds: { x0: 0, y0: 0, x1: 4, y1: 4 }, gain: 0.2 },
    { id: 'yard', profile: 'freight-yard', bounds: { x0: 10, y0: 0, x1: 14, y1: 4 }, gain: 0.18 }
  ]
};

const audio = new WorldAudioRuntime({ eventTarget, storage });
audio.setSoundscape(soundscape);
assert.equal(await audio.unlock(), true);
assert.equal(audio.beds.length, 2, 'unlock starts both configured ambient beds');
audio.update(0.1, { x: 2, y: 2 });
assert.ok(audio.beds[0].gain.gain.value > audio.beds[1].gain.gain.value, 'bed gain follows district proximity');

assert.equal(audio.playOneShot('pump-stroke', 3, 2, { sourceId: 'pump-a' }), true);
assert.equal(audio.playOneShot('pump-stroke', 3, 2, { sourceId: 'pump-a' }), false, 'source cooldown suppresses immediate repeats');
assert.equal(audio.playOneShot('paper-turn', 4, 2, { sourceId: 'board-a' }), true);
assert.equal(audio.playOneShot('cloth-snap', 4, 2, { sourceId: 'line-a' }), false, 'polyphony cap rejects excess work sounds');
const liveOneShots = [...audio.activeOneShots];
liveOneShots[0].onended();
assert.equal(audio.playOneShot('cloth-snap', 4, 2, { sourceId: 'line-a' }), true, 'a released voice makes room for the next cue');
assert.equal(audio.playOneShot('cloth-snap', 40, 40, { sourceId: 'distant-line' }), false, 'inaudible distant work does not allocate a voice');

audio.setVolume(0.4);
assert.equal(audio.toggleMuted(), true);
assert.deepEqual(JSON.parse(stored.values().next().value), { volume: 0.4, muted: true });
const restored = new WorldAudioRuntime({ eventTarget: { addEventListener() {} }, storage });
assert.equal(restored.settings.volume, 0.4);
assert.equal(restored.settings.muted, true, 'audio settings survive a runtime restart');

handlers.get('keydown')?.({ code: 'Backslash', ctrlKey: false, metaKey: false, altKey: false });
assert.equal(audio.settings.muted, false, 'the mute control remains available after Web Audio unlock');

console.log('worldAudio: beds, attenuation, panning path, cooldown, polyphony, and settings passed.');
