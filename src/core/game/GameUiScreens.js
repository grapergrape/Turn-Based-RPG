import {
  PRIMARY_ASSIGNMENT_FLAG,
  applyCustomizationText,
  changeCustomizationOption,
  changePrimaryAssignmentValue,
  createCustomizationState,
  currentCustomizationRows,
  customizationCanConfirm,
  customizationResult,
  moveCustomizationSelection,
  movePrimaryAssignmentSelection,
  primaryAssignmentCanConfirm,
  primaryAssignmentResult
} from '../CharacterCreation.js';
import { PRIMARY_ATTRIBUTES, normalizeProgression, spendPrimaryPoint } from '../Progression.js';
import { learnTechnique, techniqueList } from '../TechniqueSystem.js';
import {
  JOURNAL_TURN_DURATION,
  buildJournalFindings,
  journalConditionMet,
  visibleJournalSections
} from '../JournalState.js';
import {
  journalArrowAt,
  journalEvidenceWindow,
  journalMapCellAt,
  journalTabAt,
  journalTechniqueRowAt
} from '../../ui/journalLayout.js';
import {
  tradeActionAt,
  tradeListOffset,
  tradePlayerIndexAt,
  tradeTraderIndexAt
} from '../../ui/tradeLayout.js';
import { installGameMethods } from './installGameMethods.js';

class GameUiScreens {
  // ---- UI screens --------------------------------------------------------

