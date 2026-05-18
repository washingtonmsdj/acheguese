import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Copy, Check, Ticket, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { LegacyCoupon } from "@/core/business/services/business.admin";
export default function CupomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copiado, setCopiado] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const { data: cupom, isLoading } = useQuery<LegacyCoupon | null>({
    queryKey: ["coupon", id],
    queryFn: () => BusinessService.getCouponById(id!),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );

  if (!cupom) return <div className="p-4">Cupom não encontrado.</div>;

  const diasRestantes = cupom.validade
    ? Math.max(
        0,
        Math.ceil((new Date(cupom.validade).getTime() - Date.now()) / 86400000),
      )
    : null;
  const maxUsos = cupom.max_usos ?? 100;
  const usos = cupom.usos ?? 0;
  const usosRestantes = maxUsos - usos;
  const porcentagemUso = (usos / maxUsos) * 100;

  const copiarCodigo = () => {
    navigator.clipboard.writeText(cupom.codigo);
    setCopiado(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold font-display">Detalhes do Cupom</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-primary/5 rounded-2xl p-5 text-center border border-primary/10">
          {cupom.business_logo && (
            <img
              src={cupom.business_logo}
              alt=""
              className="h-14 w-14 rounded-xl object-cover border mx-auto mb-3"
            />
          )}
          <h2 className="text-lg font-bold font-display">{cupom.titulo}</h2>
          <p className="text-sm text-muted-foreground">{cupom.business_name}</p>
          <div className="mt-3">
            <Badge className="bg-primary text-primary-foreground text-lg px-4 py-1 font-bold">
              {cupom.desconto}
            </Badge>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <p className="text-xs text-muted-foreground mb-2 text-center">
            Código do cupom
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-xl font-bold font-mono tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-lg">
              {cupom.codigo}
            </code>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10"
              onClick={copiarCodigo}
            >
              {copiado ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {cupom.description && (
          <p className="text-sm leading-relaxed">{cupom.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          {diasRestantes !== null && (
            <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-[11px] text-muted-foreground">Validade</p>
                <p className="text-xs font-semibold">
                  {diasRestantes} dias restantes
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
            <Ticket className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Disponíveis</p>
              <p className="text-xs font-semibold">
                {usosRestantes} de {maxUsos}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{usos} usados</span>
            <span>{maxUsos} total</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${porcentagemUso}%` }}
            />
          </div>
        </div>

        {cupom.neighborhood && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Válido em {cupom.neighborhood}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={copiarCodigo}>
            {copiado ? (
              <>
                <Check className="h-4 w-4 mr-1" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" /> Copiar Código
              </>
            )}
          </Button>
          <Button
            variant={salvo ? "default" : "outline"}
            className={`flex-1 ${salvo ? "bg-success hover:bg-success/90" : ""}`}
            onClick={() => {
              setSalvo(!salvo);
              toast.success(salvo ? "Cupom removido" : "Cupom salvo!");
            }}
          >
            {salvo ? (
              <>
                <Check className="h-4 w-4 mr-1" /> Salvo
              </>
            ) : (
              "Salvar Cupom"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
