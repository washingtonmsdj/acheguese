import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invokeSupabaseBroker: vi.fn() }));

vi.mock("@/core/infrastructure/edge-functions/edgeFunctionBroker", () => ({
  invokeSupabaseBroker: mocks.invokeSupabaseBroker,
}));

import { RoleRpcService } from "./RoleRpcService";

const readers = [
  {
    name: "hasRole",
    field: "hasRole",
    call: () => RoleRpcService.hasRole("user-1", "admin"),
  },
  {
    name: "isAdmin",
    field: "isAdmin",
    call: () => RoleRpcService.isAdmin("user-1"),
  },
  {
    name: "isSuperAdmin",
    field: "isSuperAdmin",
    call: () => RoleRpcService.isSuperAdmin("user-1"),
  },
];

describe("role-rpc: booleans devem ter contrato valido e verificavel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  for (const reader of readers) {
    it(`${reader.name}: aceita true retornado pelo owner`, async () => {
      mocks.invokeSupabaseBroker.mockResolvedValueOnce({ [reader.field]: true });

      await expect(reader.call()).resolves.toBe(true);
    });

    it(`${reader.name}: aceita false confirmado pelo owner`, async () => {
      mocks.invokeSupabaseBroker.mockResolvedValueOnce({ [reader.field]: false });

      await expect(reader.call()).resolves.toBe(false);
    });

    for (const invalid of [null, undefined, "false", 0]) {
      it(`${reader.name}: rejeita valor invalido ${String(invalid)}`, async () => {
        mocks.invokeSupabaseBroker.mockResolvedValueOnce({ [reader.field]: invalid });

        await expect(reader.call()).rejects.toThrow(
          `Invalid role-rpc response: ${reader.field} must be a boolean`,
        );
      });
    }

    it(`${reader.name}: rejeita envelope ausente`, async () => {
      mocks.invokeSupabaseBroker.mockResolvedValueOnce(null);

      await expect(reader.call()).rejects.toThrow(
        `Invalid role-rpc response: ${reader.field} must be a boolean`,
      );
    });

    it(`${reader.name}: propaga indisponibilidade real do broker`, async () => {
      const error = new Error("role-rpc 503");
      mocks.invokeSupabaseBroker.mockRejectedValueOnce(error);

      await expect(reader.call()).rejects.toBe(error);
    });
  }

  it("a Edge Function valida os tres resultados SQL como boolean, sem converter invalidos em false", () => {
    const edge = readFileSync(
      resolve(process.cwd(), "supabase/functions/role-rpc/index.ts"),
      "utf8",
    );

    expect(edge).toContain("function requireSqlBoolean(");
    expect(edge).toContain("typeof value !== \"boolean\"");
    for (const name of ["hasRole", "isAdmin", "isSuperAdmin"]) {
      expect(edge).not.toContain(`${name}: data === true`);
    }
    for (const method of ["has_role", "is_admin", "is_super_admin"]) {
      expect(edge).toContain(`requireSqlBoolean(data, "${method}")`);
    }
  });
});
