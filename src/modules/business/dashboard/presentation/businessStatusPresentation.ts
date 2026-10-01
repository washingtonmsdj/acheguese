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
  tone: "success" | "warning" | "neutral";
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
          "bg-success/10 text-success",
        tone: "success",
        unavailablePublicMessage: "Link público ainda não disponível.",
      };
    case "pending":
      return {
        icon: Clock3,
        label: "Em análise",
        badgeClassName: "bg-warning/10 text-warning",
        tone: "warning",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
    case "suspended":
      return {
        icon: CircleAlert,
        label: "Suspensa",
        badgeClassName: "bg-muted text-muted-foreground",
        tone: "neutral",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
    case "deleted":
      return {
        icon: MinusCircle,
        label: "Desativada",
        badgeClassName: "bg-muted text-muted-foreground",
        tone: "neutral",
        unavailablePublicMessage:
          "Esta empresa foi desativada e não está disponível publicamente.",
      };
    case "inactive":
      return {
        icon: MinusCircle,
        label: "Inativa",
        badgeClassName: "bg-muted text-muted-foreground",
        tone: "neutral",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
    default:
      return {
        icon: MinusCircle,
        label: status,
        badgeClassName: "bg-muted text-muted-foreground",
        tone: "neutral",
        unavailablePublicMessage:
          "A página pública ficará disponível quando a empresa estiver ativa.",
      };
  }
}
