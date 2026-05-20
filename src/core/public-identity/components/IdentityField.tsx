/**
 * IdentityField
 * Componente compartilhado de campo de identidade pública.
 */

import { useCallback } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { IdentityAvailabilityBadge } from './IdentityAvailabilityBadge';
import { IdentityUrlPreview } from './IdentityUrlPreview';
import { IdentityCooldownNotice } from './IdentityCooldownNotice';
import { IdentityHistoryPanel } from './IdentityHistoryPanel';
import { useIdentityAvailability } from '@/core/public-identity/hooks/useIdentityAvailability';
import { useIdentityCooldown } from '@/core/public-identity/hooks/useIdentityCooldown';
import { useIdentityHistory } from '@/core/public-identity/hooks/useIdentityHistory';
import { useIdentityUrlPreview } from '@/core/public-identity/hooks/useIdentityUrlPreview';
import type { EntityType } from '@/core/public-identity/domain/types';
import type { UrlPreviewFn } from '@/core/public-identity/hooks/useIdentityUrlPreview';

export interface IdentityFieldProps {
  entityType: EntityType;
  entityId?: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  previewFn?: UrlPreviewFn;
  showHistory?: boolean;
  showCooldown?: boolean;
  onSuggestionSelect?: (suggestion: string) => void;
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
  onSuggestionSelect,
}: IdentityFieldProps) {
  const { result, isChecking, checkDebounced } = useIdentityAvailability({
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
      checkDebounced(v);
    },
    [onChange, checkDebounced],
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
        {result?.suggestion && onSuggestionSelect && (
          <button
            type="button"
            onClick={() => {
              const suggestion = result.suggestion as string;
              onSuggestionSelect(suggestion);
              checkDebounced(suggestion);
            }}
            className="text-xs text-primary underline underline-offset-2"
          >
            Usar sugestao: {result.suggestion}
          </button>
        )}
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
