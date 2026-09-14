import { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link2, Loader2, Settings2, Shield, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { PrivacySettings } from "@/core/profiles/components/PrivacySettings";
import { ProfileLinksManager } from "@/core/profiles/components/ProfileLinksManager";
import { ProfileMembersManagerImproved } from "@/core/profiles/components/ProfileMembersManagerImproved";
import { useActiveProfile } from "@/core/profiles/hooks/useActiveProfile";
import {
  canProfileHaveMembers,
  getProfileTypeLabel,
} from "@/core/profiles/utils/profileDomainRules";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

type ProfileSettingsTab = "privacy" | "links" | "members";

const TAB_META: Record<
  ProfileSettingsTab,
  { eyebrow: string; title: string; description: string; icon: typeof Shield }
> = {
  privacy: {
    eyebrow: "Privacidade do perfil",
    title: "Controle o que aparece na sua identidade",
    description:
      "Visibilidade pública, dados sensíveis e apresentação do perfil ativo.",
    icon: Shield,
  },
  links: {
    eyebrow: "Vínculos da identidade",
    title: "Gerencie conexões e relações",
    description:
      "Perfis relacionados, ligações da conta e contexto da identidade ativa.",
    icon: Link2,
  },
  members: {
    eyebrow: "Membros e permissões",
    title: "Convites, papéis e acesso do time",
    description:
      "Organize quem participa do perfil profissional ou empresarial.",
    icon: Users,
  },
};

function normalizeTab(value: string | null): ProfileSettingsTab {
  if (value === "links" || value === "members") {
    return value;
  }

  return "privacy";
}

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { activeProfile, loading } = useActiveProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const canHaveMembers = canProfileHaveMembers(activeProfile);
  const rawTab = searchParams.get("tab");
  const requestedTab = normalizeTab(rawTab);

  const activeTab = useMemo<ProfileSettingsTab>(() => {
    if (requestedTab === "members" && !canHaveMembers) {
      return "privacy";
    }

    return requestedTab;
  }, [canHaveMembers, requestedTab]);

  useEffect(() => {
    if (loading) return;

    const invalidTab = rawTab !== null && rawTab !== "links" && rawTab !== "members";
    const unavailableMembers = rawTab === "members" && !canHaveMembers;
    if (!invalidTab && !unavailableMembers) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("tab");
    setSearchParams(nextParams, { replace: true });
  }, [canHaveMembers, loading, rawTab, searchParams, setSearchParams]);

  const handleTabChange = (nextValue: string) => {
    const nextTab = normalizeTab(nextValue);
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === "privacy") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    setSearchParams(nextParams, { replace: true });
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Configurações da identidade | Achegue-se</title></Helmet>
        <AccountSettingsShell
          title="Configurações da identidade"
          description="Privacidade, vínculos e permissões do perfil em uso."
          backTo={ACCOUNT_PATHS.preferences}
        >
          <section className="flex min-h-40 items-center justify-center rounded-2xl border border-territory-border bg-territory-surface p-5">
            <div className="text-center" role="status">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-territory-brand" aria-hidden="true" />
              <p className="mt-2 text-sm text-territory-muted">Carregando identidade...</p>
            </div>
          </section>
        </AccountSettingsShell>
      </>
    );
  }

  if (!activeProfile) {
    return (
      <>
        <Helmet><title>Configurações da identidade | Achegue-se</title></Helmet>
        <AccountSettingsShell
          title="Configurações da identidade"
          description="Privacidade, vínculos e permissões do perfil em uso."
          backTo={ACCOUNT_PATHS.preferences}
        >
          <section className="rounded-2xl border border-territory-border bg-territory-surface p-5 text-center sm:p-6">
            <Users className="mx-auto h-8 w-8 text-territory-brand" aria-hidden="true" />
            <h2 className="mt-3 font-heading text-base font-bold text-territory-ink">Nenhum perfil ativo encontrado</h2>
            <p className="mt-1 text-sm leading-5 text-territory-muted">
              Escolha uma identidade antes de alterar privacidade, vínculos ou membros.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11"
              onClick={() => navigate(ACCOUNT_PATHS.profiles)}
            >
              Abrir Meus perfis
            </Button>
          </section>
        </AccountSettingsShell>
      </>
    );
  }

  const currentMeta = TAB_META[activeTab];
  const CurrentIcon = currentMeta.icon;

  return (
    <>
      <Helmet>
        <title>Configurações da identidade | Achegue-se</title>
      </Helmet>

      <AccountSettingsShell
        title="Configurações da identidade"
        description="Privacidade, vínculos e permissões do perfil que está em uso."
        backTo={ACCOUNT_PATHS.preferences}
      >
        <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
                <CurrentIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-territory-brand">{currentMeta.eyebrow}</p>
                <h2 className="mt-1 font-heading text-lg font-bold tracking-[-0.025em] text-territory-ink sm:text-xl">
                  {currentMeta.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-territory-muted">
                  {currentMeta.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-territory-border bg-territory-raised px-3 py-3 sm:min-w-[230px]">
              <p className="truncate text-sm font-semibold text-territory-ink">
                {activeProfile.display_name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{getProfileTypeLabel(activeProfile)}</Badge>
                <Badge variant="outline">
                  {activeProfile.handle ? `@${activeProfile.handle}` : "Sem @ público"}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
          <TabsList className="flex h-auto w-full gap-2 overflow-x-auto rounded-2xl border border-territory-border bg-territory-surface p-2">
            <TabsTrigger
              value="privacy"
              className="min-h-11 min-w-fit gap-2 rounded-xl px-4"
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              Privacidade
            </TabsTrigger>
            <TabsTrigger
              value="links"
              className="min-h-11 min-w-fit gap-2 rounded-xl px-4"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Vínculos
            </TabsTrigger>
            {canHaveMembers ? (
              <TabsTrigger
                value="members"
                className="min-h-11 min-w-fit gap-2 rounded-xl px-4"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Membros
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="privacy" className="mt-4">
            <div className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
              <PrivacySettings profile={activeProfile} onUpdate={() => {}} />
            </div>
          </TabsContent>

          <TabsContent value="links" className="mt-4">
            <div className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
              <ProfileLinksManager profileId={activeProfile.id} />
            </div>
          </TabsContent>

          {canHaveMembers ? (
            <TabsContent value="members" className="mt-4">
              <div className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
                <ProfileMembersManagerImproved
                  profileId={activeProfile.id}
                  profileType={
                    activeProfile.profile_type as "business" | "professional"
                  }
                />
              </div>
            </TabsContent>
          ) : null}
        </Tabs>

        <section className="mt-4 rounded-2xl border border-territory-border bg-territory-raised p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-territory-ink">Ajustes gerais da conta</p>
              <p className="mt-1 text-sm leading-5 text-territory-muted">
                Notificações, privacidade de dados e acessibilidade ficam nas preferências gerais da conta.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full justify-center sm:w-auto"
              onClick={() => navigate(ACCOUNT_PATHS.preferences)}
            >
              <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Abrir preferências
            </Button>
          </div>
        </section>
      </AccountSettingsShell>
    </>
  );
}
