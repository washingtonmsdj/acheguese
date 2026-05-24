import {
  AlertTriangle,
  Car,
  Construction,
  Droplets,
  Flame,
  Siren,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AlertType } from "@/core/alerts/types";

export interface AlertTypeOption {
  value: AlertType;
  label: string;
  icon: LucideIcon;
  badgeClassName: string;
  iconClassName: string;
}

export const ALERT_TYPE_OPTIONS: AlertTypeOption[] = [
  {
    value: "crime",
    label: "Crime",
    icon: Siren,
    badgeClassName: "bg-red-100 text-red-700",
    iconClassName: "text-red-600",
  },
  {
    value: "accident",
    label: "Acidente",
    icon: Car,
    badgeClassName: "bg-orange-100 text-orange-700",
    iconClassName: "text-orange-600",
  },
  {
    value: "fire",
    label: "Incêndio",
    icon: Flame,
    badgeClassName: "bg-red-100 text-red-700",
    iconClassName: "text-red-600",
  },
  {
    value: "flood",
    label: "Alagamento",
    icon: Waves,
    badgeClassName: "bg-blue-100 text-blue-700",
    iconClassName: "text-blue-600",
  },
  {
    value: "power_outage",
    label: "Falta de luz",
    icon: Zap,
    badgeClassName: "bg-yellow-100 text-yellow-800",
    iconClassName: "text-yellow-600",
  },
  {
    value: "water_outage",
    label: "Falta de água",
    icon: Droplets,
    badgeClassName: "bg-blue-100 text-blue-700",
    iconClassName: "text-blue-600",
  },
  {
    value: "road_closure",
    label: "Via bloqueada",
    icon: Construction,
    badgeClassName: "bg-orange-100 text-orange-700",
    iconClassName: "text-orange-600",
  },
  {
    value: "other",
    label: "Outro",
    icon: AlertTriangle,
    badgeClassName: "bg-gray-100 text-gray-700",
    iconClassName: "text-gray-600",
  },
];

export const ALERT_TYPE_CONFIG = ALERT_TYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option;
    return acc;
  },
  {} as Record<AlertType, AlertTypeOption>,
);
