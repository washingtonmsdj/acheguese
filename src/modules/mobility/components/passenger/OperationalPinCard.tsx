import { useEffect, useState } from "react";
import {
  AlertTriangle,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { OperationalVerificationService } from "@/core/mobility/services/OperationalVerificationService";
import type { VerificationStatusSummary } from "@/core/mobility/types/OperationalVerification";
import { Button } from "@/shared/components/ui/button";

interface OperationalPinCardProps {
  rideId: string;
  rideStatus: string;
}

function formatExpiry(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function OperationalPinCard({
  rideId,
  rideStatus,
}: OperationalPinCardProps) {
  const [summary, setSummary] = useState<VerificationStatusSummary | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);

      const result =
        await OperationalVerificationService.getVerificationStatusSummaryResult(
          rideId,
        );
      if (!active) return;

      if (!result.success) {
        setSummary(null);
        setLoadError(
          result.error || "Não foi possível confirmar a verificação desta corrida.",
        );
        setIsLoading(false);
        return;
      }

      setSummary(result.data ?? null);
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [reloadKey, rideId, rideStatus]);

  useEffect(() => {
    setPin(null);
    setExpiresAt(null);
  }, [rideId]);

  if (isLoading) return null;

  if (loadError) {
    return (
      <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Verificação de segurança indisponível
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Não foi possível confirmar se esta corrida exige PIN. Atualize o
              status antes de prosseguir com qualquer confirmação operacional.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary?.isRequired) return null;

  if (summary.verified) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 p-4">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-success"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">PIN confirmado</p>
          <p className="mt-1 text-xs text-muted-foreground">
            O motorista ou motoboy validou o código desta operação.
          </p>
        </div>
      </div>
    );
  }

  const issuePin = async () => {
    setIsIssuing(true);
    try {
      const result =
        await OperationalVerificationService.refreshRequesterPIN(rideId);
      if (!result.success || !result.data) {
        const tooFrequent = result.error?.includes("pin_refresh_too_frequent");
        toast.error(
          tooFrequent
            ? "Aguarde alguns segundos antes de gerar outro PIN."
            : result.error || "Não foi possível gerar o PIN.",
        );
        return;
      }

      setPin(result.data.pin);
      setExpiresAt(result.data.expiresAt);
      toast.success("PIN operacional gerado.");
    } finally {
      setIsIssuing(false);
    }
  };

  const expiryLabel = formatExpiry(expiresAt ?? summary.expiresAt);

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Verificação por PIN</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Informe o código somente ao motorista ou motoboy desta operação.
            Ele é quem faz a validação.
          </p>

          {pin ? (
            <div className="mt-3 rounded-lg border border-border bg-background/80 px-4 py-3">
              <div
                className="font-mono text-2xl font-bold tracking-[0.35em] text-foreground"
                aria-label="PIN operacional"
              >
                {pin}
              </div>
              {expiryLabel ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Válido até {expiryLabel}. Gerar outro código invalida o anterior.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs font-medium text-foreground">
              Gere um código quando estiver pronto para repassá-lo ao condutor.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={isIssuing}
            aria-busy={isIssuing}
            onClick={() => void issuePin()}
          >
            {isIssuing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            )}
            {pin ? "Gerar novo PIN" : "Gerar PIN"}
          </Button>
        </div>
      </div>
    </div>
  );
}
