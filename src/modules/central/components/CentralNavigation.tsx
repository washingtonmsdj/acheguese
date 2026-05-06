import { Link, useLocation, useParams } from 'react-router-dom';
import { LayoutGrid, BarChart3, Building2, CreditCard, Link as LinkIcon, Settings, Store, UtensilsCrossed, Clock, MapPin, ShoppingBag, Truck, Megaphone, BookOpen, GraduationCap, Users, Calendar } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/shared/components/ui/sidebar';
import { cn } from '@/shared/utils/cn';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { CENTRAL_NAV_SECTIONS, type CentralNavItem, type CentralNavSection } from './centralNavigation.config';
import { useBusinessById } from '@/modules/business/hooks/useBusinessById';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { isEligibleForVertical } from '@/core/verticals/config';
import { useGastronomyStatus } from '@/core/verticals/gastronomy/hooks/useGastronomyStatus';
import { useEducationStatus } from '@/core/verticals/education/hooks/useEducationStatus';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface CentralNavigationProps {
  /**
   * Estado colapsado da sidebar (opcional)
   */
  collapsed?: boolean;
}

/**
 * CentralNavigation
 * 
 * Navegação lateral/contextual específica para a Central.
 * Separa gestão de negócios/perfis profissionais/mobilidade do perfil pessoal.
 * 
 * Desktop: sidebar com seções colapsáveis
 * Mobile: tabs/dropdown/accordion
 * 
 * Quando em /central/empresas/:businessId, exibe navegação contextual da empresa ativa.
 * Quando em /central/empresas/:businessId/gastronomia, exibe subitens de gastronomia se ativa.
 */
