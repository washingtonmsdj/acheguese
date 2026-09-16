import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";

import type { RideRequest } from "@/core/mobility/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatBrl } from "@/shared/utils/currency";

type CompletionRide = RideRequest & {
  driver?: {
    name?: string | null;
    avatar_url?: string | null;
    vehicle_model?: string | null;
    rating?: number | null;
  } | null;
};

type CompletionCommandResult = { success: boolean } | void;

interface RideCompletionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: CompletionRide | null;
  onConfirm: (rideId: string) =>
    | CompletionCommandResult
    | Promise<CompletionCommandResult>;
  onReportProblem: (
    rideId: string,
    problem: string,
  ) => CompletionCommandResult | Promise<CompletionCommandResult>;
  loading?: boolean;
}

export function RideCompletionConfirmation({
  open,
  onOpenChange,
  ride,
  onConfirm,
  onReportProblem,
  loading = false,
}: RideCompletionConfirmationProps) {
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [problemDescription, setProblemDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setShowProblemForm(false);
    setProblemDescription("");
    setSubmitting(false);
  }, [ride?.id]);

  const closeAfterSuccess = () => {
    onOpenChange(false);
    setShowProblemForm(false);
    setProblemDescription("");
  };

  const handleConfirm = async () => {
    if (!ride || submitting) return;

    setSubmitting(true);
    try {
      const result = await onConfirm(ride.id);
      if (result && result.success === false) return;
      closeAfterSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportProblem = async () => {
    const problem = problemDescription.trim();
    if (!ride || !problem || submitting) return;

    setSubmitting(true);
    try {
      const result = await onReportProblem(ride.id, problem);
      if (result && result.success === false) return;
      closeAfterSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (submitting) return;
    setShowProblemForm(false);
    setProblemDescription("");
  };

  if (!ride) return null;

  const isDelivery = ride.type === "delivery" || ride.type === "entrega";
  const driverName = ride.driver?.name?.trim() || "Motorista";
  const hasDriverRating =
    typeof ride.driver?.rating === "number" &&
    Number.isFinite(ride.driver.rating);
  const displayedPrice = ride.final_price ?? ride.suggested_price ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        {!showProblemForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                {isDelivery ? "Entrega finalizada" : "Corrida finalizada"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                O condutor marcou esta operação como concluída. Confirme apenas
                se o atendimento realmente terminou conforme esperado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage
                    src={ride.driver?.avatar_url ?? undefined}
                    alt={`Foto de ${driverName}`}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {driverName.charAt(0).toUpperCase() || "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {driverName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {ride.driver?.vehicle_model ? (
                      <span>{ride.driver.vehicle_model}</span>
                    ) : null}
                    {hasDriverRating ? (
                      <Badge
                        variant="outline"
                        className="h-4 gap-1 border-warning/30 px-1 text-[0.65rem] text-warning"
                      >
                        <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                        {ride.driver!.rating!.toFixed(1)}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Origem</p>
                    <p className="text-foreground">{ride.origin || ride.origin_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Destino</p>
                    <p className="text-foreground">
                      {ride.destination || ride.destination_address}
                    </p>
                  </div>
                </div>
              </div>

              {displayedPrice != null ? (
                <div className="flex items-center justify-between rounded-lg border border-success/20 bg-success/10 p-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" aria-hidden="true" />
                    <span className="text-sm text-success">Valor informado</span>
                  </div>
                  <span className="text-lg font-bold text-success">
                    {formatBrl(displayedPrice)}
                  </span>
                </div>
              ) : null}

              {ride.completed_at ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    Finalizada em{" "}
                    {new Date(ride.completed_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ) : null}

              <div className="rounded-lg border border-info/20 bg-info/10 p-3">
                <p className="text-xs text-info">
                  Ao confirmar, você registra que a operação foi concluída. Se
                  houver divergência, reporte o problema em vez de confirmar.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={submitting || loading}
                aria-busy={submitting || loading}
                className="w-full bg-success text-success-foreground hover:bg-success/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Confirmar conclusão
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProblemForm(true)}
                disabled={submitting || loading}
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                Reportar problema
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                Reportar problema
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Descreva o que aconteceu. O relato será enviado para o fluxo de
                análise da corrida.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="problem" className="text-foreground">
                  Descrição do problema
                </Label>
                <Textarea
                  id="problem"
                  placeholder="Descreva objetivamente o que ocorreu."
                  value={problemDescription}
                  onChange={(event) => setProblemDescription(event.target.value)}
                  className="min-h-[120px] border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Inclua apenas informações relevantes para a análise do caso.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                type="button"
                onClick={() => void handleReportProblem()}
                disabled={!problemDescription.trim() || submitting}
                aria-busy={submitting}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  "Enviar relato"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={submitting}
                className="w-full"
              >
                Voltar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
