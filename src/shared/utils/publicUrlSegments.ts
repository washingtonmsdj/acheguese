function isDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

function isLowercaseLetter(code: number): boolean {
  return code >= 97 && code <= 122;
}

function isUppercaseLetter(code: number): boolean {
  return code >= 65 && code <= 90;
}

export function isSafePublicUrlSegment(value: string): boolean {
  if (!value || value[0] === '-' || value[value.length - 1] === '-') return false;

  let previousWasHyphen = false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isHyphen = code === 45;

    if (isHyphen) {
      if (previousWasHyphen) return false;
      previousWasHyphen = true;
      continue;
    }

    if (!isLowercaseLetter(code) && !isDigit(code)) return false;
    previousWasHyphen = false;
  }

  return true;
}

export function isSafePublicId(value: string): boolean {
  if (!value) return false;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isSafeSeparator = code === 45 || code === 95;

    if (!isLowercaseLetter(code) && !isUppercaseLetter(code) && !isDigit(code) && !isSafeSeparator) {
      return false;
    }
  }

  return true;
}

export function normalizeSafePublicUrlSegment(
  value: string | null | undefined,
  label: string,
): string {
  const normalized = String(value ?? '').trim();
  if (!isSafePublicUrlSegment(normalized)) {
    throw new Error(`${label} invalido para URL publica`);
  }

  return normalized;
}

export function normalizeSafePublicId(value: string | null | undefined, label: string): string {
  const normalized = String(value ?? '').trim();
  if (!isSafePublicId(normalized)) {
    throw new Error(`${label} invalido para URL publica`);
  }

  return normalized;
}
