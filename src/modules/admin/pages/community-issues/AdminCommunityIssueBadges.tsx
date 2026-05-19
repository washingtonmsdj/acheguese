import { AlertCircle, ArrowDown, ArrowUp } from "lucide-react";
import { Badge, type BadgeProps } from "@/shared/components/ui/badge";
import {
  ISSUE_PRIORITY_LABELS,
  type IssuePriority,
  type IssueStatus,
} from "@/shared/services/communityIssues";
import type { LucideIcon } from "lucide-react";

export function getStatusBadge(status: IssueStatus) {
  const variants: Record<IssueStatus, { variant: BadgeProps["variant"]; label: string }> = {
    aberto: { variant: "default", label: "Aberto" },
    em_analise: { variant: "secondary", label: "Em Analise" },
    em_andamento: { variant: "outline", label: "Em Andamento" },
    resolvido: { variant: "default", label: "Resolvido" },
    rejeitado: { variant: "destructive", label: "Rejeitado" },
  };
  const config = variants[status] ?? variants.aberto;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function getPriorityBadge(priority: IssuePriority) {
  const variants: Record<IssuePriority, { variant: BadgeProps["variant"]; icon: LucideIcon | null }> = {
    baixa: { variant: "outline", icon: ArrowDown },
    media: { variant: "secondary", icon: null },
    alta: { variant: "default", icon: ArrowUp },
    urgente: { variant: "destructive", icon: AlertCircle },
  };
  const config = variants[priority] ?? variants.media;
  const Icon = config.icon;
  const priorityLabel = ISSUE_PRIORITY_LABELS[priority] ?? ISSUE_PRIORITY_LABELS.media;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {Icon && <Icon className="h-3 w-3" />}
      {priorityLabel}
    </Badge>
  );
}
