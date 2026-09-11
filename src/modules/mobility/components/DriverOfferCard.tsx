import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, PackageCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { FailedDeliveryHandoffService } from "@/core/mobility/services/FailedDeliveryHandoffService";
import { Button } from "@/shared/components/ui/button";
import { formatBrl } from "@/shared/utils/currency";

const HANDOFF_QUERY_KEY = "mobility-targeted-handoff-offer";

function formatExpiry(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return "prazo curto";

  return expiry.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * DriverOfferCard
 *
 * G81: o card deixa de ser apenas placeholder quando o motoboy autenticado
 * recebe um pedido direcionado de transferencia de custodia. A leitura vem do
 * broker redigido e nunca carrega ride_requests antes do aceite.
 */
export function DriverOfferCard() {
  const queryClient = useQueryClient();
  const { driverProfileId } = useDriverProfileIdentity({
    queryScope: "driver-offer-card",
  });

  const handoffQuery = useQuery({
    queryKey: [HANDOFF_QUERY_KEY, driverProfileId ?? null],
    queryFn: () => FailedDeliveryHandoffService.listPending(driverProfileId!, 1),
    enabled: Boolean(driverProfileId),
    staleTime: 3_000,
    refetchInterval: 5_000,
    retry: false,
  });

  const handoff = handoffQuery.data?.[0] ?? null;

  const acceptHandoff = useMutation({
    mutationFn: async () => {
      if (!driverProfileId || !handoff) {
        throw new Error("Solicitacao de handoff indisponivel.");
      }
      return FailedDeliveryHandoffService.accept(handoff.rideId, driverProfileId);
    },
    onSuccess: async () => {
      toast.success("Transferencia de entrega aceita. Custodia atualizada.");
      await Promise.all([
        handoffQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel aceitar a transferencia de entrega.",
      );
      void handoffQuery.refetch();
    },
  });

  if (!handoff) {
    return (
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="text-sm font-semibold text-foreground">Ofertas proximas</p>
        <p className="mt-1 text-xs text-muted-foreground">
          As novas ofertas de corrida e entrega aparecerao aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300">
          <PackageCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Transferencia de entrega
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Solicitacao exclusiva para este perfil de motoboy
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatBrl(handoff.suggestedPrice)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
            <span className="truncate">{handoff.origin}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate">{handoff.destination}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {handoff.packageSize ? <span>Volume: {handoff.packageSize}</span> : null}
            <span>Expira as {formatExpiry(handoff.expiresAt)}</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Localizacao aproximada antes do aceite
            </span>
          </div>

          <Button
            className="mt-3 w-full sm:w-auto"
            disabled={acceptHandoff.isPending}
            onClick={() => acceptHandoff.mutate()}
          >
            {acceptHandoff.isPending ? "Confirmando transferencia..." : "Aceitar transferencia"}
          </Button>
        </div>
      </div>
    </div>
  );
}
