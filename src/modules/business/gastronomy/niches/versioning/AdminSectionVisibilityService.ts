import type {
  AdminSectionVisibility,
  AdminSectionsVisibilityMap,
  ProfileNicheConfig,
} from '@/core/business/niches/versioning/types';
import type { AdminSection, NicheCapability } from '@/core/business/niches/types';
import { getRecordValue } from '@/shared/utils/recordLookup';

const ADMIN_SECTION_REQUIREMENTS: Record<AdminSection, NicheCapability[]> = {
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
  pizza_sizes: ['pizza_sizes'],
  pizza_flavors: ['pizza_flavors'],
  pizza_crusts: ['pizza_crusts', 'pizza_crust_stuffing'],
  pizza_pricing: ['pizza_edge_rules'],
  sushi_builder: ['sushi_combinado_builder'],
  sushi_pieces: ['sushi_piece_count'],
  acai_builder: ['acai_base_sizes', 'acai_toppings'],
  meat_cuts: ['meat_cut_selection'],
  meat_pricing: ['meat_weight_pricing'],
  pastel_builder: ['pastel_half_half', 'pastel_fillings'],
};

export class AdminSectionVisibilityService {
  static isSectionVisible(
    section: AdminSection,
    enabledCapabilities: NicheCapability[],
  ): boolean {
    const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section);
    if (!requiredCaps || requiredCaps.length === 0) return false;
    return requiredCaps.every((cap) => enabledCapabilities.includes(cap));
  }

  static getSectionVisibility(
    section: AdminSection,
    enabledCapabilities: NicheCapability[],
  ): AdminSectionVisibility {
    const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section) || [];
    const missingCaps = requiredCaps.filter((cap) => !enabledCapabilities.includes(cap));
    const isVisible = missingCaps.length === 0 && requiredCaps.length > 0;

    return {
      section_key: section,
      is_visible: isVisible,
      required_capabilities: requiredCaps,
      missing_capabilities: missingCaps,
      can_configure: isVisible,
    };
  }

  static getAllSectionsVisibility(
    enabledCapabilities: NicheCapability[],
  ): AdminSectionsVisibilityMap {
    const sections = Object.keys(ADMIN_SECTION_REQUIREMENTS) as AdminSection[];
    return Object.fromEntries(
      sections.map((section) => [
        section,
        this.getSectionVisibility(section, enabledCapabilities),
      ]),
    );
  }

  static getVisibleSections(
    enabledCapabilities: NicheCapability[],
  ): AdminSection[] {
    const sections = Object.keys(ADMIN_SECTION_REQUIREMENTS) as AdminSection[];
    return sections.filter((section) => this.isSectionVisible(section, enabledCapabilities));
  }

  static getVisibleSectionsForProfile(profile: ProfileNicheConfig): AdminSection[] {
    return this.getVisibleSections(profile.enabled_capabilities);
  }

  static getConfigurableSections(
    enabledCapabilities: NicheCapability[],
    missingCapabilities: NicheCapability[],
  ): AdminSection[] {
    const sections = Object.keys(ADMIN_SECTION_REQUIREMENTS) as AdminSection[];

    return sections.filter((section) => {
      const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section) || [];
      if (requiredCaps.length === 0) return false;

      const isVisible = this.isSectionVisible(section, enabledCapabilities);
      const hasMissingCaps = requiredCaps.some((cap) => missingCapabilities.includes(cap));
      return !isVisible && hasMissingCaps;
    });
  }

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

    const basicSections: AdminSection[] = [
      'basic_menu',
      'variants',
      'addons',
      'combos',
      'promotions',
      'delivery_areas',
      'operational_hours',
      'order_management',
      'analytics',
    ];

    for (const section of sections) {
      if (section.startsWith('pizza_')) groups.pizza.push(section);
      else if (section.startsWith('sushi_')) groups.sushi.push(section);
      else if (section.startsWith('acai_')) groups.acai.push(section);
      else if (section.startsWith('meat_')) groups.meat.push(section);
      else if (section.startsWith('pastel_')) groups.pastel.push(section);
      else if (basicSections.includes(section)) groups.basic.push(section);
      else groups.other.push(section);
    }

    return Object.fromEntries(
      Object.entries(groups).filter(([, groupedSections]) => groupedSections.length > 0),
    );
  }

  static shouldShowUpgradePrompt(profile: ProfileNicheConfig): boolean {
    return profile.needs_niche_upgrade || profile.missing_capabilities.length > 0;
  }

  static getUpgradeMessageForSection(
    section: AdminSection,
    missingCapabilities: NicheCapability[],
  ): string | null {
    const requiredCaps = getRecordValue(ADMIN_SECTION_REQUIREMENTS, section) || [];
    const missing = requiredCaps.filter((cap) => missingCapabilities.includes(cap));
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
