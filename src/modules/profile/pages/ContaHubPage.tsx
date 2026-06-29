import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, RefreshCw, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { ContaHubLayout } from "./ContaHubLayout";

import { ResumoSection } from "@/modules/profile/sections/ResumoSection";
import { DadosPessoaisSection } from "@/modules/profile/sections/DadosPessoaisSection";
import { EmpresasSection } from "@/modules/profile/sections/EmpresasSection";
import { PlanosSection } from "@/modules/profile/sections/PlanosSection";
import { NotificacoesSection } from "@/modules/profile/sections/NotificacoesSection";
import { PreferenciasSection } from "@/modules/profile/sections/PreferenciasSection";
import { SegurancaSection } from "@/modules/profile/sections/SegurancaSection";
import type { ProfileSectionId } from "@/modules/profile/config/profile-sections.config";
import type { Profile as RuntimeProfile } from "@/core/profiles/services/multi-profile/types";

import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";
import {
  buildProfileSectionItems,
  getProfileSectionPath,
} from "@/modules/profile/utils/profileNavigation";
import { getRecordValue } from "@/shared/utils/recordLookup";

const SECTION_MAP = {
  resumo: ResumoSection,
  "dados-pessoais": DadosPessoaisSection,
  empresas: EmpresasSection,
  mobilidade: LaunchPausedProfileSection,
  delivery: LaunchPausedProfileSection,
  planos: PlanosSection,
  notificacoes: NotificacoesSection,
  preferencias: PreferenciasSection,
  seguranca: SegurancaSection,
} as const satisfies Record<ProfileSectionId, unknown>;

interface LaunchPausedProfileSectionProps {
  navigate: (path: string) => void;
}

function LaunchPausedProfileSection({ navigate }: LaunchPausedProfileSectionProps) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-card/80 p-6 shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        MVP publico
      </p>
      <h2 className="mt-3 text-xl font-bold text-foreground">
        Este modulo esta separado para ajustes.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        A conta fica focada em identidade, empresas, servicos e notificacoes do
        lancamento. Rotinas operacionais pausadas continuam preservadas fora da
        superficie publica.
      </p>
      <Button className="mt-5" variant="outline" onClick={() => navigate("/central")}>
        Abrir Central
      </Button>
    </div>
  );
}

function buildSectionProps(
  section: ProfileSectionId,
  data: ReturnType<typeof useProfileHub> & {
    personalProfile: ReturnType<typeof useProfileHub>["activeProfile"];
    personalProfileId: string | null;
    setActiveSection: (section: ProfileSectionId) => void;
  },
): Record<string, unknown> {
  const baseProps = {
    user: data.user!,
    personalProfile: data.personalProfile,
    personalProfileId: data.personalProfileId,
    navigate: data.navigate,
    appUrls: data.appUrls,
    moduleUrls: data.moduleUrls,
  };

  switch (section) {
    case "resumo":
      return {
        ...baseProps,
        operations: data.operations,
        notifications: data.notifications,
        stats: data.stats,
        nextActions: data.nextActions,
        hasActiveRide: data.hasActiveRide,
        activeRide: data.activeRide,
        driverProfileId: data.driverProfileId,
        driverData: data.driverData,
        setActiveSection: data.setActiveSection,
      };

    case "dados-pessoais":
      return {
        ...baseProps,
        profile: data.profile,
        identity: data.identity,
        context: data.context,
        stats: data.stats,
        operations: data.operations,
        isVerified: data.isVerified,
        verificationStatus: data.verificationStatus,
        verificationRejectionReason: data.verificationRejectionReason,
        favorites: data.favorites,
        setActiveSection: data.setActiveSection,
        handleBusinessClick: data.handleBusinessClick,
      };

    case "empresas":
      return {
        ...baseProps,
        businessModules: data.businessModules,
        showBusinessOnboarding: data.showBusinessOnboarding,
        copyToClipboard: data.copyToClipboard,
      };

    case "mobilidade":
      return {
        ...baseProps,
        navigate: data.navigate,
      };

    case "delivery":
      return {
        ...baseProps,
        businessModules: data.businessModules,
        setActiveSection: data.setActiveSection,
      };

    case "planos":
      return {
        ...baseProps,
        identity: data.identity,
        context: data.context,
        businessModules: data.businessModules,
      };

    case "notificacoes":
      return {
        ...baseProps,
        notifications: data.notifications,
      };

    case "preferencias":
      return {
        ...baseProps,
        canManageProfileMembers: data.canManageProfileMembers,
      };

    case "seguranca":
      return {
        ...baseProps,
        profile: data.profile,
        identity: data.identity,
        context: data.context,
        account: data.account,
        roles: data.roles,
        activeProfile: data.activeProfile,
        stats: data.stats,
        verificationStatus: data.verificationStatus,
        verificationRejectionReason: data.verificationRejectionReason,
        downloadDataOpen: data.downloadDataOpen,
        setDownloadDataOpen: data.setDownloadDataOpen,
        viewDataOpen: data.viewDataOpen,
        setViewDataOpen: data.setViewDataOpen,
        deactivateOpen: data.deactivateOpen,
        setDeactivateOpen: data.setDeactivateOpen,
        deleteOpen: data.deleteOpen,
        setDeleteOpen: data.setDeleteOpen,
        deleteConfirm: data.deleteConfirm,
        setDeleteConfirm: data.setDeleteConfirm,
        handleDownloadData: data.handleDownloadData,
        handleDeactivateAccount: data.handleDeactivateAccount,
        handleDeleteAccount: data.handleDeleteAccount,
      };

    default:
      return baseProps;
  }
}

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
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
      <div className="w-full rounded-[24px] border border-border/70 bg-card/80 p-8 text-center shadow-[0_26px_100px_-70px_rgba(0,0,0,0.9)] backdrop-blur-sm">
        {icon}
        <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

