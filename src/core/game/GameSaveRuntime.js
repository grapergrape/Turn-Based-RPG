import { exportSaveJson } from '../save/SaveCodec.js';
import { saveOptionAt, saveSlotAt } from '../../ui/saveLayout.js';
import { installGameMethods } from './installGameMethods.js';

const AUTOSAVE_INTERVAL_SECONDS = 30;

class GameSaveRuntime {
  async openTitle({ message = '', messageKind = 'info' } = {}) {
    this.ready = true;
    this.mode = 'title';
    this.uiScreen = 'title';
    this.saveUi = {
      screen: 'title',
      selected: 0,
      rows: [],
      busy: false,
      message,
      messageKind,
      returnScreen: 'title',
      confirm: null
    };
    this.anim = this.anim ?? { tick: 0, bob: 0, flicker: 0, pulse: 0 };
    await this._refreshSaveRows();
  }

  _isSaveScreen() {
    return ['title', 'pause', 'saves', 'confirm'].includes(this.uiScreen);
  }

  _openPauseMenu() {
    if (!this.player || this.uiScreen || this.mode === 'title') return false;
    this.saveUi = {
      screen: 'pause',
      selected: 0,
      rows: this.saveUi?.rows ?? [],
      busy: false,
      message: '',
      messageKind: 'info',
      returnScreen: 'pause',
      confirm: null
    };
    this.uiScreen = 'pause';
    void this._refreshSaveRows();
    return true;
  }

  _buildSaveMenuUi() {
    const screen = this.uiScreen ?? this.saveUi?.screen ?? 'title';
    const rows = (this.saveUi?.rows ?? []).map(formatSaveRow);
    return {
      screen,
      gameVersion: this.gameVersion,
      selected: this.saveUi?.selected ?? 0,
      busy: Boolean(this.saveUi?.busy),
      message: this.saveUi?.message ?? '',
      messageKind: this.saveUi?.messageKind ?? 'info',
      confirmText: this.saveUi?.confirm?.text ?? '',
      options: this._saveMenuOptions(screen),
      rows
    };
  }

  _buildTitleUi() {
    const cursor = this.input?.mouse ? { x: this.input.mouse.x, y: this.input.mouse.y, state: 'use' } : null;
    return {
      screen: this.uiScreen,
      save: this._buildSaveMenuUi(),
      cursor
    };
  }

  _saveMenuOptions(screen = this.uiScreen) {
    const hasValid = (this.saveUi?.rows ?? []).some((row) => row.status === 'valid');
    const hasAny = (this.saveUi?.rows ?? []).some((row) => row.status !== 'empty');
    const hasStorage = Boolean(this.saveCoordinator);
    if (screen === 'title') {
      return [
        { id: 'continue', label: 'CONTINUE', detail: hasValid ? 'OPEN THE NEWEST SOUND RECORD' : 'NO SOUND SAVE FOUND', enabled: hasValid },
        { id: 'new-run', label: 'NEW RUN', detail: hasAny ? 'REPLACES THE STORED RUN' : 'BEGIN AT ASH CHAPEL', enabled: true },
        { id: 'load-saves', label: 'LOAD SAVES', detail: 'VIEW MANUAL AND RECOVERY RECORDS', enabled: hasAny },
        { id: 'import-save', label: 'IMPORT SAVE', detail: hasStorage ? 'READ A JSON BACKUP FILE' : 'SAVE STORAGE UNAVAILABLE', enabled: hasStorage }
      ];
    }
    if (screen === 'pause') {
      return [
        { id: 'resume', label: 'RESUME', detail: 'RETURN TO THE FIELD', enabled: true },
        { id: 'manual-save', label: 'SAVE RUN', detail: !hasStorage ? 'SAVE STORAGE UNAVAILABLE' : this.mode === 'combat' ? 'UNAVAILABLE DURING COMBAT' : 'WRITE THE MANUAL RECORD', enabled: hasStorage && this.mode !== 'combat' },
        { id: 'load-saves', label: 'LOAD SAVES', detail: 'OPEN A STORED CHECKPOINT', enabled: hasAny },
        { id: 'export-newest', label: 'EXPORT SAVE', detail: 'WRITE THE NEWEST SOUND RECORD', enabled: hasValid },
        { id: 'return-title', label: 'RETURN TO TITLE', detail: 'LEAVE THE CURRENT FIELD', enabled: true }
      ];
    }
    if (screen === 'confirm') {
      return [
        { id: 'confirm-yes', label: 'CONFIRM', enabled: true },
        { id: 'confirm-no', label: 'GO BACK', enabled: true }
      ];
    }
    return [];
  }

