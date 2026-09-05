import { TrendingUp } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "@/core/community-issues";
import type {
  IssueAdminItem,
  IssueResolutionRate,
} from "./AdminCommunityIssues.types";

interface AdminCommunityIssuesAnalyticsProps {
  resolutionRate?: Partial<IssueResolutionRate>;
  topSupported?: IssueAdminItem[];
  categoryStats?: Partial<Record<IssueCategory, number>>;
}

export function AdminCommunityIssuesAnalytics({
  resolutionRate,
  topSupported,
  categoryStats,
}: AdminCommunityIssuesAnalyticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Resolucao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {resolutionRate?.rate || 0}%
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {resolutionRate?.resolved || 0} resolvidos de {resolutionRate?.total || 0} total
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Issues Mais Apoiados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSupported && topSupported.length > 0 ? (
            <div className="space-y-3">
              {topSupported.slice(0, 5).map((issue, index) => (
                <div key={issue.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="truncate text-sm font-medium">
                      #{index + 1} - {issue.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {issue.neighborhood_display}
                    </p>
                  </div>
                  <Badge variant="outline">{issue.support_count} apoios</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">Nenhum dado disponivel</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Issues por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryStats && Object.keys(categoryStats).length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Object.entries(categoryStats)
                .sort(([, first], [, second]) => (second as number) - (first as number))
                .map(([category, count]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <p className="text-sm">
                      {ISSUE_CATEGORY_LABELS[category as IssueCategory]}
                    </p>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-4 text-center text-muted-foreground">Nenhum dado disponivel</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
