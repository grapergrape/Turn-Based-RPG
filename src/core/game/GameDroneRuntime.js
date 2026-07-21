import { chebyshev } from '../../combat/CombatSystem.js';
import {
  DRONE_DEFINITION_ID,
  DRONE_REGISTRATION_FLAGS,
  DRONE_SERVICE_ITEM_ID,
  applyCompanionUpgrades,
  applyDroneNameInput,
  awardCompanionLevelPoints,
  companionBranchRating,
  companionNodeState,
  createCompanionEntity,
  createCompanionRunState,
  hasCompanionUpgrade,
  normalizeCompanionRunState,
  normalizeDroneName,
  purchaseCompanionUpgrade,
  rebootCompanion,
  recruitCompanionState,
  snapshotCompanionEntity
} from '../../companions/CompanionSystem.js';
import { gridToScreen, screenFacing } from '../../render/isoMath.js';
import { normalizeProgression } from '../Progression.js';
import {
  SUSPICION_SEVERITY,
  SUSPICION_STATES,
  suspicionStateRank
} from '../../world/PerceptionSystem.js';
import { installGameMethods } from './installGameMethods.js';
import { SPRINT_STEP_DURATION, STEP_DURATION, WALK_FRAMES } from './runtimeConstants.js';

const SHRINE_MODELS = Object.freeze([
  Object.freeze({ id: 'dominion-siege-mark-x', name: 'Dominion Siege Drone Mark X' }),
  Object.freeze({ id: 'palatine-combat-mark-vi', name: 'Palatine Combat Drone Mark VI' }),
  Object.freeze({ id: DRONE_DEFINITION_ID, name: 'Utility Drone Mark I' })
]);

const MODEL_FAILURES = Object.freeze({
  'dominion-siege-mark-x': 'ACTIVATION FAILED. THIS SITE HAS NO SIEGE CRADLE.',
  'palatine-combat-mark-vi': 'ACTIVATION FAILED. REMOTE CRADLE EMPTY.'
});

class GameDroneRuntime {
  _initializeCompanionRun(previousState = null) {
    this.companionDefs = this.level?.companionDefs ?? this.companionDefs ?? {};
    this.companionRun = normalizeCompanionRunState(previousState ?? createCompanionRunState());
    this.companions = [];
    this.companionFollowMotion = null;
    this.droneShrine = null;
    this.journalDroneBranchIndex = 0;
    this.journalDroneNodeIndex = 0;
    this.journalDroneConfirm = null;
    this.combatDeployables = [];
    this._awardCurrentCompanionLevelPoints({ log: false });
    this._spawnRunCompanion();
  }

  _snapshotCompanionRunState() {
    const actor = this._activeCompanion();
    this.companionRun = snapshotCompanionEntity(this.companionRun, actor);
    return JSON.parse(JSON.stringify(this.companionRun));
  }

  _companionDefinition() {
    const id = this.companionRun?.definitionId ?? DRONE_DEFINITION_ID;
    return this.companionDefs?.[id] ?? null;
  }

  _activeCompanion() {
    return (this.companions ?? []).find((actor) => !actor.removed) ?? null;
  }

  _activeControlledActor() {
    if (this.mode === 'combat') {
      const current = this.turnManager?.current?.();
      if (current?.type === 'player' || current?.control === 'player') return current;
    }
    return this.player;
  }

  _spawnRunCompanion(preferredCell = null) {
    if (!this.companionRun?.recruited || !this.player || !this.grid) return null;
    const definition = this._companionDefinition();
    if (!definition) return null;
    const position = this._findCompanionCell(preferredCell ?? this.player.position);
    if (!position) return null;
    const actor = createCompanionEntity(definition, this.companionRun, position, this.player);
    if (!actor) return null;
    this.companions = [actor];
    return actor;
  }

  _findCompanionCell(origin, { allowOrigin = false, nearestTo = null } = {}) {
    if (!origin || !this.grid) return null;
    const offsets = [
      { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 },
      { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }
    ];
    if (allowOrigin) offsets.push({ x: 0, y: 0 });
    const candidates = [];
    for (const [order, offset] of offsets.entries()) {
      const x = origin.x + offset.x;
      const y = origin.y + offset.y;
      if (!this.grid.isInside(x, y) || !this.grid.isWalkable(x, y) || this._isCellHidden?.(x, y)) continue;
      if (this._isOccupied?.(x, y, null)) continue;
      candidates.push({ x, y, order });
    }
    if (nearestTo) {
      candidates.sort((a, b) =>
        chebyshev(a, nearestTo) - chebyshev(b, nearestTo) ||
        manhattanDistance(a, nearestTo) - manhattanDistance(b, nearestTo) ||
        a.order - b.order
      );
    }
    const cell = candidates[0];
    return cell ? { x: cell.x, y: cell.y } : null;
  }

