/**
 * BusinessSlugSection
 * Seção de identidade pública para criação/edição de empresa.
 */

import { useState } from "react";
import { BusinessIdentityField } from "@/core/public-identity/components/domains/BusinessIdentityField";
import {
  BUSINESS_PUBLIC_URL_PREVIEW_SLUG,
  buildBusinessPremiumUrl,
  buildBusinessPublicUrlPreview,
} from "@/core/business/utils/businessPublicUrls";
import { IdentityImpactNotice } from "@/core/public-identity/components/IdentityImpactNotice";
import { IdentityChangeConfirmDialog } from "@/core/public-identity/components/IdentityChangeConfirmDialog";
import { getBusinessCreateFieldCopy } from "@/modules/business/components/create/businessCreateCopy";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { Button } from "@/shared/components/ui/button";
import { evaluateBusinessSlugSafety } from "@/core/public-identity/domain/businessSlugSafety";
import { isBusinessSlugSafetyBypassAllowed } from "@/core/public-identity/domain/businessSlugSafety";

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

export function BusinessSlugSection({
  slug,
  onSlugChange,
  originalSlug = "",
  businessId,
  isPremium = false,
  category,
  businessName,
  isVerifiedOfficial = false,
  manualMode = true,
  onManualModeChange,
  onResetToAuto,
  disabled,
  onSaveWithIdentityChange,
}: BusinessSlugSectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const copy = getBusinessCreateFieldCopy(category);

  const canonicalPreviewFn = (value: string) => {
    if (!value) return "";
    return buildPublicAbsoluteUrl(buildBusinessPublicUrlPreview(value));
  };

  const canonicalPreviewSkeleton = buildPublicAbsoluteUrl(
    buildBusinessPublicUrlPreview(BUSINESS_PUBLIC_URL_PREVIEW_SLUG),
  );

  const previewFn = canonicalPreviewFn;

  const slugSafety =
    manualMode && businessName && slug
      ? evaluateBusinessSlugSafety({ businessName, slug })
      : null;

  const shouldShowSafetyWarning =
    slugSafety?.status === "review" &&
    !isBusinessSlugSafetyBypassAllowed({ isVerifiedOfficial });

  const originalUrl = originalSlug ? previewFn(originalSlug) : "";
  const newUrl = slug ? previewFn(slug) : "";

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Seu link público
      </p>
      <p className="text-xs text-muted-foreground">{copy.identityHelper}</p>
      <p className="text-xs text-muted-foreground">
        URL pública: <span className="font-mono">{canonicalPreviewSkeleton}</span>
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
            Usar link automático pelo nome
          </Button>
        )}
      </div>

      {!manualMode && (
        <p className="text-xs text-muted-foreground">
          O link está em modo automático e acompanha o nome do negócio.
        </p>
      )}

      {shouldShowSafetyWarning && (
        <p className="text-xs text-amber-700">
          Este link está distante do nome informado. Para reduzir risco de fraude, use um link mais próximo do
          nome oficial.
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
          Link curto premium disponível no plano pago:{" "}
          <span className="font-mono">
            {buildPublicAbsoluteUrl(buildBusinessPremiumUrl(slug || BUSINESS_PUBLIC_URL_PREVIEW_SLUG))}
          </span>
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
