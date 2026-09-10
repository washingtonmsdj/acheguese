import type { LucideIcon } from "lucide-react";
import { Lightbulb, Plug, Wrench } from "lucide-react";
import complexoComercioImage from "@/assets/complexo-comercio.jpg";
import neighborhoodImage from "@/assets/neighborhood-featured.jpg";
import profileImage from "@/assets/persona-morador.jpg";
import serviceImage from "@/assets/servicos-hero.jpg";
import type { ProfessionalPublicProfile } from "../hooks/useProfessionalBySlug";

export interface ProfessionalConceptService {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ProfessionalConceptDetails {
  locationLabel: string;
  services: ProfessionalConceptService[];
  portfolio: string[];
  coverage: string[];
}

export const PROFESSIONAL_CONCEPT_MOCK: ProfessionalPublicProfile = {
  id: "concept-professional-joao-santos",
  slug: "joao-santos",
  professional_name: "João Santos",
  description: "Instalações e reparos elétricos para o dia a dia da sua casa.",
  service_category: "Serviços elétricos",
  service_subcategory: "Eletricista",
  is_verified: false,
  is_accepting_clients: true,
  city: "Salvador",
  state: "BA",
  avatar_url: profileImage,
  logo_url: profileImage,
  certifications: null,
  experience_years: null,
  price_range: null,
};

export const PROFESSIONAL_CONCEPT_DETAILS: ProfessionalConceptDetails = {
  locationLabel: "Santa Cruz · Salvador, BA",
  services: [
    {
      title: "Tomadas e interruptores",
      description: "Instalação e substituição",
      icon: Plug,
    },
    {
      title: "Iluminação",
      description: "Luminárias e pontos de luz",
      icon: Lightbulb,
    },
    {
      title: "Manutenção residencial",
      description: "Avaliação de problemas elétricos",
      icon: Wrench,
    },
  ],
  portfolio: [serviceImage, neighborhoodImage, complexoComercioImage],
  coverage: [
    "Santa Cruz",
    "Nordeste de Amaralina",
    "Vale das Pedrinhas",
    "Chapada",
  ],
};
