import { ProfessionalIdentityField } from "@/shared/components/public-identity/domains/ProfessionalIdentityField";
import { IdentityImpactNotice } from "@/shared/components/public-identity/IdentityImpactNotice";

interface ProfessionalSlugSectionProps {
  slug: string;
  onSlugChange: (value: string) => void;
  originalSlug?: string;
  professionalId?: string;
  disabled?: boolean;
}

export function ProfessionalSlugSection({
  slug,
  onSlugChange,
  originalSlug = "",
  professionalId,
  disabled,
}: ProfessionalSlugSectionProps) {
  const originalUrl = originalSlug
    ? `/profissionais/:uf/:cidade/${originalSlug}`
    : "";
  const newUrl = slug ? `/profissionais/:uf/:cidade/${slug}` : "";

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
