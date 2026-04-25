/**
 * 🍽️ GASTRONOMY NICHE TYPES
 *
 * Tipos canônicos para suporte a nichos gastronômicos especializados.
 * SSOT para configuração e capacidades de cada nicho.
 *
 * @version 1.0.0 - Niche Architecture Foundation
 */

// ============================================================================
// STATUS E NÍVEIS DE SUPORTE
// ============================================================================

/**
 * Status de disponibilidade de um nicho gastronômico
 */
export type NicheStatus =
  | 'full_enabled'      // Nicho completo com todas as funcionalidades
  | 'basic_enabled'     // Funciona com cardápio básico (categorias + itens)
  | 'beta_enabled'      // Disponível apenas para admin/dev/teste
  | 'hidden'            // Não aparece em lugar nenhum
  | 'coming_soon';      // Aparece como "em breve" (opcional)

// ============================================================================
// CAPACIDADES
// ============================================================================

/**
 * Capacidades operacionais que um nicho pode ter
 */
export type NicheCapability =
  // Cardápio básico
  | 'basic_menu'              // Categorias + itens simples
  | 'menu_variants'           // Variações (tamanhos, sabores base)
  | 'menu_addons'             // Adicionais/ingredientes extras
  | 'menu_combos'             // Combos/predefinidos
  | 'menu_promotions'         // Promoções e descontos

  // Nichos complexos - Pizza
  | 'pizza_sizes'             // Tamanhos de pizza específicos
  | 'pizza_flavors'           // Sabores de pizza
  | 'pizza_half_half'         // Meio a meio (2 sabores)
  | 'pizza_multi_flavor'      // 3 ou 4 sabores
  | 'pizza_crusts'            // Tipos de massa/borda
  | 'pizza_crust_stuffing'    // Recheio de borda
  | 'pizza_edge_rules'        // Regras de preço por borda

  // Nichos complexos - Sushi
  | 'sushi_piece_count'       // Contador de peças
  | 'sushi_combinado_builder' // Monte seu combinado
  | 'sushi_sashimi_weight'    // Sashimi por peso

  // Nichos complexos - Açaí/Sorvete
  | 'acai_base_sizes'         // Tamanhos de base
  | 'acai_toppings'           // Complementos
  | 'acai_syrups'             // Caldas
  | 'acai_fruit_selection'    // Escolha de frutas

  // Nichos complexos - Pastel
  | 'pastel_half_half'        // Meio a meio
  | 'pastel_sizes'            // Tamanhos
  | 'pastel_fillings'         // Recheios

  // Nichos complexos - Churrascaria/Carnes
  | 'meat_weight_pricing'     // Preço por peso (kg)
  | 'meat_cut_selection'      // Escolha de cortes
  | 'meat_point_selection'    // Ponto da carne

  // Pedido e Delivery
  | 'delivery'                // Delivery com taxas
  | 'pickup'                  // Retirada
  | 'dine_in'                 // Comer no local
  | 'scheduled_orders'        // Pedidos agendados
  | 'table_reservation'       // Reservas de mesa

  // Pagamento
  | 'payment_cash'            // Dinheiro
  | 'payment_card'            // Cartões
  | 'payment_pix'             // Pix
  | 'payment_online'          // Pagamento online

  // Gestão
  | 'inventory_tracking'      // Controle de estoque
  | 'order_management'        // Gestão de pedidos
  | 'analytics'               // Analytics específico
  | 'customer_accounts'       // Contas de cliente
  | 'loyalty_program'         // Programa de fidelidade

  // Extras
  | 'custom_instructions'     // Observações personalizadas
  | 'dietary_flags'           // Filtros dietéticos
  | 'nutrition_info'          // Informações nutricionais
  | 'photos'                  // Fotos de itens
  | 'reviews'                 // Avaliações;

/**
 * Seções de admin disponíveis para um nicho
 */
export type AdminSection =
  | 'basic_menu'              // Menu básico (categorias + itens)
  | 'variants'                // Gerenciamento de variações
  | 'addons'                  // Gerenciamento de adicionais
  | 'combos'                  // Gerenciamento de combos
  | 'promotions'              // Gerenciamento de promoções
  | 'delivery_areas'          // Áreas de entrega
  | 'operational_hours'       // Horários de funcionamento
  | 'reservations'            // Reservas
  | 'order_management'        // Gestão de pedidos
  | 'analytics'               // Analytics
  | 'pricing_rules'           // Regras de preço específicas
  | 'inventory'               // Controle de estoque

  // Seções específicas de nichos
  | 'pizza_sizes'             // Tamanhos de pizza
  | 'pizza_flavors'           // Sabores de pizza
  | 'pizza_crusts'            // Massas e bordas
  | 'pizza_pricing'           // Regras de preço de pizza
  | 'sushi_builder'           // Monte seu combinado
  | 'sushi_pieces'            // Controle de peças
  | 'acai_builder'            // Monte seu açaí
  | 'meat_cuts'               // Cortes de carne
  | 'meat_pricing'            // Preço por peso
  | 'pastel_builder';         // Monte seu pastel

// ============================================================================
// CONFIGURAÇÃO DE NICHO
// ============================================================================

