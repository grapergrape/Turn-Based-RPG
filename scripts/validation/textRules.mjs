import { errors, requireString } from './validationContext.mjs';



export function validateStringList(name, value, fieldName) {
  if (value === undefined) return;
  if (Array.isArray(value)) {
    for (const entry of value) requireString(name, entry, `${fieldName}[]`);
    return;
  }
  requireString(name, value, fieldName);
}

export function validateBarkCollection(name, value, fieldName, max = 12) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${name}: ${fieldName} must be an array of strings.`);
    return;
  }
  if (value.length === 0) {
    errors.push(`${name}: ${fieldName} must contain at least one line when defined.`);
    return;
  }
  if (value.length > max) {
    errors.push(`${name}: ${fieldName} must contain no more than ${max} lines.`);
  }
  value.forEach((line, index) => requireString(name, line, `${fieldName}[${index}]`));
}

export function validateBriefingPage(name, page, fieldName) {
  if (!Array.isArray(page) || page.length === 0) {
    errors.push(`${name}: ${fieldName} must be a non-empty array of strings.`);
    return;
  }
  for (const line of page) requireString(name, line, `${fieldName}[]`);
}
