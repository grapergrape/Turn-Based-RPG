import { createCustomizationState, currentCustomizationRows, customizationCanConfirm, createPrimaryAssignmentState, primaryAssignmentCanConfirm, primaryAssignmentRows } from '../CharacterCreation.js';
import { chebyshev, manhattan } from '../../combat/CombatSystem.js';
import { findPath } from '../../world/Pathfinder.js';
import { GROUND_ITEM_KIND } from '../../world/GroundItems.js';
import { isObjectLocked } from '../../world/LockSystem.js';
import { VIEWPORT_HEIGHT } from '../../render/renderConfig.js';
import { displayNameForKind } from '../../render/spriteCatalog.js';
import { journalArrowAt } from '../../ui/journalLayout.js';
import { DIALOGUE_MAX_CHOICES } from '../../ui/dialogueLayout.js';
import { AREA_TITLE_DURATION, PLAYER_CUSTOM_PREVIEW_SPRITE_ID } from './runtimeConstants.js';
import { installGameMethods } from './installGameMethods.js';

class GameRenderState {
  // ---- Render ------------------------------------------------------------

  render() {
    if (!this.ready) {
      if (this.loadingState) this.renderer.renderLoading(this.loadingState);
      return;
    }
    if (this.mode === 'intro') {
      this.renderer.renderBriefing({
        title: this.briefingTitle,
        page: this.briefing?.[this.briefingPage] ?? [],
        pageIndex: this.briefingPage,
        pageCount: this.briefing?.length ?? 0,
        nextPrompt: this.briefingNextPrompt,
        lastPrompt: this.briefingLastPrompt,
        skipPrompt: this.briefingSkipPrompt
      });
      return;
    }
    this.renderer.renderFrame({
      focus: { x: this.player.x, y: this.player.y, pxOffset: this.player.pxOffset },
      actors: this.actors,
      ambientSpeakers: this.speakingProps ?? [],
      groundItems: this.groundItems ?? [],
      hiddenTiles: this.hiddenTiles,
      effects: this.effects,
      anim: this.anim,
      time: this._buildClockReadout(),
      overlay: this._buildOverlay(),
      ui: this._buildUi()
    });
  }

  _buildOverlay() {
    const overlay = { mode: this.mode === 'combat' ? 'COMBAT' : 'EXPLORE', debugGrid: this.debugGrid };
    if (this.mode === 'explore' && this.sneakMode) overlay.enemyVisionCones = this._enemyVisionCones();

    if (this.mode === 'combat' && this.turnManager.isPlayerTurn() && !this.moving) {
      overlay.selectedTile = `${this.player.position.x},${this.player.position.y}`;
      const target = this._currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
      const attack = this.player.getAttack(this.selectedAttackId);
      if (attack) {
        overlay.attackRange = new Set(
          this._livingEnemies()
            .filter((enemy) => chebyshev(this.player.position, enemy.position) <= attack.range)
            .map((enemy) => `${enemy.position.x},${enemy.position.y}`)
        );
      }
      // Show the move path to the hovered tile + its AP cost instead of
      // flooding every reachable cell.
      const hover = this._hoverCell();
      if (hover && !this._isCellHidden(hover.x, hover.y) && this.grid.isWalkable(hover.x, hover.y) &&
          !(hover.x === this.player.position.x && hover.y === this.player.position.y)) {
        const path = findPath(this.grid, this.player.position, hover, this._occupiedSet(this.player));
        const budget = Math.floor(this.player.ap / this.player.moveCost);
        if (path && path.length > 0) {
          overlay.pathCells = path.map((c) => `${c.x},${c.y}`);
          overlay.pathTile = `${hover.x},${hover.y}`;
          overlay.pathCost = path.length;
          overlay.pathAffordable = path.length <= budget;
        }
      }
    } else if (this.mode !== 'combat') {
      overlay.footTile = `${this.player.position.x},${this.player.position.y}`;
      const hover = this._hoverTile();
      if (hover) overlay.hoverTile = hover;
      const actionTarget = this._nearbyActionTargetInfo();
      if (actionTarget?.target?.cell && !this.uiScreen && !this.moving) {
        overlay.interactionTile = `${actionTarget.target.cell.x},${actionTarget.target.cell.y}`;
      }
      const target = this._currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
    } else {
      const target = this._currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
    }
    return overlay;
  }

