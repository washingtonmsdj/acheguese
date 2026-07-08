import { afterEach, describe, expect, it, vi } from "vitest";
import { HibpService } from "@/core/auth/services/HibpService";
import {
  checkPasswordCompromise,
  formatCompromisedPasswordMessage,
} from "@/core/auth/utils/compromisedPassword";

describe("compromised password SSOT", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks passwords found in HIBP", async () => {
    vi.spyOn(HibpService, "checkPassword").mockResolvedValue({
      isPwned: true,
      count: 1234,
    });

    const result = await checkPasswordCompromise("SenhaVazada123!");

    expect(result).toEqual({
      blocked: true,
      count: 1234,
      unavailable: false,
      message: formatCompromisedPasswordMessage(1234),
    });
  });

  it("allows passwords not found in HIBP", async () => {
    vi.spyOn(HibpService, "checkPassword").mockResolvedValue({
      isPwned: false,
      count: 0,
    });

    await expect(checkPasswordCompromise("SenhaForte123!")).resolves.toEqual({
      blocked: false,
      count: 0,
      unavailable: false,
    });
  });

  it("keeps auth available when the external HIBP API is unavailable", async () => {
    vi.spyOn(HibpService, "checkPassword").mockRejectedValue(new Error("timeout"));

    await expect(checkPasswordCompromise("SenhaForte123!")).resolves.toEqual({
      blocked: false,
      count: 0,
      unavailable: true,
    });
  });
});
