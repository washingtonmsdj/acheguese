import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hasRole: vi.fn(),
  isAdmin: vi.fn(),
  isSuperAdmin: vi.fn(),
}));

vi.mock("./RoleRpcService", () => ({
  RoleRpcService: mocks,
}));

import { RoleService } from "./RoleService";

describe("RoleService: respostas verificadas pertencem ao role-rpc", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const readers = [
    {
      name: "hasRole",
      invoke: () => RoleService.hasRole("user-1", "moderator"),
      mock: mocks.hasRole,
    },
    {
      name: "isAdmin",
      invoke: () => RoleService.isAdmin("user-1"),
      mock: mocks.isAdmin,
    },
    {
      name: "isSuperAdmin",
      invoke: () => RoleService.isSuperAdmin("user-1"),
      mock: mocks.isSuperAdmin,
    },
  ];

  for (const reader of readers) {
    it(`${reader.name} retorna false apenas se confirmado`, async () => {
      reader.mock.mockResolvedValueOnce(false);
      await expect(reader.invoke()).resolves.toBe(false);
    });

    it(`${reader.name} retorna true apenas se confirmado`, async () => {
      reader.mock.mockResolvedValueOnce(true);
      await expect(reader.invoke()).resolves.toBe(true);
    });

    it(`${reader.name} preserva falha de rede sem retornar false`, async () => {
      const failure = new Error("role-rpc timeout");
      reader.mock.mockRejectedValueOnce(failure);
      await expect(reader.invoke()).rejects.toBe(failure);
    });
  }
});
