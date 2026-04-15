import React from "react";
import EmpresaDashboardTab from "@/modules/business/components/EmpresaDashboardTab.tsx";
import { logger } from "@/shared/utils/logger";
import type { DashboardTabProps } from "@/modules/business/types/components";

export function DashboardTab({ business }: DashboardTabProps) {
  return (
    <EmpresaDashboardTab
      businessId={business.id}
      secoesAtivas={business.secoes_ativas}
      onSecoesUpdated={(config) => {
        // Atualizar seções ativas
        if (import.meta.env.DEV) {
          logger.info("Seções atualizadas:", config);
        }
      }}
    />
  );
}
