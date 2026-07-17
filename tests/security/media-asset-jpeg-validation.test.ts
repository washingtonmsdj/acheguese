import { describe, expect, it } from "vitest";

import { validateAndStripJpegMetadata } from "../../supabase/functions/_shared/jpegValidation";

const SOF = [
  0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
];
const SOS_AND_EOI = [
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00, 0xff, 0xd9,
];

describe("canonical JPEG validation", () => {
  it("strips APP and COM metadata while preserving dimensions", () => {
    const source = new Uint8Array([
      0xff,
      0xd8,
      0xff,
      0xe1,
      0x00,
      0x04,
      0x41,
      0x42,
      0xff,
      0xfe,
      0x00,
      0x04,
      0x43,
      0x44,
      ...SOF,
      ...SOS_AND_EOI,
    ]);

    const result = validateAndStripJpegMetadata(source);

    expect(result).not.toBeNull();
    expect(result?.width).toBe(1);
    expect(result?.height).toBe(1);
    expect(Array.from(result?.bytes ?? [])).toEqual([
      0xff,
      0xd8,
      ...SOF,
      ...SOS_AND_EOI,
    ]);
  });

  it("rejects bytes appended after EOI", () => {
    const source = new Uint8Array([0xff, 0xd8, ...SOF, ...SOS_AND_EOI, 0x00]);

    expect(validateAndStripJpegMetadata(source)).toBeNull();
  });

  it("rejects malformed or dimensionless JPEG payloads", () => {
    expect(
      validateAndStripJpegMetadata(new Uint8Array([0xff, 0xd8])),
    ).toBeNull();
    expect(
      validateAndStripJpegMetadata(
        new Uint8Array([0xff, 0xd8, ...SOS_AND_EOI]),
      ),
    ).toBeNull();
  });
});
