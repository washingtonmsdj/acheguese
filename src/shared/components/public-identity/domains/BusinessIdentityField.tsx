/**
 * BusinessIdentityField — wrapper fino para identidade de empresa
 * Injeta: entityType, label, previewFn, showHistory
 * Zero validação própria — tudo via IdentityField → PublicIdentityService
 */

import { IdentityField, type IdentityFieldProps } from '../IdentityField';

type BusinessIdentityFieldProps = Omit<IdentityFieldProps, 'entityType' | 'label' | 'previewFn'> & {
  label?: string;
  /** Se true, usa preview de rota premium /p/:slug */
  isPremium?: boolean;
};

export function BusinessIdentityField({
  label = 'Slug da empresa',
  isPremium = false,
  showHistory = true,
  showCooldown = true,
  ...props
}: BusinessIdentityFieldProps) {
  const previewFn = isPremium
    ? (slug: string) => (slug ? `/p/${slug}` : '')
    : (slug: string) => (slug ? `/empresas/:uf/:cidade/:bairro/${slug}` : '');

  return (
    <IdentityField
      {...props}
      entityType="business"
      label={label}
      previewFn={previewFn}
      showHistory={showHistory}
      showCooldown={showCooldown}
    />
  );
}
