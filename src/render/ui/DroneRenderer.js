import { PALETTE } from '../palette.js';

const SHRINE_BOX = Object.freeze({ x: 66, y: 46, w: 508, h: 300 });
const BODY_BOX = Object.freeze({ x: 90, y: 82, w: 460, h: 210 });

export function drawDroneShrine(ctx, ui, tools) {
  const shrine = ui.droneShrine ?? {};
  tools.screenBackdrop(ctx, true);
  tools.window(ctx, SHRINE_BOX, 'PRE-BLOOM FIELD ATTENDANT SHRINE');
  tools.inset(ctx, BODY_BOX);

  drawCredentialSeal(ctx, tools, BODY_BOX.x + 26, BODY_BOX.y + 24);
  if (shrine.phase === 'recognition') drawRecognition(ctx, shrine, tools);
  else if (shrine.phase === 'catalogue') drawCatalogue(ctx, shrine, tools);
  else if (shrine.phase === 'failure') drawFailure(ctx, shrine, tools);
  else if (shrine.phase === 'activation') drawActivation(ctx, shrine, tools);
  else if (shrine.phase === 'naming') drawNaming(ctx, shrine, tools);

  const mandatory = shrine.phase === 'activation' || shrine.phase === 'naming';
  tools.text(
    ctx,
    mandatory ? 'REGISTRATION MUST BE COMPLETED' : 'ESC CLOSES THE SHRINE',
    SHRINE_BOX.x + 22,
    SHRINE_BOX.y + SHRINE_BOX.h - 30,
    mandatory ? PALETTE.uiWarn : PALETTE.uiDim
  );
}

function drawRecognition(ctx, shrine, tools) {
  const x = BODY_BOX.x + 82;
  let y = BODY_BOX.y + 25;
  tools.text(ctx, 'CREDENTIAL ACCEPTED.', x, y, PALETTE.uiGood);
  y += 18;
  tools.text(ctx, 'AGENT OF CENSURE IDENTIFIED.', x, y, PALETTE.uiBorderLight);
  y += 33;
  tools.text(ctx, 'WHERE IS YOUR ATTENDANT?', x, y, PALETTE.uiText, 2);
  y += 58;
  responsePlate(ctx, tools, x, y, 'I was not issued one.');
  tools.text(ctx, 'ENTER RESPONDS', x, y + 30, PALETTE.uiDim);
}

function drawCatalogue(ctx, shrine, tools) {
  const x = BODY_BOX.x + 82;
  tools.text(ctx, 'SELECT ATTENDANT MODEL', x, BODY_BOX.y + 23, PALETTE.uiBorderLight);
  tools.text(ctx, 'LOCAL AND REMOTE CATALOGUE', x, BODY_BOX.y + 39, PALETTE.uiDim);
  let y = BODY_BOX.y + 67;
  for (const model of shrine.models ?? []) {
    const selected = Boolean(model.selected);
    if (selected) {
      tools.rect(ctx, x - 5, y - 4, 322, 22, PALETTE.outline);
      tools.rect(ctx, x - 4, y - 3, 320, 20, PALETTE.uiDark);
      tools.rect(ctx, x - 4, y - 3, 320, 1, PALETTE.uiBorderLight);
    }
    const color = model.failed ? PALETTE.uiFailure : selected ? PALETTE.uiWarn : PALETTE.uiText;
    tools.text(ctx, selected ? '>' : ' ', x, y, color);
    tools.text(ctx, tools.clip(model.name, 38), x + 14, y, color);
    if (model.failed) {
      const width = Math.min(285, tools.textWidth(model.name));
      tools.rect(ctx, x + 12, y + 5, width + 4, 2, PALETTE.uiFailure);
      tools.detailRect(ctx, x + 12.5, y + 4.5, width + 3, 0.5, PALETTE.uiBad);
      tools.text(ctx, 'FAILED', x + 266, y, PALETTE.uiBad);
    }
    y += 34;
  }
  tools.text(ctx, 'UP DOWN SELECT   ENTER ACTIVATE', x, BODY_BOX.y + BODY_BOX.h - 22, PALETTE.uiDim);
}

