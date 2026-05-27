import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useSSOTMonitoring } from "@/shared/hooks/useSSOTMonitoring";
import { cn } from "@/shared/utils/cn";

/**
 * Dashboard de monitoramento SSOT
 * Exibe métricas de conformidade e violações em tempo real
 */
export function SSOTDashboard() {
  const { data, loading, error } = useSSOTMonitoring();

  const getComplianceColor = (rate: number) => {
    if (rate === 100) return "text-success";
    if (rate >= 95) return "text-warning";
    return "text-destructive";
  };

  const getComplianceIcon = (rate: number) => {
    if (rate === 100) return CheckCircle;
    if (rate >= 95) return AlertTriangle;
    return AlertTriangle;
  };

  const ComplianceIcon = getComplianceIcon(data.complianceRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            SSOT Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real da conformidade SSOT
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
          />
          Atualizar
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao verificar conformidade: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conformidade
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getComplianceColor(data.complianceRate),
                  )}
                >
                  {data.complianceRate}%
                </p>
              </div>
              <ComplianceIcon
                className={cn(
                  "h-8 w-8",
                  getComplianceColor(data.complianceRate),
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Registros
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {data.totalRecords}
                </p>
              </div>
              <Database className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Violações
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {data.violations.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Última Verificação
                </p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(data.lastCheck).toLocaleTimeString("pt-BR")}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations List */}
      {data.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Violações SSOT Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.violations.map((violation, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {violation.table}.{violation.column}
                      </Badge>
                      <span className="text-sm font-mono text-destructive">
                        "{violation.value}"
                      </span>
                    </div>
                    <p className="text-xs text-destructive/80">
                      ID: {violation.recordId} •{" "}
                      {new Date(violation.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30"
                  >
                    Corrigir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {data.violations.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-success mb-2">
                Sistema 100% Conforme!
              </h3>
              <p className="text-sm text-success/80">
                Nenhuma violação SSOT detectada. Todos os {data.totalRecords}{" "}
                registros estão em conformidade.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
