import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Building2,
  Home,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { ResidenceManager } from "@/core/residence/components/ResidenceManager";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function ContaEnderecosPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  return (
    <>
      <Helmet>
        <title>Meus enderecos</title>
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.32))]">
        <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
          <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-card/85 sm:px-5 sm:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => navigate(appUrls.profile.home)}
                  type="button"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Territorio e residencia
                  </p>
                  <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Meus enderecos
                  </h1>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Endereco privado, territorio pessoal e contexto publico.
                  </p>
                </div>
              </div>
              <div className="hidden shrink-0 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                Privacidade ativa
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                      Privacidade territorial
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      Seu endereco fica protegido
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      O perfil publico mostra apenas contexto territorial, como cidade,
                      bairro ou comunidade. Rua, numero e complemento seguem privados.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:w-auto sm:grid-cols-1">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                      <p className="font-medium text-foreground">Residencia</p>
                      <p className="mt-1 text-muted-foreground">Base canonicamente privada</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                      <p className="font-medium text-foreground">Territorio</p>
                      <p className="mt-1 text-muted-foreground">Derivado para uso publico</p>
                    </div>
                  </div>
                </div>
              </section>

              <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    Como seu endereco aparece
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    O perfil publico exibe somente contexto territorial
                    (bairro/comunidade), nunca rua, numero, complemento ou referencia
                    detalhada.
                  </p>
                  <p>
                    Se voce atua profissionalmente, gerencie cobertura operacional na{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline underline-offset-2"
                      onClick={() => navigate("/central")}
                    >
                      Central profissional
                    </button>
                    .
                  </p>
                </CardContent>
              </Card>

              <section className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                <ResidenceManager />
              </section>
            </div>

            <aside className="space-y-4">
              <Card className="rounded-3xl border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4" />
                    Regras de residencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    A residencia confirma seu territorio principal de uso.
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    Publicacao e grupos podem depender de verificacao territorial.
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    Alteracoes devem refletir sua base real de moradia.
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border/70 bg-card/85 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    Cobertura profissional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    Areas de atuacao de empresas e servicos ficam no modulo
                    operacional, fora da residencia pessoal.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => navigate("/central")}
                  >
                    Abrir /central
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
