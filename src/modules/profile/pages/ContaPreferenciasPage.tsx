import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Bell,
  ChevronRight,
  Link2,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";

const PREFERENCE_ROWS = [
  {
    title: "Notificações",
    description: "Canais, frequência e horário silencioso.",
    icon: Bell,
    hrefKey: "notifications",
  },
  {
    title: "Privacidade e dados",
    description: "Consentimentos, exportação e exclusão da conta.",
    icon: Shield,
    hrefKey: "privacy",
  },
  {
    title: "Vínculos e membros",
    description: "Relações da identidade ativa e acesso de equipes.",
    icon: Link2,
    hrefKey: "links",
  },
  {
    title: "Identidade ativa",
    description: "Visibilidade e configurações do perfil em contexto.",
    icon: UserRound,
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
    hrefKey: (typeof PREFERENCE_ROWS)[number]["hrefKey"],
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
        <title>Preferências | Achegue-se</title>
      </Helmet>

      <AccountSettingsShell
        title="Preferências do aplicativo"
        description="Organize seus ajustes pessoais sem misturar identidade, privacidade e operação."
      >
        <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <div className="flex items-start gap-3 border-b border-territory-border pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-territory-ink">Ajustes pessoais</h2>
              <p className="mt-1 text-sm leading-5 text-territory-muted">
                Cada item abre a superfície responsável por aquele dado ou comportamento.
              </p>
            </div>
          </div>

          <div>
            {PREFERENCE_ROWS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => navigate(resolveHref(item.hrefKey))}
                  className="group flex min-h-[76px] w-full items-center gap-3 border-b border-territory-border py-3 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-raised text-territory-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-territory-ink">{item.title}</span>
                    <span className="mt-1 block text-xs leading-4 text-territory-muted">{item.description}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-territory-border bg-territory-raised p-4 text-sm leading-5 text-territory-muted sm:p-5">
          Preferências de comunicação e privacidade permanecem em serviços separados. Isso evita que um único controle altere dados ou consentimentos sem contexto.
        </section>
      </AccountSettingsShell>
    </>
  );
}
