import { ArrowRight, Building2, CheckCircle2, LayoutDashboard, MapPin, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";

const benefits = [
  "Perfil público para descoberta local",
  "Painel operacional na Central",
  "Gestão de dados, verticais e planos em um só lugar",
];

export default function EmpresasCadastroLandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Cadastrar empresa | Achegue-se</title>
        <meta
          name="description"
          content="Entenda como cadastrar sua empresa no Achegue-se e acessar a Central empresarial."
        />
      </Helmet>

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.42))]">
        <section className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
              <Store className="h-3.5 w-3.5 text-primary" />
              Entrada comercial pública
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Cadastre sua empresa sem misturar vitrine pública com gestão.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A página pública de empresas serve para descoberta. A criação, configuração e gestão real acontecem na Central empresarial.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 rounded-2xl" onClick={() => navigate("/central/empresas/nova")}>
                Começar cadastro
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-2xl bg-background/70" onClick={() => navigate("/empresas")}>
                Ver empresas públicas
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/90 shadow-xl shadow-black/5 backdrop-blur">
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Building2 className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">Como fica a separação</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  O cliente encontra sua empresa em /empresas. Você administra tudo em /central.
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-muted/45 p-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">Módulo público</p>
                  <p className="text-xs text-muted-foreground">/empresas</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold">Gestão real</p>
                  <p className="text-xs text-muted-foreground">/central/empresas/nova</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
