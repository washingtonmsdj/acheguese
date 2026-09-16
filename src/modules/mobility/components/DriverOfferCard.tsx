import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, PackageCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { FailedDeliveryHandoffService } from "@/core/mobility/services/FailedDeliveryHandoffService";
import { Button } from "@/shared/components/ui/button";
import { formatBrl } from "@/shared/utils/currency";

const HANDOFF_QUERY_KEY = "mobility-targeted-handoff-offer";
const HANDOFF_STALE_TIME_MS = 3_000;
const HANDOFF_REFRESH_INTERVAL_MS = 5_000;

function formatExpiry(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return "prazo curto";

  return expiry.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Oferta direcionada de transferência de custódia.
 * A leitura vem do broker redigido e nunca carrega ride_requests antes do aceite.
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
    staleTime: HANDOFF_STALE_TIME_MS,
    refetchInterval: HANDOFF_REFRESH_INTERVAL_MS,
    retry: false,
  });

  const handoff = handoffQuery.data?.[0] ?? null;

  const acceptHandoff = useMutation({
    mutationFn: async () => {
      if (!driverProfileId || !handoff) {
        throw new Error("Solicitação de handoff indisponível.");
      }
      return FailedDeliveryHandoffService.accept(handoff.rideId, driverProfileId);
    },
    onSuccess: async () => {
      toast.success("Transferência de entrega aceita. Custódia atualizada.");
      await Promise.all([
        handoffQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["driver-dashboard"] }),
      ]);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível aceitar a transferência de entrega.",
      );
      void handoffQuery.refetch();
    },
  });

  if (handoffQuery.isError) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
        <div className="flex min-w-0 items-start gap-2">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Não foi possível consultar ofertas direcionadas
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              As demais ofertas continuam disponíveis no painel.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handoffQuery.refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!handoff) {
    return (
      <div className="rounded-xl border bg-card p-3">
        <p className="text-sm font-semibold text-foreground">Ofertas próximas</p>
        <p className="mt-1 text-xs text-muted-foreground">
          As novas ofertas de corrida e entrega aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <article className="rounded-xl border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-warning/10 p-2 text-warning">
          <PackageCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Transferência de entrega
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Solicitação exclusiva para este perfil de motoboy
              </p>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {formatBrl(handoff.suggestedPrice)}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
            <span className="truncate">{handoff.origin}</span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate">{handoff.destination}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {handoff.packageSize ? <span>Volume: {handoff.packageSize}</span> : null}
            <span>Expira às {formatExpiry(handoff.expiresAt)}</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Localização aproximada antes do aceite
            </span>
          </div>

          <Button
            type="button"
            className="mt-3 w-full sm:w-auto"
            disabled={acceptHandoff.isPending}
            onClick={() => acceptHandoff.mutate()}
          >
            {acceptHandoff.isPending
              ? "Confirmando transferência..."
              : "Aceitar transferência"}
          </Button>
        </div>
      </div>
    </article>
  );
}
