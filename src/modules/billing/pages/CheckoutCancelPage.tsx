import { ArrowLeft, CircleHelp, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BILLING_PATHS } from "@/core/billing/routes/billingRoutes";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function CheckoutCancelPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-territory-canvas px-4 py-10 text-territory-ink">
      <Card className="w-full max-w-xl border-territory-border bg-territory-surface text-territory-ink shadow-sm">
        <CardHeader className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-territory-warning/12 text-territory-warning">
            <CircleHelp className="h-7 w-7" aria-hidden="true" />
          </span>
          <CardTitle className="mt-3 font-heading text-2xl">Checkout cancelado</CardTitle>
          <p className="text-sm leading-6 text-territory-muted">A contratação não foi concluída. Nenhum plano será presumido como alterado.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Button className="bg-territory-sun text-territory-ink hover:bg-territory-sun/90" onClick={() => navigate(BILLING_PATHS.pricing)}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Voltar aos planos
          </Button>
          <Button variant="outline" className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised" onClick={() => navigate(ACCOUNT_PATHS.home)}>
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />Minha conta
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
