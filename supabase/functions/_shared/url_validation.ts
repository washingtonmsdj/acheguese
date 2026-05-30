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

export function isCountryCode(value: string): boolean {
  if (value.length !== 2) return false;
  return isLowercaseLetter(value.charCodeAt(0)) && isLowercaseLetter(value.charCodeAt(1));
}

export function isCommaSeparatedCountryCodes(value: string): boolean {
  const codes = value.split(',');
  return codes.length > 0 && codes.every(isCountryCode);
}

export function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) {
    end -= 1;
  }

  return value.slice(0, end);
}
