export interface ValidatedJpeg {
  bytes: Uint8Array;
  height: number;
  width: number;
}

export function validateAndStripJpegMetadata(
  source: Uint8Array,
): ValidatedJpeg | null {
  if (
    source.length < 16 ||
    source[0] !== 0xff ||
    source[1] !== 0xd8 ||
    source[source.length - 2] !== 0xff ||
    source[source.length - 1] !== 0xd9
  ) {
    return null;
  }

  const chunks: Uint8Array[] = [source.slice(0, 2)];
  let dimensions: { height: number; width: number } | null = null;
  let offset = 2;
  while (offset + 4 < source.length - 2) {
    const segmentStart = offset;
    if (source[offset] !== 0xff) return null;
    while (offset < source.length && source[offset] === 0xff) offset += 1;
    const marker = source[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xd8) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) return null;
    if (offset + 2 > source.length) return null;

    const segmentLength = (source[offset] << 8) | source[offset + 1];
    const segmentEnd = offset + segmentLength;
    if (segmentLength < 2 || segmentEnd > source.length - 2) return null;

    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      if (segmentLength < 7) return null;
      const height = (source[offset + 3] << 8) | source[offset + 4];
      const width = (source[offset + 5] << 8) | source[offset + 6];
      if (width <= 0 || height <= 0 || dimensions) return null;
      dimensions = { width, height };
    }

    if (marker === 0xda) {
      if (!dimensions) return null;
      chunks.push(source.slice(segmentStart));
      const totalBytes = chunks.reduce(
        (total, chunk) => total + chunk.length,
        0,
      );
      const sanitized = new Uint8Array(totalBytes);
      let writeOffset = 0;
      for (const chunk of chunks) {
        sanitized.set(chunk, writeOffset);
        writeOffset += chunk.length;
      }
      return { bytes: sanitized, ...dimensions };
    }

    const isMetadata = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) chunks.push(source.slice(segmentStart, segmentEnd));
    offset = segmentEnd;
  }

  return null;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