  _handleUiScreen(actions, click, textInput = []) {
    if (this.uiScreen === 'drone-shrine') {
      if (click) return;
      this._handleDroneShrineScreen(actions, textInput);
      return;
    }
    if (this.uiScreen === 'character-customization') {
      this._handleCharacterCustomizationScreen(actions, textInput);
      return;
    }
    if (this.uiScreen === 'primary-assignment') {
      this._handlePrimaryAssignmentScreen(actions);
      return;
    }
    if (this.uiScreen === 'journal') {
      this._handleJournalScreen(actions, click);
      return;
    }
    if (this.uiScreen === 'dialogue') {
      this._handleDialogueScreen(actions, click);
      return;
    }
    if (this.uiScreen === 'loot') {
      this._handleLootScreen(actions, click);
      return;
    }
    if (this.uiScreen === 'trade') {
      this._handleTradeScreen(actions, click);
      return;
    }
    if (this.uiScreen === 'inventory') {
      this._handleInventoryScreen(actions, click);
      return;
    }
    if (click) return;
    for (const action of actions) {
      if (action === 'cancel' || this._isConfirmAction(action) || action === 'interact') {
        this._closeUiScreen();
        return;
      }
      if (action === 'inventory') {
        this._toggleInventory();
        return;
      }
      if (action === 'journal') {
        this._toggleJournal();
        return;
      }
      if (action === 'map') {
        this._toggleJournal({ section: 'MAP' });
        return;
      }
      if (action === 'dressing') {
        this._log(this.inventory.useFieldDressing(this.player));
        this._syncInventoryOrder();
        this._clampInventorySelection();
        return;
      }
      if (action === 'restart') {
        this._requestRunRestart?.();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  _handleCharacterCustomizationScreen(actions, textInput = []) {
    if (!this.characterCreation) this.characterCreation = createCustomizationState(this.player);
    const selected = this.characterCreation.selectedIndex ?? 0;
    const selectedField = currentCustomizationRows(this.characterCreation)[selected];
    if (selectedField?.kind === 'name' && textInput.length > 0) {
      this.characterCreation = applyCustomizationText(this.characterCreation, textInput);
      this._refreshCharacterPreview();
      return;
    }

    for (const action of actions) {
      if (action === 'up') {
        this.characterCreation = moveCustomizationSelection(this.characterCreation, -1);
        continue;
      }
      if (action === 'down') {
        this.characterCreation = moveCustomizationSelection(this.characterCreation, 1);
        continue;
      }
      if (action === 'left' || action === 'right') {
        this.characterCreation = changeCustomizationOption(this.characterCreation, action === 'right' ? 1 : -1);
        this._refreshCharacterPreview();
        continue;
      }
      if (this._isConfirmAction(action) || action === 'interact') {
        if (!customizationCanConfirm(this.characterCreation)) continue;
        const result = customizationResult(this.characterCreation);
        this.player.name = result.name;
        this.player.appearance = result.appearance;
        this._refreshPlayerAppearance();
        this.characterCreation = null;
        this.uiScreen = null;
        this.mode = 'explore';
        continue;
      }
      if (action === 'restart') {
        this._requestRunRestart?.();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  _handlePrimaryAssignmentScreen(actions) {
    if (!this.primaryAssignment) this.primaryAssignment = createPrimaryAssignmentState(this.player);
    for (const action of actions) {
      if (action === 'up') {
        this.primaryAssignment = movePrimaryAssignmentSelection(this.primaryAssignment, -1);
        continue;
      }
      if (action === 'down') {
        this.primaryAssignment = movePrimaryAssignmentSelection(this.primaryAssignment, 1);
        continue;
      }
      if (action === 'left' || action === 'right') {
        this.primaryAssignment = changePrimaryAssignmentValue(this.primaryAssignment, action === 'right' ? 1 : -1);
        continue;
      }
      if (this._isConfirmAction(action) || action === 'interact') {
        if (!primaryAssignmentCanConfirm(this.primaryAssignment)) continue;
        this._confirmPrimaryAssignment();
        return;
      }
      if (action === 'restart') {
        this._requestRunRestart?.();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  _confirmPrimaryAssignment() {
    const values = primaryAssignmentResult(this.primaryAssignment);
    const progression = normalizeProgression(this.player?.progression);
    this.player.progression = {
      ...this.player.progression,
      level: progression.level,
      xp: progression.xp,
      build: progression.build.id,
      primaryPoints: progression.primaryPoints,
      activeTechniquePoints: progression.activeTechniquePoints,
      passiveTechniquePoints: progression.passiveTechniquePoints,
      techniques: [...progression.techniques],
      basePrimaries: { ...values },
      primaries: { ...values },
      primaryBonuses: {},
      trace: progression.trace,
      iconRisk: progression.iconRisk,
      scarPoints: progression.scarPoints,
      scars: progression.scars,
      fieldModifiers: progression.fieldModifiers
    };
    if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    this.flags.add(PRIMARY_ASSIGNMENT_FLAG);
    this.primaryAssignment = null;
    this.uiScreen = null;
    const transition = this.pendingPrimaryAssignmentTransition;
    this.pendingPrimaryAssignmentTransition = null;
    if (transition) {
      void this._transitionLevel(transition);
      return;
    }
    this.mode = 'explore';
  }

  _toggleInventory() {
    if (this.uiScreen === 'inventory') {
      this._closeUiScreen();
      return;
    }
    this.uiScreen = 'inventory';
    this.dialogue = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.contextActionMenu = null;
    this._clampInventorySelection();
  }

  _journalSections() {
    return visibleJournalSections({
      attendantAvailable: Boolean(this.companionRun?.recruited)
    });
  }

  _toggleJournal(options = {}) {
    const sections = this._journalSections();
    const targetSection = journalSectionIndex(options.section, sections);
    if (this.uiScreen === 'journal') {
      if (targetSection !== null && this.journalSection !== targetSection) {
        this.journalSection = targetSection;
        this.journalTurn = null;
        return;
      }
      this._closeUiScreen();
      return;
    }
    this.uiScreen = 'journal';
    this.journalSection = targetSection ?? 0;
    this.journalFactionIndex = 0;
    this.journalEvidenceIndex = 0;
    this.journalPrimaryIndex = 0;
    this.journalTechniqueIndex = 0;
    this.journalDroneBranchIndex = 0;
    this.journalDroneNodeIndex = 0;
    this.journalDroneConfirm = null;
    this.journalTurn = null;
    this.dialogue = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.contextActionMenu = null;
  }

  _handleJournalScreen(actions, click = null) {
    const journalActions = actions.map((action) => {
      if (action === 'scroll-up') return 'up';
      if (action === 'scroll-down') return 'down';
      return action;
    });
    if (this._handleDroneJournalInput?.(journalActions, click)) return;
    if (click) {
      if (click.button !== 0 || this.journalTurn) return;
      const tab = journalTabAt(click, this._journalSections().length);
      const arrow = journalArrowAt(click);
      if (tab !== null) this._turnJournalToSection(tab);
      else if (arrow === 'prev') this._cycleJournalSection(-1);
      else if (arrow === 'next') this._cycleJournalSection(1);
      else if (this._currentJournalSectionId() === 'TECHNIQUES') {
        const entries = techniqueList(this.techniqueDefs);
        const technique = journalTechniqueRowAt(click, entries, this.journalTechniqueIndex);
        if (technique !== null) this.journalTechniqueIndex = technique;
      }
      else if (this._currentJournalSectionId() === 'MAP') this._handleJournalMapClick(click);
      return;
    }
    for (const action of journalActions) {
      if (action === 'cancel' || action === 'journal') {
        this._closeUiScreen();
        return;
      }
      if (action === 'map') {
        const mapSection = journalSectionIndex('MAP', this._journalSections());
        if (mapSection !== null && this.journalSection !== mapSection) {
          this.journalSection = mapSection;
          this.journalTurn = null;
          return;
        }
        this._closeUiScreen();
        return;
      }
      if (action === 'left' || action === 'cycle') this._cycleJournalSection(-1);
      else if (action === 'right') this._cycleJournalSection(1);
      else if (action === 'up') this._moveJournalSelection(-1);
      else if (action === 'down') this._moveJournalSelection(1);
      else if (action === 'confirm') this._confirmJournalSelection();
      else if (action === 'inventory') { this._toggleInventory(); return; }
      else if (action === 'restart') { this._requestRunRestart?.(); return; }
      else if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  _cycleJournalSection(delta) {
    if (this.journalTurn) return;
    const count = this._journalSections().length;
    const from = this.journalSection ?? 0;
    const to = ((from + delta) % count + count) % count;
    if (to === from) return;
    this.journalTurn = {
      from,
      to,
      direction: delta < 0 ? -1 : 1,
      age: 0,
      duration: JOURNAL_TURN_DURATION
    };
  }

  _turnJournalToSection(target) {
    if (this.journalTurn) return false;
    const count = this._journalSections().length;
    const from = this.journalSection ?? 0;
    const to = Math.max(0, Math.min(count - 1, Math.floor(Number(target) || 0)));
    if (to === from) return false;
    this.journalTurn = {
      from,
      to,
      direction: to < from ? -1 : 1,
      age: 0,
      duration: JOURNAL_TURN_DURATION
    };
    return true;
  }

  _advanceJournalTurn(dt) {
    if (!this.journalTurn) return;
    this.journalTurn.age += dt;
    if (this.journalTurn.age >= this.journalTurn.duration) {
      this.journalSection = this.journalTurn.to;
      this.journalTurn = null;
    }
  }

  _moveJournalFaction(delta) {
    const known = (this.codexDefs ?? []).filter((entry) =>
      !entry.unlockedBy || journalConditionMet(entry.unlockedBy, {
        flags: this.flags,
        questReached: this.questReached
      })
    );
    if (!known.length) { this.journalFactionIndex = 0; return; }
    this.journalFactionIndex = Math.max(0, Math.min(known.length - 1, (this.journalFactionIndex ?? 0) + delta));
  }

  _moveJournalSelection(delta) {
    const section = this._currentJournalSectionId();
    if (section === 'NOTES') this._moveJournalEvidence(delta);
    else if (section === 'FACTIONS') this._moveJournalFaction(delta);
    else if (section === 'CHARACTER') this._moveJournalPrimary(delta);
    else if (section === 'TECHNIQUES') this._moveJournalTechnique(delta);
  }

  _moveJournalEvidence(delta) {
    const findings = buildJournalFindings({
      questDefs: this.questDefs,
      questReached: this.questReached,
      journalNotes: this.journalNotes,
      flags: this.flags
    });
    const next = journalEvidenceWindow(findings, (this.journalEvidenceIndex ?? 0) + delta);
    this.journalEvidenceIndex = next.start;
  }

  _moveJournalPrimary(delta) {
    const count = PRIMARY_ATTRIBUTES.length;
    this.journalPrimaryIndex = Math.max(0, Math.min(count - 1, (this.journalPrimaryIndex ?? 0) + delta));
  }

  _moveJournalTechnique(delta) {
    const count = techniqueList(this.techniqueDefs).length;
    if (count <= 0) { this.journalTechniqueIndex = 0; return; }
    this.journalTechniqueIndex = Math.max(0, Math.min(count - 1, (this.journalTechniqueIndex ?? 0) + delta));
  }

  _confirmJournalSelection() {
    const section = this._currentJournalSectionId();
    if (section === 'CHARACTER') this._spendSelectedPrimary();
    else if (section === 'TECHNIQUES') this._learnSelectedTechnique();
  }

  _currentJournalSectionId() {
    const sections = this._journalSections();
    return sections[this.journalSection ?? 0] ?? sections[0];
  }

  _handleJournalMapClick(click) {
    if (click.button !== 0 || this.journalTurn) return false;
    const map = this._buildJournalMap?.();
    const cell = journalMapCellAt(click, map);
    if (!cell) return false;
    if (!this._queueJournalMapWalk?.(cell, map)) return false;
    this._closeUiScreen();
    return true;
  }

  _spendSelectedPrimary() {
    const primary = PRIMARY_ATTRIBUTES[this.journalPrimaryIndex ?? 0];
    if (!primary) return;
    const result = spendPrimaryPoint(this.player?.progression, primary.id);
    if (!result.ok) {
      if (result.reason) this._log(result.reason);
      return;
    }
    this.player.progression = result.progression;
    if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    this._log(`${primary.label} improved.`);
  }

  _learnSelectedTechnique() {
    const technique = techniqueList(this.techniqueDefs)[this.journalTechniqueIndex ?? 0];
    if (!technique) return;
    const result = learnTechnique(this.player?.progression, technique.id, this.techniqueDefs, this._techniqueContext());
    if (!result.ok) {
      if (result.reason) this._log(result.reason);
      return;
    }
    this.player.progression = result.progression;
    if (typeof this.player.refreshProgressionStats === 'function') this.player.refreshProgressionStats();
    this._log(`${technique.name} learned.`);
  }

  _handleLootScreen(actions, click = null) {
    if (click) return;
    const entries = this._currentLootEntries();
    if (!entries.length) {
      this._finalizeLootIfEmpty();
      return;
    }
    this.lootIndex = Math.max(0, Math.min(entries.length - 1, this.lootIndex ?? 0));

    for (const action of actions) {
      if (action === 'cancel' || action === 'space') {
        this._closeUiScreen();
        return;
      }
      if (action === 'restart') {
        this._requestRunRestart?.();
        return;
      }
      if (action === 'debug') {
        this.debugGrid = !this.debugGrid;
        continue;
      }
      if (action === 'up' || action === 'down') {
        this.lootIndex = Math.max(0, Math.min(entries.length - 1, this.lootIndex + (action === 'down' ? 1 : -1)));
        continue;
      }
      if (action === 'left') {
        this._takeAllLoot();
        return;
      }
      if (action === 'interact') {
        this._takeMarkedLoot();
        return;
      }
    }
  }

  _objectShouldOpenLoot(object) {
    return this.lootSession.objectShouldOpen(object);
  }

  _objectShouldShowTextBeforeLoot(object) {
    return this.lootSession.objectShouldShowTextBeforeLoot(object);
  }

  _openObjectTextBeforeLoot(object) {
    return this.lootSession.openObjectTextBeforeLoot(object);
  }

  _openObjectLootScreen(object, { log = true } = {}) {
    this.lootSession.openObjectLootScreen(object, { log });
  }

  _openLootScreen({ title, sourceType, source }) {
    this.lootSession.open({ title, sourceType, source });
  }

  _lootSourceHasItems(loot) {
    return this.lootSession.sourceHasItems(loot);
  }

  _currentLootEntries() {
    return this.lootSession.currentEntries();
  }

  _takeMarkedLoot() {
    this.lootSession.takeMarked();
  }

  _takeAllLoot() {
    this.lootSession.takeAll();
  }

  _finalizeLootIfEmpty() {
    return this.lootSession.finalizeIfEmpty();
  }

  _handleTradeScreen(actions, click = null) {
    this._syncInventoryOrder();
    this._clampTradeSelection();

    if (click) {
      const action = tradeActionAt(click);
      if (action === 'close') {
        this._closeUiScreen();
        return;
      }
      if (action === 'buy') {
        if (this.tradeFocus === 'player') this._sellSelectedTradeItem();
        else this._buySelectedTradeItem();
        return;
      }

      const stockCount = this._tradeStockEntries().length;
      const stockOffset = tradeListOffset(this.tradeStockIndex, stockCount);
      const stockIndex = tradeTraderIndexAt(click, stockCount, stockOffset);
      if (stockIndex !== null) {
        this.tradeFocus = 'trader';
        this.tradeStockIndex = stockIndex;
        this._clampTradeSelection();
        return;
      }

      const playerCount = this._tradePlayerEntries().length;
      const playerOffset = tradeListOffset(this.tradePlayerIndex, playerCount);
      const playerIndex = tradePlayerIndexAt(click, playerCount, playerOffset);
      if (playerIndex !== null) {
        this.tradeFocus = 'player';
        this.tradePlayerIndex = playerIndex;
        this._clampTradeSelection();
      }
      return;
    }

    for (const action of actions) {
      if (action === 'cancel') {
        this._closeUiScreen();
        return;
      }
      if (action === 'inventory') {
        this._closeUiScreen();
        this._toggleInventory();
        return;
      }
      if (action === 'journal') {
        this._closeUiScreen();
        this._toggleJournal();
        return;
      }
      if (action === 'restart') {
        this._requestRunRestart?.();
        return;
      }
      if (action === 'debug') {
        this.debugGrid = !this.debugGrid;
        continue;
      }
      if (action === 'left' || action === 'right' || action === 'cycle') {
        this.tradeFocus = this.tradeFocus === 'player' ? 'trader' : 'player';
        this._clampTradeSelection();
        continue;
      }
      if (action === 'up' || action === 'down') {
        this._moveTradeSelection(action === 'down' ? 1 : -1);
        continue;
      }
      if (action === 'interact' || this._isConfirmAction(action)) {
        if (this.tradeFocus === 'player') this._sellSelectedTradeItem();
        else this._buySelectedTradeItem();
      }
    }
  }

  _openTradeScreen(targetId) {
    return this.tradeSession.open(targetId);
  }

  _tradeStockEntries() {
    return this.tradeSession.stockEntries();
  }

  _tradePlayerEntries() {
    return this.tradeSession.playerEntries();
  }

  _clampTradeSelection() {
    this.tradeSession.clampSelection();
  }

  _moveTradeSelection(delta) {
    this.tradeSession.moveSelection(delta);
  }

  _buySelectedTradeItem() {
    return this.tradeSession.buySelectedItem();
  }

  _sellSelectedTradeItem() {
    return this.tradeSession.sellSelectedItem();
  }

  _buildTradeUi() {
    return this.tradeSession.buildUi();
  }
}

function journalSectionIndex(section, sections) {
  if (typeof section !== 'string' || section.trim() === '') return null;
  const index = sections.indexOf(section.toUpperCase());
  return index >= 0 ? index : null;
}

export function installGameUiScreens(GameClass) {
  installGameMethods(GameClass, GameUiScreens);
}
