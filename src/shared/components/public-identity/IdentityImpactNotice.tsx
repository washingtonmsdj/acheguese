/**
 * IdentityImpactNotice
 * Aviso persistente de impacto de mudança de identidade pública.
 *
 * - business: bloco neutro/azul (redirect automático)
 * - profile/professional: bloco de atenção/amarelo (links podem parar)
 *
 * Exibe link atual → novo link quando há mudança real.
 * Não é erro. Não fica em tooltip. Fica no fluxo principal.
 */

import { Info, AlertTriangle, ArrowRight } from 'lucide-react';
import type { EntityType } from '@/core/public-identity/domain/types';

interface IdentityImpactNoticeProps {
  entityType: EntityType;
  /** Valor original salvo (vazio se criação) */
  originalValue: string;
  /** Valor atual no campo */
  currentValue: string;
  /** URL original computada */
  originalUrl?: string;
  /** URL nova computada */
  newUrl?: string;
}

const NOTICE_CONFIG: Record<
  EntityType,
  {
    variant: 'info' | 'warning';
    persistentMessage: string;
    changeMessage: string;
  }
> = {
  business: {
    variant: 'info',
    persistentMessage:
      'Seu link público da empresa pode ser alterado. Se isso acontecer, links antigos continuarão sendo redirecionados automaticamente.',
    changeMessage: 'O link público da empresa será alterado.',
  },
  profile: {
    variant: 'warning',
    persistentMessage:
      'Atenção: se você mudar seu nome de usuário, links antigos podem parar de funcionar em perfil, bio, QR Code, cartão ou materiais já compartilhados.',
    changeMessage:
      'Seu nome de usuário público será alterado. Links antigos podem deixar de funcionar.',
  },
  professional: {
    variant: 'warning',
    persistentMessage:
      'Atenção: se você mudar o link público profissional, links antigos podem parar de funcionar em cartões, anúncios, QR Codes e materiais já divulgados.',
    changeMessage:
      'O link público profissional será alterado. Links antigos podem deixar de funcionar.',
  },
};

export function IdentityImpactNotice({
  entityType,
  originalValue,
  currentValue,
  originalUrl,
  newUrl,
}: IdentityImpactNoticeProps) {
  const config = NOTICE_CONFIG[entityType];
  const hasChange =
    !!originalValue &&
    !!currentValue &&
    originalValue.trim() !== currentValue.trim();

  const isInfo = config.variant === 'info';

  const baseClass = isInfo
    ? 'border-blue-200 bg-blue-50 text-blue-800'
    : 'border-amber-200 bg-amber-50 text-amber-800';

  const Icon = isInfo ? Info : AlertTriangle;

  return (
    <div
      className={`rounded-md border px-3 py-2.5 text-xs space-y-2 ${baseClass}`}
      role="note"
      aria-label={hasChange ? config.changeMessage : config.persistentMessage}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{hasChange ? config.changeMessage : config.persistentMessage}</span>
      </div>

      {/* Comparação de links quando há mudança real */}
      {hasChange && originalUrl && newUrl && (
        <div className="flex items-center gap-1.5 font-mono text-[11px] pl-5 flex-wrap">
          <span className="line-through opacity-60">{originalUrl}</span>
          <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{newUrl}</span>
        </div>
      )}
    </div>
  );
}
