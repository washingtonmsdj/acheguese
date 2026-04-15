import { AlertTriangle, Flag, CheckCircle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/shared/utils/cn";
import type { UserReport } from "@/modules/admin/hooks/useAdminUserDetail";

interface ReportsTabProps {
  reportsReceived: UserReport[];
  reportsMade: UserReport[];
}

const SEVERITY_CONFIG = {
  low: {
    label: "Baixa",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  medium: {
    label: "Média",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  high: {
    label: "Alta",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  critical: {
    label: "Crítica",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
} as const;

const STATUS_CONFIG = {
  pending: { label: "Pendente", icon: AlertTriangle, color: "text-yellow-400" },
  investigating: { label: "Investigando", icon: Flag, color: "text-blue-400" },
  resolved: { label: "Resolvido", icon: CheckCircle, color: "text-green-400" },
  dismissed: { label: "Arquivado", icon: XCircle, color: "text-gray-400" },
} as const;

export function ReportsTab({ reportsReceived, reportsMade }: ReportsTabProps) {
  return (
    <div className="space-y-4">
      {/* Reports Recebidos */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Reports Recebidos
            </span>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {reportsReceived.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsReceived.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">
              Nenhum report recebido
            </p>
          ) : (
            <div className="space-y-2">
              {reportsReceived.map((report) => {
                const StatusIcon =
                  STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]
                    ?.icon || Flag;
                return (
                  <div
                    key={report.id}
                    className="p-3 bg-[#0A0F14] rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">
                          {report.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          Por {report.reporter_name} •{" "}
                          {formatDistanceToNow(new Date(report.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          SEVERITY_CONFIG[
                            report.severity as keyof typeof SEVERITY_CONFIG
                          ]?.color,
                        )}
                      >
                        {
                          SEVERITY_CONFIG[
                            report.severity as keyof typeof SEVERITY_CONFIG
                          ]?.label
                        }
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        className={cn(
                          "h-3 w-3",
                          STATUS_CONFIG[
                            report.status as keyof typeof STATUS_CONFIG
                          ]?.color,
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          STATUS_CONFIG[
                            report.status as keyof typeof STATUS_CONFIG
                          ]?.color,
                        )}
                      >
                        {
                          STATUS_CONFIG[
                            report.status as keyof typeof STATUS_CONFIG
                          ]?.label
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Feitos */}
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-blue-400" />
              Reports Feitos
            </span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {reportsMade.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsMade.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">
              Nenhum report feito
            </p>
          ) : (
            <div className="space-y-2">
              {reportsMade.map((report) => {
                const StatusIcon =
                  STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]
                    ?.icon || Flag;
                return (
                  <div
                    key={report.id}
                    className="p-3 bg-[#0A0F14] rounded-lg border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-white flex-1">
                        {report.title}
                      </p>
                      <Badge
                        className={cn(
                          "text-xs",
                          SEVERITY_CONFIG[
                            report.severity as keyof typeof SEVERITY_CONFIG
                          ]?.color,
                        )}
                      >
                        {
                          SEVERITY_CONFIG[
                            report.severity as keyof typeof SEVERITY_CONFIG
                          ]?.label
                        }
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {formatDistanceToNow(new Date(report.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusIcon
                        className={cn(
                          "h-3 w-3",
                          STATUS_CONFIG[
                            report.status as keyof typeof STATUS_CONFIG
                          ]?.color,
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs",
                          STATUS_CONFIG[
                            report.status as keyof typeof STATUS_CONFIG
                          ]?.color,
                        )}
                      >
                        {
                          STATUS_CONFIG[
                            report.status as keyof typeof STATUS_CONFIG
                          ]?.label
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