  _syncCompanionFollow() {
    if (this.mode !== 'explore') return false;
    const companion = this._activeCompanion();
    if (!companion || companion.isDead || !this.player) return false;
    const distance = chebyshev(companion.position, this.player.position);
    if (distance <= 1) return false;
    const cell = this._findCompanionCell(this.player.position, { nearestTo: companion.position });
    if (!cell) return false;
    return this._beginCompanionFollowMotion(companion, cell, {
      duration: this.player.pendingSuspicionSeverity === SUSPICION_SEVERITY.HIGH
        ? SPRINT_STEP_DURATION
        : STEP_DURATION
    });
  }

  _beginCompanionFollowMotion(companion, cell, { duration = STEP_DURATION } = {}) {
    if (!companion || !cell) return false;
    const previous = { ...companion.position };
    const previousScreen = gridToScreen(previous.x, previous.y, 0);
    const visibleStart = {
      x: previousScreen.x + (companion.pxOffset?.x ?? 0),
      y: previousScreen.y + (companion.pxOffset?.y ?? 0)
    };
    const destinationScreen = gridToScreen(cell.x, cell.y, 0);

    companion.facing = screenFacing(cell.x - previous.x, cell.y - previous.y);
    companion.moveTo(cell.x, cell.y);
    companion.pxOffset = {
      x: Math.round(visibleStart.x - destinationScreen.x),
      y: Math.round(visibleStart.y - destinationScreen.y)
    };
    companion.render.state = 'walk';
    companion.render.frameIndex = 0;
    companion.render.timer = 0;
    this.companionFollowMotion = {
      actor: companion,
      t: 0,
      duration,
      fromX: companion.pxOffset.x,
      fromY: companion.pxOffset.y
    };
    return true;
  }

  _advanceCompanionFollow(dt) {
    const motion = this.companionFollowMotion;
    if (!motion) return false;
    const actor = motion.actor;
    if (!actor || actor.isDead || actor.removed) {
      this._cancelCompanionFollowMotion(actor);
      return false;
    }
    if (this.moving?.actor === actor) {
      this.companionFollowMotion = null;
      return false;
    }

    const duration = Math.max(0.001, motion.duration ?? STEP_DURATION);
    motion.t = Math.min((motion.t ?? 0) + (Math.max(0, dt) / duration), 1);
    const frameIndex = Math.min(WALK_FRAMES - 1, Math.floor(motion.t * WALK_FRAMES));
    const visualRatio = motion.t >= 1 ? 1 : frameIndex / WALK_FRAMES;
    actor.pxOffset = {
      x: Math.round(motion.fromX * (1 - visualRatio)),
      y: Math.round(motion.fromY * (1 - visualRatio))
    };
    actor.render.state = 'walk';
    actor.render.frameIndex = frameIndex;

    if (motion.t >= 1) {
      actor.pxOffset = { x: 0, y: 0 };
      actor.render.state = 'idle';
      actor.render.frameIndex = 0;
      actor.render.timer = 0;
      this.companionFollowMotion = null;
      return false;
    }
    return true;
  }

  _cancelCompanionFollowMotion(actor = null) {
    const motion = this.companionFollowMotion;
    if (!motion || (actor && motion.actor !== actor)) return false;
    const subject = motion.actor;
    if (subject) {
      subject.pxOffset = { x: 0, y: 0 };
      if (!subject.isDead && subject.render?.state === 'walk') {
        subject.render.state = 'idle';
        subject.render.frameIndex = 0;
        subject.render.timer = 0;
      }
    }
    this.companionFollowMotion = null;
    return true;
  }

