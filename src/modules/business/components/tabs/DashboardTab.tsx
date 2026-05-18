import React from "react";
import EmpresaDashboardTab from "@/modules/business/components/EmpresaDashboardTab.tsx";
import { logger } from "@/shared/utils/logger";
import type { DashboardTabProps } from "@/modules/business/types/components";
import type { BizData } from "@/modules/business/types";

export function DashboardTab({ business }: DashboardTabProps) {
  const businessData = business as BizData;

  return (
    <EmpresaDashboardTab
      businessId={businessData.id}
      secoesAtivas={{
        services: Boolean(businessData.secoes_ativas?.services),
        products: Boolean(businessData.secoes_ativas?.products),
        cardapio: Boolean(businessData.secoes_ativas?.cardapio),
        portfolio: Boolean(businessData.secoes_ativas?.portfolio),
        promocoes: Boolean(businessData.secoes_ativas?.promocoes),
      }}
      onSecoesUpdated={(config) => {
        // Atualizar seções ativas
        if (import.meta.env.DEV) {
          logger.info("Seções atualizadas:", config);
        }
      }}
    />
  );
}
