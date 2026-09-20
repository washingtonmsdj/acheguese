import { Helmet } from "react-helmet-async";
import { Activity, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PLATFORM_BRAND } from "@/shared/config/brand";

export default function StatusPage() {
  return (
    <>
      <Helmet>
        <title>Status da plataforma</title>
      </Helmet>

      <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
        <main className="mx-auto w-full max-w-3xl space-y-6">
          <header className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Status da plataforma
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Informações públicas de disponibilidade do {PLATFORM_BRAND.name}.
            </p>
          </header>

          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  Monitoramento público
                </CardTitle>
                <Badge variant="outline">Não publicado</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                O Achegue-se ainda não possui uma fonte pública dedicada para
                publicar disponibilidade, uptime ou latência em tempo real. Para
                evitar informações imprecisas, esta página não infere o estado
                da plataforma a partir de verificações internas.
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Se você estiver com dificuldade para usar algum recurso, tente
                novamente e utilize o canal oficial de contato para relatar o
                problema.
              </p>
              <Link
                to="/contato"
                className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Ir para contato
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
