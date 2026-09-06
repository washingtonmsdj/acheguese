import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Car,
  CreditCard,
  Database,
  Flag,
  Image,
  LayoutDashboard,
  MailCheck,
  Map,
  MapPin,
  Megaphone,
  MessagesSquare,
  Radio,
  Settings2,
  Shield,
  ShieldCheck,
  Tag,
  Ticket,
  UserCog,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * SSOT: configuracao unica da sidebar admin.
 * O layout deve apenas renderizar esta estrutura.
 */
export type AdminNavSectionId =
  | "overview"
  | "mobilidade"
  | "negocios"
  | "conteudo"
  | "moderacao"
  | "comunidade"
  | "territorio"
  | "sistema"
  | "analytics"
  | "ferramentas";

export type AdminNavBadge = "LIVE" | "pendingReportsCount";

export interface AdminNavItem {
  readonly id: string;
  readonly to: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly section: AdminNavSectionId;
  readonly end?: boolean;
  readonly badge?: AdminNavBadge;
}

export interface AdminNavSection {
  readonly id: AdminNavSectionId;
  readonly label: string;
  readonly items: readonly AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    id: "overview",
    label: "",
    items: [
      {
        id: "dashboard",
        to: "/admin",
        icon: LayoutDashboard,
        label: "Dashboard",
        end: true,
        section: "overview",
      },
    ],
  },
  {
    id: "mobilidade",
    label: "MOBILIDADE E TRANSPORTE",
    items: [
      { id: "motoristas", to: "/admin/motoristas", icon: Car, label: "Motoristas", section: "mobilidade" },
      {
        id: "reports-passageiros",
        to: "/admin/reports-passageiros",
        icon: Flag,
        label: "Reports Passageiros",
        section: "mobilidade",
      },
      {
        id: "pontos-embarque",
        to: "/admin/pontos-embarque",
        icon: MapPin,
        label: "Pontos de Embarque",
        section: "mobilidade",
      },
      {
        id: "realtime-dashboard",
        to: "/admin/realtime-dashboard",
        icon: Activity,
        label: "Dashboard Tempo Real",
        badge: "LIVE",
        section: "mobilidade",
      },
      {
        id: "analytics-mobilidade",
        to: "/admin/analytics-mobilidade",
        icon: BarChart3,
        label: "Analytics Mobilidade",
        section: "mobilidade",
      },
      { id: "pricing", to: "/admin/pricing", icon: CreditCard, label: "Pricing e Tarifas", section: "mobilidade" },
    ],
  },
  {
    id: "negocios",
    label: "NEGOCIOS E EMPRESAS",
    items: [
      { id: "empresas", to: "/admin/empresas", icon: Building2, label: "Empresas", section: "negocios" },
      { id: "gastronomia", to: "/admin/gastronomia", icon: UtensilsCrossed, label: "Gastronomia", section: "negocios" },
      { id: "services", to: "/admin/servicos", icon: Wrench, label: "Servicos", section: "negocios" },
      { id: "anuncios", to: "/admin/anuncios", icon: Megaphone, label: "Anuncios", section: "negocios" },
      { id: "vagas", to: "/admin/vagas", icon: Briefcase, label: "Vagas de Emprego", section: "negocios" },
      {
        id: "assinaturas",
        to: "/admin/assinaturas",
        icon: CreditCard,
        label: "Assinaturas e Planos",
        section: "negocios",
      },
    ],
  },
  {
    id: "conteudo",
    label: "CONTEUDO E MARKETING",
    items: [
      { id: "banners", to: "/admin/banners", icon: Image, label: "Banners", section: "conteudo" },
      { id: "eventos", to: "/admin/eventos", icon: Calendar, label: "Eventos", section: "conteudo" },
      { id: "classificados", to: "/admin/classificados", icon: Tag, label: "Classificados", section: "conteudo" },
      { id: "cupons", to: "/admin/cupons", icon: Ticket, label: "Cupons", section: "conteudo" },
      { id: "promocoes", to: "/admin/promocoes", icon: Ticket, label: "Promocoes", section: "conteudo" },
      {
        id: "pontos-turisticos",
        to: "/admin/guia/pontos-turisticos",
        icon: MapPin,
        label: "Pontos Turisticos",
        section: "conteudo",
      },
    ],
  },
  {
    id: "moderacao",
    label: "MODERACAO E SEGURANCA",
    items: [
      {
        id: "moderacao",
        to: "/admin/moderacao",
        icon: ShieldCheck,
        label: "Moderacao Geral",
        section: "moderacao",
      },
      {
        id: "qualidade-dados",
        to: "/admin/qualidade-dados",
        icon: Database,
        label: "Qualidade de Dados",
        section: "moderacao",
      },
      {
        id: "classificados-denuncias",
        to: "/admin/classificados/denuncias",
        icon: Flag,
        label: "Denuncias",
        badge: "pendingReportsCount",
        section: "moderacao",
      },
      { id: "verificacoes", to: "/admin/verificacoes", icon: ShieldCheck, label: "Verificacoes", section: "moderacao" },
      { id: "reivindicacoes", to: "/admin/reivindicacoes", icon: AlertTriangle, label: "Reivindicacoes", section: "moderacao" },
      { id: "alertas", to: "/admin/alertas", icon: Bell, label: "Alertas Sistema", section: "moderacao" },
    ],
  },
  {
    id: "comunidade",
    label: "COMUNIDADE E SOCIAL",
    items: [
      { id: "usuarios", to: "/admin/usuarios", icon: Users, label: "Usuarios", section: "comunidade" },
      {
        id: "community-alerts",
        to: "/admin/community-alerts",
        icon: AlertTriangle,
        label: "Alertas Comunitarios",
        section: "comunidade",
      },
      {
        id: "community-issues",
        to: "/admin/community-issues",
        icon: AlertCircle,
        label: "Problemas Urbanos",
        section: "comunidade",
      },
      {
        id: "community-interest",
        to: "/admin/lista-espera",
        icon: MailCheck,
        label: "Lista de espera",
        section: "comunidade",
      },
      {
        id: "comunicacao",
        to: "/admin/comunicacao",
        icon: Radio,
        label: "Comunicacao Territorial",
        section: "comunidade",
      },
      { id: "mensagens", to: "/admin/mensagens", icon: MessagesSquare, label: "Conversas", section: "comunidade" },
      { id: "notifications", to: "/admin/notifications", icon: Bell, label: "Notificacoes", section: "comunidade" },
    ],
  },
  {
    id: "territorio",
    label: "TERRITORIO E LOCALIZACAO",
    items: [
      {
        id: "territory-management",
        to: "/admin/territory-management",
        icon: Map,
        label: "Gestao de Territorios",
        section: "territorio",
      },
      {
        id: "city-metadata",
        to: "/admin/city-metadata",
        icon: MapPin,
        label: "Metadados da Cidade",
        section: "territorio",
      },
      {
        id: "territorial-groups",
        to: "/admin/territorial-groups",
        icon: Users,
        label: "Grupos Territoriais",
        section: "territorio",
      },
      {
        id: "highlights",
        to: "/admin/highlights",
        icon: MapPin,
        label: "Destaques Territoriais",
        section: "territorio",
      },
      { id: "mapa", to: "/admin/mapa", icon: Map, label: "Mapa Geral", section: "territorio" },
    ],
  },
  {
    id: "sistema",
    label: "CONFIGURACOES E SISTEMA",
    items: [
      { id: "branding", to: "/admin/branding", icon: Image, label: "Identidade Visual", section: "sistema" },
      {
        id: "configuracoes",
        to: "/admin/configuracoes",
        icon: Settings2,
        label: "Configuracoes Gerais",
        section: "sistema",
      },
      { id: "roles", to: "/admin/roles", icon: UserCog, label: "Roles e Permissoes", section: "sistema" },
      { id: "identidade", to: "/admin/identidade", icon: Shield, label: "Identidade e Perfis", section: "sistema" },
      { id: "operacoes", to: "/admin/operacoes", icon: Activity, label: "Operacoes", section: "sistema" },
    ],
  },
  {
    id: "analytics",
    label: "ANALYTICS E DADOS",
    items: [
      { id: "analytics", to: "/admin/analytics", icon: BarChart3, label: "Analytics Avancado", section: "analytics" },
      { id: "ssot", to: "/admin/ssot", icon: Database, label: "Central SSOT", section: "analytics" },
    ],
  },
];

export function getAdminNavItems(): readonly AdminNavItem[] {
  return ADMIN_NAV_SECTIONS.flatMap((section) => section.items);
}
