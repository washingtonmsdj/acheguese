/**
 * ProfessionalIdentityField — wrapper fino para identidade de profissional
 * Injeta: entityType, label, previewFn
 * Histórico interno nesta fase — não exibido publicamente
 * Zero validação própria — tudo via IdentityField → PublicIdentityService
 */

import { IdentityField, type IdentityFieldProps } from '../IdentityField';

type ProfessionalIdentityFieldProps = Omit<
  IdentityFieldProps,
  'entityType' | 'label' | 'previewFn'
> & {
  label?: string;
};

export function ProfessionalIdentityField({
  label = 'Slug do profissional',
  showHistory = false, // histórico interno nesta fase
  showCooldown = true,
  ...props
}: ProfessionalIdentityFieldProps) {
  return (
    <IdentityField
      {...props}
      entityType="professional"
      label={label}
      previewFn={(slug) => (slug ? `/profissionais/:uf/:cidade/${slug}` : '')}
      showHistory={showHistory}
      showCooldown={showCooldown}
    />
  );
}