  _handleSaveScreen(actions, click) {
    if (!this.saveUi || this.saveUi.busy) return;
    const screen = this.uiScreen;
    if (click) {
      const index = screen === 'saves'
        ? saveSlotAt(click, this.saveUi.rows.length)
        : saveOptionAt(click, this._saveMenuOptions(screen).length);
      if (index !== null) {
        this.saveUi.selected = index;
        void this._activateSaveSelection();
        return;
      }
    }

    for (const action of actions) {
      if (action === 'up' || action === 'down') {
        const count = screen === 'saves'
          ? Math.max(1, this.saveUi.rows.length)
          : Math.max(1, this._saveMenuOptions(screen).length);
        const delta = action === 'down' ? 1 : -1;
        this.saveUi.selected = (this.saveUi.selected + delta + count) % count;
        continue;
      }
      if (this._isConfirmAction?.(action) || action === 'interact') {
        void this._activateSaveSelection();
        return;
      }
      if (action === 'export-save' && screen === 'saves') {
        void this._exportSelectedSave();
        return;
      }
      if (action === 'delete-save' && screen === 'saves') {
        this._confirmSaveAction('delete-slot', 'Remove this stored record? The other checkpoints will remain.');
        return;
      }
      if (action === 'cancel') {
        if (screen === 'title') return;
        if (screen === 'pause') {
          this._closeSaveMenu();
          return;
        }
        if (screen === 'confirm') {
          this._cancelSaveConfirmation();
          return;
        }
        this.uiScreen = this.saveUi.returnScreen ?? 'title';
        this.saveUi.screen = this.uiScreen;
        this.saveUi.selected = 0;
        this._selectEnabledSaveOption();
        return;
      }
    }
  }

  async _activateSaveSelection() {
    const screen = this.uiScreen;
    if (screen === 'saves') {
      const row = this.saveUi.rows[this.saveUi.selected];
      if (row?.status !== 'valid') return;
      if (this.saveUi.returnScreen === 'pause') {
        this._confirmSaveAction('load-slot', 'Load this checkpoint? Field progress after it will be lost.', { slot: row.slot });
      } else {
        await this._loadSaveSlot(row.slot);
      }
      return;
    }

    const option = this._saveMenuOptions(screen)[this.saveUi.selected];
    if (!option?.enabled) return;
    if (screen === 'confirm') {
      if (option.id === 'confirm-yes') await this._runConfirmedSaveAction();
      else this._cancelSaveConfirmation();
      return;
    }

    switch (option.id) {
      case 'continue': {
        this.saveUi.busy = true;
        try {
          const newest = await this.saveCoordinator.newestValid();
          if (newest) await this._loadSaveSlot(newest.slot);
          else {
            this.saveUi.busy = false;
            this.saveUi.message = 'NO SOUND SAVE FOUND.';
            this.saveUi.messageKind = 'error';
          }
        } catch (error) {
          this.saveUi.busy = false;
          this.saveUi.message = 'SAVE STORAGE COULD NOT BE READ.';
          this.saveUi.messageKind = 'error';
          this.lastSaveError = error.message;
        }
        break;
      }
      case 'new-run':
        if (this.saveUi.rows.some((row) => row.status !== 'empty')) {
          this._confirmSaveAction('new-run', 'Begin a new run? The stored run will be replaced after the field opens.');
        } else {
          await this._startNewRun();
        }
        break;
      case 'load-saves':
        this.saveUi.returnScreen = screen;
        this.saveUi.screen = 'saves';
        this.saveUi.selected = Math.max(0, this.saveUi.rows.findIndex((row) => row.status === 'valid'));
        this.uiScreen = 'saves';
        break;
      case 'import-save':
        await this._chooseImportFile();
        break;
      case 'resume':
        this._closeSaveMenu();
        break;
      case 'manual-save':
        await this._manualSaveFromMenu();
        break;
      case 'export-newest':
        await this._exportNewestSave();
        break;
      case 'return-title':
        this._confirmSaveAction('return-title', 'Return to the title screen? The latest safe state will be recorded first.');
        break;
      default:
        break;
    }
  }

