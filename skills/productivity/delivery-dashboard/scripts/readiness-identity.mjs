const FIELDS = ["product", "platform", "build", "channel", "effectiveAudience"];

function validate(identity, name, errors) {
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    errors.push(`${name} identity must be an object`);
    return false;
  }

  let valid = true;
  for (const field of FIELDS) {
    const value = identity[field];
    if (typeof value !== "string" || value.length === 0 || value.trim() !== value) {
      errors.push(`${name} identity ${field} must be a nonempty stable string ID`);
      valid = false;
    }
  }
  if (Object.keys(identity).some((field) => !FIELDS.includes(field))) {
    errors.push(`${name} identity must contain only ${FIELDS.join(", ")}`);
    valid = false;
  }
  return valid;
}

export function compareReadinessIdentity(activeIdentity, currentSummaryIdentity) {
  const errors = [];
  const activeValid = validate(activeIdentity, "active", errors);
  const summaryValid = validate(currentSummaryIdentity, "current summary", errors);
  if (activeValid && summaryValid) {
    for (const field of FIELDS) {
      if (activeIdentity[field] !== currentSummaryIdentity[field]) {
        errors.push(`current summary ${field} does not match active ${field}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
