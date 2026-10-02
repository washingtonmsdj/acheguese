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
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Entrega no endereco do cliente",
    icon: Truck,
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
    hasAreas: true,
  },
  {
    id: "retirada",
    label: "Retirada",
    description: "Cliente retira o pedido no local",
    icon: ShoppingBag,
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  {
    id: "consumo_local",
    label: "Consumo no Local",
    description: "Ambiente para consumo no estabelecimento",
    icon: UtensilsCrossed,
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  {
    id: "domicilio",
    label: "Atendimento a Domicilio",
    description: "Profissional vai ate o cliente",
    icon: Home,
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
    hasAreas: true,
  },
  {
    id: "online",
    label: "Atendimento Online",
    description: "Atendimento remoto (videochamada, chat)",
    icon: Globe,
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
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
