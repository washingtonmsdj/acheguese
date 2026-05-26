import { Badge, type BadgeProps } from "@/shared/components/ui/badge";
import type { AlertStatus } from "@/core/community/alerts";

export function getAlertStatusBadge(status: AlertStatus) {
  const variants: Record<AlertStatus, { variant: BadgeProps["variant"]; label: string }> = {
    ativo: { variant: "default", label: "Ativo" },
    encerrado: { variant: "secondary", label: "Encerrado" },
    expirado: { variant: "outline", label: "Expirado" },
    removido: { variant: "destructive", label: "Removido" },
  };
  const config = variants[status] ?? variants.ativo;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
