import {

  FIELD_RATING_IDS,

  TRACE_STAGE_VALUES,

  errors,

  referencedDialogueIds,

  relative,

  requireNumber,

  requireString,

  seenDialogueIds,

  seenQuestIds,

  validateGridPoint,

  validateOptionalBoolean,

  validateXpNumber

} from './validationContext.mjs';

import { validateLoot } from './itemValidator.mjs';

import { validateBriefingPage, validateStringList } from './textRules.mjs';



export function validateQuest(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.title, 'title');
  requireString(name, data.initialStage, 'initialStage');
  if (typeof data.id === 'string') seenQuestIds.add(data.id);
  if (!Array.isArray(data.stages) || data.stages.length === 0) {
    errors.push(`${name}: stages must be a non-empty array.`);
    return;
  }
  let hasInitial = false;
  for (const stage of data.stages) {
    requireString(name, stage.id, 'stages[].id');
    requireString(name, stage.description, 'stages[].description');
    validateXpNumber(name, stage.xp, `stages.${stage.id ?? 'unknown'}.xp`);
    if (stage.reward !== undefined) {
      if (!stage.reward || typeof stage.reward !== 'object' || Array.isArray(stage.reward)) {
        errors.push(`${name}: stages.${stage.id ?? 'unknown'}.reward must be an object.`);
      } else {
        validateXpNumber(name, stage.reward.xp, `stages.${stage.id ?? 'unknown'}.reward.xp`);
      }
    }
    if (stage.id === data.initialStage) hasInitial = true;
  }
  if (!hasInitial) {
    errors.push(`${name}: initialStage "${data.initialStage}" is not listed in stages.`);
  }
}

export function validateDialogue(filePath, data) {
  const name = relative(filePath);
  requireString(name, data.id, 'id');
  requireString(name, data.title, 'title');
  if (typeof data.id === 'string') seenDialogueIds.add(data.id);
  if (!data.nodes || typeof data.nodes !== 'object') {
    errors.push(`${name}: nodes must be an object.`);
    return;
  }
  if (!data.nodes.start) {
    errors.push(`${name}: nodes.start is required.`);
  }
  for (const [nodeId, node] of Object.entries(data.nodes)) {
    validateDialogueConditions(name, node.conditions, `nodes.${nodeId}.conditions`);
    if (!Array.isArray(node.lines) || node.lines.length === 0) {
      errors.push(`${name}: node "${nodeId}" must define a non-empty lines array.`);
    } else {
      for (const line of node.lines) requireString(name, line, `nodes.${nodeId}.lines[]`);
    }
    if (node.choices !== undefined) {
      if (!Array.isArray(node.choices) || node.choices.length === 0 || node.choices.length > 5) {
        errors.push(`${name}: node "${nodeId}" choices must contain 1 to 5 choices.`);
      } else {
        for (const choice of node.choices) {
          requireString(name, choice.label, `nodes.${nodeId}.choices[].label`);
          validateDialogueConditions(name, choice.conditions, `nodes.${nodeId}.choices[].conditions`);
          validateDialogueEffects(name, choice.effects, `nodes.${nodeId}.choices[].effects`);
        }
      }
    }
  }
}

