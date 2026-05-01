import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";

import { useSessionContext } from "@/core/session";
import { VerificationService } from "@/core/verification/services/VerificationService";
import { Button } from "@/shared/components/ui/button";
import { ResidentVerificationCard } from "@/modules/profile/components/ResidentVerificationCard";

type ResidentVerificationStatus = "not_requested" | "pending" | "approved" | "rejected";

function mapStatus(verified: boolean, hasRequest: boolean, hasRejection: boolean): ResidentVerificationStatus {
  if (verified) return "approved";
  if (hasRejection) return "rejected";
  if (hasRequest) return "pending";
  return "not_requested";
}

export default function ResidentVerificationPage() {
  const navigate = useNavigate();
  const { activeProfile, isLoading } = useSessionContext();

  const { data: verification, isLoading: verificationLoading } = useQuery({
    queryKey: ["resident-verification", activeProfile?.id],
    queryFn: async () => {
      if (!activeProfile?.id) return null;
      return VerificationService.getVerification(activeProfile.id, "resident");
    },
    enabled: !!activeProfile?.id,
  });

  const status = useMemo(() => {
    return mapStatus(
      Boolean(verification?.verified),
      Boolean(verification),
      Boolean(verification?.rejection_reason),
    );
  }, [verification]);

  if (isLoading || verificationLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeProfile?.id) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-border bg-card p-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-lg font-semibold text-foreground">Perfil ativo nao encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ative um perfil para solicitar verificacao de morador.
          </p>
          <Button className="mt-4" onClick={() => navigate("/perfil")}>
            Ir para perfis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Verificacao de Morador</title>
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/comunidade")} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Verificacao de morador</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Envie comprovacao de residencia para liberar recursos completos da comunidade do seu bairro.
            </p>
          </div>
        </div>

        <ResidentVerificationCard
          profileId={activeProfile.id}
          currentStatus={status}
          rejectionReason={verification?.rejection_reason ?? undefined}
        />
      </div>
    </>
  );
}

