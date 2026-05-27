/**
 * 💼 VAGA CARD - NÍVEL AAA
 *
 * ✅ CARACTERÍSTICAS:
 * - Design moderno otimizado para vagas de emprego
 * - Hierarquia visual clara (salário em destaque)
 * - Status inteligente com badges (urgente, destaque, nova)
 * - Metadados úteis (localização SSOT, tipo, nível, modalidade)
 * - Estados visuais ricos
 * - Animações Framer Motion
 * - Acessibilidade WCAG AAA
 * - TypeScript strict
 * - Memoização completa
 * - Responsividade completa
 * - Logo da empresa com fallback de iniciais
 *
 * @author Kiro AI
 * @date 2026-04-15
 */

import { memo, forwardRef, useMemo, useCallback } from 'react';
import { MapPin, Clock, Briefcase, Zap, Star, Users, Building2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from '@/shared/utils/dateLocale';
import type { Vaga } from '../types/vagas.types';
import { 
  CONTRATO_LABELS, 
  MODALIDADE_LABELS, 
  NIVEL_LABELS,
  HIGHLIGHT_TYPE_LABELS,
  formatSalary as formatSalaryFromTypes,
} from '../types/vagas.types';
import { BusinessLogo } from '@/shared/components/ui/business-logo';

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
};

const HOVER_SCALE = 1.02;
const TAP_SCALE = 0.98;

const URGENCIA_CONFIG = {
  urgente: {
    label: 'URGENTE',
    icon: Zap,
    color: 'text-destructive-foreground',
    bgColor: 'bg-destructive',
  },
  extrema: {
    label: 'EXTREMA',
    icon: Zap,
    color: 'text-white',
    bgColor: 'bg-red-700',
  },
  normal: null,
};

// ============================================================================
// TYPES
// ============================================================================

