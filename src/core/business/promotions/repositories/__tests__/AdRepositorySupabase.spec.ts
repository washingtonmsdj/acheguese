import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryPayload<T> = {
  data: T[] | null;
  error: { message?: string | null } | null;
};

type Builder<T> = PromiseLike<QueryPayload<T>> & {
  select: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

const supabaseMocks = vi.hoisted(() => {
  const builders: Array<Builder<unknown>> = [];
  const mockFrom = vi.fn(() => {
    const builder = builders.shift();
    if (!builder) throw new Error("No query builder queued");
    return builder;
  });

  function queueBuilder<T>(
    payload: QueryPayload<T>,
    maybeSinglePayload: { data: T | null; error: { message?: string | null } | null } = {
      data: null,
      error: null,
    },
  ): Builder<T> {
    const builder = {
      select: vi.fn(() => builder),
      in: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => maybeSinglePayload),
      then: (resolve: (value: QueryPayload<T>) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(payload).then(resolve, reject),
    } as Builder<T>;

    builders.push(builder as Builder<unknown>);
    return builder;
  }

  return { builders, mockFrom, queueBuilder };
});

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    from: supabaseMocks.mockFrom,
  },
}));

import { AdRepositorySupabase } from "../AdRepositorySupabase";

describe("AdRepositorySupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMocks.builders.length = 0;
  });

  it("filters public delivery by active, approved and paid or authorized campaigns", async () => {
    supabaseMocks.queueBuilder({
      data: [{ campaign_id: "campaign-1", location_id: "location-1", target_scope: "district" }],
      error: null,
    });
    const campaignBuilder = supabaseMocks.queueBuilder({
      data: [
        {
          id: "campaign-1",
          advertiser_name: "Padaria Central",
          title: "Pao frances em destaque",
          description: "Fresquinho todos os dias.",
          image_url: null,
          cta_label: "Ver empresa",
          cta_url: "/empresas/padaria-central",
          status: "active",
          review_status: "approved",
          billing_status: "paid",
          placement_key: "sidebar_widget",
          priority: 10,
          starts_at: "2026-07-09T00:00:00.000Z",
          ends_at: null,
          created_at: "2026-07-09T00:00:00.000Z",
          updated_at: "2026-07-09T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const repository = new AdRepositorySupabase();
    const result = await repository.findActiveCampaignsByLocationIds("sidebar_widget", [
      "location-1",
    ]);

    expect(result).toHaveLength(1);
    expect(campaignBuilder.eq).toHaveBeenCalledWith("status", "active");
    expect(campaignBuilder.eq).toHaveBeenCalledWith("review_status", "approved");
    expect(campaignBuilder.in).toHaveBeenCalledWith("billing_status", ["authorized", "paid"]);
    expect(campaignBuilder.eq).toHaveBeenCalledWith("placement_key", "sidebar_widget");
  });
});