  _enemyVisionCones() {
    return this.stealthRuntime.visionCones();
  }

  _hoverTile() {
    const cell = this._hoverCell();
    if (!cell || this._isCellHidden(cell.x, cell.y) || !this.grid.isWalkable(cell.x, cell.y)) return null;
    return `${cell.x},${cell.y}`;
  }

  _hoverCell() {
    const mouse = this.input.mouse;
    if (!mouse || mouse.y >= VIEWPORT_HEIGHT) return null;
    const cell = this.renderer.toGrid(mouse.x, mouse.y);
    return this.grid.isInside(cell.x, cell.y) ? cell : null;
  }

  _triggeredDialogueEnemy() {
    let best = null;
    let bestDist = Infinity;
    for (const enemy of [...(this.npcs ?? []), ...this.enemies]) {
      if (enemy.isDead || !enemy.dialogue || enemy.dialogueTriggerRadius == null) continue;
      if (this._isCellHidden(enemy.position.x, enemy.position.y)) continue;
      if (enemy.dialogueSeen && !enemy.dialogueRepeat) continue;
      const encounterId = enemy.encounter ? this._resolveEncounterId(enemy.encounter) : null;
      if (encounterId && this.clearedEncounters.has(encounterId)) continue;
      const dist = manhattan(this.player.position, enemy.position);
      if (dist > enemy.dialogueTriggerRadius || dist >= bestDist) continue;
      best = enemy;
      bestDist = dist;
    }
    return best;
  }

  _openEnemyDialogue(enemy) {
    if (!enemy?.dialogue) return;
    enemy.dialogueSeen = true;
    enemy.speech = null;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    this.preCombatTarget = null;
    this._faceToward(this.player, enemy.position);
    this._faceToward(enemy, this.player.position);
    this._openDialogueById(enemy.dialogue, 'start', enemy);
  }

  _objectName(object) {
    if (!object) return 'Unknown';
    if (object.name) return object.name;
    return displayNameForKind(object.kind);
  }

  _targetActionInfo(target) {
    if (target?.type === 'talk') {
      return { state: 'talk', text: `TALK: ${target.actor.name}` };
    }
    if (target?.type === 'corpse') {
      if (this._enemyHasUnclaimedLoot(target.enemy)) {
        return { state: 'loot', text: `LOOT: ${target.enemy.name}` };
      }
      return { state: 'inspect', text: `INSPECT: ${target.enemy.name}` };
    }
    if (target?.type === 'object') return this._objectActionInfo(target.object);
    return null;
  }

  _nearbyActionTargetInfo() {
    if (this.mode !== 'explore' || this.uiScreen) return null;
    const target = this._nearbyExploreActionTarget();
    const info = this._targetActionInfo(target);
    if (!target || !info) return null;
    return { target, ...info };
  }

  _cursorInfo() {
    const mouse = this.input.mouse;
    if (!mouse) return null;
    if (this.uiScreen === 'character-customization' || this.uiScreen === 'primary-assignment') {
      return { x: mouse.x, y: mouse.y, state: 'ui', text: null };
    }
    if (this.uiScreen === 'journal') {
      const arrow = journalArrowAt(mouse);
      const text = arrow === 'prev' ? 'PREV PAGE' : arrow === 'next' ? 'NEXT PAGE' : null;
      return { x: mouse.x, y: mouse.y, state: 'ui', text };
    }
    if (mouse.y >= VIEWPORT_HEIGHT) {
      return { x: mouse.x, y: mouse.y, state: 'ui', text: null };
    }

    const cell = this._hoverCell();
    if (!cell) return { x: mouse.x, y: mouse.y, state: 'blocked', text: 'OUT OF BOUNDS' };

    const target = this._interactionTargetAtCell(cell, this.mode);
    if (target.type === 'combatant') {
      return { x: mouse.x, y: mouse.y, state: 'attack', text: `ATTACK: ${target.actor.name}` };
    }
    if (target.type === 'hostile') {
      const selected = this._currentPreCombatTarget() === target.actor;
      return { x: mouse.x, y: mouse.y, state: 'attack', text: `${selected ? 'ATTACK' : 'TARGET'}: ${target.actor.name}` };
    }
    if (target.type === 'talk') {
      return { x: mouse.x, y: mouse.y, ...this._targetActionInfo(target) };
    }
    if (target.type === 'corpse') {
      return { x: mouse.x, y: mouse.y, ...this._targetActionInfo(target) };
    }
    if (target.type === 'object') {
      return this._objectCursorInfo(mouse, target.object);
    }

    if (target.type === 'move') {
      if (this.mode === 'combat' && this.turnManager.isPlayerTurn()) {
        const path = findPath(this.grid, this.player.position, cell, this._occupiedSet(this.player));
        if (path && path.length > 0) {
          return { x: mouse.x, y: mouse.y, state: 'move', text: `MOVE: ${path.length} AP` };
        }
      }
      return { x: mouse.x, y: mouse.y, state: 'move', text: `MOVE: ${cell.x},${cell.y}` };
    }

    return { x: mouse.x, y: mouse.y, state: 'blocked', text: 'BLOCKED' };
  }

