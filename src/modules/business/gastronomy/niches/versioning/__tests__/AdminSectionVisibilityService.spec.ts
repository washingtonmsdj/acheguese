/**
 * 🧪 ADMIN SECTION VISIBILITY SERVICE TESTS
 */

import { describe, it, expect } from 'vitest';
import type { ProfileNicheConfig } from '@/core/business/niches/versioning/types';
import { AdminSectionVisibilityService } from '../AdminSectionVisibilityService';
import type { AdminSection, NicheCapability } from '../../types';

describe('AdminSectionVisibilityService', () => {
  describe('isSectionVisible', () => {
    it('deve retornar true se todas as capabilities necessárias estão habilitadas', () => {
      const enabledCaps: NicheCapability[] = [
        'basic_menu',
        'menu_variants',
        'pizza_sizes',
        'pizza_flavors',
      ];

      expect(
        AdminSectionVisibilityService.isSectionVisible('basic_menu', enabledCaps),
      ).toBe(true);

      expect(
        AdminSectionVisibilityService.isSectionVisible('variants', enabledCaps),
      ).toBe(true);

      expect(
        AdminSectionVisibilityService.isSectionVisible('pizza_sizes', enabledCaps),
      ).toBe(true);

      expect(
        AdminSectionVisibilityService.isSectionVisible('pizza_flavors', enabledCaps),
      ).toBe(true);
    });

    it('deve retornar false se faltam capabilities', () => {
      const enabledCaps: NicheCapability[] = ['basic_menu', 'menu_variants'];

      expect(
        AdminSectionVisibilityService.isSectionVisible('pizza_sizes', enabledCaps),
      ).toBe(false);

      expect(
        AdminSectionVisibilityService.isSectionVisible('pizza_flavors', enabledCaps),
      ).toBe(false);

      expect(
        AdminSectionVisibilityService.isSectionVisible('sushi_builder', enabledCaps),
      ).toBe(false);
    });

    it('deve retornar true para seções que requerem múltiplas capabilities', () => {
      const enabledCaps: NicheCapability[] = [
        'pizza_crusts',
        'pizza_crust_stuffing',
      ];

      expect(
        AdminSectionVisibilityService.isSectionVisible('pizza_crusts', enabledCaps),
      ).toBe(true);
    });

    it('deve retornar false se apenas uma das capabilities necessárias está habilitada', () => {
      const enabledCaps: NicheCapability[] = ['pizza_crusts'];

      expect(
        AdminSectionVisibilityService.isSectionVisible('pizza_crusts', enabledCaps),
      ).toBe(false);
    });
  });

  describe('getSectionVisibility', () => {
    it('deve retornar informações completas de visibilidade', () => {
      const enabledCaps: NicheCapability[] = ['basic_menu', 'menu_variants'];

      const visibility = AdminSectionVisibilityService.getSectionVisibility(
        'pizza_sizes',
        enabledCaps,
      );

      expect(visibility.section_key).toBe('pizza_sizes');
      expect(visibility.is_visible).toBe(false);
      expect(visibility.required_capabilities).toContain('pizza_sizes');
      expect(visibility.missing_capabilities).toContain('pizza_sizes');
      expect(visibility.can_configure).toBe(false);
    });

    it('deve indicar seção visível quando todas capabilities estão habilitadas', () => {
      const enabledCaps: NicheCapability[] = [
        'basic_menu',
        'pizza_sizes',
        'pizza_flavors',
      ];

      const visibility = AdminSectionVisibilityService.getSectionVisibility(
        'pizza_sizes',
        enabledCaps,
      );

      expect(visibility.is_visible).toBe(true);
      expect(visibility.missing_capabilities).toHaveLength(0);
      expect(visibility.can_configure).toBe(true);
    });
  });

  describe('getAllSectionsVisibility', () => {
    it('deve retornar mapa de visibilidade de todas as seções', () => {
      const enabledCaps: NicheCapability[] = [
        'basic_menu',
        'menu_variants',
        'pizza_sizes',
      ];

      const visibilityMap =
        AdminSectionVisibilityService.getAllSectionsVisibility(enabledCaps);

      expect(visibilityMap.basic_menu.is_visible).toBe(true);
      expect(visibilityMap.variants.is_visible).toBe(true);
      expect(visibilityMap.pizza_sizes.is_visible).toBe(true);
      expect(visibilityMap.pizza_flavors.is_visible).toBe(false);
      expect(visibilityMap.sushi_builder.is_visible).toBe(false);
    });
  });

  describe('getVisibleSections', () => {
    it('deve retornar apenas seções visíveis', () => {
      const enabledCaps: NicheCapability[] = [
        'basic_menu',
        'menu_variants',
        'menu_addons',
        'pizza_sizes',
        'pizza_flavors',
      ];

      const visibleSections =
        AdminSectionVisibilityService.getVisibleSections(enabledCaps);

      expect(visibleSections).toContain('basic_menu');
      expect(visibleSections).toContain('variants');
      expect(visibleSections).toContain('addons');
      expect(visibleSections).toContain('pizza_sizes');
      expect(visibleSections).toContain('pizza_flavors');
      expect(visibleSections).not.toContain('pizza_crusts');
      expect(visibleSections).not.toContain('sushi_builder');
    });
  });

  describe('getVisibleSectionsForProfile', () => {
    it('deve retornar seções visíveis de um perfil', () => {
      const profile: ProfileNicheConfig = {
        primary_niche_key: 'pizza',
        niche_config_version: '1.0.0',
        support_level: 'full_enabled',
        operational_mode: 'pizzaria_full',
        enabled_capabilities: [
          'basic_menu',
          'menu_variants',
          'pizza_sizes',
          'pizza_flavors',
        ],
        missing_capabilities: ['pizza_multi_flavor'],
        needs_niche_upgrade: true,
        last_niche_upgrade_at: null,
      };

      const visibleSections =
        AdminSectionVisibilityService.getVisibleSectionsForProfile(profile);

      expect(visibleSections).toContain('basic_menu');
      expect(visibleSections).toContain('variants');
      expect(visibleSections).toContain('pizza_sizes');
      expect(visibleSections).toContain('pizza_flavors');
    });
  });

  describe('getConfigurableSections', () => {
    it('deve retornar seções que podem ser configuradas', () => {
      const enabledCaps: NicheCapability[] = ['basic_menu', 'menu_variants'];
      const missingCaps: NicheCapability[] = [
        'pizza_sizes',
        'pizza_flavors',
        'pizza_multi_flavor',
      ];

      const configurableSections =
        AdminSectionVisibilityService.getConfigurableSections(
          enabledCaps,
          missingCaps,
        );

      expect(configurableSections).toContain('pizza_sizes');
      expect(configurableSections).toContain('pizza_flavors');
      expect(configurableSections).not.toContain('basic_menu');
      expect(configurableSections).not.toContain('sushi_builder');
    });
  });

  describe('groupSectionsByCategory', () => {
    it('deve agrupar seções por categoria', () => {
      const sections = [
        'basic_menu',
        'variants',
        'pizza_sizes',
        'pizza_flavors',
        'sushi_builder',
        'acai_builder',
      ] as AdminSection[];

      const grouped =
        AdminSectionVisibilityService.groupSectionsByCategory(sections);

      expect(grouped.basic).toContain('basic_menu');
      expect(grouped.basic).toContain('variants');
      expect(grouped.pizza).toContain('pizza_sizes');
      expect(grouped.pizza).toContain('pizza_flavors');
      expect(grouped.sushi).toContain('sushi_builder');
      expect(grouped.acai).toContain('acai_builder');
    });

    it('deve remover grupos vazios', () => {
      const sections = ['basic_menu', 'variants'] as AdminSection[];

      const grouped =
        AdminSectionVisibilityService.groupSectionsByCategory(sections);

      expect(grouped.basic).toBeDefined();
      expect(grouped.pizza).toBeUndefined();
      expect(grouped.sushi).toBeUndefined();
    });
  });

  describe('shouldShowUpgradePrompt', () => {
    it('deve retornar true se precisa de upgrade', () => {
      const profile: ProfileNicheConfig = {
        primary_niche_key: 'pizza',
        niche_config_version: '1.0.0',
        support_level: 'full_enabled',
        operational_mode: 'pizzaria_full',
        enabled_capabilities: ['basic_menu'],
        missing_capabilities: ['pizza_multi_flavor'],
        needs_niche_upgrade: true,
        last_niche_upgrade_at: null,
      };

      expect(
        AdminSectionVisibilityService.shouldShowUpgradePrompt(profile),
      ).toBe(true);
    });

    it('deve retornar true se tem capabilities faltando', () => {
      const profile: ProfileNicheConfig = {
        primary_niche_key: 'pizza',
        niche_config_version: '1.0.0',
        support_level: 'full_enabled',
        operational_mode: 'pizzaria_full',
        enabled_capabilities: ['basic_menu'],
        missing_capabilities: ['pizza_multi_flavor', 'pizza_crusts'],
        needs_niche_upgrade: false,
        last_niche_upgrade_at: null,
      };

      expect(
        AdminSectionVisibilityService.shouldShowUpgradePrompt(profile),
      ).toBe(true);
    });

    it('deve retornar false se não precisa de upgrade', () => {
      const profile: ProfileNicheConfig = {
        primary_niche_key: 'pizza',
        niche_config_version: '1.0.0',
        support_level: 'full_enabled',
        operational_mode: 'pizzaria_full',
        enabled_capabilities: ['basic_menu', 'pizza_sizes'],
        missing_capabilities: [],
        needs_niche_upgrade: false,
        last_niche_upgrade_at: '2026-04-26T10:00:00Z',
      };

      expect(
        AdminSectionVisibilityService.shouldShowUpgradePrompt(profile),
      ).toBe(false);
    });
  });

  describe('getUpgradeMessageForSection', () => {
    it('deve retornar mensagem de upgrade para seção', () => {
      const missingCaps: NicheCapability[] = ['pizza_sizes', 'pizza_flavors'];

      const message =
        AdminSectionVisibilityService.getUpgradeMessageForSection(
          'pizza_sizes',
          missingCaps,
        );

      expect(message).toContain('Tamanhos de Pizza');
      expect(message).toContain('Configure');
    });

    it('deve retornar null se não faltam capabilities', () => {
      const missingCaps: NicheCapability[] = [];

      const message =
        AdminSectionVisibilityService.getUpgradeMessageForSection(
          'pizza_sizes',
          missingCaps,
        );

      expect(message).toBeNull();
    });
  });
});
