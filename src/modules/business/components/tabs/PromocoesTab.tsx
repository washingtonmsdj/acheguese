import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Tag } from "lucide-react";
import type { PromocoesTabProps } from "@/modules/business/types/components";

export function PromocoesTab({ business, isOwner }: PromocoesTabProps) {
  return (
    <Card className="p-6 border-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Promoções</h2>
          <p className="text-sm text-muted-foreground">
            Ofertas especiais
          </p>
        </div>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <Tag className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h3 className="font-semibold text-base mb-2">Nenhuma promoção ativa</h3>
        <p className="text-sm">
          {isOwner
            ? "Crie promoções para atrair mais clientes"
            : "Não há promoções disponíveis no momento"}
        </p>
      </div>
    </Card>
  );
}
