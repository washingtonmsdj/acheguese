import { describe, expect, it } from "vitest";
import {
  ACCOUNT_PATHS,
  buildAccountProfileEditPath,
} from "@/core/routing/config/account";

describe("account route SSOT", () => {
  it("builds profile edit URLs from the canonical route pattern", () => {
    expect(ACCOUNT_PATHS.profileEditPattern).toBe("/conta/editar/:profileId");
    expect(buildAccountProfileEditPath("profile-123")).toBe(
      "/conta/editar/profile-123",
    );
  });

  it("encodes profile ids instead of interpolating unsafe path segments", () => {
    expect(buildAccountProfileEditPath("profile/with space")).toBe(
      "/conta/editar/profile%2Fwith%20space",
    );
  });
});
