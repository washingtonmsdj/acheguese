import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Bell,
  Link2,
  Shield,
  SlidersHorizontal,
} from "lucide-react";

import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const PREFERENCE_CARDS = [
  {
    title: "Notificações",
    description: "Defina canais, frequência e horário silencioso.",
    cta: "Abrir notificações",
    icon: Bell,
    hrefKey: "notifications",
  },
  {
    title: "Privacidade",
    description: "Controle dados, consentimentos e fluxo LGPD.",
    cta: "Abrir privacidade",
    icon: Shield,
    hrefKey: "privacy",
  },
  {
    title: "Vínculos e membros",
    description: "Gerencie ligações da identidade ativa e dos times.",
    cta: "Abrir vínculos",
    icon: Link2,
    hrefKey: "links",
  },
  {
    title: "Identidade ativa",
    description: "Ajuste configurações do perfil em contexto.",
    cta: "Ajustar identidade",
    icon: SlidersHorizontal,
    hrefKey: "identity",
  },
] as const;

export default function ContaPreferenciasPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const [searchParams] = useSearchParams();
  const legacyTab = searchParams.get("tab");

  if (
    legacyTab === "privacy" ||
    legacyTab === "links" ||
    legacyTab === "members"
  ) {
    return <Navigate to={appUrls.profile.settings(legacyTab)} replace />;
  }

  const resolveHref = (
    hrefKey: (typeof PREFERENCE_CARDS)[number]["hrefKey"],
  ) => {
    switch (hrefKey) {
      case "notifications":
        return "/conta/notificacoes";
      case "privacy":
        return "/conta/privacidade";
      case "links":
        return appUrls.profile.settings("links");
      case "identity":
        return appUrls.profile.settings("privacy");
      default:
        return appUrls.profile.home;
    }
  };

  return (
    <>
      <Helmet>
        <title>Preferências da conta</title>
      </Helmet>

      <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
        <main className="mx-auto w-full max-w-[1080px] px-3 pb-24 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
          <div className="sticky top-0 z-20 -mx-3 mb-5 border-b border-territory-border bg-territory-canvas/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="flex items-start gap-3">
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
                  Conta e preferências
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Preferências da conta
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Notificações, privacidade e ajustes da identidade ativa.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                Atalhos principais
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Ajustes pessoais em um só lugar
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Use essas entradas para controlar comunicação, privacidade e
                relações da sua identidade atual sem misturar com operação.
              </p>
            </div>
          </section>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {PREFERENCE_CARDS.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="rounded-territory-highlight border-territory-border bg-territory-surface shadow-none"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full justify-center sm:w-auto"
                      onClick={() => navigate(resolveHref(item.hrefKey))}
                      type="button"
                    >
                      {item.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}
