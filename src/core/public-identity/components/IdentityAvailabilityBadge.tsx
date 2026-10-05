/**
 * IdentityAvailabilityBadge
 * Badge de status de disponibilidade de identificador público.
 */

import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { AvailabilityResult } from '@/core/public-identity/domain/types';
import { IDENTITY_MESSAGES } from '@/core/public-identity/domain/messages';

interface IdentityAvailabilityBadgeProps {
  result: AvailabilityResult | null;
  isChecking: boolean;
  infraError?: boolean;
}

const STATUS_CONFIG = {
  available: { icon: CheckCircle, className: 'text-territory-success', label: (result: AvailabilityResult) => result.message ?? IDENTITY_MESSAGES.available },
  taken: { icon: XCircle, className: 'text-territory-error', label: (result: AvailabilityResult) => result.suggestion ? `${result.message ?? IDENTITY_MESSAGES.taken} - ${IDENTITY_MESSAGES.suggestion_prefix}: ${result.suggestion}` : (result.message ?? IDENTITY_MESSAGES.taken) },
  reserved: { icon: AlertCircle, className: 'text-territory-warning', label: (result: AvailabilityResult) => result.suggestion ? `${IDENTITY_MESSAGES.reserved} - ${IDENTITY_MESSAGES.suggestion_prefix}: ${result.suggestion}` : IDENTITY_MESSAGES.reserved },
  invalid: { icon: XCircle, className: 'text-territory-error', label: (result: AvailabilityResult) => result.message ?? IDENTITY_MESSAGES.invalid_format },
  cooldown_blocked: { icon: AlertCircle, className: 'text-territory-warning', label: () => IDENTITY_MESSAGES.cooldown_blocked },
} as const;

export function IdentityAvailabilityBadge({ result, isChecking, infraError }: IdentityAvailabilityBadgeProps) {
  if (isChecking) {
    return <span className="flex items-center gap-1 text-xs text-territory-muted"><Loader2 className="h-3 w-3 animate-spin" />{IDENTITY_MESSAGES.checking}</span>;
  }

  if (infraError) {
    return <span className="flex items-center gap-1 text-xs text-territory-error" role="status" aria-live="polite"><XCircle className="h-3 w-3" aria-hidden="true" />{IDENTITY_MESSAGES.infra_error}</span>;
  }

  if (!result) return null;
  const config = STATUS_CONFIG[result.status];
  const Icon = config.icon;

  return <span className={`flex items-center gap-1 text-xs ${config.className}`} role="status" aria-live="polite"><Icon className="h-3 w-3" aria-hidden="true" />{config.label(result)}</span>;
}
