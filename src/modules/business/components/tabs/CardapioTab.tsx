import React from "react";

import DigitalMenu from "@/modules/business/components/DigitalMenu.tsx";
import type { CardapioTabProps } from "@/modules/business/types/components";

export function CardapioTab({
  products,
  businessName = "Empresa",
  isOwner,
}: CardapioTabProps) {
  return (
    <DigitalMenu
      products={products}
      businessName={businessName}
      isOwner={isOwner}
    />
  );
}
