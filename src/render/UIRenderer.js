// Low-resolution CRPG interface renderer facade.

import { drawDialogue } from './ui/DialogueRenderer.js';
import { drawContextActionMenu } from './ui/ContextActionRenderer.js';
import { drawCombatAbilityTray } from './ui/CombatAbilityRenderer.js';
import { drawCharacterCreation, drawPrimaryAssignment } from './ui/CreationRenderer.js';
import { drawHud } from './ui/HudRenderer.js';
import { drawJournal } from './ui/JournalRenderer.js';
import { drawLoadingScreen } from './ui/LoadingRenderer.js';
import {
  drawInventory,
  drawInventoryActionButton as drawInventoryActionButtonPrimitive,
  drawInventorySlot as drawInventorySlotPrimitive
} from './ui/InventoryRenderer.js';
import { drawLoot } from './ui/LootRenderer.js';
import { drawTrade } from './ui/TradeRenderer.js';
import { drawDroneShrine } from './ui/DroneRenderer.js';
import { drawSaveScreen } from './ui/SaveRenderer.js';
import {
  apPips,
  bar,
  clipUiText,
  drawAreaTitle,
  drawBriefing as drawBriefingPrimitive,
  drawCursor,
  drawHoverText,
  drawJournalNotice,
  detailLine,
  detailRect,
  formatWeight,
  inset,
  outcomeText,
  panelTexture,
  rect,
  screenBackdrop,
  scrollArrow,
  text,
  textWidth,
  windowFrame,
  wrapText
} from './ui/UiPrimitives.js';

export class UIRenderer {
  constructor(atlas = null) {
    this.atlas = atlas;
  }

  draw(ctx, ui) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const tools = this.#uiTools();
    if (['title', 'pause', 'saves', 'confirm'].includes(ui.screen)) {
      drawSaveScreen(ctx, ui, tools);
      drawCursor(ctx, ui.cursor);
      ctx.restore();
      return;
    }
    if (ui.screen === 'character-customization') {
      drawCharacterCreation(ctx, ui, tools);
      drawCursor(ctx, ui.cursor);
      ctx.restore();
      return;
    }
    if (ui.screen === 'primary-assignment') {
      drawPrimaryAssignment(ctx, ui, tools);
      drawCursor(ctx, ui.cursor);
      ctx.restore();
      return;
    }
    if (ui.screen === 'drone-shrine') {
      drawDroneShrine(ctx, ui, tools);
      drawCursor(ctx, ui.cursor);
      ctx.restore();
      return;
    }
    if (ui.screen === 'inventory') drawInventory(ctx, ui, tools);
    if (ui.screen === 'loot') drawLoot(ctx, ui, tools);
    if (ui.screen === 'trade') drawTrade(ctx, ui, tools);
    if (ui.screen === 'journal') drawJournal(ctx, ui, tools);
    drawHud(ctx, ui, tools);
    if (ui.screen === 'dialogue') drawDialogue(ctx, ui, tools);
    if (ui.areaTitle && !ui.screen && ui.mode !== 'COMBAT') drawAreaTitle(ctx, ui.areaTitle);
    if (ui.journalNotice && ui.screen !== 'journal') drawJournalNotice(ctx, ui.journalNotice);
    if (ui.hoverText && !ui.screen) drawHoverText(ctx, ui.hoverText);
    if (ui.combatAbilityTray && !ui.screen) drawCombatAbilityTray(ctx, ui.combatAbilityTray, tools, ui.cursor);
    if (ui.contextActionMenu && !ui.screen) drawContextActionMenu(ctx, ui.contextActionMenu, tools);
    drawCursor(ctx, ui.cursor);

    ctx.restore();
  }

  drawBriefing(ctx, data) {
    drawBriefingPrimitive(ctx, data);
  }

  drawLoading(ctx, data) {
    drawLoadingScreen(ctx, data);
  }

  #uiTools() {
    const tools = {
      panelTexture,
      window: windowFrame,
      screenBackdrop,
      inset,
      bar,
      apPips,
      scrollArrow,
      rect,
      detailRect,
      detailLine,
      text,
      textWidth,
      outcomeText,
      wrap: wrapText,
      clip: clipUiText,
      formatWeight,
      atlas: this.atlas
    };
    tools.drawInventorySlot = (ctx, box, item, state) => drawInventorySlotPrimitive(ctx, box, item, state, tools);
    tools.drawInventoryActionButton = (ctx, box, label, options) => drawInventoryActionButtonPrimitive(ctx, box, label, options, tools);
    return tools;
  }
}
