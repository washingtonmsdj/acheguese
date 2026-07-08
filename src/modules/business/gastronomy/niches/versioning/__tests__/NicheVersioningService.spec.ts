/**
 * NicheVersioningService tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase';
import { NicheVersioningService } from '../NicheVersioningService';

vi.mock('@/integrations/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

function mockSingleRow(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  vi.mocked(supabase.from).mockImplementation(from as never);

  return { from, select, eq, single };
}

describe('NicheVersioningService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.rpc).mockReset();
    vi.mocked(supabase.from).mockReset();
  });

  describe('hasCapability', () => {
    it('reads capabilities through the RLS-protected table', async () => {
      const query = mockSingleRow({
        enabled_capabilities: ['pizza_multi_flavor', 'pizza_sizes'],
      });

      const result = await NicheVersioningService.hasCapability(
        'business-123',
        'pizza_multi_flavor',
      );

      expect(result).toEqual({
        has_capability: true,
        capability: 'pizza_multi_flavor',
        business_id: 'business-123',
      });
      expect(query.from).toHaveBeenCalledWith('gastronomy_profiles');
      expect(query.select).toHaveBeenCalledWith('enabled_capabilities');
      expect(query.eq).toHaveBeenCalledWith('business_id', 'business-123');
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('returns false when the profile cannot be read', async () => {
      mockSingleRow(null, new Error('Database error'));

      const result = await NicheVersioningService.hasCapability(
        'business-123',
        'pizza_multi_flavor',
      );

      expect(result.has_capability).toBe(false);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('hasCapabilities', () => {
    it('checks multiple capabilities from the profile row', async () => {
      mockSingleRow({
        enabled_capabilities: ['pizza_sizes', 'pizza_flavors', 'pizza_crusts'],
      });

      const result = await NicheVersioningService.hasCapabilities(
        'business-123',
        ['pizza_sizes', 'pizza_flavors', 'pizza_multi_flavor'],
      );

      expect(result.all_enabled).toBe(false);
      expect(result.any_enabled).toBe(true);
      expect(result.enabled_count).toBe(2);
      expect(result.total_count).toBe(3);
      expect(result.capabilities.pizza_sizes).toBe(true);
      expect(result.capabilities.pizza_flavors).toBe(true);
      expect(result.capabilities.pizza_multi_flavor).toBe(false);
    });
  });

  describe('privileged mutations', () => {
    it('does not add capabilities from the browser client', async () => {
      const result = await NicheVersioningService.addCapability({
        business_id: 'business-123',
        capability: 'slice_sales',
        upgraded_by: 'user-456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('trusted admin/server path');
      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('does not mark niche cohorts for upgrade from the browser client', async () => {
      const result = await NicheVersioningService.markNeedsUpgrade({
        niche_key: 'pizza',
        missing_capabilities: ['slice_sales', 'seasonal_flavors'],
      });

      expect(result.updated_count).toBe(0);
      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('does not upgrade niche capabilities from the browser client', async () => {
      const result = await NicheVersioningService.upgradeNiche({
        business_id: 'business-123',
        to_version: '2.0.0',
        to_operational_mode: 'pizzaria_full',
        add_capabilities: ['pizza_sizes', 'pizza_flavors'],
        upgrade_type: 'manual',
        upgraded_by: 'user-456',
        notes: 'Upgrade to full pizza mode',
      });

      expect(result).toEqual({
        success: false,
        from_version: '0.0.0',
        to_version: '2.0.0',
        added_capabilities: [],
        error: expect.stringContaining('trusted admin/server path'),
      });
      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('getProfileNicheConfig', () => {
    it('gets profile niche config', async () => {
      mockSingleRow({
        primary_niche_key: 'pizza',
        niche_config_version: '1.0.0',
        support_level: 'full_enabled',
        operational_mode: 'pizzaria_full',
        enabled_capabilities: ['pizza_sizes', 'pizza_flavors'],
        missing_capabilities: ['slice_sales'],
        needs_niche_upgrade: true,
        last_niche_upgrade_at: '2026-04-26T10:00:00Z',
      });

      const config = await NicheVersioningService.getProfileNicheConfig(
        'business-123',
      );

      expect(config).not.toBeNull();
      expect(config?.primary_niche_key).toBe('pizza');
      expect(config?.niche_config_version).toBe('1.0.0');
      expect(config?.enabled_capabilities).toContain('pizza_sizes');
      expect(config?.missing_capabilities).toContain('slice_sales');
      expect(config?.needs_niche_upgrade).toBe(true);
    });

    it('returns null when the profile is not found', async () => {
      mockSingleRow(null, new Error('Not found'));

      const config = await NicheVersioningService.getProfileNicheConfig(
        'business-123',
      );

      expect(config).toBeNull();
    });
  });
});
