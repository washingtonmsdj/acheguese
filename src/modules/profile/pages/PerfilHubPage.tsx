/**
 * PerfilHubPage - Página principal do hub de perfil (REFATORADA)
 * 
 * SSOT: Usa sections modulares e layout reutilizável
 * Sem gambiarras: Código limpo e organizado
 * 
 * Responsabilidades:
 * - Carregar dados via useProfileHub
 * - Fazer guards (loading/error/no-user)
 * - Determinar section ativa
 * - Construir props específicas por section
 * - Renderizar layout + section ativa
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, RefreshCw, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

import { useProfileHub } from "@/modules/profile/hooks/useProfileHub";
import { PerfilHubLayout } from "./PerfilHubLayout";

import {
  ResumoSection,
  DadosPessoaisSection,
  EmpresasSection,
  MobilidadeSection,
  DeliverySection,
  PlanosSection,
  NotificacoesSection,
  ConfiguracoesSection,
  SegurancaSection,
  type ProfileSectionId,
  type SectionPropsMap,
} from "@/modules/profile/sections";

import {
  PROFILE_SECTIONS,
  isProfileSectionId,
} from "@/modules/profile/config/profile-sections.config";

import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";

// ============================================
// Mapa de Sections (SSOT)
// ============================================

const SECTION_MAP = {
  resumo: ResumoSection,
  "dados-pessoais": DadosPessoaisSection,
  empresas: EmpresasSection,
  mobilidade: MobilidadeSection,
  delivery: DeliverySection,
  planos: PlanosSection,
  notificacoes: NotificacoesSection,
  configuracoes: ConfiguracoesSection,
  seguranca: SegurancaSection,
} as const satisfies Record<ProfileSectionId, React.ComponentType<any>>;

// ============================================
// Helper: Construir Props por Section
// ============================================

function buildSectionProps(
  section: ProfileSectionId,
  data: ReturnType<typeof useProfileHub> & {
    personalProfile: any;
    personalProfileId: string | null;
    setActiveSection: (section: ProfileSectionId) => void;
  }
): any {
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
        handleBusinessClick: (id: string) => {
          const business = data.businessModules.find((b) => b.business.id === id)?.business;
          if (business) data.handleBusinessClick(business);
        },
      };

    case "empresas":
      return {
        ...baseProps,
        businessModules: data.businessModules,
        showBusinessOnboarding: data.showBusinessOnboarding,
        handleBusinessClick: (id: string) => {
          const business = data.businessModules.find((b) => b.business.id === id)?.business;
          if (business) data.handleBusinessClick(business);
        },
        copyToClipboard: data.copyToClipboard,
      };

    case "mobilidade":
      return {
        ...baseProps,
        hasDriverProfile: data.hasDriverProfile,
        driverProfile: data.driverProfile,
        driverProfileId: data.driverProfileId,
        driverData: data.driverData,
        driverDataLoading: data.driverDataLoading,
        operations: data.operations,
        hasActiveRide: data.hasActiveRide,
        activeRide: data.activeRide,
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

    case "configuracoes":
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

// ============================================
// Componente Principal
// ============================================

export default function PerfilHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const data = useProfileHub();

  // Determinar section ativa
  const sectionParam = searchParams.get("sec");
  const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
    ? sectionParam
    : "resumo";

  // ✅ SSOT: Perfil personal é a identidade principal
  const personalProfile = data.allProfiles.find((p) => p.profile_type === "personal") || data.profile;
  const personalProfileId = personalProfile?.id ?? null;

  // Função para mudar de section
  const setActiveSection = (section: ProfileSectionId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (section === "resumo") {
      nextParams.delete("sec");
    } else {
      nextParams.set("sec", section);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // ✅ SSOT: Usar configuração de seções com badges dinâmicos
  const sectionItems: SectionNavItem<ProfileSectionId>[] = PROFILE_SECTIONS.map((section) => {
    let badge: string | undefined;

    if (section.id === "empresas" && data.businessModules.length > 0) {
      badge = String(data.businessModules.length);
    } else if (section.id === "mobilidade" && data.operations.activeRides > 0) {
      badge = String(data.operations.activeRides);
    } else if (section.id === "notificacoes" && data.notifications.unread > 0) {
      badge = String(data.notifications.unread);
    }

    return {
      id: section.id,
      label: section.label,
      description: section.description,
      icon: section.icon,
      badge,
    };
  });

  // Guard: Redirecionar se não estiver logado
  useEffect(() => {
    if (!data.user) {
      navigate(data.appUrls.auth.login);
    }
  }, [data.user, navigate, data.appUrls.auth.login]);

  // ============================================
  // Guards: Loading
  // ============================================
  if (data.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando area de perfil...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Guards: Error
  // ============================================
  if (data.error && !data.profile && !data.identity) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Nao foi possivel carregar o perfil
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O snapshot privado falhou. Tente novamente para recuperar os dados.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button className="gap-2" onClick={() => void data.refreshWorkspace()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(data.appUrls.home)}>
              Ir para inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Guards: No Profile
  // ============================================
  if (!data.activeProfile && !data.profile) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Nenhuma identidade ativa disponivel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta carregou, mas ainda nao ha um perfil operacional ativo.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate(data.appUrls.business.create)}>
              Criar empresa
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // Renderizar Layout + Section Ativa
  // ============================================

  const ActiveSection = SECTION_MAP[activeSection];
  const sectionProps = buildSectionProps(activeSection, {
    ...data,
    personalProfile,
    personalProfileId,
    setActiveSection,
    navigate,
  });

  return (
    <PerfilHubLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
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
      <ActiveSection {...(sectionProps as any)} />
    </PerfilHubLayout>
  );
}
