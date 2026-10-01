import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  MinusCircle,
  type LucideIcon,
} from "lucide-react";

export interface BusinessStatusPresentation {
  icon: LucideIcon;
  label: string;
  badgeClassName: string;
  unavailablePublicMessage: string;
}

export function getBusinessStatusPresentation(
  status: string,
): BusinessStatusPresentation {
  switch (status) {
    case "active":
      return {
        icon: CheckCircle2,
        label: "Ativa",
        badgeClassName:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        unavailablePublicMessage: "Link público ainda não disponível.",
      };
    case "pending":
      return {
        icon: Clock3,
        label: "Em análise",
        badgeClassName: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
    case "suspended":
      return {
        icon: CircleAlert,
        label: "Suspensa",
        badgeClassName: "bg-muted text-foreground",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
    case "deleted":
      return {
        icon: MinusCircle,
        label: "Desativada",
        badgeClassName: "bg-muted text-foreground",
        unavailablePublicMessage:
          "Esta empresa foi desativada e não está disponível publicamente.",
      };
    case "inactive":
      return {
        icon: MinusCircle,
        label: "Inativa",
        badgeClassName: "bg-muted text-foreground",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
    default:
      return {
        icon: MinusCircle,
        label: status,
        badgeClassName: "bg-muted text-foreground",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
  }
}
