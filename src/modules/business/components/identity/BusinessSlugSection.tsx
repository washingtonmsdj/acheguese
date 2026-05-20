/**
 * BusinessSlugSection
 * Secao de identidade publica para criacao/edicao de empresa.
 */

import { useState } from 'react';
import { BusinessIdentityField } from '@/core/public-identity/components/domains/BusinessIdentityField';
import { IdentityImpactNotice } from '@/core/public-identity/components/IdentityImpactNotice';
import { IdentityChangeConfirmDialog } from '@/core/public-identity/components/IdentityChangeConfirmDialog';
import { getBusinessCreateFieldCopy } from '@/modules/business/components/create/businessCreateCopy';
import { buildPublicAbsoluteUrl } from '@/shared/config/publicAppOrigin';
import { Button } from '@/shared/components/ui/button';
import { evaluateBusinessSlugSafety } from '@/core/public-identity/domain/businessSlugSafety';
import { isBusinessSlugSafetyBypassAllowed } from '@/core/public-identity/domain/businessSlugSafety';

interface BusinessSlugSectionProps {
  slug: string;
  onSlugChange: (value: string) => void;
  originalSlug?: string;
  businessId?: string;
  isPremium?: boolean;
  category?: string;
  businessName?: string;
  isVerifiedOfficial?: boolean;
  stateName?: string;
  cityName?: string;
  districtName?: string;
  manualMode?: boolean;
  onManualModeChange?: (enabled: boolean) => void;
  onResetToAuto?: () => void;
  disabled?: boolean;
  onSaveWithIdentityChange?: () => void;
}

function toUrlSegment(value: string | undefined, fallback: string): string {
  const normalized = (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

export function BusinessSlugSection({
  slug,
  onSlugChange,
  originalSlug = '',
  businessId,
  isPremium = false,
  category,
  businessName,
  isVerifiedOfficial = false,
  stateName,
  cityName,
  districtName,
  manualMode = true,
  onManualModeChange,
  onResetToAuto,
  disabled,
  onSaveWithIdentityChange,
}: BusinessSlugSectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const copy = getBusinessCreateFieldCopy(category);

  const stateSegment = toUrlSegment(stateName, 'seu-estado');
  const citySegment = toUrlSegment(cityName, 'sua-cidade');
  const districtSegment = toUrlSegment(districtName, 'seu-bairro');

  const canonicalPreviewFn = (value: string) => {
    if (!value) return '';
    return buildPublicAbsoluteUrl(`/empresas/${stateSegment}/${citySegment}/${districtSegment}/${value}`);
  };
  const canonicalPreviewSkeleton = buildPublicAbsoluteUrl(
    `/empresas/${stateSegment}/${citySegment}/${districtSegment}/seu-link`,
  );

  const previewFn = isPremium
    ? (value: string) => (value ? buildPublicAbsoluteUrl(`/p/${value}`) : '')
    : canonicalPreviewFn;
  const slugSafety =
    manualMode && businessName && slug
      ? evaluateBusinessSlugSafety({ businessName, slug })
      : null;
  const shouldShowSafetyWarning =
    slugSafety?.status === "review" &&
    !isBusinessSlugSafetyBypassAllowed({ isVerifiedOfficial });

  const originalUrl = originalSlug ? previewFn(originalSlug) : '';
  const newUrl = slug ? previewFn(slug) : '';

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Seu link publico
      </p>
      <p className="text-xs text-muted-foreground">{copy.identityHelper}</p>
      <p className="text-xs text-muted-foreground">
        URL publica: <span className="font-mono">{canonicalPreviewSkeleton}</span>
      </p>

      <BusinessIdentityField
        value={slug}
        onChange={onSlugChange}
        entityId={businessId}
        isPremium={isPremium}
        label={copy.identityLabel}
        previewFn={previewFn}
        showHistory={!!businessId}
        showCooldown={!!businessId}
        disabled={disabled || !manualMode}
        onSuggestionSelect={(suggestion) => onSlugChange(suggestion)}
        placeholder="ex: padaria-do-joao"
      />

      <div className="flex flex-wrap gap-2">
        {!manualMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onManualModeChange?.(true)}
            disabled={disabled}
          >
            Editar link manualmente
          </Button>
        )}
        {manualMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onResetToAuto?.();
              onManualModeChange?.(false);
            }}
            disabled={disabled}
          >
            Usar link automatico pelo nome
          </Button>
        )}
      </div>

      {!manualMode && (
        <p className="text-xs text-muted-foreground">
          O link esta em modo automatico e acompanha o nome do negocio.
        </p>
      )}

      {shouldShowSafetyWarning && (
        <p className="text-xs text-amber-700">
          Este link esta distante do nome informado. Para reduzir risco de fraude, use um link mais proximo do nome oficial.
        </p>
      )}

      {originalSlug && (
        <IdentityImpactNotice
          entityType="business"
          originalValue={originalSlug}
          currentValue={slug}
          originalUrl={originalUrl}
          newUrl={newUrl}
        />
      )}

      {!isPremium && (
        <p className="text-xs text-muted-foreground">
          Link curto premium: <span className="font-mono">{buildPublicAbsoluteUrl(`/p/${slug || "seu-link"}`)}</span>
        </p>
      )}

      <IdentityChangeConfirmDialog
        open={confirmOpen}
        entityType="business"
        onConfirm={() => {
          setConfirmOpen(false);
          onSaveWithIdentityChange?.();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
