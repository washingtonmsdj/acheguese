import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EducationSubscriptionService } from '../education-subscription.service';

const dependencies = vi.hoisted(() => ({
  getBusinessDataIdByProfileId: vi.fn(),
  getByBusinessId: vi.fn(),
  getPublishedPlanEntitlements: vi.fn(),
  getAll: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/core/business/services/BusinessService', () => ({
  BusinessService: {
    getBusinessDataIdByProfileId: dependencies.getBusinessDataIdByProfileId,
  },
}));

vi.mock('@/core/billing', () => ({
  PlanTier: { FREE: 'free', PRO: 'pro', DELIVERY: 'delivery' },
  BusinessSubscriptionService: {
    getByBusinessId: dependencies.getByBusinessId,
  },
  EntitlementsService: { getAll: dependencies.getAll },
}));

vi.mock('@/core/billing/services/CatalogService', () => ({
  CatalogService: {
    getPublishedPlanEntitlements: dependencies.getPublishedPlanEntitlements,
  },
}));

vi.mock('@/shared/utils/logger', () => ({
  logger: { error: dependencies.logError },
}));

const capabilities = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseBasicAnalytics: true,
  canExportReports: true,
};

describe('EducationSubscriptionService: leitura confiável de plano', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dependencies.getBusinessDataIdByProfileId.mockResolvedValue('business-data-id');
    dependencies.getByBusinessId.mockResolvedValue({
      error: null,
      data: { status: 'active', plan_tier: 'pro', current_period_end: null },
    });
    dependencies.getPublishedPlanEntitlements.mockResolvedValue(capabilities);
    dependencies.getAll.mockReturnValue(capabilities);
  });

  it('retorna o estado real somente após resolver Business e Billing', async () => {
    const status = await EducationSubscriptionService.getSubscriptionStatus('profile-id');
    expect(status.isActive).toBe(true);
    expect(status.planTier).toBe('pro');
    expect(status.entitlements.canUseAnalytics).toBe(true);
    expect(dependencies.getByBusinessId).toHaveBeenCalledWith('business-data-id');
  });

  it('não inventa plano gratuito quando o Business não pode ser resolvido', async () => {
    dependencies.getBusinessDataIdByProfileId.mockResolvedValue(null);
    await expect(EducationSubscriptionService.getSubscriptionStatus('profile-id'))
      .rejects.toThrow('business_data.id indisponivel');
    expect(dependencies.getByBusinessId).not.toHaveBeenCalled();
  });

  it('não confunde falha de assinatura com ausência de entitlement', async () => {
    dependencies.getByBusinessId.mockResolvedValue({
      error: 'Falha temporária ao consultar a assinatura',
      data: null,
    });
    await expect(EducationSubscriptionService.getSubscriptionStatus('profile-id'))
      .rejects.toThrow('Falha temporária');
  });

  it('preserva erro do catálogo canônico em vez de exibir upgrade falso', async () => {
    dependencies.getPublishedPlanEntitlements.mockRejectedValue(new Error('Falha no catálogo'));
    await expect(EducationSubscriptionService.getSubscriptionStatus('profile-id'))
      .rejects.toThrow('Falha no catálogo');
  });

  it('nega analytics para assinatura inativa, sem inventar erro de leitura', async () => {
    dependencies.getByBusinessId.mockResolvedValue({
      error: null,
      data: { status: 'inactive', plan_tier: 'pro', current_period_end: null },
    });
    await expect(EducationSubscriptionService.canUseAnalytics('profile-id'))
      .resolves.toBe(false);
  });
});
