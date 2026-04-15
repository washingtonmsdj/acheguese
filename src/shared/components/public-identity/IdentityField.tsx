/**
 * IdentityField
 * Componente compartilhado de campo de identidade pública.
 *
 * Compõe: input + badge de disponibilidade + preview de URL + cooldown + histórico.
 * Toda validação passa pelo PublicIdentityService via hooks — zero duplicação.
 */

import { useCallback } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { IdentityAvailabilityBadge } from './IdentityAvailabilityBadge';
import { IdentityUrlPreview } from './IdentityUrlPreview';
import { IdentityCooldownNotice } from './IdentityCooldownNotice';
import { IdentityHistoryPanel } from './IdentityHistoryPanel';
import { useIdentityAvailability } from '@/shared/hooks/public-identity/useIdentityAvailability';
import { useIdentityCooldown } from '@/shared/hooks/public-identity/useIdentityCooldown';
import { useIdentityHistory } from '@/shared/hooks/public-identity/useIdentityHistory';
import { useIdentityUrlPreview } from '@/shared/hooks/public-identity/useIdentityUrlPreview';
import type { EntityType } from '@/core/public-identity/domain/types';
import type { UrlPreviewFn } from '@/shared/hooks/public-identity/useIdentityUrlPreview';

export interface IdentityFieldProps {
  entityType: EntityType;
  entityId?: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  /** Sobrescreve a função de preview de URL padrão */
  previewFn?: UrlPreviewFn;
  /** Exibe painel de histórico */
  showHistory?: boolean;
  /** Exibe aviso de cooldown */
  showCooldown?: boolean;
}

export function IdentityField({
  entityType,
  entityId,
  value,
  onChange,
  label,
  placeholder,
  disabled,
  previewFn,
  showHistory = false,
  showCooldown = true,
}: IdentityFieldProps) {
  const { result, isChecking, check } = useIdentityAvailability({
    entityType,
    excludeEntityId: entityId,
  });

  const { cooldown, isLoading: cooldownLoading } = useIdentityCooldown({
    entityType,
    entityId,
    enabled: showCooldown && !!entityId,
  });

  const { history, isLoading: historyLoading } = useIdentityHistory({
    entityType,
    entityId,
    enabled: showHistory && !!entityId,
  });

  const urlPreview = useIdentityUrlPreview({ entityType, identifier: value, previewFn });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChange(v);
      check(v);
    },
    [onChange, check],
  );

  const inputId = `identity-field-${entityType}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>

      <Input
        id={inputId}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={`${inputId}-status`}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      <div id={`${inputId}-status`} className="space-y-1.5">
        <IdentityAvailabilityBadge result={result} isChecking={isChecking} />
        <IdentityUrlPreview url={urlPreview} />
      </div>

      {showCooldown && (
        <IdentityCooldownNotice cooldown={cooldown} isLoading={cooldownLoading} />
      )}

      {showHistory && (
        <IdentityHistoryPanel
          history={history}
          isLoading={historyLoading}
          visible={showHistory}
        />
      )}
    </div>
  );
}
