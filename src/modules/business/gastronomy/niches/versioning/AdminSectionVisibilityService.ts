/**
 * 🎛️ ADMIN SECTION VISIBILITY SERVICE
 *
 * Serviço para determinar quais seções do admin devem ser exibidas
 * baseado nas capabilities habilitadas do nicho.
 *
 * REGRA: Admin não decide telas apenas pelo nome do nicho.
 * Ele decide pelas capabilities habilitadas.
 *
 * @version 1.0.0
 */

import type {
  AdminSectionVisibility,
  AdminSectionsVisibilityMap,
  ProfileNicheConfig,
} from '@/core/business/niches/versioning/types';
import { getRecordValue } from '@/shared/utils/recordLookup';
import type { AdminSection, NicheCapability } from '../types';

/**
 * Mapeamento de seções de admin para capabilities necessárias
 */
const ADMIN_SECTION_REQUIREMENTS: Record<
  AdminSection,
  NicheCapability[]
> = {
  // Seções básicas (sempre visíveis)
  basic_menu: ['basic_menu'],
  variants: ['menu_variants'],
  addons: ['menu_addons'],
  combos: ['menu_combos'],
  promotions: ['menu_promotions'],
  delivery_areas: ['delivery'],
  operational_hours: ['basic_menu'],
  reservations: ['table_reservation'],
  order_management: ['order_management'],
  analytics: ['analytics'],
  pricing_rules: ['basic_menu'],
  inventory: ['inventory_tracking'],

  // Seções específicas de Pizza
  pizza_sizes: ['pizza_sizes'],
  pizza_flavors: ['pizza_flavors'],
  pizza_crusts: ['pizza_crusts', 'pizza_crust_stuffing'],
  pizza_pricing: ['pizza_edge_rules'],

  // Seções específicas de Sushi
  sushi_builder: ['sushi_combinado_builder'],
  sushi_pieces: ['sushi_piece_count'],

  // Seções específicas de Açaí
  acai_builder: ['acai_base_sizes', 'acai_toppings'],

  // Seções específicas de Carnes
  meat_cuts: ['meat_cut_selection'],
  meat_pricing: ['meat_weight_pricing'],

  // Seções específicas de Pastel
  pastel_builder: ['pastel_half_half', 'pastel_fillings'],
};

export class AdminSectionVisibilityService {
  /**
   * Verifica se uma seção deve ser visível
   */
  static isSectionVisible(
    section: AdminSection,
    enabledCapabilities: NicheCapability[],
  ): boolean {
    const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section);
    if (!requiredCaps || requiredCaps.length === 0) {
      return false;
    }

