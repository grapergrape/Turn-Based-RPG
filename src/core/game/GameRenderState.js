import { createCustomizationState, currentCustomizationRows, customizationCanConfirm, createPrimaryAssignmentState, primaryAssignmentCanConfirm, primaryAssignmentRows } from '../CharacterCreation.js';
import { hazardOverlayTiles } from '../../combat/CombatHazards.js';
import { chebyshev, manhattan } from '../../combat/CombatSystem.js';
import { visibleStatuses } from '../../combat/StatusEffects.js';
import { findPath } from '../../world/Pathfinder.js';
import { GROUND_ITEM_KIND } from '../../world/GroundItems.js';
import { isObjectLocked } from '../../world/LockSystem.js';
import { isOpenDoorObject, objectGroupId } from '../../world/DoorSystem.js';
import { investigationRangeForSearch } from '../../world/SearchSystem.js';
import { compactCoverLabel } from '../../world/CoverSystem.js';
import { VIEWPORT_HEIGHT } from '../../render/renderConfig.js';
import { displayNameForKind } from '../../render/spriteCatalog.js';
import { journalArrowAt } from '../../ui/journalLayout.js';
import { DIALOGUE_MAX_CHOICES } from '../../ui/dialogueLayout.js';
import {
  AREA_TITLE_DURATION,
  PLAYER_CUSTOM_PREVIEW_SPRITE_ID,
  SNEAK_ATTACK_MULTIPLIER,
  isExplorationMode
} from './runtimeConstants.js';
import { installGameMethods } from './installGameMethods.js';

class GameRenderState {
  // ---- Render ------------------------------------------------------------

