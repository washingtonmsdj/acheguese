import { IdentityField, type IdentityFieldProps } from "../IdentityField";

type BusinessIdentityFieldProps = Omit<IdentityFieldProps, "entityType" | "label"> & {
  label?: string;
  isPremium?: boolean;
};

export function BusinessIdentityField({
  label = "Escolha o final do seu link público",
  isPremium = false,
  previewFn,
  showHistory = true,
  showCooldown = true,
  ...props
}: BusinessIdentityFieldProps) {
  const defaultPreviewFn = isPremium
    ? (slug: string) => (slug ? `/p/${slug}` : "")
    : (slug: string) => (slug ? `/empresas/:uf/:cidade/:bairro/${slug}` : "");

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
