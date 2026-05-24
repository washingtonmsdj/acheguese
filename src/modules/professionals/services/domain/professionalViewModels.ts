import type { Professional } from "@/core/professional/types";

export interface ProfessionalItem {
  id: string;
  name: string;
  category: string;
  service: string;
  description: string;
  rating: number;
  reviews_count: number;
  avatar_url: string | null;
  city: string;
  neighborhood: string;
  price_range: string;
  whatsapp: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  // CamelCase aliases for UI view models.
  photo?: string | null;
  totalAvaliacoes?: number;
  priceMedio?: string;
  priceRange?: string;
  isVerified?: boolean;
  isAcceptingClients?: boolean;
}

export interface ProfessionalDetailView {
  id: string;
  professional_data_id: string;
  slug: string;
  name: string;
  photo: string;
  service: string;
  category: string;
  description: string;
  rating: number;
  total_avaliacoes: number;
  price_medio: string;
  whatsapp: string;
  phone: string;
  email: string;
  neighborhood: string;
  city: string;
  state: string;
  address: string;
  neighborhoods_atendidos: string[];
  schedule_atendimento: string;
  experience_years: number | null;
  education: string;
  certifications: string[];
  portfolio_images: string[];
  banner_url: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  website: string;
  is_verified: boolean;
  is_accepting_clients: boolean;
  total_jobs: number;
  response_time: string;
  languages: string[];
  created_at: string;
}

export function mapProfessionalToItem(professional: Professional): ProfessionalItem {
  return {
    id: professional.id,
    name: professional.name,
    category: professional.category,
    service: professional.subcategory || professional.category || "",
    description: professional.description,
    rating: professional.rating,
    reviews_count: professional.total_reviews,
    avatar_url: professional.logo_url || null,
    city: professional.city || "",
    neighborhood: professional.neighborhood || "",
    price_range: professional.price_range || "",
    whatsapp: professional.whatsapp || null,
    latitude: professional.latitude ?? null,
    longitude: professional.longitude ?? null,
    created_at: professional.created_at,
    photo: professional.logo_url || null,
    totalAvaliacoes: professional.total_reviews,
    priceMedio: professional.price_range || "",
    priceRange: professional.price_range || "",
    isVerified: professional.is_verified,
    isAcceptingClients: professional.is_accepting_clients,
  };
}

export function mapProfessionalToDetailView(professional: Professional): ProfessionalDetailView {
  const availableHours = professional.available_hours;
  const schedule =
    availableHours && typeof availableHours.schedule === "string"
      ? availableHours.schedule
      : availableHours
        ? JSON.stringify(availableHours)
        : "";

  return {
    id: professional.id,
    professional_data_id: professional.professional_data_id,
    slug: professional.slug || "",
    name: professional.name,
    photo: professional.logo_url || "",
    service: professional.subcategory || professional.category,
    category: professional.category,
    description: professional.description,
    rating: professional.rating,
    total_avaliacoes: professional.total_reviews,
    price_medio: professional.price_range || "",
    whatsapp: professional.whatsapp || "",
    phone: professional.phone || "",
    email: professional.email || "",
    neighborhood: professional.neighborhood || "",
    city: professional.city || "",
    state: professional.state || "",
    address: professional.address || "",
    neighborhoods_atendidos: professional.service_areas,
    schedule_atendimento: schedule,
    experience_years: professional.experience_years ?? null,
    education: professional.education || "",
    certifications: professional.certifications || [],
    portfolio_images: professional.portfolio_images || [],
    banner_url: professional.banner_url || "",
    instagram: professional.instagram || "",
    facebook: professional.facebook || "",
    linkedin: professional.linkedin || "",
    website: professional.website || "",
    is_verified: professional.is_verified,
    is_accepting_clients: professional.is_accepting_clients,
    total_jobs: professional.total_jobs,
    response_time: professional.response_time || "",
    languages: professional.languages || [],
    created_at: professional.created_at,
  };
}
