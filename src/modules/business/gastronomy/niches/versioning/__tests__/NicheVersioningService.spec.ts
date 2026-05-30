/**
 * NicheVersioningService tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NicheVersioningService } from '../NicheVersioningService';
import type { ProfileNicheConfig } from '../types';

// Mock Supabase
vi.mock('@/core/infrastructure/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      insert: vi.fn(),
    })),
  },
}));

describe('NicheVersioningService', () => {
  describe('hasCapability', () => {
    it('deve verificar se perfil tem capability', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const result = await NicheVersioningService.hasCapability(
        'business-123',
        'pizza_multi_flavor',
      );

      expect(result.has_capability).toBe(true);
      expect(result.capability).toBe('pizza_multi_flavor');
      expect(result.business_id).toBe('business-123');
    });

    it('deve retornar false em caso de erro', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      } as any);

      const result = await NicheVersioningService.hasCapability(
        'business-123',
        'pizza_multi_flavor',
      );

      expect(result.has_capability).toBe(false);
    });
  });

  describe('hasCapabilities', () => {
    it('deve verificar múltiplas capabilities', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                enabled_capabilities: [
                  'pizza_sizes',
                  'pizza_flavors',
                  'pizza_crusts',
                ],
              },
              error: null,
            }),
          })),
        })),
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

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

  describe('addCapability', () => {
    it('deve adicionar capability com sucesso', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const result = await NicheVersioningService.addCapability({
        business_id: 'business-123',
        capability: 'slice_sales',
        upgraded_by: 'user-456',
      });

      expect(result.success).toBe(true);
      expect(result.already_exists).toBe(false);
    });

    it('deve indicar quando capability já existe', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: false,
        error: null,
      } as any);

      const result = await NicheVersioningService.addCapability({
        business_id: 'business-123',
        capability: 'slice_sales',
      });

      expect(result.success).toBe(true);
      expect(result.already_exists).toBe(true);
    });

    it('deve retornar erro em caso de falha', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      } as any);

      const result = await NicheVersioningService.addCapability({
        business_id: 'business-123',
        capability: 'slice_sales',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('markNeedsUpgrade', () => {
    it('deve marcar perfis como precisando upgrade', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: 5,
        error: null,
      } as any);

      const result = await NicheVersioningService.markNeedsUpgrade({
        niche_key: 'pizza',
        missing_capabilities: ['slice_sales', 'seasonal_flavors'],
      });

      expect(result.updated_count).toBe(5);
    });
  });

  describe('upgradeNiche', () => {
    it('deve realizar upgrade completo', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');

      // Mock fetch current profile
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                niche_config_version: '1.0.0',
                operational_mode: 'basic_menu',
                enabled_capabilities: ['basic_menu', 'menu_variants'],
              },
              error: null,
            }),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await NicheVersioningService.upgradeNiche({
        business_id: 'business-123',
        to_version: '2.0.0',
        to_operational_mode: 'pizzaria_full',
        add_capabilities: ['pizza_sizes', 'pizza_flavors'],
        upgrade_type: 'manual',
        upgraded_by: 'user-456',
        notes: 'Upgrade para pizzaria completa',
      });

      expect(result.success).toBe(true);
      expect(result.from_version).toBe('1.0.0');
      expect(result.to_version).toBe('2.0.0');
      expect(result.added_capabilities).toEqual(['pizza_sizes', 'pizza_flavors']);
    });

    it('deve retornar erro se perfil não encontrado', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          })),
        })),
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const result = await NicheVersioningService.upgradeNiche({
        business_id: 'business-123',
        to_version: '2.0.0',
        to_operational_mode: 'pizzaria_full',
        add_capabilities: ['pizza_sizes'],
        upgrade_type: 'manual',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Perfil gastronômico não encontrado');
    });
  });

  describe('getProfileNicheConfig', () => {
    it('deve obter configuração de nicho do perfil', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                primary_niche_key: 'pizza',
                niche_config_version: '1.0.0',
                support_level: 'full_enabled',
                operational_mode: 'pizzaria_full',
                enabled_capabilities: ['pizza_sizes', 'pizza_flavors'],
                missing_capabilities: ['slice_sales'],
                needs_niche_upgrade: true,
                last_niche_upgrade_at: '2026-04-26T10:00:00Z',
              },
              error: null,
            }),
          })),
        })),
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

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

    it('deve retornar null se perfil não encontrado', async () => {
      const { supabase } = await import('@/core/infrastructure/supabase');

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          })),
        })),
      }));
      vi.mocked(supabase.from).mockImplementation(mockFrom as any);

      const config = await NicheVersioningService.getProfileNicheConfig(
        'business-123',
      );

      expect(config).toBeNull();
    });
  });
});
