import {
  Baby,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  Camera,
  Compass,
  Dumbbell,
  Globe,
  HelpCircle,
  Languages,
  Map as MapIcon,
  Music,
  Quote,
  School,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type {
  SchoolAccessibilityFeatureKey,
  SchoolBasicResourceKey,
  SchoolEquipmentFeatureKey,
  SchoolFacilityFeatureKey,
} from "@/core/education";
import { buildWhatsAppUrl } from "@/shared/utils/contactLinks";

export const NICHE_ICONS: Record<string, LucideIcon> = {
  regular_school: School,
  daycare: Baby,
  language_school: Languages,
  prep_course: Calculator,
  technical_school: Wrench,
  tutoring_center: BookOpen,
  music_school: Music,
  sports_school: Dumbbell,
};

export const NICHE_GRADIENTS: Record<string, string> = {
  regular_school: "from-territory-brand via-territory-brand/90 to-territory-info",
  daycare: "from-territory-sun via-territory-warning/85 to-territory-warning",
  language_school: "from-territory-success via-territory-success/85 to-territory-brand",
  prep_course: "from-territory-warning via-territory-sun/85 to-territory-warning",
  technical_school: "from-territory-info via-territory-brand/85 to-territory-brand",
  tutoring_center: "from-territory-info via-territory-info/85 to-territory-brand",
  music_school: "from-territory-brand via-territory-brand/80 to-territory-sun",
  sports_school: "from-territory-success via-territory-success/85 to-territory-brand",
};

export function buildWhatsAppHref(phone?: string | null): string | null {
  return buildWhatsAppUrl(phone);
}

export function getSections(labels: { programPlural: string; eventPlural: string }) {
  return [
    { id: "overview", label: "Visão geral", icon: Compass },
    { id: "infrastructure", label: "Infraestrutura", icon: Building2 },
    { id: "programs", label: labels.programPlural, icon: BookOpen },
    { id: "modalities", label: "Modalidades", icon: Globe },
    { id: "team", label: "Equipe", icon: Users },
    { id: "gallery", label: "Galeria", icon: Camera },
    { id: "events", label: labels.eventPlural, icon: Calendar },
    { id: "testimonials", label: "Depoimentos", icon: Quote },
    { id: "faq", label: "Perguntas frequentes", icon: HelpCircle },
    { id: "location", label: "Localização", icon: MapIcon },
  ] as const;
}

export const FALLBACK_FAQ = [
  {
    q: "Como confirmar matrícula, vagas ou horários?",
    a: "Informações operacionais podem mudar ao longo do ano. Confirme pelos canais oficiais da rede ou da instituição. O Achegue-se só sinaliza disponibilidade quando houver dado cadastrado para isso.",
  },
  {
    q: "Se uma infraestrutura não aparece, significa que a unidade não possui?",
    a: "Não. A ausência de um item significa apenas que ele ainda não foi confirmado por uma fonte confiável para este perfil.",
  },
  {
    q: "Como saber a origem dos dados?",
    a: "Quando disponível, o perfil mostra identificadores públicos, rede de ensino e a data da fonte usada. Informações sensíveis a prazo devem ser reconfirmadas no canal oficial.",
  },
];

export const BASIC_RESOURCE_LABELS: Record<SchoolBasicResourceKey, string> = {
  water_supply: "Abastecimento de água",
  electricity: "Energia elétrica",
  sewage: "Esgoto",
  waste_collection: "Coleta de lixo",
};

export const ACCESSIBILITY_LABELS: Record<SchoolAccessibilityFeatureKey, string> = {
  handrails_guardrails: "Corrimão e guarda-corpos",
  elevator: "Elevador",
  tactile_flooring: "Pisos táteis",
  wide_doors_80cm: "Portas com vão livre >= 80 cm",
  ramps: "Rampas",
  sound_signage: "Sinalização sonora",
  tactile_signage: "Sinalização tátil",
  visual_signage: "Sinalização visual",
};

export const EQUIPMENT_LABELS: Record<SchoolEquipmentFeatureKey, string> = {
  satellite_dish: "Antena parabólica",
  computer: "Computador",
  copier: "Copiadora",
  printer: "Impressora",
  multifunction_printer: "Impressora multifuncional",
  scanner: "Scanner",
  dvd_player: "DVD",
  sound_system: "Aparelho de som",
  television: "Televisão",
  digital_whiteboard: "Lousa digital",
  multimedia_projector: "Projetor multimídia",
  desktop_computer: "Computador desktop",
  notebook: "Notebook",
  tablet: "Tablet",
  internet: "Internet",
};

export const FACILITY_LABELS: Record<SchoolFacilityFeatureKey, string> = {
  warehouse: "Almoxarifado",
  green_area: "Área verde",
  auditorium: "Auditório",
  bathroom: "Banheiro",
  child_bathroom: "Banheiro infantil",
  accessible_bathroom_pcd: "Banheiro acessível PCD",
  staff_bathroom: "Banheiro de funcionários",
  bathroom_with_shower: "Banheiro/vestiário com chuveiro",
  library: "Biblioteca",
  reading_room: "Sala de leitura",
  kitchen: "Cozinha",
  pantry: "Despensa",
  student_dormitory: "Dormitório de aluno",
  teacher_dormitory: "Dormitório de professor",
  science_lab: "Laboratório de ciências",
  computer_lab: "Laboratório de informática",
  covered_courtyard: "Pátio coberto",
  open_courtyard: "Pátio descoberto",
  playground: "Parque infantil",
  pool: "Piscina",
  parking: "Estacionamento/garagem",
  accessible_parking: "Vaga de estacionamento acessível",
  sports_court: "Quadra de esportes",
  covered_sports_court: "Quadra coberta",
  open_sports_court: "Quadra descoberta",
  cafeteria: "Refeitório",
  art_room: "Sala/ateliê de artes",
  music_room: "Sala de música/coral",
  dance_studio: "Sala de dança",
  multiuse_room: "Sala multiuso",
  principal_office: "Sala de diretoria",
  teacher_room: "Sala de professores",
  student_rest_room: "Sala de repouso para alunos",
  secretary_office: "Sala de secretaria",
  aee_resource_room: "Sala de recursos AEE",
  open_recreation_area: "Área aberta de recreação",
  animal_nursery: "Viveiro/criação de animais",
};

export function formatPrice(value: number | null) {
  if (value == null) return null;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function sanitizePublicEducationText(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/dados iniciais baseados[^.]*\./gi, "")
    .replace(/lista de espera/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