  _confirmSaveAction(kind, text, data = {}) {
    this.saveUi.confirm = {
      kind,
      text,
      data,
      previousScreen: this.uiScreen,
      previousSelection: this.saveUi.selected
    };
    this.saveUi.screen = 'confirm';
    this.saveUi.selected = 1;
    this.uiScreen = 'confirm';
  }

  _cancelSaveConfirmation() {
    const confirm = this.saveUi.confirm;
    this.uiScreen = confirm?.previousScreen ?? this.saveUi.returnScreen ?? 'title';
    this.saveUi.screen = this.uiScreen;
    this.saveUi.selected = confirm?.previousSelection ?? 0;
    this.saveUi.confirm = null;
  }

  async _runConfirmedSaveAction() {
    const confirm = this.saveUi.confirm;
    if (!confirm) return;
    if (confirm.kind === 'new-run') await this._startNewRun();
    else if (confirm.kind === 'load-slot') await this._loadSaveSlot(confirm.data.slot);
    else if (confirm.kind === 'delete-slot') await this._deleteSelectedSave();
    else if (confirm.kind === 'return-title') await this._returnToTitle();
    else if (confirm.kind === 'import-save') await this._importSaveText(confirm.data.text);
  }

  async _startNewRun() {
    this.saveUi.busy = true;
    this._beginFreshRunMetadata();
    this.levelPath = this.initialLevelPath;
    this.uiScreen = null;
    this.saveUi = null;
    try {
      await this.boot();
      this.pendingInitialAutosave = true;
    } catch (error) {
      await this.openTitle({ message: `NEW RUN FAILED: ${error.message}`, messageKind: 'error' });
    }
  }

  async _loadSaveSlot(slot) {
    this.saveUi.busy = true;
    const rollback = this.player ? this.createRunSnapshot() : null;
    try {
      const envelope = await this.saveCoordinator.load(slot);
      this.uiScreen = null;
      await this.boot({ preserveRun: true, restoreSnapshot: envelope.payload, skipIntro: true });
      this.lastSaveAt = envelope.savedAt;
      this.saveUi = null;
    } catch (error) {
      if (rollback) {
        try {
          await this.boot({ preserveRun: true, restoreSnapshot: rollback, skipIntro: true });
          this._log(`Load failed: ${error.message}`);
          this._openPauseMenu();
          this.saveUi.message = 'LOAD FAILED. CURRENT FIELD RESTORED.';
          this.saveUi.messageKind = 'error';
          return;
        } catch {
          // The title fallback below is the last safe recovery path.
        }
      }
      await this.openTitle({ message: `LOAD FAILED: ${error.message}`, messageKind: 'error' });
    }
  }

  async _manualSaveFromMenu() {
    if (!this.saveCoordinator) return;
    this.saveUi.busy = true;
    try {
      const snapshot = this.createRunSnapshot();
      const envelope = await this.saveCoordinator.saveManual(snapshot);
      this.lastSaveAt = envelope.savedAt;
      this.saveUi.message = 'RUN SAVED.';
      this.saveUi.messageKind = 'info';
      await this._refreshSaveRows();
    } catch (error) {
      this.saveUi.message = 'SAVE FAILED. THE OLD RECORD REMAINS.';
      this.saveUi.messageKind = 'error';
      this.lastSaveError = error.message;
    } finally {
      this.saveUi.busy = false;
    }
  }

  async _refreshSaveRows() {
    if (!this.saveUi || !this.saveCoordinator) return;
    this.saveUi.busy = true;
    try {
      this.saveUi.rows = await this._saveRows();
    } catch (error) {
      this.saveUi.rows = [];
      this.saveUi.message = 'SAVE STORAGE COULD NOT BE READ.';
      this.saveUi.messageKind = 'error';
      this.lastSaveError = error.message;
    } finally {
      if (this.saveUi) {
        this._selectEnabledSaveOption();
        this.saveUi.busy = false;
      }
    }
  }

