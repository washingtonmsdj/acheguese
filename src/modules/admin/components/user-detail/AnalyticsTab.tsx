import {
  TrendingUp,
  AlertCircle,
  Award,
  Activity,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/utils/cn";
import type {
  AdminUserDetail,
  DriverDetail,
  UserReport,
} from "@/modules/admin/hooks/useAdminUserDetail";

interface AnalyticsTabProps {
  user: AdminUserDetail;
  driverData: DriverDetail | null;
  reportsReceived: UserReport[];
  reportsMade: UserReport[];
}

export function AnalyticsTab({
  user,
  driverData,
  reportsReceived,
  reportsMade,
}: AnalyticsTabProps) {
  // Calcular métricas
  const accountAge = user?.created_at
    ? Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const reportsReceivedCritical = reportsReceived.filter(
    (r) => r.severity === "critical",
  ).length;
  const reportsReceivedHigh = reportsReceived.filter(
    (r) => r.severity === "high",
  ).length;

  // Score de risco (0-100)
  let riskScore = 0;
  if (reportsReceived.length > 0)
    riskScore += Math.min(reportsReceived.length * 15, 40);
  if (reportsReceivedCritical > 0) riskScore += 30;
  if (reportsReceivedHigh > 0) riskScore += 20;
  if (user?.suspended) riskScore += 20;
  riskScore = Math.min(riskScore, 100);

  const getRiskLevel = (score: number) => {
    if (score >= 70)
      return {
        label: "Alto",
        color: "text-red-400",
        bg: "bg-red-500/20",
        border: "border-red-500/30",
      };
    if (score >= 40)
      return {
        label: "Médio",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/30",
      };
    return {
      label: "Baixo",
      color: "text-green-400",
      bg: "bg-green-500/20",
      border: "border-green-500/30",
    };
  };

  const riskLevel = getRiskLevel(riskScore);

  // Padrões identificados
  const patterns = [];
  if (reportsReceived.length >= 2) {
    patterns.push({
      icon: AlertCircle,
      text: `${reportsReceived.length} reports recebidos`,
      severity: "warning",
    });
  }
  if (reportsReceivedCritical > 0) {
    patterns.push({
      icon: AlertCircle,
      text: `${reportsReceivedCritical} reports críticos`,
      severity: "critical",
    });
  }
  if (driverData && driverData.cancellation_count > 5) {
    patterns.push({
      icon: AlertCircle,
      text: `${driverData.cancellation_count} cancelamentos`,
      severity: "warning",
    });
  }
  if (user?.suspended) {
    patterns.push({
      icon: AlertCircle,
      text: "Atualmente suspenso",
      severity: "critical",
    });
  }

  return (
    <div className="space-y-4">
      {/* Score de Risco */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Score de Risco
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{riskScore}</p>
              <p className="text-xs text-gray-400">de 100</p>
            </div>
            <Badge
              className={cn(
                "text-sm",
                riskLevel.bg,
                riskLevel.color,
                riskLevel.border,
              )}
            >
              Risco {riskLevel.label}
            </Badge>
          </div>
          <Progress value={riskScore} className="h-2" />
          <p className="text-xs text-gray-400">
            Baseado em reports, suspensões e comportamento
          </p>
        </CardContent>
      </Card>

      {/* Padrões Identificados */}
      {patterns.length > 0 && (
        <Card className="bg-[#1E2529] border-white/10">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Padrões Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patterns.map((pattern, index) => {
              const Icon = pattern.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded",
                    pattern.severity === "critical"
                      ? "bg-red-500/10"
                      : "bg-yellow-500/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      pattern.severity === "critical"
                        ? "text-red-400"
                        : "text-yellow-400",
                    )}
                  />
                  <span className="text-sm text-white">{pattern.text}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Gerais */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Estatísticas Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Idade da Conta</p>
              <p className="text-lg font-bold text-white">{accountAge} dias</p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Reputação</p>
              <p className="text-lg font-bold text-blue-400">
                {user?.reputation || 0}
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Reports Recebidos</p>
              <p className="text-lg font-bold text-red-400">
                {reportsReceived.length}
              </p>
            </div>
            <div className="p-3 bg-[#0A0F14] rounded-lg">
              <p className="text-xs text-gray-400">Reports Feitos</p>
              <p className="text-lg font-bold text-blue-400">
                {reportsMade.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas de Motorista */}
      {driverData && (
        <Card className="bg-[#1E2529] border-white/10">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />
              Performance como Motorista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Taxa de Aceitação</span>
                  <span className="text-white">
                    {driverData.acceptance_rate}%
                  </span>
                </div>
                <Progress value={driverData.acceptance_rate} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="p-2 bg-[#0A0F14] rounded text-center">
                  <p className="text-xs text-gray-400">Solicitações</p>
                  <p className="text-sm font-bold text-white">
                    {driverData.total_requests_received}
                  </p>
                </div>
                <div className="p-2 bg-[#0A0F14] rounded text-center">
                  <p className="text-xs text-gray-400">Aceitas</p>
                  <p className="text-sm font-bold text-green-400">
                    {driverData.total_requests_accepted}
                  </p>
                </div>
                <div className="p-2 bg-[#0A0F14] rounded text-center">
                  <p className="text-xs text-gray-400">Canceladas</p>
                  <p className="text-sm font-bold text-red-400">
                    {driverData.cancellation_count}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {riskScore >= 70 && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs">
              <p className="font-semibold text-red-400 mb-1">⚠️ Ação Urgente</p>
              <p className="text-red-200">
                Usuário de alto risco. Considere suspensão ou monitoramento
                intensivo.
              </p>
            </div>
          )}

          {reportsReceived.length >= 2 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
              <p className="font-semibold text-yellow-400 mb-1">⚠️ Atenção</p>
              <p className="text-yellow-200">
                Múltiplos reports recebidos. Investigar padrão de comportamento.
              </p>
            </div>
          )}

          {driverData && driverData.acceptance_rate < 50 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
              <p className="font-semibold text-yellow-400 mb-1">
                📊 Performance
              </p>
              <p className="text-yellow-200">
                Taxa de aceitação baixa. Considerar treinamento ou advertência.
              </p>
            </div>
          )}

          {riskScore < 40 && reportsReceived.length === 0 && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-xs">
              <p className="font-semibold text-green-400 mb-1">
                ✅ Usuário Confiável
              </p>
              <p className="text-green-200">
                Sem histórico de problemas. Usuário em boa situação.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
