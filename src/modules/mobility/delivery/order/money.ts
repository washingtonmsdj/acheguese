export function roundMoney(value: number, fieldName = "value"): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return Number(value.toFixed(2));
}
