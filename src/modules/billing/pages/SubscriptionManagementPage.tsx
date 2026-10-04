import { useState } from "react";
import { AlertCircle, CalendarDays, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useBilling } from "@/core/billing/hooks/useBilling";
import { useSubscription } from "@/core/billing/hooks/useSubscription";
import { BILLING_PATHS } from "@/core/billing/routes/billingRoutes";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

function formatDate(value: string | null | undefined): string {
  if (!value) return "Não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Não informado" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

export default function SubscriptionManagementPage() {
  const navigate = useNavigate();
  const { redirectToPortal } = useBilling();
  const { subscription, isLoadingSubscription, isPastDue, isCanceled, planName, statusLabel } = useSubscription();
  const [openingPortal, setOpeningPortal] = useState(false);

  const handlePortal = async () => {
    setOpeningPortal(true);
    try {
      await redirectToPortal(buildPublicAbsoluteUrl(BILLING_PATHS.subscription));
    } finally {
      setOpeningPortal(false);
    }
  };

  if (isLoadingSubscription) {
    return <main className="flex min-h-screen items-center justify-center bg-territory-canvas"><Loader2 className="h-8 w-8 animate-spin text-territory-brand" aria-label="Carregando assinatura" /></main>;
  }

  return (
    <main className="min-h-screen bg-territory-canvas px-4 py-8 text-territory-ink sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Assinatura</h1>
          <p className="mt-1 text-sm text-territory-muted">Consulte seu plano e abra o portal seguro para operações de cobrança.</p>
        </header>
        {isPastDue ? (
          <div className="mb-4 flex gap-3 rounded-2xl border border-territory-error/25 bg-territory-error/10 p-4 text-sm text-territory-error">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            Há uma pendência de cobrança. Use o portal de assinatura para revisar o pagamento.
          </div>
        ) : null}
        <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-sm">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="font-heading text-xl">{planName}</CardTitle>
              <p className="mt-1 text-sm text-territory-muted">Plano associado à sua conta.</p>
            </div>
            <Badge className={isCanceled ? "bg-territory-warning/12 text-territory-warning" : "bg-territory-success/12 text-territory-success"}>{statusLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-territory-border bg-territory-canvas/45 p-4">
                <CreditCard className="h-5 w-5 text-territory-brand" aria-hidden="true" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-territory-muted">Código do plano</p>
                <p className="mt-1 font-semibold">{subscription?.plan_code ?? "free"}</p>
              </div>
              <div className="rounded-2xl border border-territory-border bg-territory-canvas/45 p-4">
                <CalendarDays className="h-5 w-5 text-territory-brand" aria-hidden="true" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-territory-muted">Período atual</p>
                <p className="mt-1 font-semibold">{formatDate(subscription?.current_period_end)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="bg-territory-sun text-territory-ink hover:bg-territory-sun/90" disabled={openingPortal} onClick={() => void handlePortal()}>
                {openingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />}Gerenciar cobrança
              </Button>
              <Button variant="outline" className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised" onClick={() => navigate(BILLING_PATHS.pricing)}>Ver planos</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
