import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import type { UserReport } from "@/core/admin/services/AdminUserDetailService";
import type {
  AdminUserDetail,
  DriverDetail,
} from "@/modules/admin/hooks/useAdminUserDetail";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/utils/cn";

interface AnalyticsTabProps {
  user: AdminUserDetail;
  driverData: DriverDetail | null;
  reportsReceived: UserReport[];
  reportsMade: UserReport[];
}

type RiskTone = "destructive" | "warning" | "success";

const RISK_TONE_CLASSES: Record<
  RiskTone,
  { badge: string; surface: string; copy: string }
> = {
  destructive: {
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
    surface: "border-destructive/30 bg-destructive/10",
    copy: "text-destructive",
  },
  warning: {
    badge: "border-warning/30 bg-warning/10 text-warning",
    surface: "border-warning/30 bg-warning/10",
    copy: "text-warning",
  },
  success: {
    badge: "border-success/30 bg-success/10 text-success",
    surface: "border-success/30 bg-success/10",
    copy: "text-success",
  },
};

function getRiskLevel(score: number): { label: string; tone: RiskTone } {
  if (score >= 70) return { label: "Alto", tone: "destructive" };
  if (score >= 40) return { label: "Médio", tone: "warning" };
  return { label: "Baixo", tone: "success" };
}

export function AnalyticsTab({
  user,
  driverData,
  reportsReceived,
  reportsMade,
}: AnalyticsTabProps) {
  const accountAge = user?.created_at
    ? Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const reportsReceivedCritical = reportsReceived.filter(
    (report) => report.severity === "critical",
  ).length;
  const reportsReceivedHigh = reportsReceived.filter(
    (report) => report.severity === "high",
  ).length;

  let riskScore = 0;
  if (reportsReceived.length > 0) {
    riskScore += Math.min(reportsReceived.length * 15, 40);
  }
  if (reportsReceivedCritical > 0) riskScore += 30;
  if (reportsReceivedHigh > 0) riskScore += 20;
  if (user?.suspended) riskScore += 20;
  riskScore = Math.min(riskScore, 100);

  const riskLevel = getRiskLevel(riskScore);
  const riskTone = RISK_TONE_CLASSES[riskLevel.tone];
  const driverCancellationCount = driverData?.total_rides_cancelled ?? 0;
  const driverAcceptanceRate = driverData?.acceptance_rate ?? null;

  const patterns: Array<{
    icon: typeof AlertCircle;
    text: string;
    tone: "destructive" | "warning";
  }> = [];

  if (reportsReceived.length >= 2) {
    patterns.push({
      icon: AlertCircle,
      text: `${reportsReceived.length} reports recebidos`,
      tone: "warning",
    });
  }
  if (reportsReceivedCritical > 0) {
    patterns.push({
      icon: AlertCircle,
      text: `${reportsReceivedCritical} reports críticos`,
      tone: "destructive",
    });
  }
  if (driverData && driverCancellationCount > 5) {
    patterns.push({
      icon: AlertCircle,
      text: `${driverCancellationCount} corridas canceladas`,
      tone: "warning",
    });
  }
  if (user?.suspended) {
    patterns.push({
      icon: AlertCircle,
      text: "Atualmente suspenso",
      tone: "destructive",
    });
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Score de risco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-foreground">{riskScore}</p>
              <p className="text-xs text-muted-foreground">de 100</p>
            </div>
            <Badge className={cn("border text-sm", riskTone.badge)}>
              Risco {riskLevel.label}
            </Badge>
          </div>
          <Progress value={riskScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Baseado em reports, suspensões e comportamento.
          </p>
        </CardContent>
      </Card>

      {patterns.length > 0 ? (
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              Padrões identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patterns.map((pattern) => {
              const Icon = pattern.icon;
              const tone = RISK_TONE_CLASSES[pattern.tone];
              return (
                <div
                  key={pattern.text}
                  className={cn("flex items-center gap-2 rounded border p-2", tone.surface)}
                >
                  <Icon className={cn("h-4 w-4", tone.copy)} aria-hidden="true" />
                  <span className="text-sm text-foreground">{pattern.text}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Estatísticas gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Idade da conta" value={`${accountAge} dias`} />
            <MetricCard
              label="Reputação"
              value={String(user?.reputation || 0)}
              tone="info"
            />
            <MetricCard
              label="Reports recebidos"
              value={String(reportsReceived.length)}
              tone="destructive"
            />
            <MetricCard
              label="Reports feitos"
              value={String(reportsMade.length)}
              tone="info"
            />
          </div>
        </CardContent>
      </Card>

      {driverData ? (
        <Card className="border-border bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4" aria-hidden="true" />
              Histórico como motorista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">Taxa de aceitação</span>
                  <span className="text-foreground">
                    {driverAcceptanceRate === null ? "N/A" : `${driverAcceptanceRate}%`}
                  </span>
                </div>
                <Progress value={driverAcceptanceRate ?? 0} className="h-2" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MetricCard
                  compact
                  label="Registradas"
                  value={String(driverData.total_rides ?? 0)}
                />
                <MetricCard
                  compact
                  label="Concluídas"
                  value={String(driverData.total_rides_completed ?? 0)}
                  tone="success"
                />
                <MetricCard
                  compact
                  label="Canceladas"
                  value={String(driverCancellationCount)}
                  tone="destructive"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {riskScore >= 70 ? (
            <Recommendation
              tone="destructive"
              icon={AlertCircle}
              title="Ação urgente"
              description="Usuário de alto risco. Considere suspensão ou monitoramento intensivo."
            />
          ) : null}

          {reportsReceived.length >= 2 ? (
            <Recommendation
              tone="warning"
              icon={AlertCircle}
              title="Atenção"
              description="Múltiplos reports recebidos. Investigue o padrão de comportamento."
            />
          ) : null}

          {driverData && driverAcceptanceRate !== null && driverAcceptanceRate < 50 ? (
            <Recommendation
              tone="warning"
              icon={BarChart3}
              title="Performance"
              description="Taxa de aceitação baixa. Revise o histórico operacional antes de qualquer ação."
            />
          ) : null}

          {riskScore < 40 && reportsReceived.length === 0 ? (
            <Recommendation
              tone="success"
              icon={CheckCircle2}
              title="Usuário confiável"
              description="Sem histórico de problemas. Usuário em boa situação."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
  compact = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "info" | "success" | "destructive";
  compact?: boolean;
}) {
  const toneClass = {
    default: "text-foreground",
    info: "text-info",
    success: "text-success",
    destructive: "text-destructive",
  }[tone];

  return (
    <div className={cn("rounded-lg bg-muted/60", compact ? "p-2 text-center" : "p-3")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn(compact ? "text-sm font-bold" : "text-lg font-bold", toneClass)}>
        {value}
      </p>
    </div>
  );
}

function Recommendation({
  tone,
  icon: Icon,
  title,
  description,
}: {
  tone: RiskTone;
  icon: typeof AlertCircle;
  title: string;
  description: string;
}) {
  const classes = RISK_TONE_CLASSES[tone];
  return (
    <div className={cn("rounded border p-3 text-xs", classes.surface)}>
      <p className={cn("mb-1 flex items-center gap-1.5 font-semibold", classes.copy)}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {title}
      </p>
      <p className="text-foreground/85">{description}</p>
    </div>
  );
}
