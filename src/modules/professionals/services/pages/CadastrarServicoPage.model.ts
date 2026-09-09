import type { ElementType } from "react";
import { Award, Briefcase, Globe, Phone } from "lucide-react";
import { SERVICE_FORM_CATEGORY_OPTIONS } from "@/modules/professionals/services/domain/professionalCategories";

export type Step = "info" | "details" | "contact" | "review";

export type ProfessionalServiceFormState = {
  name: string;
  category: string;
  subcategory: string;
  description: string;
  serviceAreaLocationIds: string[];
  phone: string;
  whatsapp: string;
  availableHours: string;
  priceRange: string;
  experienceYears: string;
  education: string;
  certifications: string;
  instagram: string;
  website: string;
};

export const FORM_CATEGORIES = SERVICE_FORM_CATEGORY_OPTIONS;

export const STEP_ORDER: Step[] = ["info", "details", "contact", "review"];

export const STEPS: { key: Step; label: string; icon: ElementType }[] = [
  { key: "info", label: "Informações", icon: Briefcase },
  { key: "details", label: "Detalhes", icon: Award },
  { key: "contact", label: "Contato", icon: Phone },
  { key: "review", label: "Revisão", icon: Globe },
];

export const INITIAL_SERVICE_FORM: ProfessionalServiceFormState = {
  name: "",
  category: "",
  subcategory: "",
  description: "",
  serviceAreaLocationIds: [],
  phone: "",
  whatsapp: "",
  availableHours: "",
  priceRange: "",
  experienceYears: "",
  education: "",
  certifications: "",
  instagram: "",
  website: "",
};

export function parseCertifications(certifications: string): string[] {
  return certifications
    .split(",")
    .map((certification) => certification.trim())
    .filter(Boolean);
}
