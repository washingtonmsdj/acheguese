import { Badge } from "@/shared/components/ui/badge";

export type ReadFilter = "all" | "read" | "unread";

export function formatNotificationType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function getTypeCount(byType: Record<string, number> | undefined, type: string): number {
  if (!byType) return 0;
  const typeEntry = Object.entries(byType).find(([key]) => key === type);
  return typeEntry ? Number(typeEntry[1]) : 0;
}

export function getPriorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return <Badge variant="destructive">Urgente</Badge>;
    case "high":
      return <Badge className="bg-orange-500 hover:bg-orange-500">Alta</Badge>;
    case "medium":
      return <Badge variant="secondary">Media</Badge>;
    default:
      return <Badge variant="outline">Baixa</Badge>;
  }
}