function drawFailure(ctx, shrine, tools) {
  const x = BODY_BOX.x + 82;
  tools.text(ctx, 'CRADLE RESPONSE', x, BODY_BOX.y + 27, PALETTE.uiBorderLight);
  tools.rect(ctx, x - 4, BODY_BOX.y + 57, 326, 68, PALETTE.outline);
  tools.rect(ctx, x - 3, BODY_BOX.y + 58, 324, 66, PALETTE.uiDark);
  tools.rect(ctx, x - 3, BODY_BOX.y + 58, 324, 2, PALETTE.uiFailure);
  const lines = tools.wrap(shrine.message ?? 'ACTIVATION FAILED.', 42);
  let y = BODY_BOX.y + 76;
  for (const line of lines) {
    tools.text(ctx, line, x + 10, y, PALETTE.uiBad);
    y += 14;
  }
  tools.text(ctx, 'ENTER RETURNS TO CATALOGUE', x, BODY_BOX.y + 150, PALETTE.uiDim);
}

function drawActivation(ctx, shrine, tools) {
  const x = BODY_BOX.x + 82;
  tools.text(ctx, 'LOCAL CRADLE', x, BODY_BOX.y + 25, PALETTE.uiBorderLight);
  tools.rect(ctx, x - 4, BODY_BOX.y + 55, 326, 66, PALETTE.outline);
  tools.rect(ctx, x - 3, BODY_BOX.y + 56, 324, 64, PALETTE.uiDark);
  tools.rect(ctx, x - 3, BODY_BOX.y + 56, 324, 2, PALETTE.uiGood);
  tools.text(ctx, shrine.message ?? 'LOCAL CRADLE ANSWERS.', x + 10, BODY_BOX.y + 78, PALETTE.uiGood);
  tools.text(ctx, 'A SMALL SERVICE FRAME UNFOLDS BESIDE THE SHRINE.', x + 10, BODY_BOX.y + 96, PALETTE.uiText);
  tools.text(ctx, 'ENTER OPENS THE ATTENDANT RECORD', x, BODY_BOX.y + 151, PALETTE.uiDim);
}

function drawNaming(ctx, shrine, tools) {
  const x = BODY_BOX.x + 82;
  tools.text(ctx, 'FIELD ATTENDANT RECORD', x, BODY_BOX.y + 24, PALETTE.uiBorderLight);
  tools.text(ctx, 'NAME', x, BODY_BOX.y + 58, PALETTE.uiDim);
  tools.rect(ctx, x - 4, BODY_BOX.y + 76, 246, 34, PALETTE.outline);
  tools.rect(ctx, x - 3, BODY_BOX.y + 77, 244, 32, PALETTE.uiDark);
  tools.rect(ctx, x - 3, BODY_BOX.y + 77, 244, 1, PALETTE.uiBorderLight);
  const name = `${shrine.name ?? ''}*`;
  tools.text(ctx, name, x + 10, BODY_BOX.y + 88, shrine.nameValidation?.valid ? PALETTE.uiGood : PALETTE.uiWarn, 2);
  tools.text(ctx, '1 TO 12 CHARACTERS', x, BODY_BOX.y + 126, PALETTE.uiDim);
  tools.text(ctx, 'LETTERS  NUMBERS  SPACES  APOSTROPHES', x, BODY_BOX.y + 141, PALETTE.uiDim);
  tools.text(ctx, shrine.message || 'ENTER REGISTERS THE NAME', x, BODY_BOX.y + 166, shrine.message ? PALETTE.uiBad : PALETTE.uiGood);
}

function responsePlate(ctx, tools, x, y, label) {
  tools.rect(ctx, x - 5, y - 4, 304, 24, PALETTE.outline);
  tools.rect(ctx, x - 4, y - 3, 302, 22, PALETTE.uiDark);
  tools.rect(ctx, x - 4, y - 3, 302, 1, PALETTE.uiGood);
  tools.text(ctx, '>', x, y, PALETTE.uiGood);
  tools.text(ctx, label, x + 15, y, PALETTE.uiText);
}

function drawCredentialSeal(ctx, tools, x, y) {
  tools.rect(ctx, x - 18, y - 18, 38, 38, PALETTE.outline);
  tools.rect(ctx, x - 16, y - 16, 34, 34, PALETTE.uiBorderDark);
  tools.rect(ctx, x - 13, y - 13, 28, 28, PALETTE.uiDark);
  tools.rect(ctx, x - 2, y - 10, 5, 21, PALETTE.uiWarn);
  tools.rect(ctx, x - 8, y - 4, 17, 5, PALETTE.uiWarn);
  tools.rect(ctx, x - 1, y - 8, 2, 17, PALETTE.uiBorderLight);
  tools.detailRect(ctx, x - 12.5, y - 12.5, 27, 0.5, PALETTE.uiText);
}
