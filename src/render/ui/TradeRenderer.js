import { PALETTE } from '../palette.js';
import {
  TRADE_BOX,
  TRADE_BUTTONS,
  TRADE_PANELS,
  TRADE_ROW,
  tradePlayerRowBox,
  tradeTraderRowBox
} from '../../ui/tradeLayout.js';

export function drawTrade(ctx, ui, tools) {
  tools.screenBackdrop(ctx);
  const trade = ui.trade ?? { traderName: 'Trader', traderItems: [], playerItems: [], stockIndex: 0, playerIndex: 0 };
  tools.window(ctx, TRADE_BOX, trade.title ?? `TRADE: ${trade.traderName ?? 'TRADER'}`);
  tools.inset(ctx, TRADE_PANELS.trader);
  tools.inset(ctx, TRADE_PANELS.player);
  tools.inset(ctx, TRADE_PANELS.detail);

  const traderItems = trade.traderItems ?? [];
  const playerItems = trade.playerItems ?? [];
  const stockIndex = Math.max(0, Math.min(traderItems.length - 1, trade.stockIndex ?? 0));
  const playerIndex = Math.max(0, Math.min(playerItems.length - 1, trade.playerIndex ?? 0));
  const focusStock = trade.focus !== 'player';

  const stockLabel = tools.clip(`${trade.traderName ?? 'TRADER'} STOCK`, 22);
  tools.text(ctx, stockLabel, TRADE_PANELS.trader.x + 8, TRADE_PANELS.trader.y + 8, focusStock ? PALETTE.uiText : PALETTE.uiBorderLight);
  tools.text(ctx, 'PRICE', TRADE_PANELS.trader.x + TRADE_PANELS.trader.w - 45, TRADE_PANELS.trader.y + 8, PALETTE.uiDim);
  tools.text(ctx, `YOUR DUCATS ${trade.ducats ?? 0}`, TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 8, PALETTE.uiWarn);
  tools.text(ctx, 'YOUR PACK', TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 20, focusStock ? PALETTE.uiBorderLight : PALETTE.uiText);
  tools.text(ctx, 'WT', TRADE_PANELS.player.x + TRADE_PANELS.player.w - 27, TRADE_PANELS.player.y + 20, PALETTE.uiDim);
  tools.rect(ctx, TRADE_PANELS.trader.x + 8, TRADE_PANELS.trader.y + 20, TRADE_PANELS.trader.w - 16, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 32, TRADE_PANELS.player.w - 16, 1, PALETTE.uiBorderDark);

  for (let i = 0; i < TRADE_ROW.visible; i += 1) {
    drawTradeStockRow(ctx, tradeTraderRowBox(i), traderItems[i] ?? null, {
      selected: focusStock && i === stockIndex
    }, tools);
    drawTradePackRow(ctx, tradePlayerRowBox(i), playerItems[i] ?? null, {
      selected: !focusStock && i === playerIndex
    }, tools);
  }

  const selected = focusStock ? traderItems[stockIndex] : playerItems[playerIndex];
  drawTradeDetail(ctx, trade, selected, focusStock, tools);
  tools.drawInventoryActionButton(ctx, TRADE_BUTTONS.buy, 'BUY', { disabled: !focusStock || !trade.canBuy });
  tools.drawInventoryActionButton(ctx, TRADE_BUTTONS.close, 'CLOSE');
  tools.text(ctx, 'UP DN SELECT  A D SIDE  E BUY  ESC CLOSE', TRADE_BOX.x + 18, TRADE_BOX.y + TRADE_BOX.h - 43, PALETTE.uiDim);
}