  render() {
    if (!this.ready) {
      if (this.loadingState) this.renderer.renderLoading(this.loadingState);
      return;
    }
    if (this.mode === 'title') {
      this.renderer.renderMenu(this._buildTitleUi?.() ?? { screen: 'title', save: {} });
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
    const focusActor = this._activeControlledActor?.() ?? this.player;
    this.renderer.renderFrame({
      focus: { x: focusActor.x, y: focusActor.y, pxOffset: focusActor.pxOffset },
      actors: this.actors,
      ambientSpeakers: this.speakingProps ?? [],
      groundItems: this.groundItems ?? [],
      dynamicProps: this.combatDeployables ?? [],
      hiddenTiles: this.hiddenTiles,
      effects: this.effects,
      anim: this.anim,
      time: this._buildClockReadout(),
      hoveredWorldTarget: this._hoveredWorldTarget(),
      overlay: this._buildOverlay(),
      ui: this._buildUi()
    });
  }

  _hoveredWorldTarget() {
    if (this.uiScreen || this.moving || !this.ready) return null;
    const mouse = this.input?.mouse;
    let target = null;
    if (mouse && mouse.y < VIEWPORT_HEIGHT) {
      const cell = this._interactionHighlightCellFromPoint(mouse, this.mode) ?? this._hoverCell();
      if (cell) target = this._interactionTargetAtCell(cell, this.mode);
    }

    if (target?.type === 'object') {
      const object = target.object;
      const action = this._objectActionInfo(object)?.state ?? 'inspect';
      return {
        type: 'object',
        identity: renderIdentity(object, 'object'),
        kind: object.kind,
        action,
        anchor: { x: object.x, y: object.y },
        interactionCell: normalizedCell(object.interactionMarker ?? target.cell ?? object)
      };
    }

    if (target?.type === 'talk' || target?.type === 'corpse' || target?.type === 'hostile' || target?.type === 'combatant') {
      const actor = target.actor ?? target.enemy;
      if (!actor) return null;
      const action = target.type === 'hostile' || target.type === 'combatant'
        ? 'attack'
        : this._targetActionInfo(target)?.state ?? (target.type === 'talk' ? 'talk' : 'inspect');
      return {
        type: 'actor',
        identity: renderIdentity(actor, 'actor'),
        action,
        anchor: normalizedCell(actor.position ?? actor),
        interactionCell: normalizedCell(target.cell ?? actor.position ?? actor)
      };
    }

    const selected = this._currentTarget?.();
    if (selected && !selected.isDead) {
      return {
        type: 'actor',
        identity: renderIdentity(selected, 'actor'),
        action: 'attack',
        anchor: normalizedCell(selected.position ?? selected),
        interactionCell: normalizedCell(selected.position ?? selected)
      };
    }

    if (this.mode === 'explore' && !mouse) {
      const nearby = this._nearbyExploreActionTarget?.();
      if (nearby?.type === 'object') {
        const object = nearby.object;
        return {
          type: 'object',
          identity: renderIdentity(object, 'object'),
          kind: object.kind,
          action: this._objectActionInfo(object)?.state ?? 'inspect',
          anchor: { x: object.x, y: object.y },
          interactionCell: normalizedCell(object.interactionMarker ?? nearby.cell ?? object)
        };
      }
      const actor = nearby?.actor ?? nearby?.enemy;
      if (actor) {
        return {
          type: 'actor',
          identity: renderIdentity(actor, 'actor'),
          action: this._targetActionInfo(nearby)?.state ?? 'talk',
          anchor: normalizedCell(actor.position ?? actor),
          interactionCell: normalizedCell(nearby.cell ?? actor.position ?? actor)
        };
      }
    }
    return null;
  }

  _buildOverlay() {
    const overlay = { mode: this.mode === 'combat' ? 'COMBAT' : 'EXPLORE', debugGrid: this.debugGrid };
    const controlled = this._activeControlledActor?.() ?? this.player;
    if (this.mode === 'combat') overlay.hazardTiles = hazardOverlayTiles(this.combatHazards ?? []);
    if (this.mode === 'explore' && this.sneakMode) overlay.enemyVisionCones = this._enemyVisionCones();

    if (this.mode === 'combat' && this.turnManager.isPlayerTurn() && !this.moving) {
      overlay.selectedTile = `${controlled.position.x},${controlled.position.y}`;
      const target = this._currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
      const abilityTargets = this._combatAbilityTargetCells?.();
      if (abilityTargets) overlay.abilityTargets = abilityTargets;
      const attack = controlled.type === 'companion'
        ? controlled.attacks?.[0]
        : controlled.getAttack(this.selectedAttackId);
      if (attack && !abilityTargets) {
        overlay.attackRange = new Set(
          this._livingEnemies()
            .filter((enemy) => chebyshev(controlled.position, enemy.position) <= attack.range)
            .map((enemy) => `${enemy.position.x},${enemy.position.y}`)
        );
      }
      // Show the move path to the hovered tile + its AP cost instead of
      // flooding every reachable cell.
      const hover = abilityTargets ? null : this._hoverCell();
      if (hover && !this._isCellHidden(hover.x, hover.y) && this.grid.isWalkable(hover.x, hover.y) &&
          !(hover.x === controlled.position.x && hover.y === controlled.position.y)) {
        const path = findPath(this.grid, controlled.position, hover, this._occupiedSet(controlled));
        const moveCost = Math.max(1, this._combatMoveApCost?.(controlled) ?? controlled.moveCost);
        const budget = Math.floor(controlled.ap / moveCost);
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
      const interactionHighlights = this._interactionHighlights();
      if (interactionHighlights.length > 0) overlay.interactionHighlights = interactionHighlights;
      const actionTarget = this._nearbyActionTargetInfo();
      if (actionTarget?.target?.cell && !this.uiScreen && !this.moving) {
        const marker = actionTarget.target.object?.interactionMarker ?? actionTarget.target.cell;
        overlay.interactionTile = `${marker.x},${marker.y}`;
      }
      const target = this._currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
    } else {
      const target = this._currentTarget();
      if (target) overlay.targetTile = `${target.position.x},${target.position.y}`;
    }
    return overlay;
  }

  _interactionHighlights() {
    if (!isExplorationMode(this.mode) || this.uiScreen || !this.player?.position || !this.input?.isHeld?.('tab')) return [];

    const highlights = [];
    const seen = new Set();
    const searchRating = this._actorFieldRating?.(this.player, 'search')
      ?? this._fieldRating?.('search')
      ?? 0;
    const investigationRange = investigationRangeForSearch(searchRating);
    const add = ({ identity, cell, targetCell = cell, label, action = 'inspect' }) => {
      if (!cell || !targetCell || this._isCellHidden(cell.x, cell.y) || seen.has(identity)) return;
      if (chebyshev(this.player.position, targetCell) > investigationRange) return;
      seen.add(identity);
      highlights.push({
        key: `${cell.x},${cell.y}`,
        targetKey: `${targetCell.x},${targetCell.y}`,
        label,
        action
      });
    };

    for (const object of this._allInteractables()) {
      if (object.consumed || isOpenDoorObject(object) || this._isCellHidden(object.x, object.y)) continue;
      const groupId = object.interact?.type === 'door' ? objectGroupId(object) : null;
      const marker = object.interactionMarker ?? object;
      const count = object.interact?.type === 'ground-item' && (object.count ?? 1) > 1
        ? `${object.count}x `
        : '';
      add({
        identity: groupId ? `group:${groupId}` : `object:${object.id ?? `${object.x},${object.y},${object.kind}`}`,
        cell: marker,
        targetCell: object,
        label: `${count}${this._objectName(object)}`,
        action: this._objectActionInfo(object)?.state ?? 'inspect'
      });
    }

    for (const enemy of this.enemies ?? []) {
      if (!enemy.isDead || (!enemy.inspect && !this._enemyHasUnclaimedLoot(enemy))) continue;
      if (this._isCellHidden(enemy.position.x, enemy.position.y)) continue;
      add({
        identity: `corpse:${enemy.spawnId ?? enemy.id ?? `${enemy.position.x},${enemy.position.y}`}`,
        cell: enemy.position,
        targetCell: enemy.position,
        label: enemy.name ?? 'Body',
        action: this._targetActionInfo({ type: 'corpse', enemy })?.state ?? 'inspect'
      });
    }

    return highlights;
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
      if (enemy.dormant || enemy.isDead || !enemy.dialogue || enemy.dialogueTriggerRadius == null) continue;
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
      if (target.enemy?.inspect && !target.enemy.inspectShownBeforeLoot) {
        return { state: 'inspect', text: `INSPECT: ${target.enemy.name}` };
      }
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

  _attackPreviewForUi(target, options = {}) {
    const actor = this._activeControlledActor?.() ?? this.player;
    const attack = actor.type === 'companion'
      ? actor.attacks?.[0]
      : actor?.getAttack?.(this.selectedAttackId);
    if (!attack || !target || typeof this._attackPreview !== 'function') return null;
    const sneakAttack = this.mode === 'explore' && this._canOpenWithSneakAttack?.(target, attack);
    return this._attackPreview(actor, target, attack, {
      ignoreApCost: this.mode === 'explore',
      sneakAttack,
      damageMultiplier: sneakAttack ? SNEAK_ATTACK_MULTIPLIER : 1,
      ...options
    });
  }

  _attackReadout(attack, preview) {
    if (!attack) return '-';
    if (!preview) return attack.name;
    if (preview.enabled && preview.chanceText) {
      return [attack.name, preview.chanceText, preview.damageText].filter(Boolean).join(' ');
    }
    if (!preview.enabled && preview.reason) return `${attack.name} ${preview.reason.toUpperCase()}`;
    return attack.name;
  }

  _targetReadout(target, preview) {
    if (!target) return '-';
    const cover = compactCoverLabel(preview?.cover?.level);
    const coverText = cover ? ` ${cover}` : '';
    const statuses = visibleStatuses(target).map((status) => status.label.toUpperCase().slice(0, 3));
    const statusText = statuses.length ? ` ${statuses.slice(0, 2).join(' ')}` : '';
    const fullName = String(target.name ?? 'Target');
    const displayName = fullName.length <= 12 ? fullName : this._shortName(fullName);
    return `${displayName} ${target.hp}/${target.maxHp}${coverText}${statusText}`;
  }

  _attackCursorText(prefix, target) {
    const preview = this._attackPreviewForUi(target);
    if (!preview) return `${prefix}: ${target.name}`;
    if (preview.enabled && preview.chanceText) {
      return [ `${prefix}: ${target.name}`, preview.chanceText, preview.damageText ].filter(Boolean).join(' ');
    }
    if (preview.reason) return `${preview.reason.toUpperCase()}: ${target.name}`;
    return `${prefix}: ${target.name}`;
  }

  _cursorInfo() {
    const mouse = this.input.mouse;
    if (!mouse) return null;
    if (this.uiScreen === 'character-customization' || this.uiScreen === 'primary-assignment' || this.uiScreen === 'drone-shrine') {
      return { x: mouse.x, y: mouse.y, state: 'ui', text: null };
    }
    if (this.uiScreen === 'journal') {
      const arrow = journalArrowAt(mouse);
      const text = arrow === 'prev' ? 'PREV PAGE' : arrow === 'next' ? 'NEXT PAGE' : null;
      return { x: mouse.x, y: mouse.y, state: 'ui', text };
    }
    const abilityCursor = this._combatAbilityCursorInfo?.(mouse);
    if (abilityCursor) return abilityCursor;
    if (mouse.y >= VIEWPORT_HEIGHT) {
      return { x: mouse.x, y: mouse.y, state: 'ui', text: null };
    }

    const cell = this._interactionHighlightCellFromPoint(mouse, this.mode) ?? this._hoverCell();
    if (!cell) return { x: mouse.x, y: mouse.y, state: 'blocked', text: 'OUT OF BOUNDS' };

    const target = this._interactionTargetAtCell(cell, this.mode);
    if (target.type === 'combatant') {
      return { x: mouse.x, y: mouse.y, state: 'attack', text: this._attackCursorText('ATTACK', target.actor) };
    }
    if (target.type === 'hostile') {
      const selected = this._currentPreCombatTarget() === target.actor;
      return { x: mouse.x, y: mouse.y, state: 'attack', text: this._attackCursorText(selected ? 'ATTACK' : 'TARGET', target.actor) };
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
        const controlled = this._activeControlledActor?.() ?? this.player;
        const path = findPath(this.grid, controlled.position, cell, this._occupiedSet(controlled));
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
        object.interact?.type === 'drone-shrine' ||
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
    this._refreshPlayerAttacks?.();
    const controlled = this._activeControlledActor?.() ?? this.player;
    const target = this._currentTarget();
    const attack = controlled.type === 'companion'
      ? controlled.attacks?.[0]
      : controlled.getAttack(this.selectedAttackId);
    const attackPreview = this._attackPreviewForUi(target);
    const modeLabel = this.mode === 'explore'
      ? (this.sneakMode ? 'SNEAK' : 'EXPLORE')
      : { combat: 'COMBAT', victory: 'VICTORY', defeat: 'DEFEAT' }[this.mode];
    const crouchControl = this.sneakMode ? 'C Stand' : 'C Crouch';
    const ghostLightControl = this.mode === 'explore' &&
      !this._activeCompanion?.()?.isDead &&
      this.companionRun?.upgrades?.includes('veil-ghost-light')
      ? 'Ctrl Right Ghost Light'
      : null;
    const targetingAbility = this.mode === 'combat'
      ? this._combatAbilityTargetingEntry?.(controlled)
      : null;

    let controls;
    if (this.uiScreen === 'character-customization') {
      controls = ['Type Name', 'Arrows Select', 'Enter Confirm'];
    } else if (this.uiScreen === 'primary-assignment') {
      controls = ['Arrows Assign', 'Enter Confirm'];
    } else if (this.uiScreen === 'journal') {
      const journalSection = this._currentJournalSectionId?.() ?? 'QUESTS';
      if (journalSection === 'NOTES') controls = ['Wheel/Up/Dn Scroll', 'A/D Turn Page', 'M Map', 'J/Esc Close'];
      else if (journalSection === 'FACTIONS') controls = ['Up/Dn Select', 'A/D Turn Page', 'M Map', 'J/Esc Close'];
      else if (journalSection === 'CHARACTER' || journalSection === 'TECHNIQUES') controls = ['Up/Dn Select', 'Enter Confirm', 'M Map', 'J/Esc Close'];
      else if (journalSection === 'DRONE') controls = ['Up/Dn Select', 'A/D Branch', 'Enter Install', 'Tab Turn Page', 'J/Esc Close'];
      else if (journalSection === 'MAP') controls = ['Click Walk', 'A/D Turn Page', 'M/J/Esc Close'];
      else controls = ['A/D Turn Page', 'M Map', 'J/Esc Close'];
    } else if (this.uiScreen === 'inventory') {
      controls = this.inventoryRepair
        ? ['Up/Dn Donor', 'Enter Repair', 'Esc Back']
        : this.inventorySplit
        ? ['Left/Right Count', 'Enter Drop', 'Esc Back']
        : ['1/2 Ready Slot', 'R Reload', 'Right Menu', 'Shift Sort', 'Esc Close'];
    } else if (this.uiScreen === 'loot') {
      controls = ['Up/Dn Mark', 'E Pick Item', 'A Pick All', 'Space Leave'];
    } else if (this.uiScreen === 'trade') {
      controls = ['Up/Dn Select', 'A/D Side', this.tradeFocus === 'player' ? 'E Sell' : 'E Buy', 'Esc Close'];
    } else if (this.uiScreen === 'dialogue' && this.dialogue?.choices?.length) {
      const choiceMax = Math.min(this.dialogue.choices.length, DIALOGUE_MAX_CHOICES);
      const choiceHelp = choiceMax === 1 ? '1 Choose' : `1 TO ${choiceMax} Choose`;
      controls = this.dialogue.mustChoose
        ? [choiceHelp, 'Enter First']
        : [choiceHelp, 'Enter First', 'Esc Close', 'I Pack'];
    } else if (this.uiScreen === 'dialogue') {
      controls = ['Enter Close', 'Esc Close', 'I Pack'];
    } else if (this.mode === 'combat' && targetingAbility) {
      controls = [`${targetingAbility.name} Select ${targetingAbility.targetPrompt}`, 'Click Target', 'Right Click Cancel', 'Esc Cancel'];
    } else if (this.mode === 'combat' && controlled.type === 'companion') {
      controls = ['Click/WASD Move', 'Click Ability Then Target', 'Right Click All Actions', 'Space Arc Pin', 'E End Turn', 'J Drone Tree', 'M Map'];
    } else if (this.mode === 'combat') {
      controls = ['Click/WASD Move', 'Click Ability Then Target', 'Right Click All Actions', '1/2 Ready Weapon', 'Space Attack', 'E End Turn', 'I Pack M Map'];
    } else if (this.mode === 'explore' && target) {
      controls = ['Space Attack', '1/2 Ready Weapon', 'R Reload', 'Right Click Target', ghostLightControl, 'Hold Tab Highlight', 'Esc Clear', crouchControl, 'I Pack M Map'].filter(Boolean);
    } else {
      controls = ['Click/WASD Move', crouchControl, ghostLightControl, 'Hold Shift Sprint', 'Hold Tab Highlight', 'I Pack J Journal', 'M Map H Dressing'].filter(Boolean);
    }

    const cursor = this._cursorInfo();
    const nearbyAction = this._nearbyActionTargetInfo();

    return {
      levelName: this.level.name,
      actorName: controlled.name,
      role: controlled.type === 'companion' ? 'Field Attendant' : controlled.role ?? null,
      mode: modeLabel,
      sneakMode: this.mode === 'explore' && this.sneakMode,
      hp: controlled.hp,
      maxHp: controlled.maxHp,
      ap: controlled.ap,
      maxAp: controlled.maxAp,
      statuses: visibleStatuses(controlled),
      action: this._attackReadout(attack, attackPreview),
      actionName: attack?.name ?? '-',
      actionChance: attackPreview?.enabled ? attackPreview.chanceText ?? '' : '',
      actionDamage: attackPreview?.enabled ? attackPreview.damageText ?? '' : '',
      actionReason: attackPreview && !attackPreview.enabled ? attackPreview.reason ?? '' : '',
      actionAmmo: attack?.magazineCapacity == null
        ? ''
        : `A${attack.loaded}/${attack.magazineCapacity} R${attack.reserveAmmo ?? 0}`,
      target: this._targetReadout(target, attackPreview),
      inventory: this.inventory.summary(),
      inventoryItems: this._inventoryEntries(),
      inventoryIndex: this.inventoryIndex ?? 0,
      inventoryFocus: this.inventoryFocus ?? 'items',
      inventoryMoveIndex: this.inventoryMoveIndex,
      inventoryActionMenu: this._currentInventoryActionMenu(),
      inventorySplit: this._currentInventorySplit(),
      inventoryRepair: this._currentInventoryRepair?.(),
      ducats: this.inventory.count('ducat'),
      figureSpriteId: controlled.spriteId,
      equipmentSlots: this.inventory.equipmentEntries(),
      equipmentIndex: this.equipmentIndex ?? 0,
      carryWeight: this.inventory.currentWeight(),
      maxCarryWeight: this.inventory.maxCarryWeight,
      areaTitle: this.areaTitleTimer > 0 && this.mode !== 'combat'
        ? { text: this.areaTitle, ttl: this.areaTitleTimer, duration: AREA_TITLE_DURATION }
        : null,
      journalNotice: this.journalNotice?.ttl > 0 && this.uiScreen !== 'journal'
        ? { ...this.journalNotice }
        : null,
      screen: this.uiScreen,
      save: this._isSaveScreen?.() ? this._buildSaveMenuUi?.() : null,
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
      droneShrine: this.uiScreen === 'drone-shrine' ? this._buildDroneShrineUi?.() : null,
      journal: this.uiScreen === 'journal' ? this._buildJournal() : null,
      dialogue: this.dialogue,
      combatAbilityTray: this._buildCombatAbilityTray?.(),
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

function normalizedCell(value) {
  const x = Number(value?.x);
  const y = Number(value?.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function renderIdentity(target, type) {
  if (type === 'actor') {
    return String(target?.spawnId ?? target?.id ?? `${target?.spriteId ?? 'actor'}:${target?.x},${target?.y}`);
  }
  return String(target?.id ?? target?.spawnId ?? `${target?.kind ?? 'object'}:${target?.x},${target?.y}`);
}
