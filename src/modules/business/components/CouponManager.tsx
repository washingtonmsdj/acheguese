import { AlertTriangle, Ticket } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { PlanTier } from "@/core/billing/types";

interface CouponManagerProps {
  businessId: string;
  planType: PlanTier;
}

export default function CouponManager({
  businessId: _businessId,
  planType,
}: CouponManagerProps) {
  const planLabel =
    planType === PlanTier.FREE
      ? "Basico"
      : planType === PlanTier.PRO
        ? "Profissional"
        : "Delivery";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cupons e Promocoes</h2>
        <p className="text-muted-foreground">
          Plano atual: {planLabel}
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-amber-950">
              Gestao de cupons por empresa indisponivel
            </h3>
            <p className="text-sm text-amber-900">
              A tabela canonica de cupons ainda nao possui um identificador de
              empresa. Sem esse vinculo, a tela nao cria nem lista cupons para
              evitar associacao por nome, dados falsos ou registros globais
              indevidos.
            </p>
            <p className="text-xs text-amber-800">
              Proximo passo tecnico: adicionar `business_id` em `coupons` e
              atualizar o servico de cupons para consultar por empresa.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-dashed p-12 text-center text-muted-foreground">
        <Ticket className="mx-auto mb-4 h-12 w-12 opacity-30" />
        <p className="text-sm">
          Nenhum cupom sera exibido ate existir vinculo canonico com a empresa.
        </p>
      </Card>
    </div>
  );
}
