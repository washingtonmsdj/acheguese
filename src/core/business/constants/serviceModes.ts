/**
 * SSOT: Modos de atendimento
 *
 * Este e o unico lugar onde modos de atendimento sao definidos.
 * Usado em qualquer superficie que precise exibir ou editar esses modos.
 */

import {
  Globe,
  Home,
  ShoppingBag,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ServiceMode {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  hasAreas?: boolean;
}

export const SERVICE_MODES: readonly ServiceMode[] = [
  {
    id: "presencial",
    label: "Atendimento Presencial",
    description: "Clientes visitam o estabelecimento",
    icon: Store,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Entrega no endereco do cliente",
    icon: Truck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    hasAreas: true,
  },
  {
    id: "retirada",
    label: "Retirada",
    description: "Cliente retira o pedido no local",
    icon: ShoppingBag,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    id: "consumo_local",
    label: "Consumo no Local",
    description: "Ambiente para consumo no estabelecimento",
    icon: UtensilsCrossed,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  {
    id: "domicilio",
    label: "Atendimento a Domicilio",
    description: "Profissional vai ate o cliente",
    icon: Home,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    hasAreas: true,
  },
  {
    id: "online",
    label: "Atendimento Online",
    description: "Atendimento remoto (videochamada, chat)",
    icon: Globe,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
  },
] as const;

export const getServiceModeById = (id: string): ServiceMode | undefined => {
  return SERVICE_MODES.find((mode) => mode.id === id);
};

export const getServiceModeLabel = (id: string): string => {
  return getServiceModeById(id)?.label || id;
};

export const getServiceModeIcon = (id: string): LucideIcon | undefined => {
  return getServiceModeById(id)?.icon;
};

export const getServiceModeColor = (id: string): string => {
  return getServiceModeById(id)?.color || "text-muted-foreground";
};

export const serviceModeSupportAreas = (id: string): boolean => {
  return getServiceModeById(id)?.hasAreas || false;
};

export type ServiceModeId = typeof SERVICE_MODES[number]["id"];
