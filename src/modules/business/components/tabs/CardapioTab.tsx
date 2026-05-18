import React from "react";

import DigitalMenu from "@/modules/business/components/DigitalMenu.tsx";
import type { CardapioTabProps } from "@/modules/business/types/components";

export function CardapioTab({
  products,
  businessName = "Empresa",
  isOwner,
}: CardapioTabProps) {
  const menuProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.image_url ?? null,
    business_id: product.profile_id,
    active: product.active,
    category: product.category,
    destaque: product.featured,
    promocao: product.promotion,
  }));

  return (
    <DigitalMenu
      products={menuProducts}
      businessName={businessName}
      isOwner={isOwner}
    />
  );
}
