import React from "react";
import { useState } from "react";
import { Ticket, Clock, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { CouponRecord } from "@/core/business/services/business.admin";
import { ALERT_STATUS } from "@/shared/types/constants";
const tipoIcons: Record<string, string> = {
  porcentagem: "%",
  valor: "R$",
  brinde: "Brinde",
};

export default function CuponsPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const { data: cupons = [], isLoading } = useQuery<CouponRecord[]>({
    queryKey: ["coupons"],
    queryFn: () => BusinessService.getActiveCoupons(),
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Cupom removido dos salvos");
      } else {
        next.add(id);
        toast.success("Cupom salvo!");
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold font-display">Cupons e Promocoes</h1>
        <p className="text-sm text-muted-foreground">
          Economize no comercio local
        </p>
      </div>

      <div className="mx-4 mt-2 mb-3 bg-primary/10 rounded-xl p-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Ticket className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            {cupons.length} cupons disponiveis
          </p>
          <p className="text-xs text-muted-foreground">
            {saved.size} salvos por voce
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3 px-4 py-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : cupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhum cupom disponivel no momento.
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 py-2">
          {cupons.map((cupom, i) => {
            const diasRestantes = cupom.validade
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(cupom.validade).getTime() - Date.now()) /
                      86400000,
                  ),
                )
              : null;
            const usosRestantes = (cupom.max_usos ?? 100) - (cupom.usos ?? 0);

            return (
              <motion.div
                key={cupom.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/cupons/${cupom.id}`)}
                className="bg-card rounded-xl border overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-stretch">
                  <div className="w-2 bg-primary shrink-0" />
                  <div className="flex-1 p-3">
                    <div className="flex items-start gap-3">
                      {cupom.business_logo && (
                        <img
                          src={cupom.business_logo}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold truncate">
                          {cupom.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {cupom.business_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold">
                            {tipoIcons[cupom.tipo] || "%"} {cupom.desconto}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-dashed">
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {diasRestantes !== null && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {diasRestantes}d
                            restantes
                          </span>
                        )}
                        <span>{usosRestantes} disponiveis</span>
                      </div>
                      <Button
                        size="sm"
                        variant={saved.has(cupom.id) ? "default" : "outline"}
                        className="h-7 text-xs px-2.5"
                        onClick={(e) => toggleSave(cupom.id, e)}
                      >
                        {saved.has(cupom.id) ? (
                          <>
                            <Check className="h-3 w-3 mr-0.5" /> Salvo
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
