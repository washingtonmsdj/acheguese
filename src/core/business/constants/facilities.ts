/**
 * SSOT: Facilidades oferecidas por empresas
 * 
 * Este é o ÚNICO lugar onde facilidades são definidas.
 * Usado em:
 * - FacilitiesSelector (componente de edição)
 * - EmpresaDetailLandingPage (exibição pública)
 * - Qualquer outro lugar que precise exibir facilidades
 * 
 * REGRA: Nunca duplicar estas definições em outro arquivo!
 */

import { Wifi, ParkingSquare, Accessibility, Baby, Dog, AirVent, Utensils, Music } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Facility {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

export const FACILITIES: readonly Facility[] = [
  { 
    id: "wifi", 
    label: "Wi-Fi Grátis", 
    icon: Wifi, 
    color: "text-territory-brand",
    description: "Internet sem fio gratuita para clientes"
  },
  { 
    id: "estacionamento", 
    label: "Estacionamento", 
    icon: ParkingSquare, 
    color: "text-territory-brand",
    description: "Vagas de estacionamento disponíveis"
  },
  { 
    id: "acessibilidade", 
    label: "Acessibilidade", 
    icon: Accessibility, 
    color: "text-territory-brand",
    description: "Acessível para pessoas com deficiência"
  },
  { 
    id: "kids", 
    label: "Espaço Kids", 
    icon: Baby, 
    color: "text-territory-brand",
    description: "Área dedicada para crianças"
  },
  { 
    id: "pet_friendly", 
    label: "Pet Friendly", 
    icon: Dog, 
    color: "text-territory-brand",
    description: "Aceita animais de estimação"
  },
  { 
    id: "ar_condicionado", 
    label: "Ar Condicionado", 
    icon: AirVent, 
    color: "text-territory-brand",
    description: "Ambiente climatizado"
  },
  { 
    id: "area_externa", 
    label: "Área Externa", 
    icon: Utensils, 
    color: "text-territory-brand",
    description: "Espaço ao ar livre"
  },
  { 
    id: "musica_ao_vivo", 
    label: "Música ao Vivo", 
    icon: Music, 
    color: "text-territory-brand",
    description: "Apresentações musicais"
  },
] as const;

// Helper functions
export const getFacilityById = (id: string): Facility | undefined => {
  return FACILITIES.find(f => f.id === id);
};

export const getFacilityIcon = (id: string): LucideIcon | undefined => {
  return getFacilityById(id)?.icon;
};

export const getFacilityLabel = (id: string): string => {
  return getFacilityById(id)?.label || id;
};

export const getFacilityColor = (id: string): string => {
  return getFacilityById(id)?.color || "text-muted-foreground";
};

// Type helper para IDs válidos
export type FacilityId = typeof FACILITIES[number]['id'];
