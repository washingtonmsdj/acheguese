function parseDigits(
  value: string,
  start: number,
  length: number,
): number | null {
  const part = value.slice(start, start + length);
  if (part.length !== length) return null;

  for (const character of part) {
    if (character < '0' || character > '9') return null;
  }

  return Number(part);
}

function parseStrictLocalDateTime(value: string): Date {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Data/hora local obrigatoria.');
  }

  const hasSeconds = normalized.length === 19;
  if (
    (normalized.length !== 16 && !hasSeconds) ||
    normalized[4] !== '-' ||
    normalized[7] !== '-' ||
    normalized[10] !== 'T' ||
    normalized[13] !== ':' ||
    (hasSeconds && normalized[16] !== ':')
  ) {
    throw new Error('Data/hora local invalida.');
  }

  const year = parseDigits(normalized, 0, 4);
  const month = parseDigits(normalized, 5, 2);
  const day = parseDigits(normalized, 8, 2);
  const hour = parseDigits(normalized, 11, 2);
  const minute = parseDigits(normalized, 14, 2);
  const second = hasSeconds ? parseDigits(normalized, 17, 2) : 0;

  if (
    year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null ||
    second === null
  ) {
    throw new Error('Data/hora local invalida.');
  }

  const parsed = new Date(0);
  parsed.setFullYear(year, month - 1, day);
  parsed.setHours(hour, minute, second, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute ||
    parsed.getSeconds() !== second
  ) {
    throw new Error('Data/hora local invalida.');
  }

  return parsed;
}

export function fromLocalInputToEventIso(value: string): string {
  return parseStrictLocalDateTime(value).toISOString();
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
