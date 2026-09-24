import { describe, expect, it, vi } from "vitest";

import { openBusinessDirectConversation } from "../openBusinessDirectConversation";

describe("openBusinessDirectConversation", () => {
  it("creates or reuses the Business thread and returns its canonical route", async () => {
    const createOrGetThread = vi
      .fn()
      .mockResolvedValue("11111111-1111-4111-8111-111111111111");

    const path = await openBusinessDirectConversation(
      {
        profileId: "22222222-2222-4222-8222-222222222222",
        businessId: "33333333-3333-4333-8333-333333333333",
      },
      createOrGetThread,
    );

    expect(createOrGetThread).toHaveBeenCalledWith({
      profileId: "22222222-2222-4222-8222-222222222222",
      businessId: "33333333-3333-4333-8333-333333333333",
    });
    expect(path).toBe(
      "/mensagens/business/11111111-1111-4111-8111-111111111111",
    );
  });

  it("does not hide thread creation failures", async () => {
    const failure = new Error("thread denied");
    const createOrGetThread = vi.fn().mockRejectedValue(failure);

    await expect(
      openBusinessDirectConversation(
        {
          profileId: "22222222-2222-4222-8222-222222222222",
          businessId: "33333333-3333-4333-8333-333333333333",
        },
        createOrGetThread,
      ),
    ).rejects.toBe(failure);
  });
});
