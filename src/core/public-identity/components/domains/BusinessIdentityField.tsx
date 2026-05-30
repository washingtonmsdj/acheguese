import {
  buildBusinessPremiumUrlPreview,
  buildBusinessPublicUrlPreview,
} from "@/core/business/utils/businessPublicUrls";
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
    ? buildBusinessPremiumUrlPreview
    : buildBusinessPublicUrlPreview;

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
