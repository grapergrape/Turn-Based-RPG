import { PALETTE } from '../palette.js';
import { itemRarityColor, itemRarityLabel } from './ItemRarityStyle.js';
import { drawWeaponDetailRows } from './WeaponDetailRenderer.js';
import {
  TRADE_BOX,
  TRADE_BUTTONS,
  TRADE_PANELS,
  TRADE_ROW,
  tradeListOffset,
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
  const stockOffset = tradeListOffset(stockIndex, traderItems.length);
  const playerOffset = tradeListOffset(playerIndex, playerItems.length);

  const stockPosition = traderItems.length ? `${stockIndex + 1}/${traderItems.length}` : '0/0';
  const packPosition = playerItems.length ? `${playerIndex + 1}/${playerItems.length}` : '0/0';
  const stockLabel = tools.clip(`${trade.traderName ?? 'TRADER'} ${stockPosition}`, 22);
  tools.text(ctx, stockLabel, TRADE_PANELS.trader.x + 8, TRADE_PANELS.trader.y + 8, focusStock ? PALETTE.uiText : PALETTE.uiBorderLight);
  tools.text(ctx, 'PRICE', TRADE_PANELS.trader.x + TRADE_PANELS.trader.w - 45, TRADE_PANELS.trader.y + 8, PALETTE.uiDim);
  tools.text(ctx, `YOUR DUCATS ${trade.ducats ?? 0}`, TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 8, PALETTE.uiWarn);
  tools.text(ctx, `YOUR PACK ${packPosition}`, TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 20, focusStock ? PALETTE.uiBorderLight : PALETTE.uiText);
  tools.text(ctx, 'OFFER', TRADE_PANELS.player.x + TRADE_PANELS.player.w - 45, TRADE_PANELS.player.y + 20, PALETTE.uiDim);
  tools.rect(ctx, TRADE_PANELS.trader.x + 8, TRADE_PANELS.trader.y + 20, TRADE_PANELS.trader.w - 16, 1, PALETTE.uiBorderDark);
  tools.rect(ctx, TRADE_PANELS.player.x + 8, TRADE_PANELS.player.y + 32, TRADE_PANELS.player.w - 16, 1, PALETTE.uiBorderDark);

  for (let i = 0; i < TRADE_ROW.visible; i += 1) {
    const stockItemIndex = stockOffset + i;
    const playerItemIndex = playerOffset + i;
    drawTradeStockRow(ctx, tradeTraderRowBox(i), traderItems[stockItemIndex] ?? null, {
      selected: focusStock && stockItemIndex === stockIndex
    }, tools);
    drawTradePackRow(ctx, tradePlayerRowBox(i), playerItems[playerItemIndex] ?? null, {
      selected: !focusStock && playerItemIndex === playerIndex
    }, tools);
  }

  const selected = focusStock ? traderItems[stockIndex] : playerItems[playerIndex];
  drawTradeDetail(ctx, trade, selected, focusStock, tools);
  const actionLabel = focusStock ? 'BUY' : 'SELL';
  const actionEnabled = focusStock ? trade.canBuy : trade.canSell;
  tools.drawInventoryActionButton(ctx, TRADE_BUTTONS.buy, actionLabel, { disabled: !actionEnabled });
  tools.drawInventoryActionButton(ctx, TRADE_BUTTONS.close, 'CLOSE');
  tools.text(ctx, 'UP DN SELECT  A D SIDE  E BUY OR SELL  ESC CLOSE', TRADE_BOX.x + 18, TRADE_BOX.y + TRADE_BOX.h - 43, PALETTE.uiDim);
}

function drawTradeStockRow(ctx, box, item, state, tools) {
  if (!box) return;
  if (state.selected) {
    tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
    tools.rect(ctx, box.x, box.y, 3, box.h, item?.affordable === false ? PALETTE.uiFailure : PALETTE.uiWarn);
    tools.rect(ctx, box.x + 3, box.y, box.w - 3, 1, PALETTE.uiBorderDark);
    tools.rect(ctx, box.x + 3, box.y + box.h - 1, box.w - 3, 1, PALETTE.uiBorderDark);
    tools.detailRect(ctx, box.x + 0.5, box.y + 0.5, 2, box.h - 1, item?.affordable === false ? PALETTE.uiFailure : PALETTE.uiText);
  }
  if (!item) return;
  const iconBox = { x: box.x + 5, y: box.y + 1, w: 18, h: 18 };
  tools.drawInventorySlot(ctx, iconBox, item, { selected: false });
  const sold = item.count <= 0;
  const blocked = !sold && item.affordable === false;
  const color = sold ? PALETTE.uiBorderDark : itemRarityColor(item);
  const priceColor = sold ? PALETTE.uiBorderDark : (blocked ? PALETTE.uiFailure : PALETTE.uiWarn);
  const count = item.count > 0 ? `${item.count}X` : 'SOLD';
  const price = `${item.price ?? 0}D`;
  const priceW = tools.textWidth(price) + 8;
  const priceX = box.x + box.w - priceW - 4;
  tools.text(ctx, tools.clip(item.name, 18), box.x + 29, box.y + 3, color);
  tools.text(ctx, count, box.x + 29, box.y + 12, priceColor);
  tools.rect(ctx, priceX, box.y + 4, priceW, 12, PALETTE.outline);
  tools.rect(ctx, priceX + 1, box.y + 5, priceW - 2, 10, blocked || sold ? PALETTE.uiDark : PALETTE.uiPanel);
  tools.detailRect(ctx, priceX + 1.5, box.y + 5.5, priceW - 3, 0.5, blocked || sold ? PALETTE.uiBorderDark : PALETTE.uiBorderLight);
  tools.text(ctx, price, priceX + 4, box.y + 7, priceColor);
}

