import React from "react";
import {
  Crown,
  Shield,
  Car,
  Zap,
  CheckCircle2,
  Bell,
  MapPin,
  Star,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { DriverPlan } from "@/modules/mobility/types"; // TODO: Migrar para mobility.generated.ts;
import { toast } from "sonner";

interface DriverSubscriptionCardProps {
  currentPlan: DriverPlan;
}

export function DriverSubscriptionCard({
  currentPlan,
}: DriverSubscriptionCardProps) {
  const plans = [
    {
      id: "padrao" as DriverPlan,
      name: "Padrão",
      price: "R$ 29,90/mês",
      icon: Shield,
      color: "teal",
      features: [
        { icon: Car, label: "Visualizar pedidos de viagem" },
        { icon: CheckCircle2, label: "Aceitar corridas" },
        { icon: Star, label: "Avaliações de passageiros" },
      ],
    },
    {
      id: "prioritario" as DriverPlan,
      name: "Prioritário",
      price: "R$ 59,90/mês",
      icon: Crown,
      color: "amber",
      popular: true,
      features: [
        { icon: Bell, label: "Receber notificações primeiro" },
        { icon: MapPin, label: "Destaque no mapa" },
        { icon: Zap, label: "Destaque na lista de pedidos" },
        { icon: Star, label: "Badge PRO no perfil" },
      ],
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isTeal = plan.color === "teal";

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-xl border p-2 transition-all relative overflow-visible flex flex-col",
                isCurrent
                  ? isTeal
                    ? "border-teal-400/30 bg-teal-500/5"
                    : "border-amber-500/30 bg-amber-500/5"
                  : "border-white/10 bg-[#1E2529] hover:border-white/20",
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[0.5rem] px-1.5 rounded-full shadow-lg">
                  Popular
                </Badge>
              )}

              <div className="flex items-center gap-1.5 mb-1">
                <plan.icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isTeal ? "text-teal-400" : "text-amber-400",
                  )}
                />
                <h3 className="text-xs font-bold text-white">{plan.name}</h3>
                {isCurrent && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[0.45rem] px-1 rounded-full ml-auto">
                    Atual
                  </Badge>
                )}
              </div>

              <p
                className={cn(
                  "text-sm font-bold mb-1.5",
                  isTeal ? "text-teal-400" : "text-amber-400",
                )}
              >
                {plan.price}
              </p>

              <ul className="space-y-1 mb-1.5 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <feature.icon
                      className={cn(
                        "h-2 w-2 flex-shrink-0",
                        isTeal ? "text-teal-400" : "text-amber-400",
                      )}
                    />
                    <span className="text-[0.55rem] text-gray-300 leading-tight">
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button
                  disabled
                  className="w-full rounded-lg h-7 bg-white/5 text-gray-500 text-[0.6rem] mt-auto"
                >
                  Plano Atual
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    toast.info("Em breve: pagamento de assinatura")
                  }
                  className={cn(
                    "w-full rounded-lg h-7 font-semibold shadow-lg text-[0.6rem] mt-auto",
                    isTeal
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-teal-500/20"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/20",
                  )}
                >
                  {plan.id === "prioritario" ? "Upgrade" : "Mudar"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-2 rounded-xl border border-white/10 bg-[#1E2529]">
        <h4 className="text-xs font-semibold text-white mb-1.5">
          Perguntas Frequentes
        </h4>
        <div className="space-y-1.5">
          {[
            {
              q: "Posso cancelar a qualquer momento?",
              a: "Sim, você pode cancelar sua assinatura a qualquer momento sem multas.",
            },
            {
              q: "Como recebo os pagamentos?",
              a: "O pagamento é feito diretamente pelo passageiro via Pix ou dinheiro. Não retemos nenhuma taxa.",
            },
            {
              q: "Preciso de documentação?",
              a: "Sim, CNH válida e documento do veículo são obrigatórios para dirigir.",
            },
          ].map((faq, i) => (
            <div key={i}>
              <p className="text-[0.6rem] text-white font-medium">{faq.q}</p>
              <p className="text-[0.55rem] text-gray-500 mt-0.5 leading-tight">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
