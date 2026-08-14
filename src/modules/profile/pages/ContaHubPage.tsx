import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  ChevronRight,
  CircleAlert,
  Globe2,
  LockKeyhole,
  MapPin,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { ContaHubLayout } from "./ContaHubLayout";
import { getProfileTypeLabel } from "@/core/profiles/utils/profileDomainRules";
import type { Profile as RuntimeProfile } from "@/core/profiles/services/multi-profile/types";

function GuardCard({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <div className="territory-vivo flex min-h-[70dvh] items-center justify-center bg-territory-canvas px-4">
      <section className="w-full max-w-lg rounded-territory-highlight border border-territory-border bg-territory-surface p-6 text-center sm:p-8">
        {icon}
        <h1 className="mt-4 font-heading text-xl font-semibold text-territory-ink">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-territory-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      </section>
    </div>
  );
}

function AccountAction({
  icon: Icon,
  title,
  description,
  meta,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[4.75rem] w-full items-center gap-3 border-b border-territory-border px-1 py-3 text-left last:border-b-0 focus-visible:rounded-territory"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-territory-brand/10 text-territory-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-territory-ink">{title}</span>
          {meta ? (
            <span className="rounded-full bg-territory-raised px-2 py-0.5 text-[0.6875rem] font-semibold text-territory-muted">
              {meta}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-sm leading-5 text-territory-muted">
          {description}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

export default function ContaHubPage() {
  const navigate = useNavigate();
  const data = useProfileHub();
  const personalProfile: RuntimeProfile | null =
    data.allProfiles.find((profile) => profile.profile_type === "personal") ??
    data.activeProfile ??
    null;
  const editorProfileId = personalProfile?.id ?? data.profile?.id ?? null;

  useEffect(() => {
    if (!data.loading && !data.user) {
      navigate(data.appUrls.auth.login);
    }
  }, [data.loading, data.user, navigate, data.appUrls.auth.login]);

  if (data.loading) {
    return (
      <div className="territory-vivo flex min-h-[70dvh] items-center justify-center bg-territory-canvas px-4">
        <div className="space-y-3 text-center" role="status">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-territory-brand border-t-transparent" />
          <p className="text-sm text-territory-muted">
            Organizando sua conta...
          </p>
        </div>
      </div>
    );
  }

  if (data.error && !data.profile && !data.identity) {
    return (
      <GuardCard
        icon={<CircleAlert className="mx-auto h-10 w-10 text-territory-warm" />}
        title="Não foi possível carregar a conta"
        description="Seus dados privados não foram alterados. Tente carregar novamente."
        actions={
          <>
            <Button
              className="gap-2"
              onClick={() => void data.refreshWorkspace()}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(data.appUrls.home)}
            >
              Voltar ao início
            </Button>
          </>
        }
      />
    );
  }

  if (!data.activeProfile && !data.profile) {
    return (
      <GuardCard
        icon={<Users className="mx-auto h-10 w-10 text-territory-brand" />}
        title="Sua identidade ainda não está pronta"
        description="A conta existe, mas nenhum perfil ativo foi encontrado. A criação de empresa continua disponível pela Central."
        actions={
          <Button onClick={() => navigate("/central")}>Abrir Central</Button>
        }
      />
    );
  }

  return (
    <ContaHubLayout
      personalProfile={personalProfile}
      profile={data.profile}
      allProfiles={data.allProfiles}
      isVerified={data.isVerified}
      canOpenPublicProfile={data.canOpenPublicProfile}
      handle={data.handle}
      territoryLabel={data.territoryLabel}
      userEmail={data.user?.email || ""}
      accountSnapshot={
        data.account || {
          accountState: "inactive" as const,
          isBlocked: false,
          isSuspended: false,
          verificationStatus: data.verificationStatus,
          verificationRejectionReason: data.verificationRejectionReason,
        }
      }
      identity={data.identity}
      context={data.context}
      notifications={data.notifications}
      onAvatarChange={data.handleAvatarChange}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-start">
        <div className="space-y-4">
          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-6">
            <div className="border-b border-territory-border pb-4">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                Essencial
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-territory-ink">
                Seus dados e controles
              </h2>
              <p className="mt-1 text-sm leading-6 text-territory-muted">
                Cada ajuste abre sua superfície específica, com a mesma
                navegação do Achegue-se.
              </p>
            </div>

            <AccountAction
              icon={UserRound}
              title="Identidade e apresentação"
              description="Nome, foto, bio e campos do perfil ativo."
              onClick={() =>
                editorProfileId &&
                navigate(data.appUrls.profile.edit(editorProfileId))
              }
            />
            <AccountAction
              icon={MapPin}
              title="Território e residência"
              description="Endereço privado e contexto territorial autorizado."
              meta={data.territoryLabel || "Pendente"}
              onClick={() => navigate(data.appUrls.profile.addresses)}
            />
            <AccountAction
              icon={Bell}
              title="Notificações"
              description="Canais, frequência e avisos da conta."
              meta={
                data.notifications.unread > 0
                  ? `${data.notifications.unread} não lidas`
                  : "Em dia"
              }
              onClick={() => navigate(data.appUrls.profile.notifications)}
            />
            <AccountAction
              icon={SlidersHorizontal}
              title="Preferências"
              description="Privacidade, vínculos e ajustes pessoais."
              onClick={() => navigate(data.appUrls.profile.preferences)}
            />
            <AccountAction
              icon={LockKeyhole}
              title="Segurança e acesso"
              description="Senha, recuperação e ações sensíveis."
              onClick={() => navigate(data.appUrls.profile.account)}
            />
          </section>

          {data.allProfiles.length > 1 ? (
            <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-6">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-territory-brand">
                Identidades
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-territory-ink">
                Perfis disponíveis
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {data.allProfiles.map((profile) => {
                  const isActive = profile.id === data.activeProfile?.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => void data.handleSwitchProfile(profile.id)}
                      className="rounded-territory border border-territory-border bg-territory-raised p-3 text-left hover:border-territory-brand/40"
                      aria-current={isActive ? "true" : undefined}
                    >
                      <span className="block truncate font-semibold text-territory-ink">
                        {profile.display_name || "Perfil sem nome"}
                      </span>
                      <span className="mt-1 block text-xs text-territory-muted">
                        {getProfileTypeLabel(profile)}
                        {isActive ? " · ativo" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-territory-brand/10 text-territory-brand">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-territory-ink">
                  Público e privado
                </h2>
                <p className="mt-1 text-sm leading-6 text-territory-muted">
                  Endereço, e-mail e dados de acesso ficam privados. Você
                  controla o que aparece no perfil público.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full justify-start border-territory-border bg-territory-surface text-territory-ink"
                onClick={() =>
                  navigate(data.appUrls.profile.settings("privacy"))
                }
              >
                <Shield className="mr-2 h-4 w-4" />
                Revisar privacidade
              </Button>
              {data.canOpenPublicProfile ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full justify-start border-territory-border bg-territory-surface text-territory-ink"
                  onClick={() =>
                    navigate(data.appUrls.profile.public(data.handle))
                  }
                >
                  <Globe2 className="mr-2 h-4 w-4" />
                  Ver perfil público
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-territory-highlight border border-territory-border bg-territory-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-territory-warm/10 text-territory-warm">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-territory-ink">
                  Empresas e vínculos
                </h2>
                <p className="mt-1 text-sm leading-6 text-territory-muted">
                  {data.businessModules.length > 0
                    ? `${data.businessModules.length} vínculo operacional disponível na Central.`
                    : "Nenhuma empresa vinculada a esta conta."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11 w-full border-territory-border bg-territory-surface text-territory-ink"
              onClick={() => navigate("/central")}
            >
              Abrir Central
            </Button>
          </section>

          {data.nextActions.length > 0 ? (
            <section className="rounded-territory-highlight border border-territory-border bg-territory-raised p-4 sm:p-5">
              <h2 className="font-heading text-lg font-semibold text-territory-ink">
                Próximos cuidados
              </h2>
              <div className="mt-3 space-y-3">
                {data.nextActions.slice(0, 3).map((action) => (
                  <div
                    key={action.title}
                    className="border-t border-territory-border pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-sm font-semibold text-territory-ink">
                      {action.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-territory-muted">
                      {action.description}
                    </p>
                    <button
                      type="button"
                      onClick={action.onClick}
                      className="mt-2 text-sm font-semibold text-territory-brand hover:text-territory-brand-strong"
                    >
                      {action.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </ContaHubLayout>
  );
}
