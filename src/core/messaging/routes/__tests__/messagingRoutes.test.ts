import { describe, expect, it } from "vitest";

import { messagingRoutes } from "../messagingRoutes";

describe("messagingRoutes", () => {
  it("owns Inbox and thread route construction", () => {
    expect(messagingRoutes.inbox()).toBe("/mensagens");
    expect(messagingRoutes.threadPattern()).toBe(
      "/mensagens/:providerId/:threadId",
    );
    expect(
      messagingRoutes.thread(
        "business",
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toBe(
      "/mensagens/business/11111111-1111-4111-8111-111111111111",
    );
  });

  it("fails closed for invalid route segments", () => {
    expect(() =>
      messagingRoutes.thread("business", "../outra-rota"),
    ).toThrow("Invalid Messaging thread ID");
  });
});
