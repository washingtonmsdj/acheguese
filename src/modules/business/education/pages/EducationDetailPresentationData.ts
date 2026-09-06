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
  regular_school: "from-blue-600 via-blue-500 to-indigo-600",
  daycare: "from-pink-500 via-rose-400 to-pink-600",
  language_school: "from-emerald-500 via-teal-400 to-emerald-600",
  prep_course: "from-orange-500 via-amber-400 to-orange-600",
  technical_school: "from-violet-600 via-purple-500 to-violet-700",
  tutoring_center: "from-cyan-500 via-blue-400 to-cyan-600",
  music_school: "from-fuchsia-500 via-pink-400 to-fuchsia-600",
  sports_school: "from-lime-500 via-green-400 to-emerald-600",
};

export function buildWhatsAppHref(phone?: string | null): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  const normalized = digits.startsWith("55") ? digits : `55${digits.replace(/^0+/, "")}`;
  return `https://wa.me/${normalized}`;
}

export function getSections(labels: { programPlural: string; eventPlural: string }) {
  return [
    { id: "overview", label: "Visao geral", icon: Compass },
    { id: "infrastructure", label: "Infraestrutura", icon: Building2 },
    { id: "programs", label: labels.programPlural, icon: BookOpen },
    { id: "modalities", label: "Modalidades", icon: Globe },
    { id: "team", label: "Equipe", icon: Users },
    { id: "gallery", label: "Galeria", icon: Camera },
    { id: "events", label: labels.eventPlural, icon: Calendar },
    { id: "testimonials", label: "Depoimentos", icon: Quote },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "location", label: "Localizacao", icon: MapIcon },
  ] as const;
}

export const FALLBACK_FAQ = [
  {
    q: "Como confirmar matricula, vagas ou horarios?",
    a: "Informacoes operacionais podem mudar ao longo do ano. Confirme pelos canais oficiais da rede ou da instituicao. O Achegue-se so sinaliza disponibilidade quando houver dado cadastrado para isso.",
  },
  {
    q: "Se uma infraestrutura nao aparece, significa que a unidade nao possui?",
    a: "Nao. A ausencia de um item significa apenas que ele ainda nao foi confirmado por uma fonte confiavel para este perfil.",
  },
  {
    q: "Como saber a origem dos dados?",
    a: "Quando disponivel, o perfil mostra identificadores publicos, rede de ensino e a data da fonte usada. Informacoes sensiveis a prazo devem ser reconfirmadas no canal oficial.",
  },
];

export const BASIC_RESOURCE_LABELS: Record<SchoolBasicResourceKey, string> = {
  water_supply: "Abastecimento de agua",
  electricity: "Energia eletrica",
  sewage: "Esgoto",
  waste_collection: "Coleta de lixo",
};

export const ACCESSIBILITY_LABELS: Record<SchoolAccessibilityFeatureKey, string> = {
  handrails_guardrails: "Corrimao e guarda-corpos",
  elevator: "Elevador",
  tactile_flooring: "Pisos tateis",
  wide_doors_80cm: "Portas com vao livre >= 80cm",
  ramps: "Rampas",
  sound_signage: "Sinalizacao sonora",
  tactile_signage: "Sinalizacao tatil",
  visual_signage: "Sinalizacao visual",
};

export const EQUIPMENT_LABELS: Record<SchoolEquipmentFeatureKey, string> = {
  satellite_dish: "Antena parabolica",
  computer: "Computador",
  copier: "Copiadora",
  printer: "Impressora",
  multifunction_printer: "Impressora multifuncional",
  scanner: "Scanner",
  dvd_player: "DVD",
  sound_system: "Aparelho de som",
  television: "Televisao",
  digital_whiteboard: "Lousa digital",
  multimedia_projector: "Projetor multimidia",
  desktop_computer: "Computador desktop",
  notebook: "Notebook",
  tablet: "Tablet",
  internet: "Internet",
};

export const FACILITY_LABELS: Record<SchoolFacilityFeatureKey, string> = {
  warehouse: "Almoxarifado",
  green_area: "Area verde",
  auditorium: "Auditorio",
  bathroom: "Banheiro",
  child_bathroom: "Banheiro infantil",
  accessible_bathroom_pcd: "Banheiro acessivel PCD",
  staff_bathroom: "Banheiro de funcionarios",
  bathroom_with_shower: "Banheiro/vestiario com chuveiro",
  library: "Biblioteca",
  reading_room: "Sala de leitura",
  kitchen: "Cozinha",
  pantry: "Despensa",
  student_dormitory: "Dormitorio de aluno",
  teacher_dormitory: "Dormitorio de professor",
  science_lab: "Laboratorio de ciencias",
  computer_lab: "Laboratorio de informatica",
  covered_courtyard: "Patio coberto",
  open_courtyard: "Patio descoberto",
  playground: "Parque infantil",
  pool: "Piscina",
  parking: "Estacionamento/garagem",
  accessible_parking: "Vaga de estacionamento acessível",
  sports_court: "Quadra de esportes",
  covered_sports_court: "Quadra coberta",
  open_sports_court: "Quadra descoberta",
  cafeteria: "Refeitorio",
  art_room: "Sala/atelie de artes",
  music_room: "Sala de musica/coral",
  dance_studio: "Sala de danca",
  multiuse_room: "Sala multiuso",
  principal_office: "Sala de diretoria",
  teacher_room: "Sala de professores",
  student_rest_room: "Sala de repouso para alunos",
  secretary_office: "Sala de secretaria",
  aee_resource_room: "Sala de recursos AEE",
  open_recreation_area: "Area aberta de recreacao",
  animal_nursery: "Viveiro/criacao de animais",
};

export function formatPrice(value: number | null) {
  if (!value) return null;
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