  _objectActionInfo(object) {
    const name = this._objectName(object);
    if (object.kind === GROUND_ITEM_KIND || object.interact?.type === 'ground-item') {
      return { state: 'loot', text: `PICK UP: ${name}` };
    }
    if (isObjectLocked(object)) {
      return { state: 'use', text: `LOCKED: ${name}` };
    }
    if (object.interact?.type === 'container') {
      if (this._objectShouldShowTextBeforeLoot(object)) {
        return { state: 'inspect', text: `INSPECT: ${name}` };
      }
      return { state: 'loot', text: `LOOT: ${name}` };
    }
    if (object.interact?.type === 'corpse' && !object.looted && object.interact?.loot?.length) {
      if (this._objectShouldShowTextBeforeLoot(object)) {
        return { state: 'inspect', text: `INSPECT: ${name}` };
      }
      return { state: 'loot', text: `LOOT: ${name}` };
    }
    if (object.interact?.type === 'altar' ||
        object.interact?.type === 'secret-entrance' ||
        object.interact?.type === 'secret-exit') {
      return { state: 'use', text: `USE: ${name}` };
    }
    if (object.kind === 'cross-martyr') {
      return { state: 'use', text: `APPROACH: ${name}` };
    }
    return { state: 'inspect', text: `INSPECT: ${name}` };
  }

  _objectCursorInfo(mouse, object) {
    return { x: mouse.x, y: mouse.y, ...this._objectActionInfo(object) };
  }

