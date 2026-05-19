import {
  Camera,
  Eye,
  FileText,
  MapPin,
  Phone,
  Settings2,
  Shield,
  Tag,
} from "lucide-react";

export const STEPS = [
  { id: "info", label: "Informações", icon: FileText, number: 1 },
  { id: "price", label: "Preço", icon: Tag, number: 2 },
  { id: "location", label: "Localização", icon: MapPin, number: 3 },
  { id: "photos", label: "Fotos", icon: Camera, number: 4 },
  { id: "details", label: "Detalhes", icon: Settings2, number: 5 },
  { id: "contact", label: "Contato", icon: Phone, number: 6 },
  { id: "visibility", label: "Visibilidade", icon: Shield, number: 7 },
  { id: "preview", label: "Revisão", icon: Eye, number: 8 },
] as const;

export type StepId = typeof STEPS[number]["id"];

export function getStepAt(index: number) {
  return STEPS.at(index);
}
