import { FIELD_RATINGS, PRIMARY_ATTRIBUTES, calculateFieldRating, normalizeProgression } from '../Progression.js';
import { meetsDialogueConditions } from '../DialogueConditions.js';
import { DIALOGUE_MAX_CHOICES, buildDialogueLayout } from '../../ui/dialogueLayout.js';
import { installGameMethods } from './installGameMethods.js';

class GameDialogueRuntime {
  _openDialogue(title, lines, kind = 'inspect') {
    const cleanLines = [].concat(lines ?? []).filter(Boolean);
    if (cleanLines.length === 0) return;
    this.dialogueActor = null;
    this._setDialogueState({
      title,
      kind,
      lines: cleanLines,
      choices: [],
      scroll: 0,
      options: ['ENTER CLOSE', 'ESC CLOSE']
    });
  }

  _openDialogueById(dialogueId, nodeId = 'start', sourceActor = null) {
    const definition = this.dialogueDefs[dialogueId];
    if (!definition) {
      this._log(`Missing dialogue: ${dialogueId}.`);
      return;
    }
    this.dialogueActor = sourceActor;
    this._setDialogueNode(definition, nodeId);
  }

  _setDialogueNode(definition, nodeId) {
    let node = definition.nodes?.[nodeId];
    // A node may be gated on story flags / quest stages. If its conditions are
    // not met it redirects to its `else` node, so (for example) a locked safe
    // only names the key's hiding place once the warden's journal has been read.
    let guard = 0;
    while (node && node.conditions && !this._meetsConditions(node.conditions)) {
      if (!node.else || guard++ > 8) break;
      nodeId = node.else;
      node = definition.nodes?.[nodeId];
    }
    if (!node) {
      this._log(`Missing dialogue node: ${definition.id}.${nodeId}.`);
      return;
    }
    // Showing a node can set run-global flags. This is idempotent (a Set), so
    // re-reading the same note is safe; one-shot effects stay on choices.
    if (node.effects?.setFlag) {
      for (const flag of [].concat(node.effects.setFlag)) this.flags.add(flag);
    }
    const lines = [].concat(node.lines ?? node.text ?? []).filter(Boolean);
    const choices = (node.choices ?? [])
      .filter((choice) => this._meetsConditions(choice.conditions))
      .slice(0, DIALOGUE_MAX_CHOICES);
    this._setDialogueState({
      id: definition.id,
      nodeId,
      title: node.title ?? definition.title ?? 'Inspect',
      kind: 'dialogue',
      // The talking head above the window: only actor conversations carry a
      // speaker sprite; prop and note dialogues stay text-only.
      speakerSpriteId: this.dialogueActor?.spriteId ?? null,
      lines,
      choices,
      mustChoose: Boolean(definition.mustChoose || node.mustChoose),
      scroll: 0,
      options: choices.length > 0
        ? choices.map((choice, index) => `${index + 1}. ${choice.label}`)
        : ['ENTER CLOSE', 'ESC CLOSE']
    });
  }

  _setDialogueState(dialogue) {
    this.uiScreen = 'dialogue';
    this.dialogue = dialogue;
    this._syncDialogueLayout();
  }

  _syncDialogueLayout() {
    if (!this.dialogue) return;
    const layout = buildDialogueLayout(this.dialogue);
    this.dialogue.scroll = layout.scroll;
    this.dialogue.maxScroll = layout.maxScroll;
  }

  // True when every flag, quest, scar, Trace, and field-rating gate is satisfied.
  _meetsConditions(conditions) {
    return meetsDialogueConditions(conditions, {
      flags: this.flags,
      questStages: this.questStages,
      hasScar: (scarId, rank) => this._hasScar(scarId, rank),
      fieldRating: (fieldId) => this._fieldRating(fieldId),
      traceValue: () => this._traceValue(),
      itemCount: (itemId) => this.inventory?.count(itemId) ?? 0
    });
  }

  _playerProgression() {
    return normalizeProgression(this.player?.progression);
  }

  _hasScar(scarId, rank = 1) {
    const minRank = typeof rank === 'number' ? rank : 1;
    return this._playerProgression().scars.some((scar) => scar.id === scarId && scar.rank >= minRank);
  }

  _fieldRating(fieldId) {
    const field = FIELD_RATINGS.find((entry) => entry.id === fieldId);
    if (!field) return Number.NEGATIVE_INFINITY;
    return calculateFieldRating(this._playerProgression(), field);
  }

  _primaryRating(primaryId) {
    return this._playerProgression().primaries[primaryId] ?? Number.NEGATIVE_INFINITY;
  }

  _fieldLabel(fieldId) {
    return FIELD_RATINGS.find((entry) => entry.id === fieldId)?.label ?? fieldId;
  }

  _primaryLabel(primaryId) {
    return PRIMARY_ATTRIBUTES.find((entry) => entry.id === primaryId)?.label ?? primaryId;
  }

  _traceValue() {
    return this._playerProgression().trace;
  }