  async _exportNewestSave() {
    this.saveUi.busy = true;
    try {
      const row = await this.saveCoordinator.newestValid();
      if (row) this._downloadSaveEnvelope(row.record);
      this.saveUi.message = row ? 'BACKUP FILE WRITTEN.' : 'NO SOUND SAVE TO EXPORT.';
      this.saveUi.messageKind = row ? 'info' : 'error';
    } catch (error) {
      this.saveUi.message = 'BACKUP EXPORT FAILED.';
      this.saveUi.messageKind = 'error';
      this.lastSaveError = error.message;
    } finally {
      this.saveUi.busy = false;
    }
  }

  async _exportSelectedSave() {
    const row = this.saveUi.rows[this.saveUi.selected];
    if (row?.status !== 'valid') return;
    this.saveUi.busy = true;
    try {
      const envelope = await this.saveCoordinator.load(row.slot);
      this._downloadSaveEnvelope(envelope);
      this.saveUi.message = 'BACKUP FILE WRITTEN.';
      this.saveUi.messageKind = 'info';
    } catch (error) {
      this.saveUi.message = 'BACKUP EXPORT FAILED.';
      this.saveUi.messageKind = 'error';
      this.lastSaveError = error.message;
    } finally {
      this.saveUi.busy = false;
    }
  }

  async _deleteSelectedSave() {
    const previous = this.saveUi.confirm?.previousSelection ?? this.saveUi.selected;
    const row = this.saveUi.rows[previous];
    this.saveUi.confirm = null;
    this.saveUi.busy = true;
    try {
      if (row) await this.saveCoordinator.deleteSlot(row.slot);
      this.uiScreen = 'saves';
      this.saveUi.screen = 'saves';
      this.saveUi.selected = Math.max(0, Math.min(previous, 3));
      this.saveUi.message = 'SAVED RECORD REMOVED.';
      await this._refreshSaveRows();
    } catch (error) {
      this.saveUi.message = 'THE SAVED RECORD COULD NOT BE REMOVED.';
      this.saveUi.messageKind = 'error';
      this.lastSaveError = error.message;
    } finally {
      this.saveUi.busy = false;
    }
  }

  async _chooseImportFile() {
    if (typeof document === 'undefined' || !this.saveCoordinator) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    const file = await new Promise((resolve) => {
      input.addEventListener('change', () => resolve(input.files?.[0] ?? null), { once: true });
      input.addEventListener('cancel', () => resolve(null), { once: true });
      input.click();
    });
    if (!file) return;
    try {
      const text = await file.text();
      if (this.saveUi.rows.some((row) => row.status !== 'empty')) {
        this._confirmSaveAction('import-save', 'Import this backup? Existing browser saves will be replaced.', { text });
      } else {
        await this._importSaveText(text);
      }
    } catch (error) {
      this.saveUi.message = `IMPORT FAILED: ${error.message}`;
      this.saveUi.messageKind = 'error';
    }
  }

  async _importSaveText(text) {
    this.saveUi.busy = true;
    try {
      await this.saveCoordinator.importJson(text);
      this.uiScreen = 'title';
      this.saveUi.screen = 'title';
      this.saveUi.selected = 0;
      this.saveUi.confirm = null;
      this.saveUi.message = 'BACKUP IMPORTED.';
      this.saveUi.messageKind = 'info';
      await this._refreshSaveRows();
    } catch (error) {
      this.uiScreen = 'title';
      this.saveUi.screen = 'title';
      this.saveUi.confirm = null;
      this.saveUi.message = `IMPORT FAILED: ${error.message}`;
      this.saveUi.messageKind = 'error';
      this.saveUi.busy = false;
    }
  }

  async _returnToTitle() {
    if (this.saveUi) this.saveUi.busy = true;
    let saveFailed = false;
    if (this.mode !== 'combat' && this.saveCoordinator) {
      try {
        const snapshot = this.createRunSnapshot();
        await this.saveCoordinator.saveAuto(snapshot);
      } catch (error) {
        this.lastSaveError = error.message;
        saveFailed = true;
      }
    }
    await this.openTitle(saveFailed
      ? { message: 'AUTOSAVE FAILED. THE PREVIOUS RECORD REMAINS.', messageKind: 'error' }
      : undefined);
  }

  _closeSaveMenu() {
    this.uiScreen = null;
    this.saveUi = null;
  }