  _projectDroneGhostLightExplore(cell) {
    const companion = this._activeCompanion();
    if (
      this.mode !== 'explore' ||
      !cell ||
      !companion ||
      companion.isDead ||
      !hasCompanionUpgrade(this.companionRun, 'veil-ghost-light')
    ) return false;
    if (!this.grid.isInside(cell.x, cell.y) || !this.grid.isWalkable(cell.x, cell.y) || this._isCellHidden?.(cell.x, cell.y)) {
      this._log('Ghost Light cannot settle there.');
      return true;
    }
    if (chebyshev(companion.position, cell) > 5) {
      this._log('Ghost Light is out of range.');
      return true;
    }

    let affected = 0;
    for (const enemy of this.enemies ?? []) {
      if (
        enemy.isDead ||
        enemy.dormant ||
        !this._isHumanLike?.(enemy) ||
        chebyshev(enemy.position, cell) > 5 ||
        suspicionStateRank(enemy.suspicionState ?? SUSPICION_STATES.CALM) >= suspicionStateRank(SUSPICION_STATES.ALERTED)
      ) continue;
      enemy.suspicionState = SUSPICION_STATES.INVESTIGATING;
      enemy.suspicionAction = 'ghost-light';
      enemy.suspicionReason = 'heard';
      enemy.investigationTarget = { x: cell.x, y: cell.y };
      enemy.patrolTimer = 0;
      affected += 1;
    }
    this._pushEffect?.({ type: 'spark', x: cell.x, y: cell.y, text: 'GHOST' });
    this._log(affected
      ? `${companion.name} casts a thin service whistle. ${affected} watcher${affected === 1 ? '' : 's'} turn toward it.`
      : `${companion.name} casts a thin service whistle. Nothing turns.`);
    return true;
  }

  _consumeDroneDetectionDeferral({ enemy, nextState } = {}) {
    const companion = this._activeCompanion();
    if (
      nextState !== SUSPICION_STATES.ALERTED ||
      this.mode !== 'explore' ||
      !enemy ||
      !companion ||
      companion.isDead ||
      !hasCompanionUpgrade(this.companionRun, 'veil-vanishing-circuit')
    ) return false;
    const encounterId = this._resolveEncounterId?.(enemy.encounter) ?? enemy.encounter ?? enemy.spawnId ?? enemy.id;
    if (!encounterId) return false;
    const spent = this.companionRun.vanishingSpentEncounters ?? [];
    if (spent.includes(encounterId)) return false;
    spent.push(encounterId);
    this.companionRun.vanishingSpentEncounters = spent;
    this._pushEffect?.({ type: 'spark', x: companion.x, y: companion.y, text: 'VEIL' });
    this._log(`${companion.name} scatters the sightline. The alarm becomes a search.`);
    return true;
  }

  _makeWayForFriendlyCompanion(actor, x, y) {
    if (!actor || !this.player) return false;
    const companion = this._activeCompanion();
    if (!companion || companion.isDead) return false;
    const friendlyActor = actor === this.player || actor === companion;
    const other = actor === this.player ? companion : actor === companion ? this.player : null;
    if (!friendlyActor || !other || other.x !== x || other.y !== y) return false;
    const old = { x: actor.x, y: actor.y };
    if (!this.grid.isWalkable(old.x, old.y)) return false;
    if (other === companion) {
      return this._beginCompanionFollowMotion(companion, old, {
        duration: this._isSprintHeld?.() ? SPRINT_STEP_DURATION : STEP_DURATION
      });
    }
    this._cancelCompanionFollowMotion(other);
    other.moveTo(old.x, old.y);
    other.pxOffset = { x: 0, y: 0 };
    return true;
  }

  _disableCompanion(actor) {
    if (!actor || actor.type !== 'companion') return false;
    this._cancelCompanionFollowMotion(actor);
    actor.hp = 0;
    actor.isDead = true;
    actor.disabled = true;
    actor.ap = 0;
    actor.render.state = 'dead';
    actor.render.timer = 0;
    this.companionRun = snapshotCompanionEntity(this.companionRun, actor);
    const signal = this._companionSignalText('disabled');
    this._log(signal ? `${signal} ${actor.name} folds still.` : `${actor.name} folds still.`);
    return true;
  }

  _rebootDisabledCompanions() {
    const actor = this._activeCompanion();
    if (!actor || (!actor.isDead && !actor.disabled)) return false;
    this.companionRun = rebootCompanion(this.companionRun, actor);
    this._emitCompanionSignal(actor, 'reboot');
    this._log(`${actor.name} folds upright and resumes station.`);
    return true;
  }

  _companionSignalText(signalId) {
    const signal = this._companionDefinition()?.communication?.signals?.[signalId];
    return typeof signal === 'string' && signal.trim() ? signal.trim() : '';
  }

