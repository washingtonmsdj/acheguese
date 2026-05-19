import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { IssueStatsSummary } from "./AdminCommunityIssues.types";

interface AdminCommunityIssuesStatsProps {
  stats?: Partial<IssueStatsSummary>;
}

export function AdminCommunityIssuesStats({ stats }: AdminCommunityIssuesStatsProps) {
  const cards = [
    { label: "Total de Issues", value: stats?.total || 0, className: "" },
    { label: "Abertos", value: stats?.aberto || 0, className: "text-blue-600" },
    { label: "Em Andamento", value: stats?.em_andamento || 0, className: "text-orange-600" },
    { label: "Resolvidos", value: stats?.resolvido || 0, className: "text-green-600" },
    { label: "Sob Revisao", value: stats?.underReview || 0, className: "text-red-600" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.className}`}>{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
