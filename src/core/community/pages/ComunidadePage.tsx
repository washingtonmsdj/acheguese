/**
 * ComunidadePage - Página principal da comunidade
 * 
 * ✅ SSOT - Usa Services via hooks
 * ✅ Arquitetura Modular - Componentes isolados
 * ✅ Performance - Lazy loading e memoização
 * ✅ Acessibilidade - ARIA labels e roles
 */

import React, { lazy, Suspense, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  Drum,
  GraduationCap,
  HandHeart,
  Heart,
  LayoutList,
  Loader2,
  MapPin,
  MessageSquare,
  PackageSearch,
  ShieldCheck,
  Star,
  Store,
  UtensilsCrossed,
  Users,
  Wrench,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useIsAdmin } from "@/core/auth/hooks/useIsAdmin";
import { useAppUrls } from "@/core/routing/hooks";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { useCommunityRollout } from "@/core/community/hooks/useCommunityRollout";
import { communityRolloutService } from "@/core/community/services";
import { TerritorialSelector } from "@/core/location/components/TerritorialSelector";
import { residenceService } from "@/core/residence/services/ResidenceService";
import { useComunidadePage } from "../hooks/page/useComunidadePage";
import { CommunityFeed } from "../components/feed/CommunityFeed";
import { CommunityRightSidebar } from "../components/CommunityRightSidebar";
import { LocationScopeCards } from "../components/page/LocationScopeCards";
import { CommunityFloatingButtons } from "../components/page/CommunityFloatingButtons";
import { CommunityModals } from "../components/page/CommunityModals";
import { CreatePostModal } from "../components/composer/CreatePostModal";
import { CreateAlertModal } from "@/core/community/alerts";
import { IssueFeedSection, CreateIssueModal } from "@/core/community/issues";
import { useBusinessList } from "@/modules/business/hooks/useBusinessList";
import { useGastronomyList } from "@/modules/business/gastronomy/hooks";
import { useEventos } from "@/core/community/hooks/useEventos";
import { useClassificados } from "@/modules/classifieds/hooks/useClassificados";
import { useVagasUrgentes } from "@/modules/classifieds/jobs/hooks/useVagasPublic";
import { VerificationBanner } from "@/core/verification";
import { cn } from "@/shared/utils/cn";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";
import { LAUNCH_TERRITORIES } from "@/config/territory";
import heroComplexoImg from "@/assets/hero-complexo-nordeste.jpg";
import nordesteImg from "@/assets/bairro-nordeste.jpg";
import santaCruzImg from "@/assets/bairro-santa-cruz.jpg";
import valePedrinhasImg from "@/assets/bairro-vale-pedrinhas.jpg";
import chapadaImg from "@/assets/bairro-chapada.jpg";

const GruposPage = lazy(() => import("./GruposPage"));

type CommunityTab = "feed" | "grupos";

const TABS: { id: CommunityTab; label: string; icon: React.ElementType }[] = [
  { id: "feed",   label: "Feed",   icon: LayoutList },
  { id: "grupos", label: "Grupos", icon: Users },
];

const COMPLEXO_STATS = [
  {
    label: "moradores",
    value: "~76 mil",
    detail: "Soma dos quatro bairros no Censo 2010",
    icon: Users,
  },
  {
    label: "bairros",
    value: "4",
    detail: "Nordeste, Santa Cruz, Vale e Chapada",
    icon: MapPin,
  },
  {
    label: "blocos",
    value: "73",
    detail: "Circuito Mestre Bimba em 2025",
    icon: Drum,
  },
  {
    label: "ambulantes",
    value: "300",
    detail: "Cadastrados no Carnaval de bairro",
    icon: Store,
  },
];

const COMPLEXO_BAIRROS = [
  {
    name: "Nordeste de Amaralina",
    population: "21.887",
    description: "Centro historico do aglomerado e referencia da capoeira regional.",
    image: nordesteImg,
  },
  {
    name: "Santa Cruz",
    population: "27.083",
    description: "Maior populacao entre os bairros do complexo no Censo 2010.",
    image: santaCruzImg,
  },
  {
    name: "Chapada do Rio Vermelho",
    population: "21.955",
    description: "Porta de conexao com Rio Vermelho, Amaralina e Vasco da Gama.",
    image: chapadaImg,
  },
  {
    name: "Vale das Pedrinhas",
    population: "5.162",
    description: "Territorio de encosta, comercio de proximidade e redes comunitarias.",
    image: valePedrinhasImg,
  },
];

