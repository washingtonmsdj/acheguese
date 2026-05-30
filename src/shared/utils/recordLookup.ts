export function getRecordValue<TValue>(
  record: Readonly<Record<string, TValue | undefined>>,
  key: string,
): TValue | undefined {
  return Object.entries(record).find(([entryKey]) => entryKey === key)?.[1] as
    | TValue
    | undefined;
}

export function getRequiredRecordValue<TValue>(
  record: Readonly<Record<string, TValue | undefined>>,
  key: string,
  fallback: TValue,
): TValue {
  const value = getRecordValue(record, key);
  return value === undefined ? fallback : value;
}

export function setRecordValue<TValue>(
  record: Readonly<Record<string, TValue>>,
  key: string,
  value: TValue,
): Record<string, TValue> {
  let replaced = false;
  const entries = Object.entries(record).map(([entryKey, entryValue]) => {
    if (entryKey === key) {
      replaced = true;
      return [entryKey, value] as const;
    }

    return [entryKey, entryValue] as const;
  });

  if (!replaced) {
    entries.push([key, value] as const);
  }

  return Object.fromEntries(entries);
}
