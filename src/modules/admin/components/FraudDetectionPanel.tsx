/**
 * Painel Administrativo de Detecção de Fraudes
 *
 * Exibe alertas de fraude detectados automaticamente e permite revisão.
 */

import { useState, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { profileService } from "@/core/profiles/services";
import { AdminFraudService } from "@/core/admin/services/AdminFraudService";
import type { FraudAlert } from "@/core/admin/services/AdminFraudService";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Shield,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { RIDE_STATUS, ALERT_STATUS } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";
import { adminMobilityService } from "@/core/admin"; // ✅ MIGRADO - Usa AdminMobilityService do core

interface FraudEvidence {
  duration_minutes?: number;
  quick_rides_count?: number;
  zero_distance_count?: number;
  [key: string]: string | number | boolean | undefined;
}
type FraudRideSummary = {
  id: string;
  origin?: string | null;
  destination?: string | null;
};
type FraudDriverSummary = {
  profile?: { name?: string | null } | null;
};
type FraudAlertExtended = FraudAlert & {
  ride?: FraudRideSummary | null;
  driver?: FraudDriverSummary | null;
};

export function FraudDetectionPanel() {
  const [alerts, setAlerts] = useState<FraudAlertExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlertExtended | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    critical: 0,
  });

  useEffect(() => {
    loadAlerts();
    loadStats();
  }, []);

  const loadAlerts = async () => {
    try {
      const rawAlerts = await AdminFraudService.getAlerts(50);

      const rideIds = [...new Set(rawAlerts.map((a) => a.ride_id).filter(Boolean))];
      const driverProfileIds = [...new Set(rawAlerts.map((a) => a.driver_profile_id).filter(Boolean))];

      const [ridesData, driversData] = await Promise.all([
        rideIds.length > 0
          ? adminMobilityService.getUserRides(driverProfileIds[0] || "").then((data) => ({ data }))
          : Promise.resolve({ data: [] as FraudRideSummary[] }),
        profileService.getProfilesSummary(driverProfileIds as string[]),
      ]);

      const rideMap = new Map((ridesData.data || []).map((r) => [r.id, r]));
      const driverMap = new Map(driversData.map((d) => [d.id, { id: d.id, name: d.name }]));

      setAlerts(
        rawAlerts.map((alert) => ({
          ...alert,
          ride: alert.ride_id ? rideMap.get(alert.ride_id) : null,
          driver: alert.driver_profile_id ? { profile: driverMap.get(alert.driver_profile_id) } : null,
        })),
      );
    } catch (error) {
      logger.error("Error loading alerts:", error);
      toast.error("Erro ao carregar alertas");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await AdminFraudService.getStats();
      setStats(s);
    } catch (error) {
      logger.error("Erro ao carregar estatísticas:", error);
    }
  };

  const updateAlertStatus = async (
    alertId: string,
    newStatus: FraudAlert["status"],
  ) => {
    try {
      await AdminFraudService.updateAlertStatus(alertId, newStatus, resolutionNotes || undefined);
      toast.success("Status atualizado");
      setSelectedAlert(null);
      setResolutionNotes("");
      loadAlerts();
      loadStats();
    } catch (error) {
      logger.error("Error updating alert status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-red-500/10 text-red-500";
      case "false_positive":
        return "bg-green-500/10 text-green-500";
      case ALERT_STATUS.RESOLVED:
        return "bg-blue-500/10 text-blue-500";
      case "investigating":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getFraudTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quick_ride: "⚡ Corrida Rápida",
      zero_distance: "📍 Distância Zero",
      pattern_quick_rides: "🔄 Padrão: Corridas Rápidas",
      pattern_zero_distance: "🔄 Padrão: Distância Zero",
      fake_completion: "🎭 Conclusão Falsa",
    };
    return Object.entries(labels).find(([key]) => key === type)?.[1] ?? type;
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-500" />
          Detecção de Fraudes
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sistema automático de detecção de padrões suspeitos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground">Total de Alertas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {stats.critical}
              </p>
              <p className="text-xs text-muted-foreground">Críticos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card className="p-8 text-center bg-card border-border">
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-foreground font-semibold">
              Nenhum alerta de fraude
            </p>
            <p className="text-sm text-muted-foreground">
              Sistema funcionando normalmente
            </p>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 bg-card border ${
                alert.severity === "critical"
                  ? "border-red-500/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {getFraudTypeLabel(alert.fraud_type)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-foreground">{alert.description}</p>

                  {/* Evidence */}
                  {alert.evidence && Object.keys(alert.evidence).length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        Evidências:
                      </p>
                      {alert.evidence.duration_minutes && (
                        <p className="text-muted-foreground">
                          • Duração: {alert.evidence.duration_minutes} minutos
                        </p>
                      )}
                      {alert.evidence.quick_rides_count && (
                        <p className="text-muted-foreground">
                          • Corridas rápidas: {alert.evidence.quick_rides_count}
                        </p>
                      )}
                      {alert.evidence.zero_distance_count && (
                        <p className="text-muted-foreground">
                          • Distância zero: {alert.evidence.zero_distance_count}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Ride Info */}
                  {alert.ride && (
                    <div className="text-xs text-muted-foreground">
                      <p>
                        Corrida: {alert.ride.origin} → {alert.ride.destination}
                      </p>
                    </div>
                  )}

                  {/* Driver Info */}
                  {alert.driver && (
                    <div className="text-xs text-muted-foreground">
                      <p>Motorista: {alert.driver.profile?.name}</p>
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>

                {/* Actions */}
                {alert.status === RIDE_STATUS.PENDING && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAlert(alert)}
                    className="flex-shrink-0"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Revisar
                  </Button>
                )}
              </div>

              {/* Review Panel */}
              {selectedAlert?.id === alert.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <Textarea
                    placeholder="Notas da revisão (opcional)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="min-h-[80px] bg-background"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => updateAlertStatus(alert.id, "confirmed")}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Confirmar Fraude
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateAlertStatus(alert.id, "false_positive")
                      }
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Falso Positivo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateAlertStatus(alert.id, "investigating")
                      }
                    >
                      Investigar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedAlert(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