  _emitCompanionSignal(actor, signalId, ttl = 1.4) {
    const text = this._companionSignalText(signalId);
    if (!actor || !text) return false;
    actor.speech = { text, ttl, kind: 'machine-signal' };
    return true;
  }

  _awardCurrentCompanionLevelPoints({ log = true } = {}) {
    const definition = this._companionDefinition();
    if (!definition || !this.companionRun?.recruited) return 0;
    const level = normalizeProgression(this.player?.progression).level;
    const result = awardCompanionLevelPoints(this.companionRun, definition, level);
    this.companionRun = result.state;
    if (log && result.gained > 0) this._log(`Attendant upgrade points gained: ${result.gained}.`);
    return result.gained;
  }

  _openDroneShrine(object) {
    const state = normalizeCompanionRunState(this.companionRun);
    this.companionRun = state;
    if (state.ritual.completed) {
      this._openDialogue('Censure Attendant Shrine', [
        `ATTENDANT RECORD: ${state.name.toUpperCase()}.`,
        'FIELD REGISTRATION COMPLETE. NO OTHER LOCAL CRADLE ANSWERS.'
      ], 'shrine');
      return;
    }
    state.ritual.opened = true;
    this.droneShrine = {
      objectId: object?.id ?? null,
      activationCell: object?.activationCell ? { ...object.activationCell } : null,
      phase: 'recognition',
      selectedIndex: firstAvailableModelIndex(state.ritual.failedModels),
      name: '',
      message: ''
    };
    this.uiScreen = 'drone-shrine';
    this.contextActionMenu = null;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
  }

  _handleDroneShrineScreen(actions, textInput = []) {
    const shrine = this.droneShrine;
    if (!shrine) {
      this.uiScreen = null;
      return;
    }
    if (shrine.phase === 'naming' && textInput.length > 0) {
      shrine.name = applyDroneNameInput(shrine.name, textInput);
    }
    for (const action of actions) {
      if (action === 'restart') {
        this._requestRunRestart?.();
        return;
      }
      if (action === 'debug') {
        this.debugGrid = !this.debugGrid;
        continue;
      }
      if (action === 'cancel') {
        if (shrine.phase === 'recognition' || shrine.phase === 'catalogue' || shrine.phase === 'failure') {
          this._closeDroneShrine();
          return;
        }
        continue;
      }
      if (shrine.phase === 'recognition') {
        if (this._isConfirmAction(action) || action === 'interact') shrine.phase = 'catalogue';
        continue;
      }
      if (shrine.phase === 'catalogue') {
        if (action === 'up' || action === 'down') {
          shrine.selectedIndex = nextModelIndex(shrine.selectedIndex, action === 'down' ? 1 : -1, this.companionRun.ritual.failedModels);
          continue;
        }
        if (this._isConfirmAction(action) || action === 'interact') this._selectDroneShrineModel();
        continue;
      }
      if (shrine.phase === 'failure') {
        if (this._isConfirmAction(action) || action === 'interact') {
          shrine.phase = 'catalogue';
          shrine.message = '';
          shrine.selectedIndex = firstAvailableModelIndex(this.companionRun.ritual.failedModels);
        }
        continue;
      }
      if (shrine.phase === 'activation') {
        if (this._isConfirmAction(action) || action === 'interact') shrine.phase = 'naming';
        continue;
      }
      if (shrine.phase === 'naming' && (this._isConfirmAction(action) || action === 'interact')) {
        this._finishDroneNaming();
        return;
      }
    }
  }

  _selectDroneShrineModel() {
    const shrine = this.droneShrine;
    const model = SHRINE_MODELS[shrine?.selectedIndex ?? 0];
    if (!shrine || !model) return;
    const failed = this.companionRun.ritual.failedModels;
    if (failed.includes(model.id)) return;
    if (MODEL_FAILURES[model.id]) {
      failed.push(model.id);
      shrine.message = MODEL_FAILURES[model.id];
      shrine.phase = 'failure';
      return;
    }
    shrine.message = 'LOCAL CRADLE ANSWERS. FIELD ATTENDANT READY.';
    shrine.phase = 'activation';
    this._spawnShrinePreviewDrone(shrine.activationCell);
  }