  createRunSnapshot() {
    if (!this.player || !this.level || !this.inventory) return null;
    if (!this.runId) this.runId = createRunId();
    if (!this.runCreatedAt) this.runCreatedAt = new Date().toISOString();
    this._snapshotLevelState();
    const inventory = this.inventory.stateSnapshot();
    const companion = this._activeCompanion?.();
    const levels = [...(this.levelStateByPath ?? [])].map(([path, state]) => ({
      path,
      state: serializeLevelState(state)
    }));
    return {
      runId: this.runId,
      createdAt: this.runCreatedAt,
      levelPath: this.levelPath,
      levelName: this.level.name,
      mode: this.mode === 'victory' ? 'victory' : 'explore',
      playtimeSeconds: Math.max(0, this.playtimeSeconds ?? 0),
      player: {
        name: this.player.name,
        appearance: clone(this.player.appearance),
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        position: { ...this.player.position },
        facing: this.player.facing,
        progression: clone(this.player.progression)
      },
      companion: {
        run: this._snapshotCompanionRunState?.() ?? null,
        position: companion ? { ...companion.position } : null,
        facing: companion?.facing ?? null
      },
      inventory,
      inventoryOrder: [...(this.inventoryOrder ?? [])],
      maxCarryWeight: this.inventory.maxCarryWeight,
      requiredItemIds: inventoryItemIds(inventory, levels),
      contentLevelPaths: levels.map((entry) => entry.path).sort(),
      flags: [...(this.flags ?? [])].sort(),
      questStages: [...(this.questStages ?? [])],
      questReached: [...(this.questReached ?? [])].map(([id, stages]) => [id, [...stages]]),
      awardedQuestXp: [...(this.awardedQuestXp ?? [])].sort(),
      clock: clone(this.clock),
      groundItemSeq: this.groundItemSeq ?? 0,
      selectedAttackId: this.selectedAttackId ?? null,
      sneakMode: Boolean(this.sneakMode),
      levels
    };
  }

  _restoreSnapshotValues(snapshot) {
    if (!snapshot) return null;
    return {
      inventoryState: clone(snapshot.inventory),
      inventoryOrder: [...(snapshot.inventoryOrder ?? [])],
      questStages: new Map(snapshot.questStages ?? []),
      questReached: new Map((snapshot.questReached ?? []).map(([id, stages]) => [id, new Set(stages)])),
      questDefs: {},
      codexDefs: [],
      journalNotes: [],
      flags: new Set(snapshot.flags ?? []),
      awardedQuestXp: new Set(snapshot.awardedQuestXp ?? []),
      clock: clone(snapshot.clock),
      player: clone(snapshot.player),
      groundItemSeq: snapshot.groundItemSeq ?? 0,
      companionRun: clone(snapshot.companion?.run),
      levelStates: new Map((snapshot.levels ?? []).map((entry) => [entry.path, deserializeLevelState(entry.state)]))
    };
  }

  _applyRestoredRuntimeMetadata(snapshot) {
    if (!snapshot) return;
    this.runId = snapshot.runId;
    this.runCreatedAt = snapshot.createdAt;
    this.playtimeSeconds = Math.max(0, Number(snapshot.playtimeSeconds) || 0);
    this.mode = snapshot.mode === 'victory' ? 'victory' : 'explore';
    this.selectedAttackId = this.player.getAttack(snapshot.selectedAttackId)?.id
      ?? this.selectedAttackId;
    this.sneakMode = Boolean(snapshot.sneakMode);
    const companion = this._activeCompanion?.();
    const position = snapshot.companion?.position;
    if (companion && Number.isInteger(position?.x) && Number.isInteger(position?.y)) {
      const exactCellIsOpen = this.grid?.isInside(position.x, position.y)
        && this.grid.isWalkable(position.x, position.y)
        && !this._isCellHidden?.(position.x, position.y)
        && !this._isOccupied?.(position.x, position.y, companion);
      const cell = exactCellIsOpen ? position : this._findCompanionCell?.(position, { allowOrigin: true });
      if (cell) companion.moveTo(cell.x, cell.y);
      if (typeof snapshot.companion.facing === 'string') companion.facing = snapshot.companion.facing;
    }
    this.introSeen = true;
    this.autosaveElapsed = 0;
  }

