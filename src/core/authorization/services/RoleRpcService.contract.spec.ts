import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invokeSupabaseBroker: vi.fn() }));
vi.mock("@/core/infrastructure/edge-functions/edgeFunctionBroker", () => ({
  invokeSupabaseBroker: mocks.invokeSupabaseBroker,
}));

import { RoleRpcService } from "./RoleRpcService";

describe("role-rpc: contrato da resposta e indisponibilidade", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("roles confirmadas pelo broker sao devolvidas sem transformacao", async () => {
    mocks.invokeSupabaseBroker.mockResolvedValueOnce({
      roles: ["user", "moderator"],
    });

    await expect(RoleRpcService.getUserRoles("user-1")).resolves.toEqual([
      "user",
      "moderator",
    ]);

    expect(mocks.invokeSupabaseBroker).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "getUserRoles",
        functionName: "role-rpc",
        params: { userId: "user-1" },
      }),
    );
  });

  it("lista vazia confirmada continua lista vazia", async () => {
    mocks.invokeSupabaseBroker.mockResolvedValueOnce({ roles: [] });

    await expect(RoleRpcService.getUserRoles("user-1")).resolves.toEqual([]);
  });

  it.each([
    { invalid: { roles: null }, name: "null" },
    { invalid: { roles: undefined }, name: "ausente" },
    { invalid: { roles: "user" }, name: "string" },
    { invalid: { roles: [42] }, name: "item nao textual" },
    { invalid: null, name: "payload nulo" },
  ])("rejeita contrato invalido ($name) em vez de inventar []", async ({ invalid }) => {
    mocks.invokeSupabaseBroker.mockResolvedValueOnce(invalid);

    await expect(RoleRpcService.getUserRoles("user-1")).rejects.toThrow(
      "Invalid role-rpc response: roles must be an array",
    );
  });

  it("indisponibilidade do broker continua excecao original", async () => {
    const failure = new Error("role-rpc 503");
    mocks.invokeSupabaseBroker.mockRejectedValueOnce(failure);

    await expect(RoleRpcService.getUserRoles("user-1")).rejects.toBe(failure);
  });

  it("impede que a Edge Function normalize falhas do SQL em array vazio", () => {
    const source = readFileSync(
      resolve(process.cwd(), "supabase/functions/role-rpc/index.ts"),
      "utf8",
    );
    expect(source).not.toContain("roles: Array.isArray(data) ? data : []");
    expect(source).toContain("if (!Array.isArray(data)) {");
    expect(source).toContain("get_user_roles returned an invalid result");
  });
});
