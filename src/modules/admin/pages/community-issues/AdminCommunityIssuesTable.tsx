import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  ISSUE_CATEGORY_LABELS,
  type IssueCategory,
} from "@/shared/services/communityIssues";
import { getPriorityBadge, getStatusBadge } from "./AdminCommunityIssueBadges";
import type { IssueAdminItem } from "./AdminCommunityIssues.types";

interface IssuesPageData {
  data?: IssueAdminItem[];
  page: number;
  totalPages: number;
}

interface AdminCommunityIssuesTableProps {
  issuesData?: IssuesPageData;
  isLoading: boolean;
  page: number;
  isClearingReview: boolean;
  onPageChange: (page: number) => void;
  onClearReview: (issueId: string) => void;
  onOpenStatusDialog: (issue: IssueAdminItem) => void;
  onOpenRemoveDialog: (issue: IssueAdminItem) => void;
}

export function AdminCommunityIssuesTable({
  issuesData,
  isLoading,
  page,
  isClearingReview,
  onPageChange,
  onClearReview,
  onOpenStatusDialog,
  onOpenRemoveDialog,
}: AdminCommunityIssuesTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Localizacao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Apoios</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issuesData?.data?.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="max-w-xs font-medium">
                      <div className="truncate">{issue.title}</div>
                      {issue.under_review && (
                        <Badge variant="outline" className="mt-1">
                          Em Revisao
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {ISSUE_CATEGORY_LABELS[issue.category as IssueCategory]}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{issue.neighborhood_display}</div>
                        <div className="text-muted-foreground">{issue.city}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.support_count || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(issue.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {issue.under_review && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onClearReview(issue.id)}
                            disabled={isClearingReview}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenStatusDialog(issue)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onOpenRemoveDialog(issue)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {issuesData && issuesData.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Pagina {issuesData.page} de {issuesData.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === issuesData.totalPages}
                    onClick={() => onPageChange(page + 1)}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