const COMMUNITY_PROOF_POINTS = [
  {
    icon: ShieldCheck,
    title: "Acesso para moradores",
    description: "A comunidade sera ativada com foco no Complexo do Nordeste de Amaralina.",
  },
  {
    icon: Heart,
    title: "Cultura local no centro",
    description: "Capoeira, samba, afoxes, blocos e comunicacao comunitaria sao parte da identidade.",
  },
  {
    icon: HandHeart,
    title: "Utilidade pratica",
    description: "Alertas, recomendacoes, problemas urbanos e achados ficam no mesmo hub.",
  },
];

const EDUCATION_GUIDE = [
  "Escolas e creches do territorio",
  "Cursos livres e profissionalizantes",
  "Reforco escolar e apoio ao estudante",
];

const SERVICE_GUIDE = [
  "Eletricista, diarista e manutencao",
  "Beleza, saude e bem-estar",
  "Tecnicos e prestadores proximos",
];

function parseTerritoryPath(path?: string | null): { state: string; city: string; districtOrGroup: string } | null {
  const parts = (path ?? "").split("/").filter(Boolean);
  if (parts.length >= 4) {
    return {
      state: parts[1],
      city: parts[2],
      districtOrGroup: parts[3],
    };
  }
  if (parts.length >= 3) {
    return {
      state: parts[0],
      city: parts[1],
      districtOrGroup: parts[2],
    };
  }
  return null;
}

function buildEducationTerritoryUrl(params: { districtPath?: string | null }): string | null {
  const parsed = parseTerritoryPath(params.districtPath);
  if (!parsed) return null;
  return `/educacao/${parsed.state}/${parsed.city}/${parsed.districtOrGroup}`;
}

function buildTerritorialModuleUrl(params: {
  module: "empresas" | "servicos" | "gastronomia" | "eventos" | "vagas" | "classificados" | "educacao";
  districtPath?: string | null;
}): string | null {
  const parsed = parseTerritoryPath(params.districtPath);
  if (!parsed) return null;
  return `/${params.module}/${parsed.state}/${parsed.city}/${parsed.districtOrGroup}`;
}

function buildTerritorialBusinessDetailUrl(params: {
  slug?: string | null;
  districtPath?: string | null;
}): string | null {
  if (!params.slug) return null;
  const parsed = parseTerritoryPath(params.districtPath);
  if (!parsed) return null;
  return `/empresas/${parsed.state}/${parsed.city}/${parsed.districtOrGroup}/${params.slug}`;
}

function resolveCommunityDistrictPath(params: {
  resolved?: ResolvedTerritory;
  homeDistrictPath?: string | null;
}): string | null {
  const launchCommunityGroup = LAUNCH_TERRITORIES.find(
    (territory) => territory.kind === "group" && territory.slug === "complexo-do-nordeste-de-amaralina"
  );
  const launchCommunityPath = launchCommunityGroup?.path ?? null;

  if (params.resolved?.kind === "group") {
    const firstMemberPath = params.resolved.group.members[0]?.geographic_path ?? "";
    const parts = firstMemberPath.split("/").filter(Boolean);
    if (parts.length >= 3) {
      const state = parts[1];
      const city = parts[2];
      return `/${state}/${city}/${params.resolved.group.slug}`;
    }
    return launchCommunityPath;
  }

  if (params.resolved?.kind === "location") {
    const location = params.resolved.location as unknown as Record<string, unknown>;
    const locationType = typeof location.type === "string" ? location.type : null;
    const locationPath =
      (typeof location.geographic_path === "string" && location.geographic_path) ||
      (typeof location.path === "string" && location.path) ||
      null;

    if (locationType === "district" && locationPath) {
      return locationPath.replace(/^\/br/, "");
    }

    if (locationType === "city") {
      return launchCommunityPath;
    }
  }

  return params.homeDistrictPath ?? launchCommunityPath ?? null;
}

interface ComunidadePageProps {
  resolved?: ResolvedTerritory;
}