  _beginFreshRunMetadata() {
    this.runId = createRunId();
    this.runCreatedAt = new Date().toISOString();
    this.playtimeSeconds = 0;
    this.autosaveElapsed = 0;
    this.lastSaveAt = null;
    this.lastSaveError = null;
    this.introSeen = false;
    this.saveCoordinator?.beginNewRun();
  }

  _requestRunRestart() {
    if (!this.saveCoordinator) {
      this.levelPath = this.initialLevelPath;
      void this.boot();
      return true;
    }
    if (this.uiScreen || this.moving || !this._openPauseMenu()) return false;
    this._confirmSaveAction('new-run', 'Begin a new run? The stored run will be replaced after the field opens.');
    return true;
  }

  _advanceSaveRuntime(dt) {
    if (!this.player || this.mode === 'title' || !this.ready) return;
    if (this.mode !== 'intro' && !this.uiScreen) {
      this.playtimeSeconds = Math.max(0, (this.playtimeSeconds ?? 0) + dt);
    }
    if (!this._canSaveRun()) return;
    this.autosaveElapsed = (this.autosaveElapsed ?? 0) + dt;
    if (this.autosaveElapsed < AUTOSAVE_INTERVAL_SECONDS) return;
    this.autosaveElapsed = 0;
    void this._requestAutosave('field interval');
  }

  _canSaveRun({ allowPause = false } = {}) {
    return Boolean(
      this.ready &&
      this.player &&
      (this.mode === 'explore' || this.mode === 'victory') &&
      !this.moving &&
      (!this.uiScreen || (allowPause && this.uiScreen === 'pause'))
    );
  }

  async _requestAutosave(reason = '') {
    if (!this.saveCoordinator || !this._canSaveRun()) return null;
    try {
      const snapshot = this.createRunSnapshot();
      if (!snapshot) return null;
      const envelope = await this.saveCoordinator.saveAuto(snapshot);
      this.lastSaveAt = envelope.savedAt;
      this.lastSaveError = null;
      return envelope;
    } catch (error) {
      this.lastSaveError = error.message;
      this._log?.('Autosave failed. The previous save is still held.');
      return null;
    }
  }

  async _writeManualSave() {
    if (!this.saveCoordinator || !this._canSaveRun({ allowPause: true })) return null;
    try {
      const snapshot = this.createRunSnapshot();
      const envelope = await this.saveCoordinator.saveManual(snapshot);
      this.lastSaveAt = envelope.savedAt;
      this.lastSaveError = null;
      this._log?.('Run saved.');
      return envelope;
    } catch (error) {
      this.lastSaveError = error.message;
      this._log?.('Save failed. The previous save is still held.');
      return null;
    }
  }

  async _saveRows() {
    if (!this.saveCoordinator) return [];
    return this.saveCoordinator.listSlots();
  }

  _selectEnabledSaveOption() {
    if (!this.saveUi || !['title', 'pause'].includes(this.uiScreen)) return;
    const options = this._saveMenuOptions(this.uiScreen);
    if (options[this.saveUi.selected]?.enabled !== false) return;
    const firstEnabled = options.findIndex((option) => option.enabled !== false);
    this.saveUi.selected = Math.max(0, firstEnabled);
  }

