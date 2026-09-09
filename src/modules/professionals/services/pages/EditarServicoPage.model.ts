import type {
  Professional,
  ProfessionalCategory,
  UpdateProfessionalInput,
} from "@/core/professional/types";

export type ProfessionalEditTab = "info" | "details" | "contact" | "portfolio" | "availability";

export interface ProfessionalEditForm {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  serviceAreaLocationIds: string[];
  phone: string;
  whatsapp: string;
  email: string;
  availableHours: string;
  priceRange: string;
  experienceYears: string;
  education: string;
  certifications: string;
  instagram: string;
  website: string;
  isAcceptingClients: boolean;
}

export const createInitialProfessionalEditForm = (): ProfessionalEditForm => ({
  name: "",
  category: "",
  subcategory: "",
  description: "",
  serviceAreaLocationIds: [],
  phone: "",
  whatsapp: "",
  email: "",
  availableHours: "",
  priceRange: "",
  experienceYears: "",
  education: "",
  certifications: "",
  instagram: "",
  website: "",
  isAcceptingClients: true,
});

function getAvailableHoursSchedule(
  availableHours: Record<string, unknown> | null | undefined,
): string {
  const schedule = availableHours?.schedule;
  return typeof schedule === "string" ? schedule : "";
}

export const mapProfessionalToEditForm = (
  professional: Professional,
  serviceAreaLocationIds: string[] = [],
): ProfessionalEditForm => ({
  name: professional.name || "",
  category: professional.category || "",
  subcategory: professional.subcategory || "",
  description: professional.description || "",
  serviceAreaLocationIds,
  phone: professional.phone || "",
  whatsapp: professional.whatsapp || "",
  email: professional.email || "",
  availableHours: getAvailableHoursSchedule(professional.available_hours),
  priceRange: professional.price_range || "",
  experienceYears: professional.experience_years?.toString() || "",
  education: professional.education || "",
  certifications: professional.certifications?.join(", ") || "",
  instagram: professional.instagram || "",
  website: professional.website || "",
  isAcceptingClients: professional.is_accepting_clients ?? true,
});

export const toggleServiceAreaSelection = (
  currentAreas: string[],
  area: string,
): string[] =>
  currentAreas.includes(area)
    ? currentAreas.filter((selectedArea) => selectedArea !== area)
    : [...currentAreas, area];

export const parseCertificationsInput = (certifications: string): string[] =>
  certifications
    .split(",")
    .map((certification) => certification.trim())
    .filter(Boolean);

export const buildProfessionalUpdateInput = ({
  form,
  portfolioImages,
  logoUrl,
  slug,
  shouldUpdateSlug,
}: {
  form: ProfessionalEditForm;
  portfolioImages: string[];
  logoUrl?: string;
  slug: string;
  shouldUpdateSlug: boolean;
}): UpdateProfessionalInput => ({
  name: form.name.trim(),
  category: form.category as ProfessionalCategory,
  ...(shouldUpdateSlug ? { slug: slug.trim() } : {}),
  subcategory: form.subcategory.trim() || undefined,
  description: form.description.trim() || undefined,
  phone: form.phone.trim() || undefined,
  whatsapp: form.whatsapp.trim() || undefined,
  email: form.email.trim() || undefined,
  available_hours: form.availableHours ? { schedule: form.availableHours } : undefined,
  price_range: form.priceRange.trim() || undefined,
  experience_years: form.experienceYears
    ? parseInt(form.experienceYears, 10)
    : undefined,
  education: form.education.trim() || undefined,
  certifications: parseCertificationsInput(form.certifications),
  instagram: form.instagram.trim() || undefined,
  website: form.website.trim() || undefined,
  is_accepting_clients: form.isAcceptingClients,
  portfolio_images: portfolioImages,
  ...(logoUrl ? { logo_url: logoUrl } : {}),
});