export default function ContaHubPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("resumo");
  const data = useProfileHub();

  const personalProfile: RuntimeProfile | null =
    data.allProfiles.find((p) => p.profile_type === "personal") ??
    data.activeProfile ??
    null;
  const personalProfileId = personalProfile?.id ?? null;

  const handleSectionChange = (section: ProfileSectionId) => {
    const nextPath = getProfileSectionPath(section);

    if (nextPath === "/conta") {
      setActiveSection(section);
      return;
    }

    navigate(nextPath, { replace: true });
  };

  const sectionItems: SectionNavItem<ProfileSectionId>[] = buildProfileSectionItems({
    businessModules: data.businessModules,
    operations: data.operations,
    notifications: data.notifications,
  }) as SectionNavItem<ProfileSectionId>[];

  useEffect(() => {
    if (!data.user) {
      navigate(data.appUrls.auth.login);
    }
  }, [data.user, navigate, data.appUrls.auth.login]);

  if (data.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando area da conta...</p>
        </div>
      </div>
    );
  }

  if (data.error && !data.profile && !data.identity) {
    return (
      <GuardCard
        icon={<CircleAlert className="mx-auto h-10 w-10 text-amber-600" />}
        title="Nao foi possivel carregar a conta"
        description="O snapshot privado falhou. Tente novamente para recuperar os dados."
        actions={
          <>
            <Button className="gap-2" onClick={() => void data.refreshWorkspace()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(data.appUrls.home)}>
              Ir para inicio
            </Button>
          </>
        }
      />
    );
  }

  if (!data.activeProfile && !data.profile) {
    return (
      <GuardCard
        icon={<Users className="mx-auto h-10 w-10 text-primary" />}
        title="Nenhuma identidade ativa disponivel"
        description="Sua conta carregou, mas ainda nao ha um perfil operacional ativo."
        actions={
          <Button onClick={() => navigate(data.appUrls.business.create)}>
            Criar empresa
          </Button>
        }
      />
    );
  }

  const sectionProps = buildSectionProps(activeSection, {
    ...data,
    personalProfile,
    personalProfileId,
    setActiveSection,
    navigate,
  });
  const ActiveSection =
    (getRecordValue(SECTION_MAP, activeSection) ?? ResumoSection) as unknown as ComponentType<
      typeof sectionProps
    >;

  return (
    <ContaHubLayout
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
    >
      <ActiveSection {...sectionProps} />
    </ContaHubLayout>
  );
}
