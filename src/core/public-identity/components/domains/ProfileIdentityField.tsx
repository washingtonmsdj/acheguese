import { IdentityField, type IdentityFieldProps } from '../IdentityField';
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';

type ProfileIdentityFieldProps = Omit<IdentityFieldProps, 'entityType' | 'label' | 'previewFn'> & {
  label?: string;
};

export function ProfileIdentityField({
  label = 'Nome de usuário',
  showHistory = false,
  showCooldown = true,
  ...props
}: ProfileIdentityFieldProps) {
  return (
    <IdentityField
      {...props}
      entityType="profile"
      label={label}
      previewFn={(username) => (username ? buildPublicProfileUrl(username) : '')}
      showHistory={showHistory}
      showCooldown={showCooldown}
    />
  );
}
