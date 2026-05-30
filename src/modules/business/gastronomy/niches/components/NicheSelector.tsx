/**
 * 🍽️ NICHE SELECTOR COMPONENT
 *
 * Componente de seleção de nicho gastronômico para admin.
 *
 * @version 1.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { Check, Clock, FlaskConical, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { NicheConfigService } from '../services/NicheConfigService';
import type { GastronomyNicheConfig, NicheStatus } from '../types';

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface NicheSelectorProps {
  /** Nicho atualmente selecionado */
  selectedNiche: string | null;
  /** Callback quando um nicho é selecionado */
  onSelect: (nicheKey: string) => void;
  /** Mostrar nichos em beta (para admin/dev) */
  showBeta?: boolean;
  /** Mostrar nichos ocultos */
  showHidden?: boolean;
  /** Filtro por status específico */
  filterStatus?: NicheStatus | NicheStatus[];
  /** Classe CSS adicional */
  className?: string;
  /** Desabilitado */
  disabled?: boolean;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function NicheSelector({
  selectedNiche,
  onSelect,
  showBeta = false,
  showHidden = false,
  filterStatus,
  className,
  disabled = false,
}: NicheSelectorProps) {
  const niches = useMemo(() => {
    const filters = {
      status: filterStatus,
    };

    // Se não houver filtro específico, usar lógica padrão
    if (!filterStatus) {
      const statuses: NicheStatus[] = ['full_enabled', 'basic_enabled'];
      if (showBeta) statuses.push('beta_enabled');
      if (showHidden) statuses.push('hidden');
      filters.status = statuses;
    }

    return NicheConfigService.filter(filters);
  }, [filterStatus, showBeta, showHidden]);

  const handleSelect = useCallback(
    (key: string) => {
      if (disabled) return;
      onSelect(key);
    },
    [disabled, onSelect],
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {niches.map((niche) => (
          <NicheCard
            key={niche.nicheKey}
            niche={niche}
            isSelected={selectedNiche === niche.nicheKey}
            onClick={() => handleSelect(niche.nicheKey)}
            disabled={disabled}
          />
        ))}
      </div>

      {niches.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Nenhum nicho disponível para seleção.</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

interface NicheCardProps {
  niche: GastronomyNicheConfig;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function NicheCard({ niche, isSelected, onClick, disabled }: NicheCardProps) {
  const statusInfo = getStatusInfo(niche.supportLevel);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !niche.isSelectable}
      className={cn(
        'relative flex flex-col items-start p-4 rounded-lg border-2 text-left transition-all',
        'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:bg-accent',
        disabled && 'opacity-50 cursor-not-allowed',
        !niche.isSelectable && 'opacity-70 cursor-not-allowed',
      )}
    >
      {/* Badge de status */}
      <StatusBadge status={niche.supportLevel} info={statusInfo} />

      {/* Ícone e título */}
      <div className="flex items-center gap-3 mt-2">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: niche.themeColor }}
        >
          <span className="text-lg font-bold">
            {niche.publicLabel.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{niche.publicLabel}</h3>
          <p className="text-xs text-muted-foreground">
            {niche.operationalType === 'complex' ? 'Nicho Complexo' : 'Cardápio Básico'}
          </p>
        </div>
      </div>

      {/* Descrição */}
      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {niche.description}
      </p>

      {/* Indicador de seleção */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="h-5 w-5 text-primary" />
        </div>
      )}

      {/* Tag beta */}
      {niche.isBeta && (
        <div className="absolute bottom-2 right-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded-full">
            <FlaskConical className="h-3 w-3" />
            Beta
          </span>
        </div>
      )}
    </button>
  );
}

interface StatusBadgeProps {
  status: NicheStatus;
  info: { label: string; className: string };
}

function StatusBadge({ status, info }: StatusBadgeProps) {
  const getIcon = () => {
    switch (status) {
      case 'full_enabled':
        return <Check className="h-3 w-3" />;
      case 'basic_enabled':
        return <Info className="h-3 w-3" />;
      case 'beta_enabled':
        return <FlaskConical className="h-3 w-3" />;
      case 'coming_soon':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
        info.className,
      )}
    >
      {getIcon()}
      {info.label}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatusInfo(status: NicheStatus): { label: string; className: string } {
  const map: Record<NicheStatus, { label: string; className: string }> = {
    full_enabled: { label: 'Completo', className: 'bg-success/10 text-success' },
    basic_enabled: { label: 'Básico', className: 'bg-primary/10 text-primary' },
    beta_enabled: { label: 'Beta', className: 'bg-warning/10 text-warning' },
    hidden: { label: 'Oculto', className: 'bg-muted text-muted-foreground' },
    coming_soon: { label: 'Em Breve', className: 'bg-accent text-accent-foreground' },
  };
  return getRecordValue(map, status) ?? map.hidden;
}
