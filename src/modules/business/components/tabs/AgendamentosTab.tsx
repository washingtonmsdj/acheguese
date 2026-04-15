import React from "react";

import AppointmentsPanel from "@/modules/business/components/AppointmentsPanel.tsx";
interface AgendamentosTabProps {
  businessId: string;
  businessName?: string;
  isOwner: boolean;
}

export function AgendamentosTab({
  businessId,
  businessName = "Empresa",
  isOwner,
}: AgendamentosTabProps) {
  return (
    <AppointmentsPanel
      businessId={businessId}
      businessName={businessName}
      isOwner={isOwner}
    />
  );
}
