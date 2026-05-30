import { ProfessionalIdentityField } from "@/core/public-identity/components/domains/ProfessionalIdentityField";
import { IdentityImpactNotice } from "@/core/public-identity/components/IdentityImpactNotice";
import {
  evaluateProfessionalSlugSafety,
  isProfessionalSlugSafetyBypassAllowed,
} from "@/core/public-identity/domain/professionalSlugSafety";
import { professionalPublicRoutes } from "@/core/professional/routes/professionalPublicRoutes";

interface ProfessionalSlugSectionProps {
  slug: string;
  onSlugChange: (value: string) => void;
  originalSlug?: string;
  professionalId?: string;
  professionalName?: string;
  isVerifiedProfessional?: boolean;
  disabled?: boolean;
}

export function ProfessionalSlugSection({
  slug,
  onSlugChange,
  originalSlug = "",
  professionalId,
  professionalName,
  isVerifiedProfessional = false,
  disabled,
}: ProfessionalSlugSectionProps) {
  const originalUrl = originalSlug ? professionalPublicRoutes.detailPreview(originalSlug) : "";
  const newUrl = slug ? professionalPublicRoutes.detailPreview(slug) : "";
  const slugSafety =
    professionalName && slug
      ? evaluateProfessionalSlugSafety({ professionalName, slug })
      : null;
  const shouldShowSafetyWarning =
    slugSafety?.status === "review" &&
    !isProfessionalSlugSafetyBypassAllowed({ isVerifiedProfessional });

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Identidade pública
      </p>

      <ProfessionalIdentityField
        value={slug}
        onChange={onSlugChange}
        entityId={professionalId}
        showHistory={false}
        showCooldown={!!professionalId}
        disabled={disabled}
        placeholder="ex: joao-eletricista"
      />

      {shouldShowSafetyWarning && (
        <p className="text-xs text-amber-700">
          Este link esta distante do nome informado. Use um link mais proximo do nome para reduzir risco de fraude.
        </p>
      )}

      <IdentityImpactNotice
        entityType="professional"
        originalValue={originalSlug}
        currentValue={slug}
        originalUrl={originalUrl}
        newUrl={newUrl}
      />
    </div>
  );
}
