import { useEffect, useState } from "react";
import { KeyRound, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { OperationalVerificationService } from "@/core/mobility/services/OperationalVerificationService";
import type { VerificationStatusSummary } from "@/core/mobility/types/OperationalVerification";
import { toast } from "sonner";

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

  useEffect(() => {
    let active = true;

    void (async () => {
      setIsLoading(true);
      const next = await OperationalVerificationService.getVerificationStatusSummary(rideId);
      if (!active) return;
      setSummary(next);
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [rideId, rideStatus]);

  useEffect(() => {
    setPin(null);
    setExpiresAt(null);
  }, [rideId]);

  if (isLoading || !summary?.isRequired) return null;

  if (summary.verified) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
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
      const result = await OperationalVerificationService.refreshRequesterPIN(rideId);
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
          <KeyRound className="h-4 w-4 text-primary" />
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
              {expiryLabel && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Válido até {expiryLabel}. Gerar outro código invalida o anterior.
                </p>
              )}
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
            onClick={issuePin}
          >
            {isIssuing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            {pin ? "Gerar novo PIN" : "Gerar PIN"}
          </Button>
        </div>
      </div>
    </div>
  );
}
