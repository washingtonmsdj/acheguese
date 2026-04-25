import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { Button } from "@/shared/components/ui/button";
import { SectionFrame, BusinessModulesSection } from "@/modules/profile/components/hub";
import { PerfilHubLayout } from "@/modules/profile/pages/PerfilHubLayout";
import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { buildProfileSectionItems, getProfileSectionPath } from "@/modules/profile/utils/profileNavigation";
import type { ProfileSectionId } from "@/modules/profile/sections";

export default function PerfilEmpresasPage() {
  const navigate = useNavigate();
  const data = useProfileHub();

  useEffect(() => {
    if (!data.user) {
      navigate(data.appUrls.auth.login);
    }
  }, [data.appUrls.auth.login, data.user, navigate]);

  const personalProfile = data.allProfiles.find((p) => p.profile_type === "personal") || data.profile;
  const activeSection: ProfileSectionId = "empresas";

  const sectionItems = buildProfileSectionItems({
    businessModules: data.businessModules,
    operations: data.operations,
    notifications: data.notifications,
  });

  const handleSectionChange = (section: ProfileSectionId) => {
    navigate(getProfileSectionPath(section), { replace: true });
  };

  return (
    <PerfilHubLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      sectionItems={sectionItems}
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
      reputation={data.identity?.reputation || data.context?.reputation}
      onAvatarChange={data.handleAvatarChange}
      pageTitle="Perfil | Minhas empresas"
      pageDescription="Lista de empresas vinculadas à conta ativa, com acesso ao dashboard, planos e link premium."
    >
      <div className="space-y-5">
        <Breadcrumbs />

        <SectionFrame
          title="Minhas empresas"
          description="Escolha uma empresa para gerenciar dashboard, gastronomia, planos e link premium."
          action={
            <Button variant="outline" className="gap-2" onClick={() => navigate("/perfil")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar ao perfil
            </Button>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              {data.businessModules.length} empresa(s) vinculada(s)
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground">
              Dashboard, gastronomia, planos e link premium no mesmo shell
            </div>
          </div>
        </SectionFrame>

        {data.loading ? (
          <div className="flex min-h-[30vh] items-center justify-center rounded-3xl border border-border bg-card">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando empresas...
            </div>
          </div>
        ) : (
          <BusinessModulesSection
            businessModules={data.businessModules}
            showOnboarding={data.showBusinessOnboarding}
            onCreateBusiness={() => navigate(data.appUrls.business.create)}
            onNavigate={(url) => navigate(url)}
            onCopy={data.copyToClipboard}
          />
        )}
      </div>
    </PerfilHubLayout>
  );
}
