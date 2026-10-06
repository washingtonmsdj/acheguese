const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function parseStrictLocalDateTime(value: string): Date {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Data/hora local obrigatoria.');
  }

  const match = DATETIME_LOCAL_PATTERN.exec(normalized);
  if (!match) {
    throw new Error('Data/hora local invalida.');
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? '0');

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