  _spawnShrinePreviewDrone(preferredCell) {
    if (this._activeCompanion()) return this._activeCompanion();
    const definition = this._companionDefinition();
    if (!definition) return null;
    const previewState = {
      ...createCompanionRunState(),
      recruited: true,
      name: definition.name,
      hp: definition.stats?.hp ?? 8,
      ritual: { ...this.companionRun.ritual }
    };
    const clearPreferred = preferredCell && this.grid.isWalkable(preferredCell.x, preferredCell.y) &&
      !this._isOccupied(preferredCell.x, preferredCell.y, null)
      ? preferredCell
      : null;
    const position = clearPreferred ?? this._findCompanionCell(this.player.position);
    if (!position) return null;
    const actor = createCompanionEntity(definition, previewState, position, this.player);
    if (!actor) return null;
    actor.ritualPreview = true;
    this.companions = [actor];
    return actor;
  }

  _finishDroneNaming() {
    const shrine = this.droneShrine;
    const validation = normalizeDroneName(shrine?.name);
    if (!shrine || !validation.valid) {
      if (shrine) shrine.message = 'ENTER A NAME FROM 1 TO 12 CHARACTERS.';
      return false;
    }
    const definition = this._companionDefinition();
    const level = normalizeProgression(this.player?.progression).level;
    const result = recruitCompanionState(this.companionRun, definition, level, validation.name);
    if (!result.ok) {
      shrine.message = String(result.reason ?? '').toUpperCase();
      return false;
    }
    this.companionRun = result.state;
    this.inventory.add(DRONE_SERVICE_ITEM_ID, 2, { ignoreCapacity: true });
    this._syncInventoryOrder?.();
    let actor = this._activeCompanion();
    if (!actor) actor = this._spawnRunCompanion(shrine.activationCell);
    if (actor) {
      actor.ritualPreview = false;
      actor.name = validation.name;
      actor.progression = JSON.parse(JSON.stringify(this.player.progression));
      applyCompanionUpgrades(actor, definition, this.companionRun);
      actor.hp = actor.maxHp;
      actor.isDead = false;
      actor.disabled = false;
      this.companionRun.hp = actor.hp;
      this._emitCompanionSignal(actor, 'registered');
    }
    for (const flag of DRONE_REGISTRATION_FLAGS) this.flags.add(flag);
    this._log(`${validation.name} registers as your field attendant.`);
    this._log(`Attendant upgrade points available: ${this.companionRun.upgradePoints}.`);
    this._log('Recovered: 2x Drone Service Parts.');
    this.droneShrine = null;
    this.uiScreen = null;
    this.mode = 'explore';
    return true;
  }

  _closeDroneShrine() {
    const preview = this._activeCompanion();
    if (preview?.ritualPreview) this.companions = [];
    this.droneShrine = null;
    this.uiScreen = null;
  }

  _buildDroneShrineUi() {
    if (!this.droneShrine) return null;
    const failed = new Set(this.companionRun?.ritual?.failedModels ?? []);
    return {
      ...this.droneShrine,
      models: SHRINE_MODELS.map((model, index) => ({
        ...model,
        failed: failed.has(model.id),
        selected: index === this.droneShrine.selectedIndex
      })),
      nameValidation: normalizeDroneName(this.droneShrine.name)
    };
  }

