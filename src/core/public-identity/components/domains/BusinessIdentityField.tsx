import { IdentityField, type IdentityFieldProps } from '../IdentityField';

type BusinessIdentityFieldProps = Omit<IdentityFieldProps, 'entityType' | 'label'> & {
  label?: string;
  isPremium?: boolean;
};

export function BusinessIdentityField({
  label = 'Escolha o final do seu link publico',
  isPremium = false,
  previewFn,
  showHistory = true,
  showCooldown = true,
  ...props
}: BusinessIdentityFieldProps) {
  const defaultPreviewFn = isPremium
    ? (slug: string) => (slug ? `/p/${slug}` : '')
    : (slug: string) => (slug ? `/empresas/seu-estado/sua-cidade/seu-bairro/${slug}` : '');

  return (
    <IdentityField
      {...props}
      entityType="business"
      label={label}
      previewFn={previewFn ?? defaultPreviewFn}
      showHistory={showHistory}
      showCooldown={showCooldown}
    />
  );
}
