import { CheckCircle, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_REPORT_REASON_LABELS,
  type IssueCategory,
} from "@/core/community-issues";
import { getPriorityBadge } from "./AdminCommunityIssueBadges";
import type { IssueAdminItem } from "./AdminCommunityIssues.types";

interface AdminCommunityIssuesReviewListProps {
  reviewIssues?: IssueAdminItem[];
  isClearingReview: boolean;
  onClearReview: (issueId: string) => void;
  onOpenRemoveDialog: (issue: IssueAdminItem) => void;
}

export function AdminCommunityIssuesReviewList({
  reviewIssues,
  isClearingReview,
  onClearReview,
  onOpenRemoveDialog,
}: AdminCommunityIssuesReviewListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issues Sob Revisao</CardTitle>
        <CardDescription>
          Issues que atingiram o limite de reports e precisam de analise
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reviewIssues && reviewIssues.length > 0 ? (
          <div className="space-y-4">
            {reviewIssues.map((issue) => (
              <div key={issue.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge>{ISSUE_CATEGORY_LABELS[issue.category as IssueCategory]}</Badge>
                      {getPriorityBadge(issue.priority)}
                      <Badge variant="destructive">{issue.report_count} reports</Badge>
                    </div>
                    <h3 className="mb-1 font-medium">{issue.title}</h3>
                    <p className="mb-2 text-sm text-muted-foreground">{issue.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {issue.neighborhood_display}, {issue.city}
                    </p>

                    {issue.reports && issue.reports.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <p className="mb-2 text-sm font-medium">Motivos dos Reports:</p>
                        <div className="flex flex-wrap gap-2">
                          {issue.reports.map((report) => (
                            <Badge key={report.id} variant="outline">
                              {ISSUE_REPORT_REASON_LABELS[report.reason]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onClearReview(issue.id)}
                      disabled={isClearingReview}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onOpenRemoveDialog(issue)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum issue sob revisao no momento
          </p>
        )}
      </CardContent>
    </Card>
  );
}
