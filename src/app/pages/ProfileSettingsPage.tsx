/**
 * PROFILE SETTINGS PAGE
 * Configuracoes do perfil ativo: privacidade, vinculos e membros.
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Settings2 } from "lucide-react";

import { useActiveProfile } from "@/core/profiles/hooks/useActiveProfile";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { PrivacySettings } from "@/core/profiles/components/PrivacySettings";
import { ProfileLinksManager } from "@/core/profiles/components/ProfileLinksManager";
import { ProfileMembersManagerImproved } from "@/core/profiles/components/ProfileMembersManagerImproved";
import { getProfileTypeLabel } from "@/core/profile/utils/profileDomainRules";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { activeProfile, loading } = useActiveProfile();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "privacy";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Nenhum perfil ativo encontrado</p>
        <Button variant="outline" size="sm" onClick={() => navigate(appUrls.profile.home)}>
          Voltar
        </Button>
      </div>
    );
  }

  const canHaveMembers =
    activeProfile.profile_type === "business" || activeProfile.profile_type === "professional";

  return (
    <>
      <Helmet>
        <title>Configuracoes do Perfil</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(appUrls.profile.home)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Configuracoes do perfil</h1>
            <p className="text-xs text-muted-foreground">
              Privacidade, vinculos e membros da identidade ativa
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Identidade ativa</p>
              <h2 className="mt-2 truncate text-xl font-semibold text-foreground">
                {activeProfile.display_name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{getProfileTypeLabel(activeProfile)}</Badge>
                <Badge variant="outline">@{activeProfile.handle}</Badge>
              </div>
            </div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(appUrls.settings)}
            >
              <Settings2 className="h-4 w-4" />
              Configuracoes operacionais
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${canHaveMembers ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
            <TabsTrigger value="links">Vinculos</TabsTrigger>
            {canHaveMembers ? <TabsTrigger value="members">Membros</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="privacy" className="mt-6">
            <PrivacySettings profile={activeProfile} onUpdate={() => {}} />
          </TabsContent>

          <TabsContent value="links" className="mt-6">
            <ProfileLinksManager profileId={activeProfile.id} />
          </TabsContent>

          {canHaveMembers ? (
            <TabsContent value="members" className="mt-6">
              <ProfileMembersManagerImproved
                profileId={activeProfile.id}
                profileType={activeProfile.profile_type as "business" | "professional"}
              />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </>
  );
}
