import { IdentityField, type IdentityFieldProps } from '../IdentityField';

type CommunicationChannelIdentityFieldProps = Omit<
  IdentityFieldProps,
  'entityType' | 'label' | 'previewFn'
> & {
  label?: string;
};

export function CommunicationChannelIdentityField({
  label = 'Slug do canal de comunicacao',
  showHistory = true,
  showCooldown = true,
  ...props
}: CommunicationChannelIdentityFieldProps) {
  return (
    <IdentityField
      {...props}
      entityType="communication_channel"
      label={label}
      previewFn={(slug) => (slug ? `/comunicacao/:uf/:cidade/:territorio/${slug}` : '')}
      showHistory={showHistory}
      showCooldown={showCooldown}
    />
  );
}