export function CentralNavigation({ collapsed = false }: CentralNavigationProps) {
  const location = useLocation();
  const { businessId } = useParams<{ businessId: string }>();
  const isMobile = useIsMobile();

  // Buscar dados da empresa quando businessId está presente
  const { business, isLoading: loadingBusiness } = useBusinessById(businessId);

  // Buscar status de gastronomia quando businessId está presente
  const isGastronomyEligible = business ? isEligibleForVertical(business.category, 'gastronomy') : false;
  const { status: gastronomyStatus, isLoading: loadingGastronomy } = useGastronomyStatus(businessId || '', isGastronomyEligible);
  const isGastronomyActive = gastronomyStatus === 'active';

  // Buscar status de education quando businessId está presente
  const isEducationEligible = business ? isEligibleForVertical(business.category, 'education') : false;
  const { status: educationStatus, isLoading: loadingEducation } = useEducationStatus(businessId || '', isEducationEligible);
  const isEducationActive = educationStatus === 'published';

  // Detectar se está em rota de empresa específica
  const isInBusinessRoute = location.pathname.match(/^\/central\/empresas\/[^/]+/);
  const isInGastronomyRoute = location.pathname.match(/^\/central\/empresas\/[^/]+\/gastronomia/);
  const isInEducationRoute = location.pathname.match(/^\/central\/empresas\/[^/]+\/education/);

  const isActiveHref = (href: string): boolean => {
    if (href === '/central') return location.pathname === '/central';
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: CentralNavItem, level = 0) => (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton asChild isActive={isActiveHref(item.href)} tooltip={item.label}>
        <Link to={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  // Renderizar subitens da empresa quando em /central/empresas/:businessId
  const renderBusinessSubItems = () => {
    if (!businessId || !business) return null;

    const basePath = businessManagementRoutes.overview(businessId);

    const businessNavItems: CentralNavItem[] = [
      {
        id: 'business-overview',
        icon: Store,
        label: 'Visão geral',
        href: basePath,
      },
      {
        id: 'business-dados',
        icon: Building2,
        label: 'Dados da empresa',
        href: businessManagementRoutes.dados(businessId),
      },
      ...(isGastronomyEligible
        ? [
            {
              id: 'business-gastronomia',
              icon: UtensilsCrossed,
              label: 'Gastronomia',
              href: businessManagementRoutes.gastronomia(businessId),
              subItems: isGastronomyActive
                ? [
                    {
                      id: 'gastronomy-setup',
                      icon: LayoutGrid,
                      label: 'Setup',
                      href: businessManagementRoutes.gastronomySetup(businessId),
                    },
                    {
                      id: 'gastronomy-cardapio',
                      icon: BookOpen,
                      label: 'Cardápio',
                      href: businessManagementRoutes.gastronomyCardapio(businessId),
                    },
                    {
                      id: 'gastronomy-horarios',
                      icon: Clock,
                      label: 'Horários',
                      href: businessManagementRoutes.gastronomyHorarios(businessId),
                    },
                    {
                      id: 'gastronomy-area-entrega',
                      icon: MapPin,
                      label: 'Área de entrega',
                      href: businessManagementRoutes.gastronomyAreaEntrega(businessId),
                    },
                    {
                      id: 'gastronomy-pedidos',
                      icon: ShoppingBag,
                      label: 'Pedidos',
                      href: businessManagementRoutes.gastronomyPedidos(businessId),
                    },
                    {
                      id: 'gastronomy-entregas',
                      icon: Truck,
                      label: 'Entregas',
                      href: businessManagementRoutes.gastronomyEntregas(businessId),
                    },
                    {
                      id: 'gastronomy-promocoes',
                      icon: Megaphone,
                      label: 'Promoções',
                      href: businessManagementRoutes.gastronomyPromocoes(businessId),
                    },
                    {
                      id: 'gastronomy-analytics',
                      icon: BarChart3,
                      label: 'Analytics',
                      href: businessManagementRoutes.gastronomyAnalytics(businessId),
                    },
                  ]
                : undefined,
            },
          ]
        : []),
      ...(isEducationEligible
        ? [
            {
              id: 'business-education',
              icon: GraduationCap,
              label: 'Educação',
              href: businessManagementRoutes.education(businessId),
              subItems: isEducationActive
                ? [
                    {
                      id: 'education-setup',
                      icon: LayoutGrid,
                      label: 'Setup',
                      href: businessManagementRoutes.educationSetup(businessId),
                    },
                    {
                      id: 'education-programas',
                      icon: Users,
                      label: 'Programas',
                      href: businessManagementRoutes.educationProgramas(businessId),
                    },
                    {
                      id: 'education-leads',
                      icon: BookOpen,
                      label: 'Leads',
                      href: businessManagementRoutes.educationLeads(businessId),
                    },
                    {
                      id: 'education-eventos',
                      icon: Calendar,
                      label: 'Eventos',
                      href: businessManagementRoutes.educationEventos(businessId),
                    },
                    {
                      id: 'education-analytics',
                      icon: BarChart3,
                      label: 'Analytics',
                      href: businessManagementRoutes.educationAnalytics(businessId),
                    },
                    {
                      id: 'education-planos',
                      icon: CreditCard,
                      label: 'Planos',
                      href: businessManagementRoutes.educationPlanos(businessId),
                    },
                  ]
                : undefined,
            },
          ]
        : []),
      {
        id: 'business-planos',
        icon: CreditCard,
        label: 'Planos',
        href: businessManagementRoutes.planos(businessId),
      },
      {
        id: 'business-link-premium',
        icon: LinkIcon,
        label: 'Link premium',
        href: businessManagementRoutes.linkPremium(businessId),
      },
      {
        id: 'business-analytics',
        icon: BarChart3,
        label: 'Analytics',
        href: businessManagementRoutes.analytics(businessId),
      },
      {
        id: 'business-configuracoes',
        icon: Settings,
        label: 'Configurações',
        href: businessManagementRoutes.configuracoes(businessId),
      },
    ];

    return (
      <SidebarGroup className="px-2 py-1">
        <SidebarGroupLabel className="h-6 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
          {loadingBusiness ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="truncate" title={business.name}>
              {business.name}
            </span>
          )}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {businessNavItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                {item.subItems ? (
                  <SidebarMenuSub>
                    <SidebarMenuSubButton asChild isActive={isActiveHref(item.href)}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.id}>
                        <SidebarMenuSubButton asChild isActive={isActiveHref(subItem.href)}>
                          <Link to={subItem.href}>
                            <subItem.icon className="h-4 w-4" />
                            <span>{subItem.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : (
                  <SidebarMenuButton asChild isActive={isActiveHref(item.href)} tooltip={item.label}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  const renderSection = (section: CentralNavSection) => {
    // Não renderizar seção "Empresas" se já estiver em rota de empresa específica
    if (isInBusinessRoute && section.id === 'business') {
      return null;
    }

    return (
      <SidebarGroup key={section.id} className="px-2 py-1">
        <SidebarGroupLabel className="h-6 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
          {section.label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {section.items.map((item) => renderNavItem(item))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // Mobile: render como tabs/dropdown
  if (isMobile) {
    return (
      <div className="border-b border-border bg-background">
        <div className="flex overflow-x-auto px-2 py-2 gap-2">
          {CENTRAL_NAV_SECTIONS.map((section) => {
            // Se estiver em rota de empresa, mostrar nome da empresa em vez de "Empresas"
            const firstItem = section.items[0];
            const Icon = firstItem?.icon;
            const label = isInBusinessRoute && section.id === 'business' && business
              ? business.name
              : section.label;
            return (
              <Link
                key={section.id}
                to={firstItem?.href || '/central'}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  isActiveHref(firstItem?.href || '/central')
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground',
                )}
                title={label}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="truncate max-w-[120px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: render como sidebar
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link
          to="/central"
          className={cn(
            'flex items-center gap-2 rounded-lg transition-colors hover:bg-sidebar-accent/60',
            collapsed ? 'justify-center' : '',
          )}
        >
          <LayoutGrid className="h-6 w-6 text-primary" />
          {!collapsed ? (
            <span className="text-lg font-semibold text-foreground font-heading">
              Central
            </span>
          ) : null}
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <div className="flex-1 overflow-y-auto py-2">
          {CENTRAL_NAV_SECTIONS.map((section) => renderSection(section))}
          {isInBusinessRoute && renderBusinessSubItems()}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
