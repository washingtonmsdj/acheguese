/**
 * 🍽️ NICHE CAPABILITIES LIST COMPONENT
 *
 * Lista de capacidades de um nicho para exibição no admin.
 *
 * @version 1.0.0
 */

import React from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { GastronomyNicheConfig, NicheCapability } from '../types';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface NicheCapabilitiesListProps {
  niche: GastronomyNicheConfig;
  showMissing?: boolean;
  className?: string;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function NicheCapabilitiesList({
  niche,
  showMissing = true,
  className,
}: NicheCapabilitiesListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Capacidades Habilitadas */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          Capacidades Disponíveis
        </h4>
        <div className="flex flex-wrap gap-2">
          {niche.enabledCapabilities.map((cap) => (
            <CapabilityBadge key={cap} capability={cap} isEnabled />
          ))}
        </div>
      </div>

      {/* Capacidades Faltantes */}
      {showMissing && niche.missingCapabilities.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Em Desenvolvimento
          </h4>
          <div className="flex flex-wrap gap-2">
            {niche.missingCapabilities.map((cap) => (
              <CapabilityBadge key={cap} capability={cap} isEnabled={false} />
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {niche.operationalType === 'complex' && (
        <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Este é um <strong>nicho complexo</strong>. Algumas funcionalidades
              avançadas estão em desenvolvimento e serão liberadas em breve.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

interface CapabilityBadgeProps {
  capability: NicheCapability;
  isEnabled: boolean;
}

function CapabilityBadge({ capability, isEnabled }: CapabilityBadgeProps) {
  const label = getCapabilityLabel(capability);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full',
        isEnabled
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-gray-100 text-gray-600 border border-gray-200'
      )}
    >
      {isEnabled ? (
        <Check className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCapabilityLabel(capability: NicheCapability): string {
  const labels: Record<NicheCapability, string> = {
    // Básicas
    basic_menu: 'Cardápio Básico',
    menu_variants: 'Variações',
    menu_addons: 'Adicionais',
    menu_combos: 'Combos',
    menu_promotions: 'Promoções',

    // Pizza
    pizza_sizes: 'Tamanhos de Pizza',
    pizza_flavors: 'Sabores',
    pizza_half_half: 'Meio a Meio',
    pizza_multi_flavor: 'Múltiplos Sabores',
    pizza_crusts: 'Massas',
    pizza_crust_stuffing: 'Bordas Recheadas',
    pizza_edge_rules: 'Regras de Borda',

    // Sushi
    sushi_piece_count: 'Contador de Peças',
    sushi_combinado_builder: 'Monte seu Combinado',
    sushi_sashimi_weight: 'Sashimi por Peso',

    // Açaí
    acai_base_sizes: 'Tamanhos de Base',
    acai_toppings: 'Complementos',
    acai_syrups: 'Caldas',
    acai_fruit_selection: 'Seleção de Frutas',

    // Pastel
    pastel_half_half: 'Meio a Meio',
    pastel_sizes: 'Tamanhos',
    pastel_fillings: 'Recheios',

    // Carnes
    meat_weight_pricing: 'Preço por Peso',
    meat_cut_selection: 'Seleção de Cortes',
    meat_point_selection: 'Ponto da Carne',

    // Operação
    delivery: 'Delivery',
    pickup: 'Retirada',
    dine_in: 'Comer no Local',
    scheduled_orders: 'Pedidos Agendados',
    table_reservation: 'Reservas',

    // Pagamento
    payment_cash: 'Dinheiro',
    payment_card: 'Cartões',
    payment_pix: 'Pix',
    payment_online: 'Online',

    // Gestão
    inventory_tracking: 'Controle de Estoque',
    order_management: 'Gestão de Pedidos',
    analytics: 'Analytics',
    customer_accounts: 'Contas de Cliente',
    loyalty_program: 'Fidelidade',

    // Extras
    custom_instructions: 'Observações',
    dietary_flags: 'Filtros Dietéticos',
    nutrition_info: 'Informações Nutricionais',
    photos: 'Fotos',
    reviews: 'Avaliações',
  };

  return labels[capability] || capability;
}
