import { describe, expect, it } from "vitest";

import { getAuthReturnContext } from "../../src/core/auth/utils/authReturnContext";

describe("auth return context", () => {
  it("turns premium business slugs into a safe friendly label", () => {
    expect(getAuthReturnContext("/p/sabores-da-ana?origem=chat")).toEqual({
      label: "Sabores da Ana",
      kind: "business",
    });
  });

  it("recognizes common internal destinations", () => {
    expect(getAuthReturnContext("/mensagens")).toEqual({
      label: "Conversas",
      kind: "conversation",
    });
    expect(getAuthReturnContext("/conta/perfis")).toEqual({
      label: "Minha conta",
      kind: "account",
    });
    expect(getAuthReturnContext("/comunidade/post/123")).toEqual({
      label: "Comunidade",
      kind: "community",
    });
  });

  it("never reflects unknown paths as interface copy", () => {
    expect(getAuthReturnContext("/qualquer/<script>alert(1)</script>")).toEqual({
      label: "onde parou",
      kind: "generic",
    });
  });
});