  _buildUi() {
    const target = this._currentTarget();
    const attack = this.player.getAttack(this.selectedAttackId);
    const modeLabel = this.mode === 'explore'
      ? (this.sneakMode ? 'SNEAK' : 'EXPLORE')
      : { combat: 'COMBAT', victory: 'VICTORY', defeat: 'DEFEAT' }[this.mode];
    const crouchControl = this.sneakMode ? 'C Stand' : 'C Crouch';

    let controls;
    if (this.uiScreen === 'character-customization') {
      controls = ['Type Name', 'Arrows Select', 'Enter Confirm'];
    } else if (this.uiScreen === 'primary-assignment') {
      controls = ['Arrows Assign', 'Enter Confirm'];
    } else if (this.uiScreen === 'journal') {
      const journalSection = this._currentJournalSectionId?.() ?? 'QUESTS';
      if (journalSection === 'FACTIONS') controls = ['Up/Dn Select', 'A/D Turn Page', 'M Map', 'J/Esc Close'];
      else if (journalSection === 'CHARACTER' || journalSection === 'TECHNIQUES') controls = ['Up/Dn Select', 'Enter Confirm', 'M Map', 'J/Esc Close'];
      else if (journalSection === 'MAP') controls = ['Click Walk', 'A/D Turn Page', 'M/J/Esc Close'];
      else controls = ['A/D Turn Page', 'M Map', 'J/Esc Close'];
    } else if (this.uiScreen === 'inventory') {
      controls = this.inventorySplit
        ? ['Left/Right Count', 'Enter Drop', 'Esc Back']
        : ['Click Select', 'Right Menu', 'Shift Sort', 'Ctrl Split', 'Esc Close'];
    } else if (this.uiScreen === 'loot') {
      controls = ['Up/Dn Mark', 'E Pick Item', 'A Pick All', 'Space Leave'];
    } else if (this.uiScreen === 'trade') {
      controls = ['Up/Dn Select', 'A/D Side', 'E Buy', 'Esc Close'];
    } else if (this.uiScreen === 'dialogue' && this.dialogue?.choices?.length) {
      const choiceMax = Math.min(this.dialogue.choices.length, DIALOGUE_MAX_CHOICES);
      const choiceHelp = choiceMax === 1 ? '1 Choose' : `1 TO ${choiceMax} Choose`;
      controls = this.dialogue.mustChoose
        ? [choiceHelp, 'Enter First']
        : [choiceHelp, 'Enter First', 'Esc Close', 'I Pack'];
    } else if (this.uiScreen === 'dialogue') {
      controls = ['Enter Close', 'Esc Close', 'I Pack'];
    } else if (this.mode === 'combat') {
      controls = ['Click/WASD Move', '1 Knife 2 Gun', 'Tab Target', 'Space Attack', 'E End Turn', 'I Pack', 'M Map', 'H Dress'];
    } else if (this.mode === 'explore' && target) {
      controls = ['Space Attack', '1 Knife 2 Gun', 'Right Click Target', 'Esc Clear', crouchControl, 'I Pack', 'M Map'];
    } else {
      controls = ['Click Move/Use', 'WASD Move', crouchControl, 'Hold Shift Sprint', 'I Pack', 'J Journal', 'M Map', 'H Dressing'];
    }

    const cursor = this._cursorInfo();
    const nearbyAction = this._nearbyActionTargetInfo();

    return {
      levelName: this.level.name,
      actorName: this.player.name,
      role: this.player.role ?? null,
      mode: modeLabel,
      sneakMode: this.mode === 'explore' && this.sneakMode,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      ap: this.player.ap,
      maxAp: this.player.maxAp,
      action: attack ? attack.name : '-',
      target: target ? `${this._shortName(target.name)} ${target.hp}/${target.maxHp}` : '-',
      inventory: this.inventory.summary(),
      inventoryItems: this._inventoryEntries(),
      inventoryIndex: this.inventoryIndex ?? 0,
      inventoryFocus: this.inventoryFocus ?? 'items',
      inventoryMoveIndex: this.inventoryMoveIndex,
      inventoryActionMenu: this._currentInventoryActionMenu(),
      inventorySplit: this._currentInventorySplit(),
      ducats: this.inventory.count('ducat'),
      figureSpriteId: this.player.spriteId,
      equipmentSlots: this.inventory.equipmentEntries(),
      equipmentIndex: this.equipmentIndex ?? 0,
      carryWeight: this.inventory.currentWeight(),
      maxCarryWeight: this.inventory.maxCarryWeight,
      areaTitle: this.areaTitleTimer > 0
        ? { text: this.areaTitle, ttl: this.areaTitleTimer, duration: AREA_TITLE_DURATION }
        : null,
      screen: this.uiScreen,
      loot: this.uiScreen === 'loot' ? {
        title: this.loot?.title ?? 'Loot',
        entries: this._currentLootEntries(),
        index: this.lootIndex ?? 0
      } : null,
      trade: this.uiScreen === 'trade' ? this._buildTradeUi() : null,
      characterCreation: this.uiScreen === 'character-customization' ? {
        name: this.characterCreation?.name ?? this.player.name,
        rows: currentCustomizationRows(this.characterCreation ?? createCustomizationState(this.player)),
        canConfirm: customizationCanConfirm(this.characterCreation ?? createCustomizationState(this.player)),
        error: this.characterCreation?.error ?? '',
        previewSpriteId: PLAYER_CUSTOM_PREVIEW_SPRITE_ID
      } : null,
      primaryAssignment: this.uiScreen === 'primary-assignment' ? {
        rows: primaryAssignmentRows(this.primaryAssignment ?? createPrimaryAssignmentState(this.player)),
        pointsRemaining: this.primaryAssignment?.pointsRemaining ?? 0,
        canConfirm: primaryAssignmentCanConfirm(this.primaryAssignment ?? createPrimaryAssignmentState(this.player))
      } : null,
      journal: this.uiScreen === 'journal' ? this._buildJournal() : null,
      dialogue: this.dialogue,
      contextActionMenu: this.contextActionMenu,
      nearbyActionText: nearbyAction ? `E ${nearbyAction.text}` : null,
      hoverText: cursor?.text ?? null,
      cursor,
      log: this.log,
      controls
    };
  }
}

export function installGameRenderState(GameClass) {
  installGameMethods(GameClass, GameRenderState);
}
