export function fromLocalInputToEventIso(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Data/hora local obrigatoria.');
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Data/hora local invalida.');
  }

  return parsed.toISOString();
}

export function fromEventIsoToLocalInput(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Data/hora do evento invalida.');
  }

  const localTime = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
  );
  return localTime.toISOString().slice(0, 16);
}