export default function ComunidadePage({ resolved }: ComunidadePageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as CommunityTab) || "feed";
  const [showBanner, setShowBanner] = React.useState(true);
  const [chooseDistrictOpen, setChooseDistrictOpen] = React.useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = React.useState<string | null>(null);
  const [selectedDistrictLabel, setSelectedDistrictLabel] = React.useState("");
  const [savingDistrict, setSavingDistrict] = React.useState(false);
  const appUrls = useAppUrls(resolved); // ✅ SSOT URLs com contexto territorial
  const territoryFilter = useTerritoryFilter(resolved);

  // ✅ SSOT: guarda de acesso por UUID canônico, não por string de perfil
  const { hasHome, homeDistrict, homeCity, loading: territoryLoading } = useUserTerritory();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isLoading: rolloutLoading } = useCommunityRollout(resolved);
  const {
    data: isHomeDistrictApproved = false,
    isLoading: homeDistrictRolloutLoading,
  } = useQuery({
    queryKey: ["community-rollout", "district", homeDistrict?.id],
    queryFn: async () => {
      if (!homeDistrict?.id) return false;
      return communityRolloutService.isCommunityActiveForLocation(homeDistrict.id);
    },
    enabled: !!homeDistrict?.id,
    staleTime: 5 * 60 * 1000,
  });
  const setTab = (tab: CommunityTab) => {
    setSearchParams(tab === "feed" ? {} : { tab });
  };

  const {
    profile,
    postId,
    postData,
    isLoadingPost,
    modalState,
    alertModalOpen,
    issueModalOpen,
    immediateFilters,
    likePost,
    savePost,
    sharePost,
    setLocationScope,
    handleOpenCreatePost,
    handleOpenAlertModal,
    handleCloseAlertModal,
    handleOpenIssueModal,
    handleCloseIssueModal,
    handlePostClick,
    handleClosePostDetail,
    handleCommentClick,
    handleTagClick,
    handleReportPost,
    handleDeletePost,
    handleEditPost,
    handleReportClick,
    handleCloseModal,
    communityLocation,
  } = useComunidadePage();
  const {
    data: hasPrimaryStreet = false,
    isLoading: streetCheckLoading,
  } = useQuery({
    queryKey: ["community-access", "primary-street", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return false;
      const residence = await residenceService.getPrimaryResidenceWithRelations(profile.user_id);
      const street = residence?.address?.street ?? "";
      return street.trim().length > 0;
    },
    enabled: !!profile?.user_id,
    staleTime: 5 * 60 * 1000,
  });
  const issueLocationId =
    communityLocation.activeLocation?.type === "district"
      ? communityLocation.activeLocation.id
      : homeDistrict?.id;
  const modalCity =
    communityLocation.activeLocation?.type === "city"
      ? communityLocation.activeLocation.name
      : homeCity?.name ?? profile?.city ?? "";
  const modalNeighborhood =
    communityLocation.activeLocation?.type === "district"
      ? communityLocation.activeLocation.name
      : homeDistrict?.name ?? profile?.neighborhood;
  const communityTerritoryFilter: TerritoryFilter = homeDistrict
    ? { scope: "location", location_id: homeDistrict.id }
    : territoryFilter;
  const hasCommunityDistrict = !!homeDistrict?.id;
  const communityDistrictPath = resolveCommunityDistrictPath({
    resolved,
    homeDistrictPath: homeDistrict?.path,
  });
  const launchCommunityGroupPath =
    LAUNCH_TERRITORIES.find((territory) => territory.kind === "group" && territory.slug === "complexo-do-nordeste-de-amaralina")
      ?.path ?? null;
  const fallbackCommunityPath = communityDistrictPath ?? launchCommunityGroupPath;
  const educationTerritoryUrl = buildEducationTerritoryUrl({ districtPath: communityDistrictPath });
  const empresasTerritoryUrl =
    buildTerritorialModuleUrl({ module: "empresas", districtPath: fallbackCommunityPath }) ?? "/empresas";
  const servicosTerritoryUrl =
    buildTerritorialModuleUrl({ module: "servicos", districtPath: fallbackCommunityPath }) ?? "/servicos";
  const gastronomiaTerritoryUrl =
    buildTerritorialModuleUrl({ module: "gastronomia", districtPath: fallbackCommunityPath }) ?? "/gastronomia";
  const eventosTerritoryUrl =
    buildTerritorialModuleUrl({ module: "eventos", districtPath: fallbackCommunityPath }) ?? "/eventos";
  const vagasTerritoryUrl =
    buildTerritorialModuleUrl({ module: "vagas", districtPath: fallbackCommunityPath }) ?? "/vagas";

  const { businesses: neighborhoodBusinesses } = useBusinessList({
    pageSize: 6,
    sortBy: "rating",
    enabled: hasCommunityDistrict,
    territoryFilter: communityTerritoryFilter,
  });
  const { businesses: educationBusinesses } = useBusinessList({
    category: "educacao",
    pageSize: 4,
    sortBy: "rating",
    enabled: hasCommunityDistrict,
    territoryFilter: communityTerritoryFilter,
  });
  const { businesses: serviceBusinesses } = useBusinessList({
    category: "servicos",
    pageSize: 4,
    sortBy: "rating",
    enabled: hasCommunityDistrict,
    territoryFilter: communityTerritoryFilter,
  });
  const gastronomyQuery = useGastronomyList(
    { territoryFilter: communityTerritoryFilter },
    { enabled: hasCommunityDistrict },
  );
  const { eventos: neighborhoodEvents } = useEventos({
    enabled: hasCommunityDistrict,
    territoryFilter: communityTerritoryFilter,
  });
  const { classificados: neighborhoodClassifieds } = useClassificados({
    enabled: hasCommunityDistrict,
    territoryFilter: communityTerritoryFilter,
  });
  const { data: neighborhoodJobs = [] } = useVagasUrgentes(homeDistrict?.id ?? "", 3);
  const neighborhoodFood =
    gastronomyQuery.data?.pages.flatMap((page) => page.businesses) ?? [];
  const topBusinesses = neighborhoodBusinesses.slice(0, 5);
  const topEducation = educationBusinesses.slice(0, 4);
  const topServices = serviceBusinesses.slice(0, 4);
  const topFood = neighborhoodFood.slice(0, 4);
  const latestEvents = neighborhoodEvents.slice(0, 3);
  const latestClassifieds = neighborhoodClassifieds.slice(0, 3);

  const communityShortcuts: {
    title: string;
    description: string;
    icon: React.ElementType;
    action: () => void;
  }[] = [
    {
      title: "Recomendacoes",
      description: "Peca indicacoes e respostas de vizinhos.",
      icon: MessageSquare,
      action: () => navigate(appUrls.community.recommendations),
    },
    {
      title: "Achados e perdidos",
      description: "Publique ou procure itens do bairro.",
      icon: PackageSearch,
      action: () => navigate(appUrls.community.lostAndFound),
    },
    {
      title: "Alertas",
      description: "Avise sobre situacoes urgentes na regiao.",
      icon: AlertTriangle,
      action: () => navigate(appUrls.community.alerts),
    },
    {
      title: "Problemas urbanos",
      description: "Registre buracos, iluminacao e zeladoria.",
      icon: MapPin,
      action: () => navigate(appUrls.community.issues),
    },
    {
      title: "Grupos",
      description: "Converse por interesses e ruas proximas.",
      icon: Users,
      action: () => setTab("grupos"),
    },
    {
      title: "Eventos",
      description: "Veja o que esta acontecendo perto de voce.",
      icon: CalendarDays,
      action: () => navigate(appUrls.community.events),
    },
  ];

  const overviewActions = [
    {
      title: "Alertas do bairro",
      description: "Avisos urgentes, seguranca, clima, mobilidade e situacoes que afetam os moradores.",
      icon: Bell,
      primary: "Criar alerta",
      secondary: "Ver alertas",
      onPrimary: handleOpenAlertModal,
      onSecondary: () => navigate(appUrls.community.alerts),
    },
    {
      title: "Problemas urbanos",
      description: "Buracos, iluminacao, lixo, agua, drenagem e zeladoria acompanhados em um so lugar.",
      icon: AlertTriangle,
      primary: "Reportar problema",
      secondary: "Ver chamados",
      onPrimary: handleOpenIssueModal,
      onSecondary: () => navigate(appUrls.community.issues),
    },
    {
      title: "Publicacoes da comunidade",
      description: "Pedidos, avisos, recomendacoes, achados e conversas do Complexo.",
      icon: MessageSquare,
      primary: "Publicar agora",
      secondary: "Ver recomendacoes",
      onPrimary: handleOpenCreatePost,
      onSecondary: () => navigate(appUrls.community.recommendations),
    },
  ];

  const projectSummary = [
    {
      title: "Empresas",
      value: topBusinesses.length || neighborhoodBusinesses.length,
      description: "Negocios do territorio com melhor sinal de reputacao.",
      href: empresasTerritoryUrl,
      icon: Building2,
    },
    {
      title: "Educacao",
      value: topEducation.length || EDUCATION_GUIDE.length,
      description: "Escolas, cursos e apoio ao estudante em um unico atalho.",
      href: educationTerritoryUrl ?? "/comunidade",
      icon: GraduationCap,
    },
    {
      title: "Servicos",
      value: topServices.length || SERVICE_GUIDE.length,
      description: "Profissionais e prestadores para resolver demandas do dia a dia.",
      href: servicosTerritoryUrl,
      icon: Wrench,
    },
    {
      title: "Oportunidades",
      value: neighborhoodJobs.length + latestClassifieds.length,
      description: "Vagas, classificados, eventos e renda local.",
      href: vagasTerritoryUrl,
      icon: Briefcase,
    },
  ];

  const handleDistrictSelectionChange = useCallback(
    (
      locationId: string | null,
      locationData: { cityName: string; neighborhoodName: string } | null,
    ) => {
      setSelectedDistrictId(locationId);
      setSelectedDistrictLabel(
        locationData
          ? `${locationData.neighborhoodName}, ${locationData.cityName}`
          : "",
      );
    },
    [],
  );

  const handleSaveCommunityDistrict = useCallback(async () => {
    if (!profile?.user_id || !selectedDistrictId) return;

    setSavingDistrict(true);
    try {
      const residence = await residenceService.getPrimaryResidence(profile.user_id);

      if (!residence?.id) {
        toast.error(
          "Nao foi encontrada uma residencia canonica para atualizar. Cadastre um endereco antes de escolher o bairro da comunidade.",
        );
        return;
      }

      await residenceService.updateResidence(residence.id, {
        location_id: selectedDistrictId,
        is_primary: true,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["user-residence", "primary", profile.user_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["user-territory-resolved"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["user-residences", profile.user_id],
        }),
      ]);

      toast.success("Bairro da comunidade atualizado");
      setChooseDistrictOpen(false);
      setSelectedDistrictId(null);
    } catch {
      toast.error("Nao foi possivel salvar o bairro da comunidade");
    } finally {
      setSavingDistrict(false);
    }
  }, [profile?.user_id, queryClient, selectedDistrictId]);

  // Bloquear se não estiver logado
  if (!profile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Faça login para acessar a comunidade
            </h2>
            <p className="text-gray-400 mb-6">
              A comunidade é exclusiva para moradores cadastrados do bairro.
            </p>
            <Button onClick={() => window.location.href = appUrls.auth.login} className="bg-teal-500 hover:bg-teal-400">
              Fazer Login
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aguardar resolução do território antes de bloquear
  if (territoryLoading || adminLoading || rolloutLoading || homeDistrictRolloutLoading || streetCheckLoading) {
    return (
      <div className="min-h-screen bg-[#12181B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ✅ SSOT: bloquear por ausência de user_residence (location_id), não por string de perfil
  // Admin e moderadores têm acesso mesmo sem bairro cadastrado
  if (!hasHome && !isAdmin) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Escolha seu bairro
            </h2>
            <p className="text-gray-400 mb-6">
              A comunidade e hiperlocal. Selecione seu bairro principal para ver feed,
              alertas, grupos e problemas da sua regiao.
            </p>
            <Button onClick={() => setChooseDistrictOpen(true)} className="bg-teal-500 hover:bg-teal-400">
              Escolher meu bairro
            </Button>
          </div>
          <Dialog open={chooseDistrictOpen} onOpenChange={setChooseDistrictOpen}>
            <DialogContent className="border-white/10 bg-[#172126] text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Escolher meu bairro</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Este bairro sera usado como base da sua comunidade.
                </DialogDescription>
              </DialogHeader>
              <TerritorialSelector
                initialLocationId={homeDistrict?.id}
                allowCityOnly={false}
                labels={{
                  state: "Estado",
                  city: "Cidade",
                  neighborhood: "Bairro",
                }}
                onLocationChange={handleDistrictSelectionChange}
              />
              {selectedDistrictLabel && (
                <p className="text-sm text-gray-300">
                  Minha comunidade: {selectedDistrictLabel}
                </p>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setChooseDistrictOpen(false)}
                  disabled={savingDistrict}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveCommunityDistrict}
                  disabled={!selectedDistrictId || savingDistrict}
                  className="bg-teal-500 hover:bg-teal-400"
                >
                  {savingDistrict && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar bairro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    );
  }

  const hasApprovedCommunityAccess = isAdmin || (hasHome && isHomeDistrictApproved);

  if (!hasApprovedCommunityAccess) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">Comunidade ainda nao liberada</h2>
            <p className="text-gray-400 mb-6">
              Seu bairro ainda nao foi aprovado no rollout da comunidade. Quando for liberado, os atalhos
              e conteudos locais serao ativados automaticamente.
            </p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (!isAdmin && !hasPrimaryStreet) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <MapPin className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">Informe sua rua para entrar</h2>
            <p className="text-gray-400 mb-6">
              Para acessar a comunidade do bairro, complete o endereco com rua no seu perfil.
            </p>
            <Button onClick={() => navigate("/perfil/configuracoes")} className="bg-teal-500 hover:bg-teal-400">
              Atualizar endereco
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aviso se não for verificado (mas permite acesso)
  const showVerificationBanner = !profile?.verified;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#12181B]" role="main">
        <section className="relative overflow-hidden border-b border-white/10 bg-[#0d1417]">
          <div className="absolute inset-0">
            <img
              src={heroComplexoImg}
              alt="Complexo do Nordeste de Amaralina"
              className="h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1417] via-[#0d1417]/90 to-[#0d1417]/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12181B] via-transparent to-transparent" />
          </div>

          <div className="relative mx-auto grid min-h-[280px] max-w-[1600px] gap-5 px-4 py-5 md:min-h-[320px] md:grid-cols-[minmax(0,1fr)_340px] md:px-6 lg:min-h-[380px] lg:px-8">
            <div className="flex max-w-4xl flex-col justify-center py-3">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-200">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Comunidade piloto ativa
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
                  Salvador, BA
                </span>
              </div>

              <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white md:text-5xl">
                Complexo do Nordeste de Amaralina
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                Um hub para quem mora, trabalha e constrói o Nordeste de Amaralina, Santa Cruz, Vale das Pedrinhas e Chapada do Rio Vermelho. Aqui o morador encontra avisos, recomendações, serviços, comércio local e problemas urbanos em um fluxo só.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleOpenCreatePost}
                  className="h-10 bg-teal-500 px-5 font-semibold text-white hover:bg-teal-400"
                >
                  Publicar na comunidade
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(empresasTerritoryUrl)}
                  className="h-10 border-white/20 bg-white/10 px-5 text-white hover:bg-white/15"
                >
                  Ver empresas locais
                </Button>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {COMPLEXO_STATS.map(({ label, value, detail, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-300/15 text-teal-200">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <p className="text-xl font-semibold text-white">{value}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/65">{label}</p>
                    <p className="mt-1 line-clamp-1 text-xs leading-snug text-white/45">{detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="flex items-center">
              <div className="w-full rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">Dados publicos do territorio</p>
                <div className="mt-3 space-y-2">
                  {COMPLEXO_BAIRROS.map((bairro) => (
                    <div key={bairro.name} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-2">
                      <img
                        src={bairro.image}
                        alt={bairro.name}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{bairro.name}</p>
                        <p className="text-xs font-medium text-teal-200">{bairro.population} moradores</p>
                        <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-white/50">{bairro.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 text-[11px] leading-relaxed text-white/40">
                  Referencias: ObservaSSA/IBGE 2010, Governo da Bahia, Setur-BA e NordestEuSou.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
          <nav className="mb-6 flex gap-1 border-b border-white/10 pb-0" aria-label="Subcategorias da comunidade">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === id
                    ? "border-teal-400 text-teal-300"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20"
                )}
                aria-current={activeTab === id ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          {activeTab !== "feed" && (
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {activeTab === "grupos" && <GruposPage />}
            </Suspense>
          )}

          {activeTab === "feed" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <main className="min-w-0" role="feed" aria-label="Feed da comunidade">
              {showVerificationBanner && showBanner && (
                <VerificationBanner
                  onDismiss={() => setShowBanner(false)}
                  onRequestVerification={() => navigate("/perfil/verificacao-morador")}
                />
              )}

              <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:p-5" aria-label="Resumo da comunidade">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Painel do Complexo</p>
                    <h2 className="text-2xl font-semibold text-white">Tudo que importa no bairro, em resumo</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">
                      A comunidade vira a porta de entrada para servicos, comercio, educacao, alertas, oportunidades e conversas locais.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/busca')}
                    className="justify-start text-teal-300 hover:bg-teal-400/10 hover:text-teal-200"
                  >
                    Buscar no Achegue-se
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {projectSummary.map(({ title, value, description, href, icon: Icon }) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => navigate(href)}
                      className="group rounded-xl border border-white/10 bg-black/20 p-4 text-left transition-colors hover:border-teal-400/50 hover:bg-teal-400/10 focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-2xl font-semibold text-white">{value || "-"}</span>
                      </div>
                      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-gray-400">{description}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" aria-label="Alertas e acoes principais">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 md:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                      <Bell className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Alertas e ocorrencias</p>
                      <h2 className="text-xl font-semibold text-white">O que o morador precisa saber agora</h2>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                    {overviewActions.map(({ title, description, icon: Icon, primary, secondary, onPrimary, onSecondary }) => (
                      <article key={title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-200">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-white">{title}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-gray-400">{description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button size="sm" className="h-8 bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={onPrimary}>
                                {primary}
                              </Button>
                              <Button size="sm" variant="outline" className="h-8" onClick={onSecondary}>
                                {secondary}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Atalhos</p>
                      <h2 className="text-xl font-semibold text-white">Central do morador</h2>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setTab("grupos")} className="text-teal-300 hover:bg-teal-400/10 hover:text-teal-200">
                      Grupos
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {communityShortcuts.map(({ title, description, icon: Icon, action }) => (
                      <button
                        key={title}
                        type="button"
                        onClick={action}
                        className="group flex min-h-20 items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-3 text-left transition-colors hover:border-teal-400/50 hover:bg-teal-400/10 focus:outline-none focus:ring-2 focus:ring-teal-400/60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300 group-hover:bg-teal-400/20">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-white">{title}</span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-gray-400">{description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="mb-5 grid gap-4 xl:grid-cols-2" aria-label="Destaques do bairro">
                <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Empresas</p>
                      <h2 className="text-xl font-semibold text-white">Melhores empresas do bairro</h2>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(empresasTerritoryUrl)}>
                      Ver empresas
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {topBusinesses.length > 0 ? topBusinesses.map((business, index) => (
                      <button
                        key={business.id}
                        type="button"
                        onClick={() => {
                          const detailUrl = buildTerritorialBusinessDetailUrl({
                            slug: business.slug,
                            districtPath: communityDistrictPath,
                          });
                          navigate(detailUrl ?? empresasTerritoryUrl);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-3 text-left transition-colors hover:border-teal-400/40 hover:bg-teal-400/10"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-sm font-semibold text-teal-200">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{business.name}</span>
                          <span className="block truncate text-xs text-gray-400">{business.category}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-200">
                          <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                          {Number(business.rating || 0).toFixed(1)}
                        </span>
                      </button>
                    )) : (
                      <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-gray-500">
                        Ainda nao ha empresas suficientes para montar um ranking local.
                      </p>
                    )}
                  </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Educacao</p>
                      <h2 className="text-xl font-semibold text-white">Escolas, cursos e formacao</h2>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!educationTerritoryUrl}
                      onClick={() => {
                        if (!educationTerritoryUrl) {
                          toast.error("Educacao disponivel somente no contexto do bairro aprovado.");
                          return;
                        }
                        navigate(educationTerritoryUrl);
                      }}
                    >
                      Ver educacao
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(topEducation.length > 0 ? topEducation.map((item) => item.name) : EDUCATION_GUIDE).map((label) => (
                      <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-200">
                          <GraduationCap className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{label}</span>
                          <span className="block text-xs text-gray-400">
                            {topEducation.length > 0 ? "Cadastro de educacao do bairro" : "Atalho de descoberta"}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="mb-5 grid gap-4 xl:grid-cols-3" aria-label="Servicos, gastronomia e oportunidades">
                {[
                  {
                    title: "Servicos mais uteis",
                    eyebrow: "Servicos",
                    icon: Wrench,
                    href: servicosTerritoryUrl,
                    items: topServices.length > 0 ? topServices.map((item) => item.name) : SERVICE_GUIDE,
                  },
                  {
                    title: "Onde comer no bairro",
                    eyebrow: "Gastronomia",
                    icon: UtensilsCrossed,
                    href: gastronomiaTerritoryUrl,
                    items: topFood.length > 0 ? topFood.map((item) => item.name) : ["Restaurantes", "Lanches", "Delivery local"],
                  },
                  {
                    title: "Eventos e oportunidades",
                    eyebrow: "Agenda",
                    icon: CalendarDays,
                    href: eventosTerritoryUrl,
                    items: [
                      ...latestEvents.map((item) => item.title),
                      ...neighborhoodJobs.slice(0, 2).map((item) => item.title),
                      ...latestClassifieds.slice(0, 2).map((item) => item.titulo),
                    ].slice(0, 4),
                  },
                ].map(({ title, eyebrow, icon: Icon, href, items }) => (
                  <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">{eyebrow}</p>
                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="min-h-32 space-y-2">
                      {items.length > 0 ? items.map((label) => (
                        <p key={label} className="truncate rounded-lg bg-black/15 px-3 py-2 text-sm text-gray-300">
                          {label}
                        </p>
                      )) : (
                        <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm leading-relaxed text-gray-500">
                          Sem destaques recentes neste bairro.
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => navigate(href)}>
                      Abrir secao
                    </Button>
                  </article>
                ))}
              </section>

              <section className="mb-5 grid gap-3 md:grid-cols-3" aria-label="Como a comunidade funciona">
                {COMMUNITY_PROOF_POINTS.map(({ title, description, icon: Icon }) => (
                  <article key={title} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-400/10 text-teal-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-gray-400">{description}</p>
                  </article>
                ))}
              </section>
              <LocationScopeCards
                city={homeCity?.name ?? profile.city}
                neighborhood={homeDistrict?.name ?? profile.neighborhood}
                currentScope={immediateFilters.locationScope}
                onScopeChange={setLocationScope}
              />
              <CommunityFeed
                currentUserId={profile?.id}
                onPostClick={handlePostClick}
                onCommentClick={handleCommentClick}
                onTagClick={handleTagClick}
                onOpenCreatePost={handleOpenCreatePost}
                onOpenAlertModal={handleOpenAlertModal}
                onOpenIssueModal={handleOpenIssueModal}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                onReportClick={handleReportClick}
                locationScope={immediateFilters.locationScope}
                territoryFilter={communityTerritoryFilter}
              />

              {/* Problemas urbanos do bairro do usuário */}
              <div className="mt-6">
                <IssueFeedSection
                  territoryFilter={communityTerritoryFilter}
                  city={homeCity?.name ?? profile.city}
                  neighborhood={homeDistrict?.name ?? profile.neighborhood}
                  locationId={homeDistrict?.id}
                  profileId={profile.id}
                />
              </div>
            </main>

            <aside className="hidden lg:block w-80 flex-shrink-0" aria-label="Widgets da comunidade">
              <div className="sticky top-6">
                <CommunityRightSidebar />
              </div>
            </aside>
          </div>
          )}
        </div>

        <CommunityFloatingButtons />

        {/* Modal de Criar Post */}
        <CreatePostModal
          open={modalState.type === "create"}
          onClose={handleCloseModal}
          defaultType={modalState.data?.defaultType}
        />

        {/* Modal de Criar Alerta */}
        <CreateAlertModal
          open={alertModalOpen}
          onClose={handleCloseAlertModal}
          city={modalCity}
          neighborhood={modalNeighborhood}
          locationId={issueLocationId}
        />

        {/* Modal de Criar Problema */}
        <CreateIssueModal
          open={issueModalOpen}
          onClose={handleCloseIssueModal}
          city={modalCity}
          neighborhood={modalNeighborhood}
          locationId={issueLocationId}
        />

        {/* Modais de Detalhes e Comentários */}
        <CommunityModals
          modalState={modalState}
          postId={postId}
          postData={postData}
          isLoadingPost={isLoadingPost}
          profileId={profile?.id}
          onCloseModal={handleCloseModal}
          onClosePostDetail={handleClosePostDetail}
          onLike={likePost}
          onSave={savePost}
          onShare={sharePost}
          onReport={handleReportPost}
          onTagClick={handleTagClick}
        />
      </div>
    </TooltipProvider>
  );
}


