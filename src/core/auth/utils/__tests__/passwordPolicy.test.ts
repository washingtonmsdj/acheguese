import { describe, expect, it } from "vitest";
import {
  getAuthPasswordRequirementStatus,
  validateAuthPassword,
} from "@/core/auth/utils/passwordPolicy";
import { isStrongPassword } from "@/shared/validation/passwordPolicy";
import { strongPasswordValidator } from "@/shared/validation/validators/custom.validators";

describe("password policy SSOT", () => {
  const validPassword = "Senha123!";
  const missingSpecial = "Senha123";

  it("uses the same strong password rule in auth helpers and Zod schemas", () => {
    expect(isStrongPassword(validPassword)).toBe(true);
    expect(strongPasswordValidator.safeParse(validPassword).success).toBe(true);
    expect(validateAuthPassword(validPassword)).toBeNull();
  });

  it("rejects the same weak password across every validation surface", () => {
    expect(isStrongPassword(missingSpecial)).toBe(false);
    expect(strongPasswordValidator.safeParse(missingSpecial).success).toBe(false);
    expect(validateAuthPassword(missingSpecial)).not.toBeNull();
  });

  it("keeps requirement status aligned with the canonical validator", () => {
    const requirements = getAuthPasswordRequirementStatus(validPassword);

    expect(requirements).toHaveLength(5);
    expect(requirements.every((requirement) => requirement.satisfied)).toBe(true);
    expect(isStrongPassword(validPassword)).toBe(true);
  });
});
