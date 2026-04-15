/**
 * useProfileHub - Hook consolidado para o hub de perfil
 * 
 * Organiza e prepara todos os dados necessários para os componentes do hub
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User,
  Building2,
  Briefcase,
  Car,
  Settings2,
  Shield,
  Globe,
  Bell,
  KeyRound,
  ExternalLink,
  MessageSquare,
  MapPin,
  Users,
  Route,
  Wrench,
  UtensilsCrossed,
  Bookmark,
  CalendarDays,
  Crown,
} from 'lucide-react';

import { useAuth } from '@/core/auth/hooks/useAuth';
import { useMultiProfileContext } from '@/core/profiles/contexts/multi-profile-runtime-context';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { useDriverProfileIdentity } from '@/modules/mobility/hooks/useDriverProfileIdentity';
import { usePerfilPageV3 } from './usePerfilPageV3';
import { buildProfileEditUrl, buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';
import { isProfileVerified } from '../utils/profileDomainRules';

import type { Business } from '@/core/profiles/services/types';

export function useProfileHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile, allProfiles, switchProfile } = useMultiProfileContext();
  const appUrls = useAppUrls();
  const moduleUrls = useFriendlyModuleUrls();

  const {
    profile,
    context,
    identity,
    account,
    stats,
    operations,
    notifications,
    roles,
    businessModules,
    loading,
    error,
    activeRide,
    hasActiveRide,
    verificationStatus,
    verificationRejectionReason,
    favorites,
    downloadDataOpen,
    setDownloadDataOpen,
    viewDataOpen,
    setViewDataOpen,
    deactivateOpen,
    setDeactivateOpen,
    deleteOpen,
    setDeleteOpen,
    deleteConfirm,
    setDeleteConfirm,
    handleDownloadData,
    handleDeactivateAccount,
    handleDeleteAccount,
    handleAvatarChange,
    refreshWorkspace,
  } = usePerfilPageV3();

  // Dados básicos
  const activeProfileId = activeProfile?.id ?? profile?.id ?? null;
  const isVerified = isProfileVerified(activeProfile, profile);
  const handle = activeProfile?.handle ?? identity?.username ?? '';
  const canOpenPublicProfile = Boolean(handle);
  const territoryLabel = identity?.territoryLabel;

  // Permissões
  const canManageProfileMembers =
    activeProfile?.profile_type === 'business' || activeProfile?.profile_type === 'professional';
  const hasDriverProfile = allProfiles.some((item) => item.profile_type === 'driver');
  const hasBusinesses = businessModules.length > 0;
  const driverIdentity = useDriverProfileIdentity({
    queryScope: 'profile-hub',
  });
  const fallbackDriverProfile = allProfiles.find((item) => item.profile_type === 'driver') ?? null;
  const resolvedDriverProfile =
    allProfiles.find((item) => item.id === driverIdentity.driverProfileId) ?? fallbackDriverProfile;
  const resolvedDriverProfileId = driverIdentity.driverProfileId ?? fallbackDriverProfile?.id ?? null;

  // Estatísticas para ProfileStats
  const statsData = useMemo(
    () => [
      {
        icon: User,
        label: 'Posts',
        value: operations.posts,
        hint: 'Conteudo autoral e presenca na comunidade.',
      },
      {
        icon: Building2,
        label: 'Negocios',
        value: operations.businesses,
        hint: 'Empresas administradas ou operadas pelo usuario.',
      },
      {
        icon: Bell,
        label: 'Inbox',
        value: notifications.unread,
        hint: 'Notificacoes nao lidas aguardando acao.',
      },
      {
        icon: Car,
        label: 'Mobilidade',
        value: operations.activeRides > 0 ? `${operations.activeRides} ativa(s)` : operations.ridesTotal,
        hint: 'Operacao de corridas, historico e estado atual.',
      },
    ],
    [operations, notifications],
  );

  // Links pessoais
  const personalLinks = useMemo(
    () => [
      {
        icon: User,
        title: 'Editar perfil',
        description: 'Atualize identidade, avatar, campos publicos e apresentacao.',
        onClick: () => {
          if (!activeProfileId) return;
          navigate(buildProfileEditUrl(activeProfileId));
        },
      },
      {
        icon: Users,
        title: 'Identidades e perfis',
        description: 'Troque, ative e gerencie perfis pessoal, empresa, profissional e motorista.',
        badge: `${allProfiles.length}`,
        onClick: () => navigate(appUrls.profile.manage),
      },
      {
        icon: KeyRound,
        title: 'Minha conta',
        description: 'Senha, email de acesso e acoes sensiveis da conta.',
        onClick: () => navigate(appUrls.profile.account),
      },
      {
        icon: Shield,
        title: 'Privacidade do perfil',
        description: 'Controle visibilidade, exposicao publica e regras de privacidade.',
        onClick: () => navigate(appUrls.profile.settings('privacy')),
      },
      {
        icon: Globe,
        title: 'Links e vinculos',
        description: 'Gerencie conexoes, vinculos e relacoes da identidade ativa.',
        onClick: () => navigate(appUrls.profile.settings('links')),
      },
      ...(canManageProfileMembers
        ? [
            {
              icon: Shield,
              title: 'Membros do perfil',
              description: 'Convide, revise acessos e governe membros do perfil operacional.',
              onClick: () => navigate(appUrls.profile.settings('members')),
            },
          ]
        : []),
      {
        icon: Settings2,
        title: 'Configuracoes operacionais',
        description: 'Residencia, areas de atuacao e preferencias operacionais do contexto atual.',
        onClick: () => navigate(appUrls.settings),
      },
      {
        icon: Bell,
        title: 'Inbox de notificacoes',
        description: 'Veja alertas recentes, nao lidas e acessos do sistema.',
        badge: notifications.unread > 0 ? `${notifications.unread}` : undefined,
        onClick: () => navigate(appUrls.notifications),
      },
      {
        icon: Globe,
        title: 'Perfil publico',
        description: 'Abra a versao publica da identidade ativa.',
        badge: canOpenPublicProfile ? 'Ativo' : 'Indisponivel',
        onClick: () => {
          if (!canOpenPublicProfile) {
            toast.error('Perfil publico indisponivel para a identidade atual');
            return;
          }
          navigate(buildPublicProfileUrl(handle));
        },
      },
    ],
    [
      activeProfileId,
      allProfiles.length,
      canManageProfileMembers,
      canOpenPublicProfile,
      handle,
      navigate,
      notifications.unread,
      appUrls,
    ],
  );

  // Links operacionais
  const operationalLinks = useMemo(
    () => [
      {
        icon: MessageSquare,
        title: 'Mensagens',
        description: 'Central de conversas e relacionamento.',
        onClick: () => navigate(appUrls.messages),
      },
      {
        icon: MapPin,
        title: 'Mapa e territorio',
        description: 'Mapa principal, exploracao territorial e contexto local.',
        onClick: () => navigate(appUrls.map),
      },
      {
        icon: Users,
        title: 'Familia',
        description: 'Vinculos familiares, rastreamento e zonas seguras.',
        onClick: () => navigate(appUrls.family.home),
      },
      {
        icon: Settings2,
        title: 'Residencia e areas',
        description: 'Residencia, areas de atuacao e preferencias operacionais.',
        onClick: () => navigate(appUrls.settings),
      },
      {
        icon: Car,
        title: hasDriverProfile ? 'Ferramentas de motorista' : 'Mobilidade passageiro',
        description: hasDriverProfile
          ? 'Acesse perfil de motorista, historico e operacao de corridas.'
          : 'Acesse a central de mobilidade e o historico de corridas.',
        onClick: () =>
          navigate(hasDriverProfile ? appUrls.mobility.driverProfile : appUrls.mobility.passenger),
      },
      {
        icon: Route,
        title: 'Historico de mobilidade',
        description: 'Resumo de corridas, solicitacoes e operacao em andamento.',
        badge: operations.ridesTotal > 0 ? `${operations.ridesTotal}` : undefined,
        onClick: () => navigate(appUrls.mobility.history),
      },
    ],
    [hasDriverProfile, operations.ridesTotal, navigate, appUrls],
  );

  // Links do ecossistema
  const ecosystemLinks = useMemo(
    () => [
      {
        icon: Building2,
        title: 'Empresas do territorio',
        description: 'Explore empresas, presenca local e operacao publica ja ativa.',
        onClick: () => navigate(moduleUrls.business),
      },
      {
        icon: Wrench,
        title: 'Servicos',
        description: 'Descubra profissionais e servicos publicados no territorio atual.',
        onClick: () => navigate(moduleUrls.services),
      },
      {
        icon: UtensilsCrossed,
        title: 'Gastronomia',
        description: 'Acesse a vitrine gastronomica e os negocios com vertical ativa.',
        onClick: () => navigate(moduleUrls.gastronomy),
      },
      {
        icon: Bookmark,
        title: 'Favoritos gastro',
        description: 'Entrada rapida para seus favoritos de gastronomia.',
        onClick: () => navigate(moduleUrls.gastronomyFavorites),
      },
      {
        icon: MessageSquare,
        title: 'Comunidade',
        description: 'Postagens, recomendacoes, conversas e conteudo territorial.',
        onClick: () => navigate(moduleUrls.community),
      },
      {
        icon: Briefcase,
        title: 'Vagas',
        description: 'Veja oportunidades e movimentacao economica local.',
        onClick: () => navigate(moduleUrls.jobs),
      },
      {
        icon: CalendarDays,
        title: 'Eventos',
        description: 'Acompanhe eventos ativos e programacao territorial existente.',
        onClick: () => navigate(moduleUrls.events),
      },
      {
        icon: Globe,
        title: 'Pontos turisticos',
        description: 'Vertical publica de pontos turisticos e conteudo territorial.',
        onClick: () => navigate(moduleUrls.touristPoints),
      },
      {
        icon: Crown,
        title: 'Ranking local',
        description: 'Acesse ranking, relevancia e sinais de destaque do territorio.',
        onClick: () => navigate(moduleUrls.ranking),
      },
    ],
    [navigate, moduleUrls],
  );

  // Próximas ações
  const showBusinessOnboarding =
    !hasBusinesses &&
    Boolean(identity?.permissions.some((item: any) => item.key === 'canCreateBusiness' && item.allowed));

  const nextActions = useMemo(
    () =>
      [
        !territoryLabel
          ? {
              title: 'Definir residencia ou territorio',
              description: 'Ainda faltam sinais territoriais para personalizacao e descoberta local.',
              actionLabel: 'Abrir configuracoes',
              onClick: () => navigate(appUrls.settings),
            }
          : null,
        !canOpenPublicProfile
          ? {
              title: 'Completar identidade publica',
              description: 'O perfil ativo ainda nao tem handle publico pronto para compartilhamento.',
              actionLabel: 'Editar perfil',
              onClick: () => {
                if (!activeProfileId) return;
                navigate(buildProfileEditUrl(activeProfileId));
              },
            }
          : null,
        showBusinessOnboarding
          ? {
              title: 'Ativar operacao empresarial',
              description:
                'Este perfil ja pode entrar no fluxo de empresa, dashboard, billing e verticalizacao.',
              actionLabel: 'Criar empresa',
              onClick: () => navigate(appUrls.business.create),
            }
          : null,
        notifications.unread > 0
          ? {
              title: 'Triar notificacoes pendentes',
              description: `Existem ${notifications.unread} notificacoes nao lidas aguardando acao.`,
              actionLabel: 'Abrir inbox',
              onClick: () => navigate(appUrls.notifications),
            }
          : null,
        hasDriverProfile && operations.ridesTotal === 0
          ? {
              title: 'Revisar operacao de mobilidade',
              description: 'O perfil de motorista existe, mas ainda nao ha historico recente consolidado.',
              actionLabel: 'Abrir mobilidade',
              onClick: () => navigate(appUrls.mobility.driverProfile),
            }
          : null,
      ].filter(Boolean) as Array<{
        title: string;
        description: string;
        actionLabel: string;
        onClick: () => void;
      }>,
    [
      territoryLabel,
      canOpenPublicProfile,
      showBusinessOnboarding,
      notifications.unread,
      hasDriverProfile,
      operations.ridesTotal,
      activeProfileId,
      navigate,
      appUrls,
    ],
  );

  // Handlers
  const handleSwitchProfile = async (profileId: string) => {
    if (profileId === activeProfile?.id) return;
    const result = await switchProfile(profileId);
    if (result) toast.success('Perfil ativo alterado');
  };

  const handleBusinessClick = (business: Business) => {
    if (!business.slug) return;
    const url = BusinessUrlService.getCanonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });
    navigate(url);
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${value}`);
      toast.success(`${label} copiado`);
    } catch {
      toast.error(`Nao foi possivel copiar ${label.toLowerCase()}`);
    }
  };

  return {
    // Dados básicos
    user,
    activeProfile,
    profile,
    allProfiles,
    activeProfileId,
    isVerified,
    handle,
    canOpenPublicProfile,
    territoryLabel,
    
    // Contexto e identidade
    context,
    identity,
    account,
    
    // Estatísticas e operações
    stats,
    operations,
    notifications,
    roles,
    
    // Módulos empresariais
    businessModules,
    hasBusinesses,
    showBusinessOnboarding,

    // Snapshot de motorista (mobilidade)
    hasDriverProfile,
    driverProfile: resolvedDriverProfile,
    driverProfileId: resolvedDriverProfileId,
    driverData: driverIdentity.driverData ?? null,
    driverDataLoading: driverIdentity.isLoading,
    driverDataError: driverIdentity.error ?? null,
    
    // Estados
    loading,
    error,
    
    // Mobilidade
    activeRide,
    hasActiveRide,
    
    // Verificação
    verificationStatus,
    verificationRejectionReason,
    
    // Favoritos
    favorites,

    // Dialogos e seguranca
    downloadDataOpen,
    setDownloadDataOpen,
    viewDataOpen,
    setViewDataOpen,
    deactivateOpen,
    setDeactivateOpen,
    deleteOpen,
    setDeleteOpen,
    deleteConfirm,
    setDeleteConfirm,
    handleDownloadData,
    handleDeactivateAccount,
    handleDeleteAccount,
    
    // Dados preparados para componentes
    statsData,
    personalLinks,
    operationalLinks,
    ecosystemLinks,
    nextActions,
    
    // Handlers
    handleAvatarChange,
    handleSwitchProfile,
    handleBusinessClick,
    copyToClipboard,
    refreshWorkspace,
    navigate,
    appUrls,
    moduleUrls,
  };
}
