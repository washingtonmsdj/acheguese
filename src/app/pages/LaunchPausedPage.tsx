import { Link } from "react-router-dom";
import { ArrowLeft, Building2, Home, Map, MapPin, Search, Tag, Users, Wrench } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";

interface LaunchPausedPageProps {
  moduleName?: string;
}

const STATIC_ACTIVE_LINKS = [
  { label: "Início", href: "/", icon: Home },
  { label: "Empresas", href: "/empresas", icon: Building2 },
  { label: "Serviços", href: "/servicos", icon: Wrench },
  { label: "Classificados", href: "/classificados", icon: Tag },
  { label: "Mapa", href: "/mapa", icon: Map },
  { label: "Perto de Mim", href: "/perto-de-mim", icon: MapPin },
  { label: "Busca", href: "/busca", icon: Search },
] as const;

export default function LaunchPausedPage({ moduleName = "Módulo" }: LaunchPausedPageProps) {
  const communityHref = useHomeCommunityHref();
  const activeLinks = [
    { label: "Comunidade", href: communityHref, icon: Users },
    ...STATIC_ACTIVE_LINKS,
  ] as const;

  return (
    <main id="main-content" className="min-h-[calc(100vh-5rem)] bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <Button asChild variant="ghost" className="w-fit gap-2 px-0 text-muted-foreground hover:bg-transparent">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
        </Button>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            MVP público
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
            {moduleName} está separado para ajustes.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Esta área não faz parte da primeira superfície pública do Achegue-se. O módulo continua
            preservado para manutenção, testes e retorno controlado quando estiver pronto para lançar.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Áreas abertas agora
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
