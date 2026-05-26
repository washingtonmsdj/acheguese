import { describe, expect, it } from "vitest";
import { MediaError } from "./MediaService";

describe("MediaError", () => {
  it("preserves a stable operational error code", () => {
    const error = new MediaError("Arquivo invalido", "INVALID_FILE_TYPE");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MediaError");
    expect(error.code).toBe("INVALID_FILE_TYPE");
  });
});
