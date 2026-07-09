import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Link2, Settings2, Shield, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { canProfileHaveMembers, getProfileTypeLabel } from "@/core/profiles/utils/profileDomainRules";
import { PrivacySettings } from "@/core/profiles/components/PrivacySettings";
import { ProfileLinksManager } from "@/core/profiles/components/ProfileLinksManager";
import { ProfileMembersManagerImproved } from "@/core/profiles/components/ProfileMembersManagerImproved";
import { useActiveProfile } from "@/core/profiles/hooks/useActiveProfile";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

type ProfileSettingsTab = "privacy" | "links" | "members";

const TAB_META: Record<
  ProfileSettingsTab,
  { eyebrow: string; title: string; description: string; icon: typeof Shield }
> = {
  privacy: {
    eyebrow: "Privacidade do perfil",
    title: "Controle o que aparece na sua identidade",
    description: "Visibilidade pública, dados sensíveis e apresentação do perfil ativo.",
    icon: Shield,
  },
  links: {
    eyebrow: "Vínculos da identidade",
    title: "Gerencie conexões e relações operacionais",
    description: "Perfis relacionados, ligações da conta e contexto da identidade ativa.",
    icon: Link2,
  },
  members: {
    eyebrow: "Membros e permissões",
    title: "Convites, papéis e acesso do time",
    description: "Organize quem participa do perfil profissional ou empresarial.",
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
  const appUrls = useAppUrls();
  const { activeProfile, loading } = useActiveProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileSettingsTab>(normalizeTab(searchParams.get("tab")));

  const canHaveMembers = canProfileHaveMembers(activeProfile);

  const resolvedTab = useMemo<ProfileSettingsTab>(() => {
    const requestedTab = normalizeTab(searchParams.get("tab"));

    if (requestedTab === "members" && !canHaveMembers) {
      return "privacy";
    }

    return requestedTab;
  }, [canHaveMembers, searchParams]);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (nextValue: string) => {
    const nextTab = normalizeTab(nextValue);
    const nextParams = new URLSearchParams(searchParams);

    if (nextTab === "privacy") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", nextTab);
    }

    setSearchParams(nextParams, { replace: true });
    setActiveTab(nextTab);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground">Nenhum perfil ativo encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(appUrls.profile.home)} type="button">
          Voltar para a conta
        </Button>
      </div>
    );
  }

  const currentMeta = TAB_META[activeTab];
  const CurrentIcon = currentMeta.icon;

  return (
    <>
      <Helmet>
        <title>Configurações da identidade</title>
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))]">
        <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
          <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-6 sm:rounded-3xl sm:border sm:bg-card/85 sm:px-5 sm:shadow-sm">
            <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full"
                  onClick={() => navigate(appUrls.settings)}
                  type="button"
                >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Identidade ativa
                </p>
                <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Configurações da identidade
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Privacidade, vínculos e permissões do perfil que está em uso.
                </p>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary/90">
                  {currentMeta.eyebrow}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                  {currentMeta.title}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
                  {currentMeta.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary">{getProfileTypeLabel(activeProfile)}</Badge>
                  <Badge variant="outline">@{activeProfile.handle}</Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 sm:min-w-[280px]">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                    <CurrentIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{activeProfile.display_name}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Ajustes aplicados à identidade atual. Preferências de conta ficam em{" "}
                      <button
                        type="button"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => navigate(appUrls.settings)}
                      >
                        /conta/preferencias
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-5">
            <TabsList className="flex h-auto w-full gap-2 overflow-x-auto rounded-3xl border border-border/70 bg-card/90 p-2">
              <TabsTrigger value="privacy" className="min-w-fit gap-2 rounded-2xl px-4 py-2.5">
                <Shield className="h-4 w-4" />
                Privacidade
              </TabsTrigger>
              <TabsTrigger value="links" className="min-w-fit gap-2 rounded-2xl px-4 py-2.5">
                <Link2 className="h-4 w-4" />
                Vinculos
                Vínculos
              </TabsTrigger>
              {canHaveMembers ? (
                <TabsTrigger value="members" className="min-w-fit gap-2 rounded-2xl px-4 py-2.5">
                  <Users className="h-4 w-4" />
                  Membros
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="privacy" className="mt-5">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                <PrivacySettings profile={activeProfile} onUpdate={() => {}} />
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-5">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                <ProfileLinksManager profileId={activeProfile.id} />
              </div>
            </TabsContent>

            {canHaveMembers ? (
              <TabsContent value="members" className="mt-5">
                <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-sm sm:p-6">
                  <ProfileMembersManagerImproved
                    profileId={activeProfile.id}
                    profileType={activeProfile.profile_type as "business" | "professional"}
                  />
                </div>
              </TabsContent>
            ) : null}
          </Tabs>

          <section className="mt-5 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Voltar para ajustes da conta</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Notificações, privacidade LGPD e configurações gerais ficam separadas da identidade.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full justify-center sm:w-auto"
                onClick={() => navigate(appUrls.settings)}
                type="button"
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Abrir preferências
              </Button>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
