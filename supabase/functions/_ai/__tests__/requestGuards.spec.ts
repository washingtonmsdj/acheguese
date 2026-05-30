import { describe, expect, it } from "vitest";

import {
  AI_VISION_REQUEST_LIMITS,
  dataUrlToImageBytes,
  hasAllowedTextMessages,
  hasAllowedToolSchema,
  isAllowedImageReference,
  jsonByteLength,
} from "../requestGuards.ts";

describe("AI request guards", () => {
  it("validates JSON payload byte length", () => {
    expect(jsonByteLength({ value: "abc" })).toBeGreaterThan(0);
  });

  it("accepts only safe image references", () => {
    expect(isAllowedImageReference("https://cdn.example.com/image.webp")).toBe(true);
    expect(isAllowedImageReference("data:image/png;base64,aGVsbG8=")).toBe(true);

    expect(isAllowedImageReference("http://cdn.example.com/image.webp")).toBe(false);
    expect(isAllowedImageReference("https://localhost/image.webp")).toBe(false);
    expect(isAllowedImageReference("https://127.0.0.1/image.webp")).toBe(false);
    expect(isAllowedImageReference("https://192.168.0.10/image.webp")).toBe(false);
    expect(isAllowedImageReference("javascript:alert(1)")).toBe(false);
    expect(isAllowedImageReference("data:text/html;base64,PGgxPkJvb208L2gxPg==")).toBe(false);
    expect(isAllowedImageReference(`https://cdn.example.com/${"a".repeat(AI_VISION_REQUEST_LIMITS.maxImageReferenceChars)}`)).toBe(false);
  });

  it("decodes only allowed image data URLs", () => {
    const decoded = dataUrlToImageBytes("data:image/jpg;base64,aGVsbG8=");

    expect(decoded.mime).toBe("image/jpeg");
    expect(decoded.bytes).toEqual(Uint8Array.from([104, 101, 108, 108, 111]));
    expect(() => dataUrlToImageBytes("data:text/html;base64,PGgxPkJvb208L2gxPg==")).toThrow();
  });

  it("validates text messages", () => {
    expect(hasAllowedTextMessages([{ role: "user", content: "texto" }])).toBe(true);
    expect(hasAllowedTextMessages([{ role: "assistant", content: [{ type: "text", text: "ok" }] }])).toBe(true);

    expect(hasAllowedTextMessages([{ role: "developer", content: "texto" }])).toBe(false);
    expect(hasAllowedTextMessages([{ role: "user" }])).toBe(false);
    expect(hasAllowedTextMessages([null])).toBe(false);
  });

  it("validates tool schema shape", () => {
    expect(hasAllowedToolSchema(undefined)).toBe(true);
    expect(hasAllowedToolSchema({ name: "extract_food_item", parameters: { type: "object" } })).toBe(true);

    expect(hasAllowedToolSchema({ name: "bad name", parameters: { type: "object" } })).toBe(false);
    expect(hasAllowedToolSchema({ name: "tool", parameters: [] })).toBe(false);
    expect(hasAllowedToolSchema({ name: "tool" })).toBe(false);
  });
});
