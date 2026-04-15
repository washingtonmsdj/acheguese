import React from "react";
import BusinessStats from "@/modules/business/components/BusinessStats.tsx";
import type { EstatisticasTabProps } from "@/modules/business/types/components";

export function EstatisticasTab({ business, isOwner }: EstatisticasTabProps) {
  return (
    <BusinessStats
      businessId={business.id}
      businessName={business.name}
      isOwner={isOwner}
    />
  );
}
