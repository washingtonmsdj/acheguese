import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Navigation, RefreshCw, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";

import { getDriverRideActionAvailability } from "@/core/mobility/core/DriverRideActionPolicy";
import { OperationalVerificationService } from "@/core/mobility/services/OperationalVerificationService";
import type { VerificationStatusSummary } from "@/core/mobility/types/OperationalVerification";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface DriverPassengerRideProgressionProps {
  rideId: string;
  status: string;
  disabled?: boolean;
  onStartPickupRoute?: (rideId: string) => Promise<boolean> | boolean | void;
  onConfirmBoarding?: (
    rideId: string,
    pin?: string,
  ) => Promise<boolean> | boolean | void;
}

type VerificationReadState = "idle" | "loading" | "ready" | "error";
type ActionInFlight = "pickup" | "boarding" | null;

export function DriverPassengerRideProgression({
  rideId,
  status,
  disabled = false,
  onStartPickupRoute,
  onConfirmBoarding,
}: DriverPassengerRideProgressionProps) {
  const actions = useMemo(
    () => getDriverRideActionAvailability(status),
    [status],
  );
  const [verificationState, setVerificationState] =
    useState<VerificationReadState>("idle");
  const [verification, setVerification] =
    useState<VerificationStatusSummary | null>(null);
  const [pin, setPin] = useState("");
  const [actionInFlight, setActionInFlight] = useState<ActionInFlight>(null);

  const loadVerification = useCallback(async () => {
    if (!actions.canConfirmBoarding) {
      setVerification(null);
      setVerificationState("idle");
      setPin("");
      return;
    }

    setVerificationState("loading");
    const result =
      await OperationalVerificationService.getVerificationStatusSummaryResult(
        rideId,
      );

    if (!result.success) {
      setVerification(null);
      setVerificationState("error");
      return;
    }

    setVerification(result.data ?? null);
    setVerificationState("ready");
  }, [actions.canConfirmBoarding, rideId]);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

  const handleStartPickupRoute = async () => {
    if (!onStartPickupRoute || disabled || actionInFlight) return;

    setActionInFlight("pickup");
    try {
      await onStartPickupRoute(rideId);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleConfirmBoarding = async () => {
    if (
      !onConfirmBoarding ||
      disabled ||
      actionInFlight ||
      verificationState !== "ready"
    ) {
      return;
    }

    const requiresPin = verification?.isRequired === true && !verification.verified;
    if (requiresPin && !OperationalVerificationService.isValidPINFormat(pin)) {
      return;
    }

    setActionInFlight("boarding");
    try {
      const applied = await onConfirmBoarding(
        rideId,
        requiresPin ? pin : undefined,
      );

      if (applied === false) {
        await loadVerification();
        return;
      }

      setPin("");
    } finally {
      setActionInFlight(null);
    }
  };

  if (actions.canStartPickupRoute && onStartPickupRoute) {
    return (
      <div className="mb-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <p className="mb-2 text-xs text-muted-foreground">
          Confirme quando iniciar o deslocamento até o passageiro.
        </p>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={disabled || actionInFlight !== null}
          onClick={handleStartPickupRoute}
        >
          {actionInFlight === "pickup" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="mr-2 h-4 w-4" />
          )}
          Estou a caminho do passageiro
        </Button>
      </div>
    );
  }

  if (!actions.canConfirmBoarding || !onConfirmBoarding) return null;

  if (verificationState === "loading" || verificationState === "idle") {
    return (
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Validando protocolo de embarque...
      </div>
    );
  }

  if (verificationState === "error") {
    return (
      <div className="mb-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">
              Embarque bloqueado por segurança
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Não foi possível confirmar se esta corrida exige PIN. O embarque
              continuará bloqueado até a verificação responder.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={disabled || actionInFlight !== null}
          onClick={() => void loadVerification()}
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  const pinRequired = verification?.isRequired === true;
  const pinVerified = verification?.verified === true;
  const attemptsRemaining = verification?.attemptsRemaining;
  const attemptsExhausted =
    pinRequired && !pinVerified && attemptsRemaining === 0;
  const pinReady = !pinRequired || pinVerified || pin.length === 4;

  return (
    <div className="mb-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-start gap-2">
        {pinVerified ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        ) : (
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">
            Confirmar embarque do passageiro
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pinRequired
              ? pinVerified
                ? "PIN validado. Confirme somente com o passageiro já dentro do veículo."
                : "Solicite ao passageiro o PIN de 4 dígitos exibido no aplicativo dele."
              : "Esta corrida não exige PIN. Confirme somente com o passageiro já dentro do veículo."}
          </p>
        </div>
      </div>

      {pinRequired && !pinVerified && !attemptsExhausted && (
        <div className="mt-3 space-y-2">
          <Input
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            aria-label="PIN de embarque"
            placeholder="0000"
            className="text-center font-mono text-lg tracking-[0.35em]"
            disabled={disabled || actionInFlight !== null}
          />
          {typeof attemptsRemaining === "number" && (
            <p className="text-[11px] text-muted-foreground">
              {attemptsRemaining} tentativa(s) restante(s). O limite é controlado
              pelo servidor.
            </p>
          )}
        </div>
      )}

      {attemptsExhausted ? (
        <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive">
          Limite de tentativas atingido. Peça ao passageiro para gerar um novo PIN
          antes de tentar novamente.
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          className="mt-3 w-full"
          disabled={
            disabled ||
            actionInFlight !== null ||
            !pinReady
          }
          onClick={handleConfirmBoarding}
        >
          {actionInFlight === "boarding" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="mr-2 h-4 w-4" />
          )}
          {pinRequired && !pinVerified
            ? "Validar PIN e confirmar embarque"
            : "Confirmar passageiro embarcado"}
        </Button>
      )}
    </div>
  );
}