  _handleDroneJournalInput(actions, click = null) {
    if (this._currentJournalSectionId?.() !== 'DRONE') return false;
    if (this.journalTurn) return true;
    if (click) return false;
    const definition = this._companionDefinition();
    const branches = definition?.branches ?? [];
    const branch = branches[this.journalDroneBranchIndex ?? 0];
    const nodes = branch?.nodes ?? [];
    for (const action of actions) {
      if (action === 'cancel' && this.journalDroneConfirm) {
        this.journalDroneConfirm = null;
        continue;
      }
      if (action === 'cancel' || action === 'journal') {
        this._closeUiScreen();
        return true;
      }
      if (action === 'map') {
        this._toggleJournal({ section: 'MAP' });
        return true;
      }
      if (action === 'left' || action === 'right') {
        if (branches.length) {
          const delta = action === 'right' ? 1 : -1;
          this.journalDroneBranchIndex = ((this.journalDroneBranchIndex + delta) % branches.length + branches.length) % branches.length;
          this.journalDroneNodeIndex = 0;
          this.journalDroneConfirm = null;
        }
        continue;
      }
      if (action === 'cycle') {
        this._cycleJournalSection(1);
        return true;
      }
      if (action === 'up' || action === 'down') {
        if (nodes.length) {
          const delta = action === 'down' ? 1 : -1;
          this.journalDroneNodeIndex = Math.max(0, Math.min(nodes.length - 1, (this.journalDroneNodeIndex ?? 0) + delta));
          this.journalDroneConfirm = null;
        }
        continue;
      }
      if (this._isConfirmAction(action) || action === 'interact') this._confirmDroneUpgrade();
      else if (action === 'inventory') { this._toggleInventory(); return true; }
      else if (action === 'restart') { this._requestRunRestart?.(); return true; }
      else if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
    return true;
  }

  _confirmDroneUpgrade() {
    const definition = this._companionDefinition();
    const branch = definition?.branches?.[this.journalDroneBranchIndex ?? 0];
    const node = branch?.nodes?.[this.journalDroneNodeIndex ?? 0];
    if (!node) return false;
    const status = companionNodeState(
      definition,
      this.companionRun,
      node.id,
      this.player,
      this.inventory.count(definition.serviceItem ?? DRONE_SERVICE_ITEM_ID)
    );
    if (!status.unlocked) {
      if (status.reason) this._log(status.reason);
      this.journalDroneConfirm = null;
      return false;
    }
    if (this.journalDroneConfirm !== node.id) {
      this.journalDroneConfirm = node.id;
      return false;
    }
    const result = purchaseCompanionUpgrade({
      definition,
      state: this.companionRun,
      nodeId: node.id,
      player: this.player,
      inventory: this.inventory,
      mode: this.mode
    });
    this.journalDroneConfirm = null;
    if (!result.ok) {
      if (result.reason) this._log(result.reason);
      return false;
    }
    this.companionRun = result.state;
    const actor = this._activeCompanion();
    if (actor) {
      applyCompanionUpgrades(actor, definition, this.companionRun);
      this.companionRun.hp = actor.hp;
    }
    this._syncInventoryOrder?.();
    this._log(`${node.name} installed.`);
    return true;
  }

  _buildDroneJournalUi() {
    const definition = this._companionDefinition();
    const branches = definition?.branches ?? [];
    const branchIndex = Math.max(0, Math.min(branches.length - 1, this.journalDroneBranchIndex ?? 0));
    const branch = branches[branchIndex] ?? null;
    const nodeIndex = Math.max(0, Math.min((branch?.nodes?.length ?? 1) - 1, this.journalDroneNodeIndex ?? 0));
    const parts = this.inventory?.count?.(definition?.serviceItem ?? DRONE_SERVICE_ITEM_ID) ?? 0;
    return {
      recruited: Boolean(this.companionRun?.recruited),
      name: this.companionRun?.name || definition?.name || 'Unregistered',
      model: definition?.model ?? '',
      hp: this._activeCompanion()?.hp ?? this.companionRun?.hp ?? 0,
      maxHp: this._activeCompanion()?.maxHp ?? definition?.stats?.hp ?? 0,
      points: this.companionRun?.upgradePoints ?? 0,
      parts,
      branchIndex,
      nodeIndex,
      confirmNodeId: this.journalDroneConfirm,
      branches: branches.map((entry) => ({
        id: entry.id,
        name: entry.name,
        rating: companionBranchRating(definition, entry.id, this.player),
        installed: (entry.nodes ?? []).filter((node) => this.companionRun?.upgrades?.includes(node.id)).length
      })),
      nodes: (branch?.nodes ?? []).map((node) => ({
        ...node,
        ...companionNodeState(definition, this.companionRun, node.id, this.player, parts)
      }))
    };
  }
}

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function firstAvailableModelIndex(failedModels = []) {
  const failed = new Set(failedModels);
  const index = SHRINE_MODELS.findIndex((model) => !failed.has(model.id));
  return index >= 0 ? index : SHRINE_MODELS.length - 1;
}

function nextModelIndex(current, delta, failedModels = []) {
  const failed = new Set(failedModels);
  let index = current;
  for (let step = 0; step < SHRINE_MODELS.length; step += 1) {
    index = ((index + delta) % SHRINE_MODELS.length + SHRINE_MODELS.length) % SHRINE_MODELS.length;
    if (!failed.has(SHRINE_MODELS[index].id)) return index;
  }
  return current;
}

export function installGameDroneRuntime(GameClass) {
  installGameMethods(GameClass, GameDroneRuntime);
}