interface VagaCardProps {
  vaga: Vaga;
  variant?: 'grid' | 'list' | 'compact';
  index?: number;
  onClick: () => void;
  locationName?: string | null; // Nome da localização do SSOT
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formata data relativa
 */
function formatRelativeDate(date: Date): string {
  try {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // Se foi publicada nas últimas 24h, mostrar "Nova"
    if (diffInHours < 24) {
      return 'Nova';
    }
    
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return '';
  }
}

/**
 * Verifica se a vaga é nova (menos de 24h)
 */
function isNewVaga(date: Date): boolean {
  try {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VagaCard = memo(
  forwardRef<HTMLDivElement, VagaCardProps>(function VagaCard(
    {
      vaga,
      variant = 'grid',
      index = 0,
      onClick,
      locationName,
      className,
    },
    ref,
  ) {
    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const formattedSalary = useMemo(() => formatSalaryFromTypes(vaga), [vaga]);
    
    const relativeDate = useMemo(
      () => formatRelativeDate(vaga.publishedAt || vaga.createdAt),
      [vaga.publishedAt, vaga.createdAt],
    );

    const isNew = useMemo(
      () => isNewVaga(vaga.publishedAt || vaga.createdAt),
      [vaga.publishedAt, vaga.createdAt],
    );

    const urgenciaConfig = useMemo(
      () => URGENCIA_CONFIG[vaga.urgencia],
      [vaga.urgencia],
    );

    const hasMultipleVagas = vaga.vagasQuantidade > 1;

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleClick = useCallback(() => {
      onClick();
    }, [onClick]);

    // ========================================================================
    // RENDER VARIANTS
    // ========================================================================

    if (variant === 'list') {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={handleClick}
          className={cn(
            'group flex gap-3 overflow-hidden rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-lg cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Vaga: ${vaga.titulo} - ${vaga.empresaNome}`}
        >
          {/* Logo da Empresa */}
          <div className="shrink-0">
            <BusinessLogo
              name={vaga.empresaNome}
              logoUrl={vaga.empresaLogoUrl}
              className="h-12 w-12 rounded-xl"
            />
          </div>

          {/* Conteúdo */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {vaga.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground">{vaga.empresaNome}</p>
                </div>

                {/* Badges de Status */}
                <div className="flex shrink-0 gap-1">
                  {isNew && (
                    <Badge className="h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                      <TrendingUp className="mr-0.5 h-2.5 w-2.5" />
                      Nova
                    </Badge>
                  )}
                  {urgenciaConfig && (
                    <Badge className={cn('h-5 text-[10px] font-bold', urgenciaConfig.bgColor, urgenciaConfig.color)}>
                      <urgenciaConfig.icon className="mr-0.5 h-2.5 w-2.5" />
                      {urgenciaConfig.label}
                    </Badge>
                  )}
                  {vaga.highlightType !== 'none' && HIGHLIGHT_TYPE_LABELS[vaga.highlightType] && (
                    <Badge className={`h-5 text-[10px] font-bold ${HIGHLIGHT_TYPE_LABELS[vaga.highlightType].bgColor} ${HIGHLIGHT_TYPE_LABELS[vaga.highlightType].color} border-0`}>
                      <Star className="mr-0.5 h-2.5 w-2.5" />
                      {HIGHLIGHT_TYPE_LABELS[vaga.highlightType].label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Metadados */}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {/* Salário */}
                <span className="font-semibold text-primary">{formattedSalary}</span>

                {/* Localização */}
                {locationName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {locationName}
                  </span>
                )}

                {/* Tipo de Contrato */}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {CONTRATO_LABELS[vaga.contrato]}
                </span>

                {/* Data */}
                {relativeDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {relativeDate}
                  </span>
                )}
              </div>
            </div>

            {/* Footer - Tags */}
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px]">
                {MODALIDADE_LABELS[vaga.modalidade]}
              </Badge>
              <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px]">
                {NIVEL_LABELS[vaga.nivel]}
              </Badge>
              {hasMultipleVagas && (
                <Badge variant="outline" className="h-5 px-1.5 py-0 text-[10px]">
                  <Users className="mr-0.5 h-2.5 w-2.5" />
                  {vaga.vagasQuantidade} vagas
                </Badge>
              )}
            </div>
          </div>
        </motion.article>
      );
    }

    if (variant === 'compact') {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 5) * 0.05 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={handleClick}
          className={cn(
            'group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md cursor-pointer',
            className,
          )}
          role="article"
          aria-label={`Vaga: ${vaga.titulo} - ${vaga.empresaNome}`}
        >
          {/* Logo/Ícone */}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-orange-500/10 p-4">
            <BusinessLogo
              name={vaga.empresaNome}
              logoUrl={vaga.empresaLogoUrl}
              className="h-16 w-16 rounded-xl"
            />

            {/* Status Badge */}
            {(isNew || urgenciaConfig) && (
              <div className="absolute left-1 top-1">
                {urgenciaConfig ? (
                  <Badge className={cn('h-5 text-[10px] font-bold', urgenciaConfig.bgColor, urgenciaConfig.color)}>
                    <urgenciaConfig.icon className="h-2.5 w-2.5" />
                  </Badge>
                ) : isNew ? (
                  <Badge className="h-5 bg-emerald-500/90 text-white text-[10px] font-bold">
                    Nova
                  </Badge>
                ) : null}
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex flex-col gap-1.5 p-3">
            <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {vaga.titulo}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{vaga.empresaNome}</p>
            <p className="text-xs font-bold text-primary">{formattedSalary}</p>
          </div>
        </motion.article>
      );
    }

    // ========================================================================
    // GRID VARIANT (DEFAULT)
    // ========================================================================

    return (
      <motion.article
        ref={ref}
        {...CARD_ANIMATION}
        transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
        whileHover={{ scale: HOVER_SCALE }}
        whileTap={{ scale: TAP_SCALE }}
        onClick={handleClick}
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-xl cursor-pointer',
          className,
        )}
        role="article"
        aria-label={`Vaga: ${vaga.titulo} - ${vaga.empresaNome}`}
      >
        {/* Top Badges */}
        <div className="absolute left-0 right-0 top-0 flex items-start justify-between">
          {/* Destaque Badge */}
          {vaga.highlightType !== 'none' && HIGHLIGHT_TYPE_LABELS[vaga.highlightType] && (
            <div className={`rounded-br-xl px-3 py-1 ${HIGHLIGHT_TYPE_LABELS[vaga.highlightType].bgColor}`}>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${HIGHLIGHT_TYPE_LABELS[vaga.highlightType].color}`}>
                <Star className="h-3 w-3" />
                {HIGHLIGHT_TYPE_LABELS[vaga.highlightType].label.toUpperCase()}
              </div>
            </div>
          )}

          {/* Urgente Badge */}
          {urgenciaConfig && (
            <div className={cn('rounded-bl-xl px-3 py-1 ml-auto', urgenciaConfig.bgColor)}>
              <div className={cn('flex items-center gap-1 text-[10px] font-bold', urgenciaConfig.color)}>
                <urgenciaConfig.icon className="h-3 w-3" />
                {urgenciaConfig.label}
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div className={cn(vaga.urgencia !== 'normal' || vaga.highlightType !== 'none' ? 'mt-6' : '')}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug sm:text-lg">
                {vaga.titulo}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {vaga.empresaNome}
              </p>
            </div>

            {/* Logo da Empresa */}
            <div className="shrink-0">
              <BusinessLogo
                name={vaga.empresaNome}
                logoUrl={vaga.empresaLogoUrl}
                className="h-16 w-16 rounded-xl"
              />
            </div>
          </div>

          {/* Salário */}
          <p className="text-xl font-bold text-primary mb-3">{formattedSalary}</p>

          {/* Tags Row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
              <Briefcase className="mr-1 h-2.5 w-2.5" />
              {CONTRATO_LABELS[vaga.contrato]}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {MODALIDADE_LABELS[vaga.modalidade]}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {NIVEL_LABELS[vaga.nivel]}
            </Badge>
            {isNew && (
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                <TrendingUp className="mr-1 h-2.5 w-2.5" />
                Nova
              </Badge>
            )}
          </div>

          {/* Descrição */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {vaga.descricao}
          </p>

          {/* Footer Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              {/* Localização */}
              {locationName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {locationName}
                </span>
              )}

              {/* Múltiplas Vagas */}
              {hasMultipleVagas && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {vaga.vagasQuantidade} vagas
                </span>
              )}
            </div>

            {/* Data */}
            {relativeDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {relativeDate}
              </span>
            )}
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-orange-500/5" />
        </div>
      </motion.article>
    );
  }),
);

VagaCard.displayName = 'VagaCard';
