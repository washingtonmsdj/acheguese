import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Briefcase } from "lucide-react";
import type { PortfolioTabProps } from "@/modules/business/types/components";

export function PortfolioTab({ business, isOwner }: PortfolioTabProps) {
  return (
    <Card className="p-6 border-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Portfólio</h2>
          <p className="text-sm text-muted-foreground">Trabalhos realizados</p>
        </div>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h3 className="font-semibold text-base mb-2">
          Nenhum trabalho no portfólio
        </h3>
        <p className="text-sm">
          {isOwner
            ? "Adicione trabalhos realizados para mostrar seu portfólio"
            : "Ainda não há trabalhos cadastrados"}
        </p>
      </div>
    </Card>
  );
}
