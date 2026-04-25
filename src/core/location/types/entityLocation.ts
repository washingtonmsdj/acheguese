/**
 * Entity Location Types - SSOT
 * 
 * Define os diferentes tipos de localização por entidade do sistema.
 * Cada tipo tem regras distintas de coleta, exibição e precisão.
 * 
 * @module core/location/types
 */

// ============================================
// ENTITY LOCATION TYPES
// ============================================

/**
 * Tipo de entidade que possui localização.
 * Cada tipo tem regras distintas de captura e exibição.
 */
export type LocationEntityType =
  | 'user_gps'           // Usuário comum — GPS do celular com permissão
  | 'verified_resident'  // Morador confirmado — endereço estruturado
  | 'physical_business'  // Empresa com local físico — endereço + coordenadas
  | 'mobile_service'     // Prestador/serviço móvel — área de cobertura
  | 'territorial'        // Entidade territorial do sistema — location_id canônico
  ;

/**
 * Fonte de onde a localização foi obtida
 */
export type LocationSource =
  | 'gps'                // GPS do dispositivo
  | 'address_geocoded'   // Geocodificado a partir de endereço estruturado
  | 'territory_center'   // Centro do território canônico (fallback)
  | 'ip_geolocation'     // Geolocalização por IP
  | 'manual'             // Inserção manual (admin)
  | 'coverage_area'      // Área de cobertura (serviço móvel)
  ;

/**
 * Posição resolvida de uma entidade — resultado final unificado
 */
export interface ResolvedEntityLocation {
  /** Tipo da entidade */
  entityType: LocationEntityType;
  /** Fonte da localização */
  source: LocationSource;
  /** Coordenadas (pode ser null se apenas territorial) */
  latitude: number | null;
  longitude: number | null;
  /** Precisão em metros (null se não aplicável) */
  accuracy: number | null;
  /** location_id canônico (sempre presente quando resolvido) */
  locationId: string | null;
  /** Nome do local para exibição */
  locationName: string | null;
  /** Nível de confiança geral */
  confidence: 'high' | 'medium' | 'low';
}

// ============================================
// DISPLAY RULES PER ENTITY TYPE
// ============================================

/**
 * Regras de exibição pública por tipo de entidade.
 * Define o que pode ser mostrado publicamente vs. internamente.
 */
export interface EntityDisplayRules {
  /** Pode exibir rua/número publicamente? */
  showStreetAddress: boolean;
  /** Pode exibir coordenadas precisas no mapa? */
  showExactPin: boolean;
  /** O que mostrar como localização pública */
  publicLabel: 'neighborhood_city' | 'city' | 'coverage_area' | 'exact_address';
  /** Pode ser listado em "perto de mim"? */
  supportsProximity: boolean;
  /** Tipo de representação no mapa */
  mapRepresentation: 'pin' | 'area' | 'territory' | 'none';
}

/**
 * Regras de exibição por tipo de entidade — SSOT
 * 
 * Nunca hardcodar regras de exibição em componentes.
 * Sempre usar esta tabela.
 */
export const ENTITY_DISPLAY_RULES: Record<LocationEntityType, EntityDisplayRules> = {
  user_gps: {
    showStreetAddress: false,
    showExactPin: false,
    publicLabel: 'neighborhood_city',
    supportsProximity: true,
    mapRepresentation: 'none',
  },
  verified_resident: {
    showStreetAddress: false, // NUNCA expor rua/número de morador
    showExactPin: false,
    publicLabel: 'neighborhood_city',
    supportsProximity: true,
    mapRepresentation: 'none',
  },
  physical_business: {
    showStreetAddress: true,  // Empresa pode mostrar endereço
    showExactPin: true,
    publicLabel: 'exact_address',
    supportsProximity: true,
    mapRepresentation: 'pin',
  },
  mobile_service: {
    showStreetAddress: false, // Serviço móvel não tem endereço fixo
    showExactPin: false,
    publicLabel: 'coverage_area',
    supportsProximity: true,
    mapRepresentation: 'area',
  },
  territorial: {
    showStreetAddress: false,
    showExactPin: false,
    publicLabel: 'neighborhood_city',
    supportsProximity: false,
    mapRepresentation: 'territory',
  },
};

function resolveDisplayRules(entityType: LocationEntityType): EntityDisplayRules {
  switch (entityType) {
    case 'user_gps':
      return ENTITY_DISPLAY_RULES.user_gps;
    case 'verified_resident':
      return ENTITY_DISPLAY_RULES.verified_resident;
    case 'physical_business':
      return ENTITY_DISPLAY_RULES.physical_business;
    case 'mobile_service':
      return ENTITY_DISPLAY_RULES.mobile_service;
    case 'territorial':
      return ENTITY_DISPLAY_RULES.territorial;
    default:
      return ENTITY_DISPLAY_RULES.territorial;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Obtém regras de exibição para um tipo de entidade
 */
export function getDisplayRules(entityType: LocationEntityType): EntityDisplayRules {
  return resolveDisplayRules(entityType);
}

/**
 * Verifica se uma entidade pode exibir endereço completo publicamente
 */
export function canShowFullAddress(entityType: LocationEntityType): boolean {
  return resolveDisplayRules(entityType).showStreetAddress;
}

/**
 * Verifica se uma entidade pode aparecer com pin exato no mapa
 */
export function canShowExactPin(entityType: LocationEntityType): boolean {
  return resolveDisplayRules(entityType).showExactPin;
}

/**
 * Retorna o label público para a localização de uma entidade
 */
export function getPublicLocationLabel(
  entityType: LocationEntityType,
  context: {
    neighborhood?: string;
    city?: string;
    coverageAreas?: string[];
    fullAddress?: string;
  }
): string {
  const rules = resolveDisplayRules(entityType);

  switch (rules.publicLabel) {
    case 'exact_address':
      return context.fullAddress || context.neighborhood
        ? `${context.neighborhood}, ${context.city}`
        : context.city || 'Local não informado';

    case 'neighborhood_city':
      return context.neighborhood
        ? `${context.neighborhood}, ${context.city}`
        : context.city || 'Local não informado';

    case 'city':
      return context.city || 'Local não informado';

    case 'coverage_area':
      if (context.coverageAreas?.length) {
        return `Atende em: ${context.coverageAreas.slice(0, 3).join(', ')}${
          context.coverageAreas.length > 3 ? ` +${context.coverageAreas.length - 3}` : ''
        }`;
      }
      return context.city ? `Atende em ${context.city}` : 'Área de atendimento';

    default:
      return context.city || 'Local não informado';
  }
}