export function validateDialogueConditions(name, conditions, fieldName) {
  if (conditions === undefined) return;
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }

  validateStringList(name, conditions.flag, `${fieldName}.flag`);
  validateStringList(name, conditions.flags, `${fieldName}.flags`);
  validateStringList(name, conditions.notFlag, `${fieldName}.notFlag`);
  validateStringList(name, conditions.flagsAbsent, `${fieldName}.flagsAbsent`);
  validateStringList(name, conditions.scar, `${fieldName}.scar`);
  validateStringList(name, conditions.scars, `${fieldName}.scars`);
  validateStringList(name, conditions.notScar, `${fieldName}.notScar`);
  validateStringList(name, conditions.scarsAbsent, `${fieldName}.scarsAbsent`);

  if (conditions.questStages !== undefined) {
    if (!conditions.questStages || typeof conditions.questStages !== 'object' || Array.isArray(conditions.questStages)) {
      errors.push(`${name}: ${fieldName}.questStages must be an object.`);
    } else {
      for (const [questId, stageId] of Object.entries(conditions.questStages)) {
        requireString(name, questId, `${fieldName}.questStages quest id`);
        requireString(name, stageId, `${fieldName}.questStages.${questId}`);
      }
    }
  }

  if (conditions.scarRanks !== undefined) {
    if (!conditions.scarRanks || typeof conditions.scarRanks !== 'object' || Array.isArray(conditions.scarRanks)) {
      errors.push(`${name}: ${fieldName}.scarRanks must be an object.`);
    } else {
      for (const [scarId, rank] of Object.entries(conditions.scarRanks)) {
        requireString(name, scarId, `${fieldName}.scarRanks scar id`);
        requireNumber(name, rank, `${fieldName}.scarRanks.${scarId}`);
        if (typeof rank === 'number' && (!Number.isInteger(rank) || rank < 1 || rank > 5)) {
          errors.push(`${name}: ${fieldName}.scarRanks.${scarId} must be an integer from 1 to 5.`);
        }
      }
    }
  }

  if (conditions.fieldRatings !== undefined) {
    if (!conditions.fieldRatings || typeof conditions.fieldRatings !== 'object' || Array.isArray(conditions.fieldRatings)) {
      errors.push(`${name}: ${fieldName}.fieldRatings must be an object.`);
    } else {
      for (const [fieldId, minimum] of Object.entries(conditions.fieldRatings)) {
        if (!FIELD_RATING_IDS.has(fieldId)) {
          errors.push(`${name}: ${fieldName}.fieldRatings has unknown field rating "${fieldId}".`);
        }
        requireNumber(name, minimum, `${fieldName}.fieldRatings.${fieldId}`);
        if (typeof minimum === 'number' && (!Number.isInteger(minimum) || minimum < 0 || minimum > 100)) {
          errors.push(`${name}: ${fieldName}.fieldRatings.${fieldId} must be an integer from 0 to 100.`);
        }
      }
    }
  }

  validateTraceCondition(name, conditions.traceMin, `${fieldName}.traceMin`);
  validateTraceCondition(name, conditions.traceMax, `${fieldName}.traceMax`);
}

function validateTraceCondition(name, value, fieldName) {
  if (value === undefined) return;
  requireNumber(name, value, fieldName);
  if (typeof value === 'number' && (!Number.isInteger(value) || !TRACE_STAGE_VALUES.has(value))) {
    errors.push(`${name}: ${fieldName} must match a defined Trace stage.`);
  }
}

function validateShowBriefing(name, showBriefing, fieldName) {
  if (showBriefing === undefined) return;
  if (!showBriefing || typeof showBriefing !== 'object' || Array.isArray(showBriefing)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }

  if (showBriefing.title !== undefined) requireString(name, showBriefing.title, `${fieldName}.title`);
  if (showBriefing.nextPrompt !== undefined) requireString(name, showBriefing.nextPrompt, `${fieldName}.nextPrompt`);
  if (showBriefing.lastPrompt !== undefined) requireString(name, showBriefing.lastPrompt, `${fieldName}.lastPrompt`);
  if (showBriefing.skipPrompt !== undefined) requireString(name, showBriefing.skipPrompt, `${fieldName}.skipPrompt`);

  if (!Array.isArray(showBriefing.pages) || showBriefing.pages.length === 0) {
    errors.push(`${name}: ${fieldName}.pages must be a non-empty array of pages.`);
  } else {
    showBriefing.pages.forEach((page, index) => {
      validateBriefingPage(name, page, `${fieldName}.pages[${index}]`);
    });
  }

  if (showBriefing.conditionalPages === undefined) return;
  if (!Array.isArray(showBriefing.conditionalPages)) {
    errors.push(`${name}: ${fieldName}.conditionalPages must be an array.`);
    return;
  }
  showBriefing.conditionalPages.forEach((entry, index) => {
    const entryName = `${fieldName}.conditionalPages[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${name}: ${entryName} must be an object.`);
      return;
    }
    validateDialogueConditions(name, entry.conditions, `${entryName}.conditions`);
    validateBriefingPage(name, entry.page, `${entryName}.page`);
  });
}