function drawTradeStockRow(ctx, box, item, state, tools) {
  if (!box) return;
  if (state.selected) {
    tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
    tools.rect(ctx, box.x, box.y, 3, box.h, item?.affordable === false ? PALETTE.uiFailure : PALETTE.uiWarn);
    tools.rect(ctx, box.x + 3, box.y, box.w - 3, 1, PALETTE.uiBorderDark);
    tools.rect(ctx, box.x + 3, box.y + box.h - 1, box.w - 3, 1, PALETTE.uiBorderDark);
  }
  if (!item) return;
  const iconBox = { x: box.x + 5, y: box.y + 1, w: 18, h: 18 };
  tools.drawInventorySlot(ctx, iconBox, item, { selected: false });
  const sold = item.count <= 0;
  const blocked = !sold && item.affordable === false;
  const color = sold ? PALETTE.uiBorderDark : (state.selected ? PALETTE.uiText : PALETTE.uiDim);
  const priceColor = sold ? PALETTE.uiBorderDark : (blocked ? PALETTE.uiFailure : PALETTE.uiWarn);
  const count = item.count > 0 ? `${item.count}X` : 'SOLD';
  const price = `${item.price ?? 0}D`;
  const priceW = tools.textWidth(price) + 8;
  const priceX = box.x + box.w - priceW - 4;
  tools.text(ctx, tools.clip(item.name, 18), box.x + 29, box.y + 3, color);
  tools.text(ctx, count, box.x + 29, box.y + 12, priceColor);
  tools.rect(ctx, priceX, box.y + 4, priceW, 12, PALETTE.outline);
  tools.rect(ctx, priceX + 1, box.y + 5, priceW - 2, 10, blocked || sold ? PALETTE.uiDark : PALETTE.uiPanel);
  tools.text(ctx, price, priceX + 4, box.y + 7, priceColor);
}

function drawTradePackRow(ctx, box, item, state, tools) {
  if (!box) return;
  if (state.selected) {
    tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
    tools.rect(ctx, box.x, box.y, 3, box.h, PALETTE.uiGood);
    tools.rect(ctx, box.x + 3, box.y, box.w - 3, 1, PALETTE.uiBorderDark);
    tools.rect(ctx, box.x + 3, box.y + box.h - 1, box.w - 3, 1, PALETTE.uiBorderDark);
  }
  if (!item) return;
  const iconBox = { x: box.x + 5, y: box.y + 1, w: 18, h: 18 };
  tools.drawInventorySlot(ctx, iconBox, item, { selected: false });
  const color = state.selected ? PALETTE.uiText : PALETTE.uiDim;
  const weight = `WT ${tools.formatWeight(item.totalWeight ?? item.weight ?? 0)}`;
  tools.text(ctx, tools.clip(item.name, 19), box.x + 29, box.y + 3, color);
  tools.text(ctx, `${item.count}X`, box.x + 29, box.y + 12, PALETTE.uiGood);
  tools.text(ctx, weight, box.x + box.w - tools.textWidth(weight) - 5, box.y + 12, PALETTE.uiGood);
}

function drawTradeDetail(ctx, trade, item, focusStock, tools) {
  const box = TRADE_PANELS.detail;
  if (!item) {
    tools.text(ctx, focusStock ? 'NO STOCK SELECTED' : 'PACK EMPTY', box.x + 8, box.y + 8, PALETTE.uiBorderLight);
    return;
  }
  tools.text(ctx, tools.clip(item.name, 36), box.x + 8, box.y + 8, PALETTE.uiBorderLight);
  const ask = focusStock
    ? `PRICE ${item.price ?? 0} DUCATS  STOCK ${item.count ?? 0}`
    : `COUNT ${item.count ?? 0}  WT ${tools.formatWeight(item.totalWeight ?? item.weight ?? 0)} KG`;
  tools.text(ctx, ask, box.x + 8, box.y + 20, focusStock ? PALETTE.uiWarn : PALETTE.uiGood);
  const status = focusStock
    ? item.count <= 0
      ? 'SOLD OUT'
      : (trade.canBuy ? 'E BUY: TAKE 1' : trade.buyHint ?? 'NOT ENOUGH DUCATS')
    : tools.clip(item.description || 'NO DESCRIPTION.', 58);
  const statusColor = focusStock && item.count > 0
    ? (trade.canBuy ? PALETTE.uiGood : PALETTE.uiFailure)
    : PALETTE.uiDim;
  tools.text(ctx, tools.clip(status, 58), box.x + 8, box.y + 32, statusColor);
  if (focusStock) {
    tools.text(ctx, tools.clip(item.description || 'NO DESCRIPTION.', 58), box.x + 8, box.y + 44, PALETTE.uiDim);
  }
}
