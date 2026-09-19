import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  from,
  invokeBroker,
  invokeNullableBroker,
  trackError,
  loggerError,
} = vi.hoisted(() => ({
  from: vi.fn(),
  invokeBroker: vi.fn(),
  invokeNullableBroker: vi.fn(),
  trackError: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from },
}));

vi.mock("@/core/infrastructure/edge-functions/edgeFunctionBroker", () => ({
  invokeSupabaseBroker: invokeBroker,
  invokeNullableSupabaseBroker: invokeNullableBroker,
}));

vi.mock("@/shared/utils/errorTracking", () => ({ trackError }));
vi.mock("@/shared/utils/logger", () => ({
  logger: { error: loggerError },
}));

import {
  TerritorialAIService,
  type TerritoryAIContentUpdateInput,
} from "./TerritorialAIService";

describe("TerritorialAIService", () => {
  beforeEach(() => {
    from.mockReset();
    invokeBroker.mockReset();
    invokeNullableBroker.mockReset();
    trackError.mockReset();
    loggerError.mockReset();
  });

  it("reads the public projection without wildcard or admin metadata", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        territory_slug: "nordeste-de-amaralina",
        territory_name: "Nordeste de Amaralina",
        description: "Descrição",
        history: null,
        demographics: {},
        events: [],
        ai_generated_at: null,
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    await expect(
      TerritorialAIService.getAIContent("  Nordeste-de-Amaralina  "),
    ).resolves.toMatchObject({
      territory_slug: "nordeste-de-amaralina",
    });

    expect(from).toHaveBeenCalledWith("territory_ai_content");
    expect(select).toHaveBeenCalledTimes(1);
    const projection = String(select.mock.calls[0][0]);
    expect(projection).toContain("territory_slug");
    expect(projection).toContain("ai_generated_at");
    expect(projection).not.toContain("*");
    expect(projection).not.toContain("is_manual_override");
    expect(projection).not.toContain("manually_edited_at");
    expect(projection).not.toContain("created_at");
    expect(projection).not.toContain("updated_at");
    expect(eq).toHaveBeenCalledWith(
      "territory_slug",
      "nordeste-de-amaralina",
    );
  });

  it("routes admin reads through the broker", async () => {
    invokeNullableBroker.mockResolvedValue(null);

    await expect(
      TerritorialAIService.getAdminContent("nordeste-de-amaralina"),
    ).resolves.toBeNull();

    expect(invokeNullableBroker).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "get",
        functionName: "territory-ai-content",
        params: { territory_slug: "nordeste-de-amaralina" },
      }),
    );
  });

  it("generates using only the canonical territory slug", async () => {
    invokeBroker.mockResolvedValue({
      territory_slug: "nordeste-de-amaralina",
    });

    await TerritorialAIService.generateAIContent(
      "nordeste-de-amaralina",
    );

    expect(invokeBroker).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "generate",
        functionName: "territory-ai-content",
        params: { territory_slug: "nordeste-de-amaralina" },
      }),
    );
    expect(invokeBroker.mock.calls[0][0].params).not.toHaveProperty(
      "territory_name",
    );
    expect(invokeBroker.mock.calls[0][0].params).not.toHaveProperty(
      "members",
    );
  });

  it("sends only explicit editorial fields on manual update", async () => {
    const updates: TerritoryAIContentUpdateInput = {
      description: "Descrição",
      history: "História",
      demographics: {
        estimated_population: 10_000,
        economy: "Comércio local",
      },
      events: [
        {
          name: "Feira",
          description: "Feira local",
          frequency: "semanal",
          category: "cultura",
        },
      ],
    };

    invokeBroker.mockResolvedValue({
      territory_slug: "nordeste-de-amaralina",
    });

    await TerritorialAIService.updateAIContent(
      "nordeste-de-amaralina",
      updates,
    );

    expect(invokeBroker).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        functionName: "territory-ai-content",
        params: {
          territory_slug: "nordeste-de-amaralina",
          ...updates,
        },
      }),
    );

    const params = invokeBroker.mock.calls[0][0].params;
    expect(params).not.toHaveProperty("id");
    expect(params).not.toHaveProperty("territory_name");
    expect(params).not.toHaveProperty("ai_generated_at");
    expect(params).not.toHaveProperty("manually_edited_at");
    expect(params).not.toHaveProperty("is_manual_override");
    expect(params).not.toHaveProperty("created_at");
    expect(params).not.toHaveProperty("updated_at");
  });

  it("fails public reads closed and records the error", async () => {
    const error = new Error("permission denied");
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    await expect(
      TerritorialAIService.getAIContent("nordeste-de-amaralina"),
    ).resolves.toBeNull();

    expect(loggerError).toHaveBeenCalled();
    expect(trackError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        component: "TerritorialAIService",
        action: "getAIContent",
      }),
    );
  });
});