export function validateDialogueEffects(name, effects, fieldName) {
  if (effects === undefined) return;
  if (!effects || typeof effects !== 'object' || Array.isArray(effects)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }

  validateInventoryEffects(name, effects.inventory, `${fieldName}.inventory`);
  validateXpNumber(name, effects.xp, `${fieldName}.xp`);
  validateMoveActorEffects(name, effects.moveActor, `${fieldName}.moveActor`);

  const startCombat = effects.startCombat;
  if (startCombat !== undefined) {
    if (typeof startCombat === 'string') {
      // Valid compact form.
    } else if (startCombat && typeof startCombat === 'object' && !Array.isArray(startCombat)) {
      requireString(name, startCombat.encounter, `${fieldName}.startCombat.encounter`);
    } else {
      errors.push(`${name}: ${fieldName}.startCombat must be an encounter id or object.`);
    }
  }
  validateShowBriefing(name, effects.showBriefing, `${fieldName}.showBriefing`);
}

function validateMoveActorEffects(name, moveActor, fieldName) {
  if (moveActor === undefined) return;
  const entries = Array.isArray(moveActor) ? moveActor : [moveActor];
  if (entries.length === 0) {
    errors.push(`${name}: ${fieldName} must contain at least one movement spec.`);
    return;
  }
  entries.forEach((spec, index) => {
    const specName = `${fieldName}${Array.isArray(moveActor) ? `[${index}]` : ''}`;
    if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
      errors.push(`${name}: ${specName} must be an object.`);
      return;
    }
    if (spec.target !== undefined) requireString(name, spec.target, `${specName}.target`);
    if (spec.actor !== undefined) requireString(name, spec.actor, `${specName}.actor`);
    if (spec.id !== undefined) requireString(name, spec.id, `${specName}.id`);
    if (spec.startDelay !== undefined) {
      requireNumber(name, spec.startDelay, `${specName}.startDelay`);
      if (typeof spec.startDelay === 'number' && spec.startDelay < 0) {
        errors.push(`${name}: ${specName}.startDelay must be zero or greater.`);
      }
    }
    if (spec.timer !== undefined) {
      requireNumber(name, spec.timer, `${specName}.timer`);
      if (typeof spec.timer === 'number' && spec.timer < 0) {
        errors.push(`${name}: ${specName}.timer must be zero or greater.`);
      }
    }
    validateOptionalBoolean(name, spec.removeOnComplete, `${specName}.removeOnComplete`);
    validateOptionalBoolean(name, spec.remove, `${specName}.remove`);
    validateOptionalBoolean(name, spec.hideOnComplete, `${specName}.hideOnComplete`);
    const hasPath = spec.path !== undefined;
    const hasTargetPoint = spec.to !== undefined || spec.targetCell !== undefined;
    if (!hasPath && !hasTargetPoint) {
      errors.push(`${name}: ${specName} must define path, to, or targetCell.`);
    }
    if (hasPath) {
      if (!Array.isArray(spec.path) || spec.path.length === 0) {
        errors.push(`${name}: ${specName}.path must contain at least one point.`);
      } else {
        spec.path.forEach((point, pointIndex) => {
          validateGridPoint(name, point, `${specName}.path[${pointIndex}]`);
        });
      }
    }
    if (spec.to !== undefined) validateGridPoint(name, spec.to, `${specName}.to`);
    if (spec.targetCell !== undefined) validateGridPoint(name, spec.targetCell, `${specName}.targetCell`);
    validateDialogueEffects(name, spec.onComplete ?? spec.complete ?? spec.arrival, `${specName}.onComplete`);
  });
}

function validateInventoryEffects(name, inventory, fieldName) {
  if (inventory === undefined) return;
  if (!inventory || typeof inventory !== 'object' || Array.isArray(inventory)) {
    errors.push(`${name}: ${fieldName} must be an object.`);
    return;
  }
  for (const key of ['add', 'remove']) {
    if (inventory[key] === undefined) continue;
    if (!Array.isArray(inventory[key])) {
      errors.push(`${name}: ${fieldName}.${key} must be an array.`);
      continue;
    }
    validateLoot(name, inventory[key], `${fieldName}.${key}`);
  }
}

export function validateDialogueReference(name, id, fieldName) {
  if (id === undefined) return;
  requireString(name, id, fieldName);
  if (typeof id === 'string') referencedDialogueIds.add(id);
}