  _downloadSaveEnvelope(envelope) {
    if (typeof document === 'undefined' || !envelope) return false;
    const blob = new Blob([exportSaveJson(envelope)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vale-imprint-save-${safeFilePart(envelope.summary?.playerName)}-${dateFilePart(envelope.savedAt)}.json`;
    anchor.style.display = 'none';
    document.body?.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  }
}

export function installGameSaveRuntime(GameClass) {
  installGameMethods(GameClass, GameSaveRuntime);
}

export function serializeLevelState(state = {}) {
  return {
    consumedObjects: sortedSet(state.consumedObjects),
    killedObjects: sortedSet(state.killedObjects),
    unlockedObjects: sortedSet(state.unlockedObjects),
    openedObjects: sortedSet(state.openedObjects),
    lootedObjects: sortedSet(state.lootedObjects),
    revealedObjects: sortedSet(state.revealedObjects),
    searchedObjects: mapEntries(state.searchedObjects, (value) => sortedSet(value)),
    deadEnemies: sortedSet(state.deadEnemies),
    lootedEnemies: sortedSet(state.lootedEnemies),
    clearedEncounters: sortedSet(state.clearedEncounters),
    appliedLevelEvents: sortedSet(state.appliedLevelEvents),
    seenCombatTriggers: sortedSet(state.seenCombatTriggers),
    actorStates: mapEntries(state.actorStates, clone),
    tradeStockByActor: mapEntries(state.tradeStockByActor, clone),
    groundItems: (state.groundItems ?? []).map(savedGroundItem),
    exploredMapTiles: sortedSet(state.exploredMapTiles)
  };
}

export function deserializeLevelState(state = {}) {
  return {
    consumedObjects: new Set(state.consumedObjects ?? []),
    killedObjects: new Set(state.killedObjects ?? []),
    unlockedObjects: new Set(state.unlockedObjects ?? []),
    openedObjects: new Set(state.openedObjects ?? []),
    lootedObjects: new Set(state.lootedObjects ?? []),
    revealedObjects: new Set(state.revealedObjects ?? []),
    searchedObjects: new Map((state.searchedObjects ?? []).map(([key, value]) => [key, new Set(value)])),
    deadEnemies: new Set(state.deadEnemies ?? []),
    lootedEnemies: new Set(state.lootedEnemies ?? []),
    clearedEncounters: new Set(state.clearedEncounters ?? []),
    appliedLevelEvents: new Set(state.appliedLevelEvents ?? []),
    seenCombatTriggers: new Set(state.seenCombatTriggers ?? []),
    actorStates: new Map(state.actorStates ?? []),
    tradeStockByActor: new Map(state.tradeStockByActor ?? []),
    groundItems: clone(state.groundItems ?? []),
    exploredMapTiles: new Set(state.exploredMapTiles ?? [])
  };
}

function inventoryItemIds(inventory, levels = []) {
  return [...new Set([
    ...(inventory.counts ?? []).map((entry) => entry.item),
    ...(inventory.instances ?? []).map((entry) => entry.itemId),
    ...levels.flatMap((entry) => (entry.state?.groundItems ?? []).map((item) => item.itemId))
  ].filter(Boolean))].sort();
}

function savedGroundItem(item) {
  if (!item || typeof item !== 'object') return item;
  const { name: _name, model: _model, ...runtimeState } = item;
  return clone(runtimeState);
}

function sortedSet(value) {
  return [...(value ?? [])].sort();
}

function mapEntries(value, transform) {
  return [...(value ?? [])]
    .map(([key, entry]) => [key, transform(entry)])
    .sort(([left], [right]) => String(left).localeCompare(String(right)));
}

function createRunId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clone(value) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function safeFilePart(value) {
  return String(value ?? 'run').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'run';
}

function dateFilePart(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'backup';
  return date.toISOString().replace(/[:.]/g, '').slice(0, 15);
}

function formatSaveRow(row) {
  const labels = {
    manual: 'MANUAL SAVE',
    'autosave-1': 'AUTOSAVE I',
    'autosave-2': 'AUTOSAVE II',
    'autosave-3': 'AUTOSAVE III'
  };
  if (!row) return { status: 'empty', label: 'EMPTY' };
  const summary = row.summary ?? {};
  return {
    slot: row.slot,
    status: row.status,
    label: labels[row.slot] ?? row.slot,
    reason: row.error ?? '',
    playerName: summary.playerName ?? 'Unnamed Agent',
    playerLevel: summary.playerLevel ?? 1,
    location: summary.levelName ?? summary.levelPath ?? 'Unknown field',
    fieldTime: formatFieldTime(summary),
    savedAt: formatSavedAt(row.record?.savedAt),
    versionWarning: Boolean(row.gameVersionMismatch),
    savedGameVersion: row.record?.gameVersion ?? ''
  };
}

function formatFieldTime(summary) {
  const minute = Math.max(0, Math.min(1439, Math.floor(Number(summary.minuteOfDay) || 0)));
  const hours = String(Math.floor(minute / 60)).padStart(2, '0');
  const minutes = String(minute % 60).padStart(2, '0');
  return `DAY ${summary.fieldDay ?? 1} ${hours}:${minutes}`;
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'UNKNOWN TIME';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${months[date.getMonth()]} ${hour}:${minute}`;
}