  _handleDialogueScreen(actions) {
    const choices = this.dialogue?.choices ?? [];
    this._syncDialogueLayout();
    for (const action of actions) {
      if (action === 'up') {
        this.dialogue.scroll = Math.max(0, (this.dialogue.scroll ?? 0) - 1);
        this._syncDialogueLayout();
        continue;
      }
      if (action === 'down') {
        this.dialogue.scroll = Math.min(this.dialogue.maxScroll ?? 0, (this.dialogue.scroll ?? 0) + 1);
        this._syncDialogueLayout();
        continue;
      }
      if (choices.length > 0) {
        const choiceIndex = this._dialogueChoiceIndex(action);
        if (choiceIndex !== null) {
          this._chooseDialogueOption(choiceIndex);
          return;
        }
        if (this._isConfirmAction(action) || action === 'interact') {
          this._chooseDialogueOption(0);
          return;
        }
        if (action === 'cancel' && !this.dialogue?.mustChoose) {
          this._closeDialogueScreen({ openPendingLoot: false });
          return;
        }
      } else if (action === 'cancel') {
        this._closeDialogueScreen({ openPendingLoot: false });
        return;
      } else if (this._isConfirmAction(action) || action === 'interact') {
        this._closeDialogueScreen();
        return;
      }

      if (this.dialogue?.mustChoose && choices.length > 0) {
        if (action === 'restart') {
          this.boot();
          return;
        }
        if (action === 'debug') this.debugGrid = !this.debugGrid;
        continue;
      }

      if (action === 'inventory') {
        this._toggleInventory();
        return;
      }
      if (action === 'dressing') {
        this._log(this.inventory.useFieldDressing(this.player));
        this._syncInventoryOrder();
        this._clampInventorySelection();
        return;
      }
      if (action === 'restart') {
        this.boot();
        return;
      }
      if (action === 'debug') this.debugGrid = !this.debugGrid;
    }
  }

  _dialogueChoiceIndex(action) {
    const choiceKeys = { melee: 0, sidearm: 1, choice3: 2, choice4: 3, choice5: 4 };
    return choiceKeys[action] ?? null;
  }

  _chooseDialogueOption(index) {
    const choice = this.dialogue?.choices?.[index];
    if (!choice) return;
    if (choice.lockAction) {
      this._chooseLockOption(choice.lockAction);
      return;
    }
    if (choice.searchAction) {
      this._chooseSearchOption(choice.searchAction);
      return;
    }
    const didTransition = this._applyEffects(choice.effects);
    if (didTransition) return;
    const definition = this.dialogueDefs[this.dialogue.id];
    if (choice.next && definition) {
      this._setDialogueNode(definition, choice.next);
      return;
    }
    if (choice.close !== false) this._closeDialogueScreen();
  }

  _applyEffects(effects) {
    return this.dialogueEffects.apply(effects);
  }

  // End a still-living staged victim (the crucified Opened Saint, or its cellar
  // successor): it stops whispering, its backlight gutters out, and it will not
  // offer the choice again. `consumed` keeps the prop killed across re-entry.
  _silenceProp(propId) {
    const prop = (this.level.props ?? []).find((object) => object.id === propId);
    if (!prop) return;
    prop.killed = true;
    prop.consumed = true;
    prop.speech = null;
    prop.ambient = [];
    // A crucified saint cut down falls off the cross and dies on the ground; the
    // renderer animates the drop from this timestamp.
    if (prop.kind === 'cross-martyr') {
      prop.released = true;
      prop.fallStart = this.anim?.tick ?? 0;
    }
  }

  async _transitionLevel(effect) {
    this._closeUiScreen();
    this._snapshotLevelState();
    this.ready = false;
    this.levelPath = effect.path ?? this.levelPath;
    await this.boot({ preserveRun: true, player: effect.player ?? null });
  }

  _teleportPlayer(point) {
    if (!point || !this.grid.isWalkable(point.x, point.y)) return;
    this.player.moveTo(point.x, point.y);
    this.player.pxOffset = { x: 0, y: 0 };
    this.player.render.state = this._idleStateFor(this.player);
    this.player.render.frameIndex = 0;
    this.moving = null;
    this.pathQueue = [];
    this.pendingExploreTarget = null;
    if (this.hiddenTilesKey !== null) this._revealMapAroundPlayer();
  }

  _closeUiScreen() {
    this.uiScreen = null;
    this.characterCreation = null;
    this.primaryAssignment = null;
    this.dialogue = null;
    this.dialogueActor = null;
    this.pendingLootAfterDialogue = null;
    this.inventoryActionMenu = null;
    this.inventorySplit = null;
    this.inventoryRepair = null;
    this.contextActionMenu = null;
    this.loot = null;
    this.lootIndex = 0;
    this.trade = null;
    this.tradeFocus = 'trader';
    this.tradeStockIndex = 0;
    this.tradePlayerIndex = 0;
  }

  _closeDialogueScreen({ openPendingLoot = true } = {}) {
    const pendingLoot = openPendingLoot ? this.pendingLootAfterDialogue : null;
    this._closeUiScreen();
    if (!pendingLoot || this.mode !== 'explore') return;
    if (pendingLoot.sourceType === 'object' && this._objectShouldOpenLoot(pendingLoot.source)) {
      pendingLoot.source.dialogueShownBeforeLoot = true;
      this._openObjectLootScreen(pendingLoot.source, { log: false });
    } else if (pendingLoot.sourceType === 'enemy') {
      pendingLoot.source.inspectShownBeforeLoot = true;
      this._openEnemyLootScreen(pendingLoot.source);
    }
  }

  _isConfirmAction(action) {
    return action === 'confirm' || action === 'space';
  }
}

export function installGameDialogueRuntime(GameClass) {
  installGameMethods(GameClass, GameDialogueRuntime);
}
