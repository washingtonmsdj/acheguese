/**
 * SSOT: Modos de atendimento
 * 
 * Este é o ÚNICO lugar onde modos de atendimento são definidos.
 * Usado em:
 * - ServiceModesSelector (componente de edição)
 * - EmpresaDetailLandingPage (exibição pública)
 * - Qualquer outro lugar que precise exibir modos
 * 
 * REGRA: Nunca duplicar estas definições em outro arquivo!
 */

import { Store, Truck, Home, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ServiceMode {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  hasAreas?: boolean; // Se permite configurar áreas de atendimento
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
    description: "Entrega no endereço do cliente",
    icon: Truck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    hasAreas: true,
  },
  {
    id: "domicilio",
    label: "Atendimento a Domicílio",
    description: "Profissional vai até o cliente",
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

// Helper functions
export const getServiceModeById = (id: string): ServiceMode | undefined => {
  return SERVICE_MODES.find(m => m.id === id);
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

// Type helper para IDs válidos
export type ServiceModeId = typeof SERVICE_MODES[number]['id'];
