/**
 * ContaHubPage - Pagina principal do hub de conta (refatorada)
 *
 * SSOT: Usa sections modulares e layout reutilizavel
 * Sem gambiarras: Codigo limpo e organizado
 *
 * Responsabilidades:
 * - Carregar dados via useProfileHub
 * - Fazer guards (loading/error/no-user)
 * - Determinar section ativa
 * - Construir props especificas por section
 * - Renderizar layout + section ativa
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, RefreshCw, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

import { useProfileHub } from "@/core/profile/hooks/useProfileHub";
import { ContaHubLayout } from "./ContaHubLayout";

import {
  ResumoSection,
  DadosPessoaisSection,
  EmpresasSection,
  MobilidadeSection,
  DeliverySection,
  PlanosSection,
  NotificacoesSection,
  PreferenciasSection,
  SegurancaSection,
  type ProfileSectionId,
  type SectionPropsMap,
} from "@/modules/profile/sections";

import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";
import { buildProfileSectionItems, getProfileSectionPath } from "@/modules/profile/utils/profileNavigation";

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
  preferencias: PreferenciasSection,
  seguranca: SegurancaSection,
} as const satisfies Record<ProfileSectionId, React.ComponentType<any>>;

// ============================================
// Helper: Construir Props por Section
// ============================================

function buildSectionProps(
  section: ProfileSectionId,
  data: ReturnType<typeof useProfileHub> & {
    personalProfile: ReturnType<typeof useProfileHub>["profile"];
    personalProfileId: string | null;
    setActiveSection: (section: ProfileSectionId) => void;
  }
): any {
  const baseProps = {
    user: data.user!,
    personalProfile: data.personalProfile as any,
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
        profile: data.profile as any,
        identity: data.identity,
        context: data.context,
        stats: data.stats,
        operations: data.operations,
        isVerified: data.isVerified,
        verificationStatus: data.verificationStatus,
        verificationRejectionReason: data.verificationRejectionReason,
        favorites: data.favorites as any,
        setActiveSection: data.setActiveSection,
        handleBusinessClick: (id: string) => {
          const business = (data.businessModules as any[]).find((b: any) => b.business?.id === id)?.business;
          if (business) data.handleBusinessClick(business);
        },
      };

    case "empresas":
      return {
        ...baseProps,
        businessModules: data.businessModules,
        showBusinessOnboarding: data.showBusinessOnboarding,
        handleBusinessClick: (id: string) => {
          const business = (data.businessModules as any[]).find((b: any) => b.business?.id === id)?.business;
          if (business) data.handleBusinessClick(business);
        },
        copyToClipboard: data.copyToClipboard,
      };

    case "mobilidade":
      return {
        ...baseProps,
        hasDriverProfile: data.hasDriverProfile,
        driverProfile: data.driverProfile as any,
        driverProfileId: data.driverProfileId,
        driverData: data.driverData,
        driverDataLoading: data.driverDataLoading,
        operations: data.operations,
        hasActiveRide: data.hasActiveRide,
        activeRide: (data.activeRide as any) ?? undefined,
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
        account: data.account as any,
        roles: data.roles as any,
        activeProfile: data.activeProfile as any,
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

export default function ContaHubPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("resumo");
  const data = useProfileHub();

  // SSOT: Perfil personal e a identidade principal
  const personalProfile = (data.allProfiles.find((p) => p.profile_type === "personal") ||
    data.profile) as any;
  const personalProfileId = personalProfile?.id ?? null;

  // Funcao para mudar de section
  const handleSectionChange = (section: ProfileSectionId) => {
    const nextPath = getProfileSectionPath(section);

    if (nextPath === "/conta") {
      setActiveSection(section);
      return;
    }

    navigate(nextPath, { replace: true });
  };

  // SSOT: Usar configuracao de secoes com badges dinamicos
  const sectionItems: SectionNavItem<ProfileSectionId>[] = buildProfileSectionItems({
    businessModules: data.businessModules,
    operations: data.operations,
    notifications: data.notifications,
  }) as SectionNavItem<ProfileSectionId>[];

  // Guard: Redirecionar se nao estiver logado
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
          <p className="text-sm text-muted-foreground">Carregando area da conta...</p>
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
        <div className="w-full rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <CircleAlert className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Nao foi possivel carregar a conta
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
        <div className="w-full rounded-lg border border-border bg-card p-8 text-center shadow-sm">
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

  const ActiveSection = (SECTION_MAP as any)[activeSection];
  const sectionProps = buildSectionProps(activeSection, {
    ...data,
    personalProfile,
    personalProfileId,
    setActiveSection,
    navigate,
  });

  return (
    <ContaHubLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      sectionItems={sectionItems}
      personalProfile={personalProfile}
      profile={data.profile as any}
      allProfiles={data.allProfiles as any}
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
      notifications={data.notifications as any}
      reputation={data.identity?.reputation || data.context?.reputation}
      onAvatarChange={data.handleAvatarChange}
    >
      <ActiveSection {...sectionProps} />
    </ContaHubLayout>
  );
}
