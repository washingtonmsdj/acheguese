import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileRow } from "../types";

const mocks = vi.hoisted(() => ({
  banRead: vi.fn(),
  getUserRoles: vi.fn(),
  from: vi.fn(),
  maybeSingle: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  logError: vi.fn(),
  warn: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));

vi.mock("@/core/trust/services/ActiveBanReader", () => ({
  activeBanReader: { readCurrent: mocks.banRead },
}));

vi.mock("@/core/authorization/services/RoleService", () => ({
  RoleService: { getUserRoles: mocks.getUserRoles },
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: mocks.logError, warn: mocks.warn },
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import { getProfileContextAggregate } from "../profile.context.aggregate";

const profile = {
  id: "profile-1",
  user_id: "user-1",
  profile_type: "personal",
  name: "Perfil Teste",
  display_name: "Perfil Teste",
  username: "teste",
  city: "Salvador",
  verified: false,
  reputation: 0,
  is_active: true,
  created_at: "2026-10-07T00:00:00Z",
  updated_at: "2026-10-07T00:00:00Z",
} as ProfileRow;

function contextFor(
  getActiveProfile: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(profile),
) {
  return getProfileContextAggregate({ userId: "user-1", getActiveProfile });
}

describe("Contexto da Conta: estado conhecido versus falha de backend", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.banRead.mockResolvedValue(false);
    mocks.getUserRoles.mockResolvedValue([]);
    mocks.eq.mockReturnValue({
      eq: mocks.eq,
      maybeSingle: mocks.maybeSingle,
    });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("retorna null somente quando o owner confirma que nao ha perfil", async () => {
    await expect(contextFor(vi.fn().mockResolvedValue(null))).resolves.toBeNull();

    expect(mocks.banRead).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("representa como basico somente uma consulta valida sem assinatura", async () => {
    const result = await contextFor();

    expect(result?.plan).toMatchObject({ type: "basic", isPremium: false });
    expect(result?.status).toMatchObject({ isBlocked: false, isActive: true });
    expect(mocks.from).toHaveBeenCalledWith("user_subscriptions");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mocks.eq).toHaveBeenCalledWith("active", true);
  });

  it("mantem estado de bloqueio confirmado pelo servidor", async () => {
    mocks.banRead.mockResolvedValueOnce(true);

    const result = await contextFor();

    expect(result?.status.isBlocked).toBe(true);
    expect(result?.status.isActive).toBe(false);
    expect(result?.permissions.canCreateBusiness).toBe(false);
    expect(result?.permissions.canMessage).toBe(false);
  });

  it("preserva o erro do RPC de ban, sem produzir contexto desbloqueado", async () => {
    const failure = new Error("ban data plane unavailable");
    mocks.banRead.mockRejectedValueOnce(failure);

    await expect(contextFor()).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({
        component: "profile.context.aggregate",
        action: "getProfileContextAggregate",
      }),
    );
  });

  it("nao interpreta erro PostgREST de assinatura como plano basico", async () => {
    const failure = { code: "PGRST301", message: "session invalid" };
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: failure });

    await expect(contextFor()).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "session invalid" }),
      expect.objectContaining({ component: "profile.context.aggregate" }),
    );
  });

  it("nao mascara erro de rede durante a consulta de assinatura", async () => {
    const failure = new Error("network unavailable");
    mocks.maybeSingle.mockRejectedValueOnce(failure);

    await expect(contextFor()).rejects.toBe(failure);
  });

  it("falha ao ler papeis globais rejeita o contexto e nao fabrica canModerate=false", async () => {
    const failure = new Error("role-rpc unavailable");
    mocks.getUserRoles.mockRejectedValueOnce(failure);

    await expect(contextFor()).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({ component: "profile.context.aggregate" }),
    );
  });

  it("moderacao confirmada pelo broker continua refletida na UI", async () => {
    mocks.getUserRoles.mockResolvedValueOnce(["moderator"]);

    const context = await contextFor();

    expect(context?.permissions.canModerate).toBe(true);
    expect(mocks.getUserRoles).toHaveBeenCalledWith("user-1");
  });

  it("preserva assinatura real quando o backend devolve plano valido", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: { active: true, plan_type: "premium", expires_at: null },
      error: null,
    });

    const result = await contextFor();

    expect(result?.plan).toMatchObject({ type: "premium", isPremium: true });
  });
});
