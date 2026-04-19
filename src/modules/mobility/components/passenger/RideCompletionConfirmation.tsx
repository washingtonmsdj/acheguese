import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  CheckCircle2,
  AlertTriangle,
  MapPin,
  DollarSign,
  Clock,
  User,
} from "lucide-react";
import { RideRequest } from "@/modules/mobility/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";

interface RideCompletionConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: RideRequest | null;
  onConfirm: (rideId: string) => Promise<void>;
  onReportProblem: (rideId: string, problem: string) => Promise<void>;
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

  const handleConfirm = async () => {
    if (!ride) return;
    setSubmitting(true);
    try {
      await onConfirm(ride.id);
      onOpenChange(false);
      setShowProblemForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportProblem = async () => {
    if (!ride || !problemDescription.trim()) return;
    setSubmitting(true);
    try {
      await onReportProblem(ride.id, problemDescription);
      onOpenChange(false);
      setShowProblemForm(false);
      setProblemDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setShowProblemForm(false);
    setProblemDescription("");
  };

  if (!ride) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {!showProblemForm ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Corrida Finalizada
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                O motorista finalizou a corrida. Por favor, confirme se tudo
                ocorreu bem.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Driver Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={ride.driver?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {ride.driver?.name?.charAt(0) || "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {ride.driver?.name || "Motorista"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{ride.driver?.vehicle_model}</span>
                    {ride.driver?.rating && (
                      <Badge
                        variant="outline"
                        className="text-[0.65rem] h-4 px-1 border-warning/30 text-warning"
                      >
                        ⭐ {ride.driver.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Ride Details */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Origem</p>
                    <p className="text-foreground">{ride.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Destino</p>
                    <p className="text-foreground">{ride.destination}</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              {(ride.final_price || ride.suggested_price) && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">
                      Valor da corrida
                    </span>
                  </div>
                  <span className="text-lg font-bold text-success">
                    R$ {(ride.final_price || ride.suggested_price).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Completion Time */}
              {ride.completed_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
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
              )}

              {/* Info Box */}
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs text-accent">
                  ℹ️ Ao confirmar, você atesta que a corrida foi concluída
                  conforme esperado. Se houve algum problema, por favor reporte.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={submitting || loading}
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
              >
                {submitting ? (
                  <>Confirmando...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirmar - Tudo OK
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProblemForm(true)}
                disabled={submitting || loading}
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reportar Problema
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Reportar Problema
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Descreva o que aconteceu. Nossa equipe irá analisar o caso.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="problem" className="text-foreground">
                  Descrição do problema
                </Label>
                <Textarea
                  id="problem"
                  placeholder="Ex: Motorista não seguiu a rota combinada, cobrou valor diferente, comportamento inadequado, etc."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="min-h-[120px] bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Seja específico para que possamos ajudar melhor.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-xs text-warning">
                  ⚠️ Reportes falsos podem resultar em suspensão da conta. Use
                  este recurso apenas para problemas reais.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                type="button"
                onClick={handleReportProblem}
                disabled={!problemDescription.trim() || submitting}
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {submitting ? "Enviando..." : "Enviar Reporte"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={submitting}
                className="w-full border-border text-muted-foreground hover:bg-secondary/50"
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