function drawTradePackRow(ctx, box, item, state, tools) {
  if (!box) return;
  if (state.selected) {
    tools.rect(ctx, box.x, box.y, box.w, box.h, PALETTE.uiDark);
    tools.rect(ctx, box.x, box.y, 3, box.h, item?.sellable ? PALETTE.uiGood : PALETTE.uiBorderDark);
    tools.rect(ctx, box.x + 3, box.y, box.w - 3, 1, PALETTE.uiBorderDark);
    tools.rect(ctx, box.x + 3, box.y + box.h - 1, box.w - 3, 1, PALETTE.uiBorderDark);
    tools.detailRect(ctx, box.x + 0.5, box.y + 0.5, 2, box.h - 1, item?.sellable ? PALETTE.uiText : PALETTE.uiBorderDark);
  }
  if (!item) return;
  const iconBox = { x: box.x + 5, y: box.y + 1, w: 18, h: 18 };
  tools.drawInventorySlot(ctx, iconBox, item, { selected: false });
  const color = itemRarityColor(item);
  const offer = Number.isFinite(item.sellPrice) ? `${item.sellPrice}D` : 'NO';
  const offerColor = item.sellable ? PALETTE.uiGood : PALETTE.uiDim;
  tools.text(ctx, tools.clip(item.name, 19), box.x + 29, box.y + 3, color);
  tools.text(ctx, `${item.count}X`, box.x + 29, box.y + 12, PALETTE.uiGood);
  tools.text(ctx, offer, box.x + box.w - tools.textWidth(offer) - 5, box.y + 12, offerColor);
}

function drawTradeDetail(ctx, trade, item, focusStock, tools) {
  const box = TRADE_PANELS.detail;
  const textCols = Math.max(20, Math.floor((box.w - 16) / 6));
  if (!item) {
    tools.text(ctx, focusStock ? 'NO STOCK SELECTED' : 'PACK EMPTY', box.x + 8, box.y + 8, PALETTE.uiBorderLight);
    return;
  }
  tools.text(ctx, tools.clip(item.name, 36), box.x + 8, box.y + 8, itemRarityColor(item));
  const sellCurrency = item.sellPrice === 1 ? 'DUCAT' : 'DUCATS';
  const sellOffer = Number.isFinite(item.sellPrice) ? `OFFER ${item.sellPrice} ${sellCurrency}` : 'NO OFFER';
  const buyCurrency = item.price === 1 ? 'DUCAT' : 'DUCATS';
  const ask = focusStock
    ? `PRICE ${item.price ?? 0} ${buyCurrency}  STOCK ${item.count ?? 0}`
    : `COUNT ${item.count ?? 0}  WT ${tools.formatWeight(item.totalWeight ?? item.weight ?? 0)} KG  ${sellOffer}`;
  const build = item.buildLabel ? `BUILD ${item.buildLabel}  ` : '';
  const meta = `${build}GRADE ${itemRarityLabel(item)}  ${ask}`;
  tools.text(ctx, tools.clip(meta, textCols), box.x + 8, box.y + 20, focusStock ? PALETTE.uiWarn : PALETTE.uiGood);
  const status = focusStock
    ? (item.count <= 0
        ? 'SOLD OUT'
        : (trade.canBuy ? 'E BUY: TAKE 1' : trade.buyHint ?? 'NOT ENOUGH DUCATS'))
    : (trade.canSell ? 'E SELL: GIVE 1' : trade.sellHint ?? 'NOT ACCEPTED HERE');
  const statusColor = focusStock
    ? (item.count > 0 ? (trade.canBuy ? PALETTE.uiGood : PALETTE.uiFailure) : PALETTE.uiDim)
    : (trade.canSell ? PALETTE.uiGood : PALETTE.uiFailure);
  tools.text(ctx, tools.clip(status, textCols), box.x + 8, box.y + 32, statusColor);

  const hasWeaponDetails = Array.isArray(item.attackModes) && item.attackModes.length > 0;
  let y = hasWeaponDetails
    ? drawWeaponDetailRows(ctx, item, {
        x: box.x + 8,
        y: box.y + 44,
        maxChars: textCols,
        maxRows: 3
      }, tools)
    : box.y + 44;
  const bottom = box.y + box.h - 2;
  for (const line of tools.wrap(item.description || 'NO DESCRIPTION.', textCols)) {
    if (y + 7 > bottom) break;
    tools.text(ctx, line, box.x + 8, y, PALETTE.uiDim);
    y += 9;
  }
}
