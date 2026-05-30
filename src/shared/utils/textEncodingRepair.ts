const WINDOWS_1252_BYTE_BY_CODE_POINT = new Map<number, number>([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const MOJIBAKE_MARKER_PATTERN = /[ÃÂâ]/;
const REPLACEMENT_CHARACTER_PATTERN = /[?�]/g;

const LEGACY_QUESTION_MARK_REPAIRS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bpr\?tico\b/g, "pr\u00e1tico"],
  [/\bPr\?tico\b/g, "Pr\u00e1tico"],
  [/\bneg\?cio\b/g, "neg\u00f3cio"],
  [/\bneg\?cios\b/g, "neg\u00f3cios"],
  [/\bNeg\?cio\b/g, "Neg\u00f3cio"],
  [/\bNeg\?cios\b/g, "Neg\u00f3cios"],
  [/\bAudit\?rio\b/g, "Audit\u00f3rio"],
  [/\baudit\?rio\b/g, "audit\u00f3rio"],
  [/\bcomunit\?rio\b/g, "comunit\u00e1rio"],
  [/\bComunit\?rio\b/g, "Comunit\u00e1rio"],
];

function countReplacementMarkers(value: string): number {
  return value.match(REPLACEMENT_CHARACTER_PATTERN)?.length ?? 0;
}

function toWindows1252Bytes(value: string): Uint8Array | null {
  const bytes: number[] = [];

  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) return null;

    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const mappedByte = WINDOWS_1252_BYTE_BY_CODE_POINT.get(codePoint);
    if (mappedByte === undefined) return null;
    bytes.push(mappedByte);
  }

  return Uint8Array.from(bytes);
}

function repairUtf8Mojibake(value: string): string {
  if (!MOJIBAKE_MARKER_PATTERN.test(value) || typeof TextDecoder === "undefined") {
    return value;
  }

  const bytes = toWindows1252Bytes(value);
  if (!bytes) return value;

  try {
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return countReplacementMarkers(decoded) <= countReplacementMarkers(value) ? decoded : value;
  } catch {
    return value;
  }
}

function repairLegacyQuestionMarks(value: string): string {
  return LEGACY_QUESTION_MARK_REPAIRS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

export function normalizePersistedTextEncoding(value: string): string {
  return repairLegacyQuestionMarks(repairUtf8Mojibake(value));
}
