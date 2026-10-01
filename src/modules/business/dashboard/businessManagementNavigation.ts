import {
  Clock,
  FileText,
  Images,
  MapPin,
  Package,
  Pencil,
  Settings,
  Store,
  type LucideIcon,
} from "lucide-react";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

/** Presentation contract. Lifecycle authorization belongs to the app boundary. */
export interface BusinessManagementNavigationItem {
  id:
    | "overview"
    | "edit"
    | "photos"
    | "hours"
    | "location"
    | "catalog"
    | "dados"
    | "configuracoes";
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
  owner: "business";
  group: "management";
  order: number;
  routePath: string;
  buildRoute: (businessId: string) => string;
}

export const businessManagementNavigation: readonly BusinessManagementNavigationItem[] =
  [
    {
      id: "overview",
      label: "Visão geral",
      mobileLabel: "Visão",
      icon: Store,
      owner: "business",
      group: "management",
      order: 0,
      routePath: "",
      buildRoute: businessManagementRoutes.overview,
    },
    {
      id: "edit",
      label: "Editar empresa",
      mobileLabel: "Editar",
      icon: Pencil,
      owner: "business",
      group: "management",
      order: 1,
      routePath: "editar",
      buildRoute: businessManagementRoutes.edit,
    },
    {
      id: "photos",
      label: "Fotos",
      mobileLabel: "Fotos",
      icon: Images,
      owner: "business",
      group: "management",
      order: 2,
      routePath: "fotos",
      buildRoute: businessManagementRoutes.photos,
    },
    {
      id: "hours",
      label: "Horário de funcionamento",
      mobileLabel: "Horário",
      icon: Clock,
      owner: "business",
      group: "management",
      order: 3,
      routePath: "horarios",
      buildRoute: businessManagementRoutes.hours,
    },
    {
      id: "location",
      label: "Localização",
      mobileLabel: "Local",
      icon: MapPin,
      owner: "business",
      group: "management",
      order: 4,
      routePath: "localizacao",
      buildRoute: businessManagementRoutes.location,
    },
    {
      id: "catalog",
      label: "Produtos e serviços",
      mobileLabel: "Catálogo",
      icon: Package,
      owner: "business",
      group: "management",
      order: 5,
      routePath: "produtos-servicos",
      buildRoute: businessManagementRoutes.catalog,
    },
    {
      id: "dados",
      label: "Dados da empresa",
      mobileLabel: "Dados",
      icon: FileText,
      owner: "business",
      group: "management",
      order: 6,
      routePath: "dados",
      buildRoute: businessManagementRoutes.dados,
    },
    {
      id: "configuracoes",
      label: "Configurações",
      mobileLabel: "Ajustes",
      icon: Settings,
      owner: "business",
      group: "management",
      order: 7,
      routePath: "configuracoes",
      buildRoute: businessManagementRoutes.configuracoes,
    },
  ];