    return requiredCaps.every((cap) => enabledCapabilities.includes(cap));
  }

  /**
   * Obtém informações de visibilidade de uma seção
   */
  static getSectionVisibility(
    section: AdminSection,
    enabledCapabilities: NicheCapability[],
  ): AdminSectionVisibility {
    const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section) || [];
    const missingCaps = requiredCaps.filter(
      (cap) => !enabledCapabilities.includes(cap),
    );
    const isVisible = missingCaps.length === 0 && requiredCaps.length > 0;

    return {
      section_key: section,
      is_visible: isVisible,
      required_capabilities: requiredCaps,
      missing_capabilities: missingCaps,
      can_configure: isVisible,
    };
  }

  /**
   * Obtém mapa de visibilidade de todas as seções
   */
  static getAllSectionsVisibility(
    enabledCapabilities: NicheCapability[],
  ): AdminSectionsVisibilityMap {
    const sections = Object.keys(
      ADMIN_SECTION_REQUIREMENTS,
    ) as AdminSection[];

    return Object.fromEntries(
      sections.map((section) => [
        section,
        this.getSectionVisibility(section, enabledCapabilities),
      ]),
    );
  }

  /**
   * Obtém apenas seções visíveis
   */
  static getVisibleSections(
    enabledCapabilities: NicheCapability[],
  ): AdminSection[] {
    const sections = Object.keys(
      ADMIN_SECTION_REQUIREMENTS,
    ) as AdminSection[];

    return sections.filter((section) =>
      this.isSectionVisible(section, enabledCapabilities),
    );
  }

  /**
   * Obtém seções visíveis de um perfil
   */
  static getVisibleSectionsForProfile(
    profile: ProfileNicheConfig,
  ): AdminSection[] {
    return this.getVisibleSections(profile.enabled_capabilities);
  }

  /**
   * Obtém seções que podem ser habilitadas (tem capabilities faltando)
   */
  static getConfigurableSections(
    enabledCapabilities: NicheCapability[],
    missingCapabilities: NicheCapability[],
  ): AdminSection[] {
    const sections = Object.keys(
      ADMIN_SECTION_REQUIREMENTS,
    ) as AdminSection[];

    return sections.filter((section) => {
      const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section) || [];
      if (requiredCaps.length === 0) return false;

      const isVisible = this.isSectionVisible(section, enabledCapabilities);
      const hasMissingCaps = requiredCaps.some((cap) =>
        missingCapabilities.includes(cap),
      );

      return !isVisible && hasMissingCaps;
    });
  }

  /**
   * Agrupa seções por categoria
   */
  static groupSectionsByCategory(
    sections: AdminSection[],
  ): Record<string, AdminSection[]> {
    const groups: Record<string, AdminSection[]> = {
      basic: [],
      pizza: [],
      sushi: [],
      acai: [],
      meat: [],
      pastel: [],
      other: [],
    };

    for (const section of sections) {
      if (section.startsWith('pizza_')) {
        groups.pizza.push(section);
      } else if (section.startsWith('sushi_')) {
        groups.sushi.push(section);
      } else if (section.startsWith('acai_')) {
        groups.acai.push(section);
      } else if (section.startsWith('meat_')) {
        groups.meat.push(section);
      } else if (section.startsWith('pastel_')) {
        groups.pastel.push(section);
      } else if (
        [
          'basic_menu',
          'variants',
          'addons',
          'combos',
          'promotions',
          'delivery_areas',
          'operational_hours',
          'order_management',
          'analytics',
        ].includes(section)
      ) {
        groups.basic.push(section);
      } else {
        groups.other.push(section);
      }
    }

    return Object.fromEntries(
      Object.entries(groups).filter(([_, sections]) => sections.length > 0),
    );
  }

  /**
   * Verifica se deve mostrar seção de upgrade
   */
  static shouldShowUpgradePrompt(
    profile: ProfileNicheConfig,
  ): boolean {
    return (
      profile.needs_niche_upgrade ||
      profile.missing_capabilities.length > 0
    );
  }

  /**
   * Obtém mensagem de upgrade para uma seção
   */
  static getUpgradeMessageForSection(
    section: AdminSection,
    missingCapabilities: NicheCapability[],
  ): string | null {
    const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section) || [];
    const missing = requiredCaps.filter((cap) =>
      missingCapabilities.includes(cap),
    );

    if (missing.length === 0) return null;

    const sectionNames: Record<AdminSection, string> = {
      basic_menu: 'Cardápio Básico',
      variants: 'Variações',
      addons: 'Adicionais',
      combos: 'Combos',
      promotions: 'Promoções',
      delivery_areas: 'Áreas de Entrega',
      operational_hours: 'Horários',
      reservations: 'Reservas',
      order_management: 'Gestão de Pedidos',
      analytics: 'Analytics',
      pricing_rules: 'Regras de Preço',
      inventory: 'Estoque',
      pizza_sizes: 'Tamanhos de Pizza',
      pizza_flavors: 'Sabores de Pizza',
      pizza_crusts: 'Massas e Bordas',
      pizza_pricing: 'Preços de Pizza',
      sushi_builder: 'Monte seu Combinado',
      sushi_pieces: 'Controle de Peças',
      acai_builder: 'Monte seu Açaí',
      meat_cuts: 'Cortes de Carne',
      meat_pricing: 'Preço por Peso',
      pastel_builder: 'Monte seu Pastel',
    };

    const sectionName = getRecordValue(sectionNames, section) || section;
    return `Configure ${sectionName} para habilitar esta funcionalidade`;
  }
}