/**
 * Configuração padrão de um nicho
 */
export interface NicheDefaultConfig {
  /** Preço mínimo de pedido padrão */
  defaultMinimumOrder?: number;
  /** Taxa de entrega padrão */
  defaultDeliveryFee?: number;
  /** Tempo mínimo de entrega (min) */
  defaultDeliveryTimeMin?: number;
  /** Tempo máximo de entrega (min) */
  defaultDeliveryTimeMax?: number;
  /** Aceita reservas por padrão */
  defaultAcceptsReservations?: boolean;
  /** Métodos de pagamento habilitados por padrão */
  defaultPaymentMethods?: string[];
  /** Categorias sugeridas iniciais */
  suggestedCategories?: string[];
  /** Itens sugeridos iniciais */
  suggestedItems?: string[];
  /** Configurações específicas do nicho (JSON) */
  nicheSpecific?: Record<string, unknown>;
}

/**
 * Regras de validação para itens de um nicho
 */
export interface NicheValidationRules {
  /** Preço mínimo permitido */
  minPrice?: number;
  /** Preço máximo permitido */
  maxPrice?: number;
  /** Número máximo de variações por item */
  maxVariantsPerItem?: number;
  /** Número máximo de adicionais por item */
  maxAddonsPerItem?: number;
  /** Requer descrição */
  requiresDescription?: boolean;
  /** Requer foto */
  requiresPhoto?: boolean;
  /** Campos obrigatórios personalizados */
  requiredFields?: string[];
  /** Regras customizadas em formato JSON Schema */
  customRules?: Record<string, unknown>;
}

/**
 * Configuração completa de um nicho gastronômico
 */
export interface GastronomyNicheConfig {
  /** Chave única do nicho (kebab-case) */
  nicheKey: string;
  /** Label público para exibição */
  publicLabel: string;
  /** Descrição curta */
  description: string;
  /** Tipo operacional (classificação interna) */
  operationalType: 'fast_food' | 'restaurant' | 'dessert' | 'bakery' | 'bar' | 'specialty' | 'complex';
  /** Nível de suporte atual */
  supportLevel: NicheStatus;
  /** Se aparece na seleção pública */
  isSelectable: boolean;
  /** Se é visível publicamente */
  isPublic: boolean;
  /** Se está em beta */
  isBeta: boolean;
  /** Capacidades habilitadas para este nicho */
  enabledCapabilities: NicheCapability[];
  /** Capacidades planejadas mas não implementadas */
  missingCapabilities: NicheCapability[];
  /** Configurações padrão */
  defaultConfig: NicheDefaultConfig;
  /** Seções de admin a exibir */
  adminSections: AdminSection[];
  /** Regras de validação */
  validationRules: NicheValidationRules;
  /** Ícone (nome do Lucide icon) */
  icon?: string;
  /** Cor tema (opcional) */
  themeColor?: string;
  /** Ordem de exibição na lista */
  displayOrder: number;
  /** Tags para filtros */
  tags: string[];
}

// ============================================================================
// TIPOS DE DADOS
// ============================================================================

/**
 * Nicho selecionado em um perfil gastronômico
 */
export interface SelectedNiche {
  nicheKey: string;
  selectedAt: string;
  /** Se foi confirmado pelo usuário */
  isConfirmed: boolean;
  /** Configurações específicas salvas */
  configOverrides?: Record<string, unknown>;
}

/**
 * Mapeamento de nichos por chave
 */
export type NicheRegistry = Record<string, GastronomyNicheConfig>;

/**
 * Filtros para listar nichos
 */
export interface NicheFilters {
  status?: NicheStatus | NicheStatus[];
  isSelectable?: boolean;
  isPublic?: boolean;
  operationalType?: string | string[];
  tags?: string[];
}

/**
 * Resultado de validação de um item para um nicho
 */
export interface NicheValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  nicheKey: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Chaves de nichos gastronômicos oficiais
 */
export const NICHE_KEYS = {
  // Nichos básicos (basic_enabled)
  LANCHES: 'lanches',
  BRASILEIRA: 'brasileira',
  ARABE: 'arabe',
  SAUDAVEL: 'saudavel',
  SALGADOS: 'salgados',
  PADARIA: 'padaria',
  DOCES: 'doces',
  MARMITA: 'marmita',
  CAFES: 'cafes',
  HAMBURGUER: 'hamburguer',

  // Nichos complexos (preparados para implementação futura)
  PIZZA: 'pizza',
  JAPONESA: 'japonesa',
  SUSHI: 'sushi',
  ACAI: 'acai',
  SORVETE: 'sorvete',
  PASTEL: 'pastel',
  CHURRASCARIA: 'churrascaria',
  CARNES: 'carnes',
  BARES: 'bares',

  // Genérico
  OUTROS: 'outros',
} as const;

export type NicheKey = (typeof NICHE_KEYS)[keyof typeof NICHE_KEYS];

/**
 * Status ordenados por prioridade de exibição
 */
export const NICHE_STATUS_PRIORITY: Record<NicheStatus, number> = {
  full_enabled: 1,
  basic_enabled: 2,
  beta_enabled: 3,
  coming_soon: 4,
  hidden: 5,
};
