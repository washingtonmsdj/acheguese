import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TerritorialGroupAdminService } from '../TerritorialGroupAdminService';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@/core/infrastructure/edge-functions/edgeFunctionBroker', () => ({
  invokeSupabaseBroker: invokeMock,
}));

const group = {
  id: '5b7f3f5a-2d39-4e08-9c91-3f2e7b2a40d2',
  slug: 'centro',
  name: 'Centro',
  description: 'Area central',
  anchor_city_id: '1ab7a4d5-d8b8-4b7b-9d66-36cbf1995e93',
  status: 'inactive',
  metadata: {},
  created_at: '2026-09-20T00:00:00.000Z',
  updated_at: '2026-09-20T00:00:00.000Z',
};

describe('TerritorialGroupAdminService', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('sends saveGroup as one broker command and validates the acknowledgement', async () => {
    invokeMock.mockResolvedValue({
      group,
      memberIds: ['4f6d1c74-0bd2-4c52-9a2a-20b4d5d0c5bc'],
      memberCount: 1,
    });

    await expect(
      TerritorialGroupAdminService.saveGroup({
        slug: 'centro',
        name: 'Centro',
        description: 'Area central',
        anchorCityId: group.anchor_city_id,
        memberLocationIds: ['4f6d1c74-0bd2-4c52-9a2a-20b4d5d0c5bc'],
      }),
    ).resolves.toEqual(group);

    expect(invokeMock).toHaveBeenCalledWith({
      action: 'saveGroup',
      functionName: 'territorial-group-admin-rpc',
      noDataMessage: 'Broker territorial retornou dados invalidos.',
      params: {
        slug: 'centro',
        name: 'Centro',
        description: 'Area central',
        anchorCityId: group.anchor_city_id,
        memberLocationIds: ['4f6d1c74-0bd2-4c52-9a2a-20b4d5d0c5bc'],
      },
      serviceName: 'TerritorialGroupAdminService',
    });
  });

  it('fails when the broker acknowledgement does not match the requested membership set', async () => {
    invokeMock.mockResolvedValue({ group, memberIds: [], memberCount: 0 });

    await expect(
      TerritorialGroupAdminService.saveGroup({
        slug: 'centro',
        name: 'Centro',
        anchorCityId: group.anchor_city_id,
        memberLocationIds: ['4f6d1c74-0bd2-4c52-9a2a-20b4d5d0c5bc'],
      }),
    ).rejects.toThrow('Confirmacao inconsistente');
  });

  it('validates the returned status before reporting success', async () => {
    invokeMock.mockResolvedValue({ group: { ...group, status: 'active' } });

    await expect(
      TerritorialGroupAdminService.setStatus(group.id, 'active'),
    ).resolves.toEqual({ ...group, status: 'active' });
  });
});
