/**
 * ProfileIdentityField — wrapper fino para identidade de perfil pessoal
 * Injeta: entityType, label, previewFn
 * Histórico interno — não exibido publicamente
 * Zero validação própria — tudo via IdentityField → PublicIdentityService
 */

import { IdentityField, type IdentityFieldProps } from '../IdentityField';

type ProfileIdentityFieldProps = Omit<IdentityFieldProps, 'entityType' | 'label' | 'previewFn'> & {
  label?: string;
};

export function ProfileIdentityField({
  label = 'Nome de usuário',
  showHistory = false, // histórico interno — não exibido ao usuário por padrão
  showCooldown = true,
  ...props
}: ProfileIdentityFieldProps) {
  return (
    <IdentityField
      {...props}
      entityType="profile"
      label={label}
      previewFn={(username) => (username ? `/u/${username}` : '')}
      showHistory={showHistory}
      showCooldown={showCooldown}
    />
  );
}
