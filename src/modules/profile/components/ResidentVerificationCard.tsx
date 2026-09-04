/**
 * ResidentVerificationCard
 *
 * The resident verification aggregate remains readable in the browser, but
 * verification-document uploads are intentionally fail-closed until a
 * brokered upload authority is certified for the reserved private bucket.
 */

import {
  CheckCircle,
  Clock,
  Home,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { VerifiedResidentBadge } from "@/shared/components/badges";
import type { ProfileVerificationStatus } from "@/core/verification/verificationStatus";

export type VerificationStatus = ProfileVerificationStatus;

interface ResidentVerificationCardProps {
  profileId: string;
  currentStatus?: VerificationStatus;
  rejectionReason?: string;
  onStatusChange?: (status: VerificationStatus) => void;
}

export function ResidentVerificationCard(
  props: ResidentVerificationCardProps,
) {
  const {
    currentStatus = "not_requested",
    rejectionReason,
  } = props;

  if (currentStatus === "approved") {
    return (
      <div className="overflow-hidden rounded-xl border border-success/30 bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-success/20 p-3 sm:gap-2.5 sm:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 sm:h-8 sm:w-8">
            <CheckCircle className="h-3.5 w-3.5 text-success sm:h-4 sm:w-4" />
          </div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-foreground sm:gap-2 sm:text-sm">
            <VerifiedResidentBadge size="medium" showTooltip={false} />
            Morador Verificado
          </h3>
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex items-start gap-2 rounded-lg border border-success/10 bg-success/5 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success sm:h-5 sm:w-5" />
            <div>
              <p className="mb-1 text-xs font-semibold text-success sm:text-sm">
                Endereço verificado
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Sua verificação de morador está ativa e pode ser usada pelos
                recursos da comunidade que exigem identidade territorial.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "pending") {
    return (
      <div className="overflow-hidden rounded-xl border border-warning/30 bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-warning/20 p-3 sm:gap-2.5 sm:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/10 sm:h-8 sm:w-8">
            <Clock className="h-3.5 w-3.5 text-warning sm:h-4 sm:w-4" />
          </div>
          <h3 className="text-xs font-semibold text-foreground sm:text-sm">
            Verificação Pendente
          </h3>
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex items-start gap-2 rounded-lg border border-warning/10 bg-warning/5 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning sm:h-5 sm:w-5" />
            <div>
              <p className="mb-1 text-xs font-semibold text-warning sm:text-sm">
                Solicitação em análise
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Uma solicitação existente está registrada. O status será
                atualizado quando a análise for concluída.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "rejected") {
    return (
      <div className="overflow-hidden rounded-xl border border-destructive/30 bg-card sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-destructive/20 p-3 sm:gap-2.5 sm:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 sm:h-8 sm:w-8">
            <XCircle className="h-3.5 w-3.5 text-destructive sm:h-4 sm:w-4" />
          </div>
          <h3 className="text-xs font-semibold text-foreground sm:text-sm">
            Verificação Rejeitada
          </h3>
        </div>
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/10 bg-destructive/5 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive sm:h-5 sm:w-5" />
            <div>
              <p className="mb-1 text-xs font-semibold text-destructive sm:text-sm">
                A solicitação anterior não foi aprovada
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {rejectionReason || "Os documentos enviados não foram aceitos."}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Novos envios permanecem indisponíveis até a ativação do canal seguro
            de documentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card sm:rounded-2xl">
      <div className="flex items-center gap-2 border-b border-border p-3 sm:gap-2.5 sm:p-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-8 sm:w-8">
          <Home className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
        </div>
        <h3 className="text-xs font-semibold text-foreground sm:text-sm">
          Verificação de Morador
        </h3>
      </div>

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 sm:gap-3 sm:rounded-xl sm:p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
          <div>
            <p className="mb-1 text-xs font-semibold text-foreground sm:text-sm">
              Canal seguro de documentos em preparação
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Novas solicitações estão temporariamente indisponíveis. O envio
              será liberado somente quando o fluxo privado de documentos estiver
              protegido por uma autoridade de upload certificada.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground sm:text-xs">
          Nenhum documento de verificação é enviado diretamente pelo navegador
          enquanto essa proteção não estiver ativa.
        </p>
      </div>
    </div>
  );
}
