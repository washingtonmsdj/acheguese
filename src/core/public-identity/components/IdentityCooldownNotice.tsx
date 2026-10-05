/**
 * IdentityCooldownNotice
 * Aviso de cooldown ativo para troca de identificador.
 */

import { Clock } from 'lucide-react';
import type { CooldownResult } from '@/core/public-identity/domain/types';
import { IDENTITY_MESSAGES } from '@/core/public-identity/domain/messages';

interface IdentityCooldownNoticeProps {
  cooldown: CooldownResult | null;
  isLoading?: boolean;
}

export function IdentityCooldownNotice({ cooldown, isLoading }: IdentityCooldownNoticeProps) {
  if (isLoading || !cooldown || cooldown.canChange) return null;

  const nextDate = cooldown.nextAllowedDate
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(cooldown.nextAllowedDate)
    : null;

  const message = cooldown.daysRemaining != null
    ? IDENTITY_MESSAGES.cooldown_wait_days(cooldown.daysRemaining)
    : IDENTITY_MESSAGES.cooldown_blocked;

  return (
    <div className="flex items-start gap-2 rounded-md border border-territory-warning/20 bg-territory-warning/10 px-3 py-2 text-xs text-territory-warning" role="alert">
      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}{nextDate && ` (${nextDate})`}.</span>
    </div>
  );
}
