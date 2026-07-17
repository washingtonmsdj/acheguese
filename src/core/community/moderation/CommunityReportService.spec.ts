import { beforeEach, describe, expect, it, vi } from "vitest";

const { insert } = vi.hoisted(() => ({ insert: vi.fn() }));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({ insert })),
  },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: vi.fn() },
}));

import { communityReportService } from "./CommunityReportService";

const validInput = {
  targetType: "post" as const,
  targetId: "00000000-0000-4000-8000-000000000111",
  reason: "spam" as const,
  details: "Repeated promotion",
};

describe("CommunityReportService", () => {
  beforeEach(() => {
    insert.mockReset();
  });

  it("writes only the canonical Community report payload", async () => {
    insert.mockResolvedValue({ error: null });

    await communityReportService.report(validInput);

    expect(insert).toHaveBeenCalledWith({
      target_type: "post",
      target_id: validInput.targetId,
      reason: "spam",
      description: "Repeated promotion",
    });
  });

  it("rejects unknown reason codes before reaching Supabase", async () => {
    await expect(
      communityReportService.report({
        ...validInput,
        reason: "legacy_reason" as never,
      }),
    ).rejects.toThrow("dados da denuncia sao invalidos");
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not expose raw database errors to the interface", async () => {
    insert.mockResolvedValue({
      error: { code: "XX000", message: "internal schema detail" },
    });

    await expect(communityReportService.report(validInput)).rejects.toThrow(
      "Nao foi possivel enviar a denuncia.",
    );
  });
});
