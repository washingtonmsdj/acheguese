import { AlertTriangle, CheckCircle, Flag, XCircle } from "lucide-react";
import type { UserReport } from "@/core/admin/services/AdminUserDetailService";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";
import { formatDistanceToNow } from "date-fns";

interface ReportsTabProps {
  reportsReceived: UserReport[];
  reportsMade: UserReport[];
}

const SEVERITY_CONFIG = {
  low: {
    label: "Baixa",
    color: "border-border bg-muted text-muted-foreground",
  },
  medium: {
    label: "Média",
    color: "border-warning/30 bg-warning/10 text-warning",
  },
  high: {
    label: "Alta",
    color: "border-warning/50 bg-warning/15 text-warning",
  },
  critical: {
    label: "Crítica",
    color: "border-destructive/30 bg-destructive/10 text-destructive",
  },
} as const;

const STATUS_CONFIG = {
  pending: { label: "Pendente", icon: AlertTriangle, color: "text-warning" },
  investigating: { label: "Investigando", icon: Flag, color: "text-info" },
  resolved: { label: "Resolvido", icon: CheckCircle, color: "text-success" },
  dismissed: { label: "Arquivado", icon: XCircle, color: "text-muted-foreground" },
} as const;

export function ReportsTab({ reportsReceived, reportsMade }: ReportsTabProps) {
  return (
    <div className="space-y-4">
      <ReportSection
        title="Reports recebidos"
        icon={AlertTriangle}
        iconClassName="text-destructive"
        count={reportsReceived.length}
        countClassName="border-destructive/30 bg-destructive/10 text-destructive"
        reports={reportsReceived}
        emptyMessage="Nenhum report recebido"
        showReporter
      />

      <ReportSection
        title="Reports feitos"
        icon={Flag}
        iconClassName="text-info"
        count={reportsMade.length}
        countClassName="border-info/30 bg-info/10 text-info"
        reports={reportsMade}
        emptyMessage="Nenhum report feito"
      />
    </div>
  );
}

function ReportSection({
  title,
  icon: Icon,
  iconClassName,
  count,
  countClassName,
  reports,
  emptyMessage,
  showReporter = false,
}: {
  title: string;
  icon: typeof Flag;
  iconClassName: string;
  count: number;
  countClassName: string;
  reports: UserReport[];
  emptyMessage: string;
  showReporter?: boolean;
}) {
  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
            {title}
          </span>
          <Badge className={cn("border", countClassName)}>{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <ReportItem key={report.id} report={report} showReporter={showReporter} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReportItem({ report, showReporter }: { report: UserReport; showReporter: boolean }) {
  const severity =
    SEVERITY_CONFIG[report.severity as keyof typeof SEVERITY_CONFIG] ??
    SEVERITY_CONFIG.low;
  const status =
    STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.dismissed;
  const StatusIcon = status.icon;

  return (
    <article className="rounded-lg border border-border bg-muted/40 p-3 transition-colors hover:border-ring/40">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{report.title}</p>
          <p className="text-xs text-muted-foreground">
            {showReporter && report.reporter_name ? `Por ${report.reporter_name} • ` : null}
            {formatDistanceToNow(new Date(report.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        <Badge className={cn("shrink-0 border text-xs", severity.color)}>
          {severity.label}
        </Badge>
      </div>

      {report.description ? (
        <p className="mb-2 line-clamp-2 text-xs text-foreground/80">
          {report.description}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <StatusIcon className={cn("h-3 w-3", status.color)} aria-hidden="true" />
        <span className={cn("text-xs", status.color)}>{status.label}</span>
      </div>
    </article>
  );
}
