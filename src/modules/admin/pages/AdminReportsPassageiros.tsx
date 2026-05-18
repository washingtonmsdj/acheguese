 
/**
 * Página Admin - Reports de Passageiros
 * Gerencia denúncias e problemas reportados por passageiros em corridas
 *
 * SSOT: Usa tipos e constantes centralizadas
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles/services/ProfileService"; // ✅ MIGRADO - Usa ProfileService
import { REPORT_TYPE, REPORT_SEVERITY } from "@/shared/services/mobilityAdmin"; // ✅ Import constants

// ✅ SSOT - Define REPORT_STATUS localmente (não existe em constants)
const REPORT_STATUS = {
  PENDING: 'pending' as const,
  INVESTIGATING: 'under_review' as const,
  UNDER_REVIEW: 'under_review' as const,
  RESOLVED: 'resolved' as const,
  DISMISSED: 'rejected' as const,
  REJECTED: 'rejected' as const,
};
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { AccessibleDialog } from "@/shared/components/ui/accessible-dialog";
import {
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  Flag,
  Car,
  User,
  MapPin,
  FileText,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { adminMobilityService } from "@/core/admin"; // ✅ MIGRADO - Usa AdminMobilityService do core

// SSOT: Importar tipos e constantes centralizadas
import type { RideReport as RideReportsRow, ReportStatus, ReportSeverity } from "@/shared/services/mobilityAdmin";
import { RIDE_STATUS, ALERT_STATUS } from "@/shared/types/constants";

// Type alias para compatibilidade
type RideReport = RideReportsRow;

interface Stats {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
  dismissed: number;
  critical: number;
  high: number;
}

// SSOT: Configuração de tipos de report usando constantes
const REPORT_TYPES_CONFIG = {
  [REPORT_TYPE.DRIVER_BEHAVIOR]: {
    label: "Comportamento do Motorista",
    icon: User,
    color: "orange",
  },
  [REPORT_TYPE.SAFETY_CONCERN]: {
    label: "Preocupação de Segurança",
    icon: Shield,
    color: "red",
  },
  [REPORT_TYPE.ROUTE_ISSUE]: {
    label: "Problema na Rota",
    icon: MapPin,
    color: "yellow",
  },
  [REPORT_TYPE.PAYMENT_DISPUTE]: {
    label: "Disputa de Pagamento",
    icon: FileText,
    color: "blue",
  },
  [REPORT_TYPE.VEHICLE_CONDITION]: {
    label: "Condição do Veículo",
    icon: Car,
    color: "orange",
  },
  [REPORT_TYPE.CANCELLATION_ABUSE]: {
    label: "Abuso de Cancelamento",
    icon: XCircle,
    color: "red",
  },
  [REPORT_TYPE.HARASSMENT]: {
    label: "Assédio",
    icon: AlertTriangle,
    color: "red",
  },
  [REPORT_TYPE.FRAUD]: { label: "Fraude", icon: Flag, color: "red" },
  [REPORT_TYPE.OTHER]: { label: "Outro", icon: FileText, color: "gray" },
} as const;

interface DisplayReport {
  id: string;
  ride_id: string;
  reporter_id: string;
  reported_user_id: string | null;
  report_type: string;
  severity: ReportSeverity;
  title: string;
  description: string;
  evidence_urls: string[];
  status: ReportStatus;
  admin_notes: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter_name: string;
  reporter_avatar: string | null;
  driver_name: string;
  ride_origin: string | null;
  ride_destination: string | null;
}

// SSOT: Configuração de severidade usando constantes
const SEVERITY_CONFIG = {
  [REPORT_SEVERITY.LOW]: {
    label: "Baixa",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  [REPORT_SEVERITY.MEDIUM]: {
    label: "Média",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  [REPORT_SEVERITY.HIGH]: {
    label: "Alta",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  [REPORT_SEVERITY.CRITICAL]: {
    label: "Crítica",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
} as const;

export default function AdminReportsPassageiros() {
  const { canModerate, isChecking } = useAdminGuard();
  const { activeProfile } = useSessionContext();
  const navigate = useNavigate();
  const [reports, setReports] = useState<DisplayReport[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportStatus>(
    REPORT_STATUS.PENDING,
  );
  const [selectedReport, setSelectedReport] = useState<DisplayReport | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Função para abrir perfil restrito do admin
  const openUserProfile = (userId: string) => {
    // Navegar para a página de usuários do admin com o usuário selecionado
    navigate(`/admin/users?userId=${userId}`);
  };

  // ✅ SSOT - Tabela ride_reports não existe no schema, então não busca dados
  useEffect(() => {
    if (canModerate && !isChecking) {
      // Inicializa com dados vazios já que a tabela não existe
      setReports([]);
      setStats({
        total: 0,
        pending: 0,
        investigating: 0,
        resolved: 0,
        dismissed: 0,
        critical: 0,
        high: 0,
      });
      setLoading(false);
    }
  }, [activeTab, canModerate, isChecking]);

  // ✅ SSOT - Funções removidas pois a tabela ride_reports não existe no banco
  const fetchReports = async () => {
    // Tabela não existe - não faz nada
    setReports([]);
    setLoading(false);
  };

  const fetchStats = async () => {
    // Tabela não existe - não faz nada
    setStats({
      total: 0,
      pending: 0,
      investigating: 0,
      resolved: 0,
      dismissed: 0,
      critical: 0,
      high: 0,
    });
  };

  const updateReportStatus = async (
    reportId: string,
    newStatus: string,
    notes?: string,
  ) => {
    // ✅ SSOT - Tabela ride_reports não existe, então não atualiza
    toast.error("Funcionalidade não disponível: tabela ride_reports não existe no banco de dados");
    return;
  };

  const openDetails = (report: DisplayReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes);
    setDetailsOpen(true);
  };

  // Validação de admin
  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar loading enquanto verifica admin
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F14] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Flag className="h-8 w-8 text-red-400" />
          Reports de Passageiros
        </h1>
        <p className="text-gray-400 mt-2">
          Gerenciar denúncias e problemas reportados em corridas
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="bg-[#1E2529] border-white/10">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2529] border-yellow-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {stats.pending}
              </div>
              <div className="text-xs text-gray-400">Pendentes</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2529] border-blue-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">
                {stats.investigating}
              </div>
              <div className="text-xs text-gray-400">Investigando</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2529] border-green-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">
                {stats.resolved}
              </div>
              <div className="text-xs text-gray-400">Resolvidos</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2529] border-gray-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-400">
                {stats.dismissed}
              </div>
              <div className="text-xs text-gray-400">Arquivados</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2529] border-red-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">
                {stats.critical}
              </div>
              <div className="text-xs text-gray-400">Críticos</div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E2529] border-orange-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-400">
                {stats.high}
              </div>
              <div className="text-xs text-gray-400">Alta Prioridade</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as ReportStatus)}>
        <TabsList className="bg-[#1E2529] border border-white/10">
          <TabsTrigger value={REPORT_STATUS.PENDING}>
            Pendentes ({stats?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value={REPORT_STATUS.INVESTIGATING}>
            Investigando ({stats?.investigating || 0})
          </TabsTrigger>
          <TabsTrigger value={REPORT_STATUS.RESOLVED}>
            Resolvidos ({stats?.resolved || 0})
          </TabsTrigger>
          <TabsTrigger value={REPORT_STATUS.DISMISSED}>
            Arquivados ({stats?.dismissed || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Carregando...</div>
          ) : reports.length === 0 ? (
            <Card className="bg-[#1E2529] border-white/10 p-12 text-center">
              <Flag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">Funcionalidade não disponível</p>
              <p className="text-sm text-gray-500">
                A tabela ride_reports não existe no banco de dados
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onViewDetails={openDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      {selectedReport && (
        <AccessibleDialog
          title="Detalhes do Report"
          description={`Report #${selectedReport.id.slice(0, 8)}`}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          contentClassName="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E2529] border-white/10 text-white"
        >
          <div className="space-y-4">
            {/* Envolvidos no Report */}
            <div className="bg-[#0A0F14] p-4 rounded-lg border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3">
                Envolvidos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Reclamante (Passageiro)
                  </label>
                  <button
                    onClick={() => openUserProfile(selectedReport.reporter_id)}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    {selectedReport.reporter_avatar && (
                      <img
                        src={selectedReport.reporter_avatar}
                        alt={selectedReport.reporter_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <span>{selectedReport.reporter_name}</span>
                    <User className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Reclamado (Motorista)
                  </label>
                  {selectedReport.reported_user_id ? (
                    <button
                      onClick={() =>
                        openUserProfile(selectedReport.reported_user_id!)
                      }
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      <span>{selectedReport.driver_name}</span>
                      <User className="w-3 h-3" />
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400">
                      {selectedReport.driver_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Info do Report */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400">Tipo</label>
                <p className="text-sm text-white">
                  {
                    REPORT_TYPES_CONFIG[
                      selectedReport.report_type as keyof typeof REPORT_TYPES_CONFIG
                    ]?.label
                  }
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Gravidade</label>
                <Badge
                  className={cn(
                    "text-xs",
                    SEVERITY_CONFIG[selectedReport.severity].color,
                  )}
                >
                  {SEVERITY_CONFIG[selectedReport.severity].label}
                </Badge>
              </div>
              <div>
                <label className="text-xs text-gray-400">ID da Corrida</label>
                <p className="text-sm text-white font-mono">
                  #{selectedReport.ride_id.slice(0, 8)}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Data</label>
                <p className="text-sm text-white">
                  {formatDistanceToNow(new Date(selectedReport.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>

            {/* Rota da Corrida */}
            {(selectedReport.ride_origin ||
              selectedReport.ride_destination) && (
              <div className="bg-[#0A0F14] p-4 rounded-lg border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Rota da Corrida
                </h3>
                <div className="space-y-2">
                  {selectedReport.ride_origin && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5" />
                      <div>
                        <p className="text-xs text-gray-400">Origem</p>
                        <p className="text-sm text-white">
                          {selectedReport.ride_origin}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedReport.ride_destination && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5" />
                      <div>
                        <p className="text-xs text-gray-400">Destino</p>
                        <p className="text-sm text-white">
                          {selectedReport.ride_destination}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descrição */}
            <div>
              <label className="text-xs text-gray-400">Descrição</label>
              <p className="text-sm text-white mt-1">
                {selectedReport.description}
              </p>
            </div>

            {/* Evidências */}
            {selectedReport.evidence_urls &&
              selectedReport.evidence_urls.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400">Evidências</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedReport.evidence_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Evidência ${idx + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* Notas Admin */}
            <div>
              <label className="text-xs text-gray-400">
                Notas do Administrador
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicionar notas sobre a investigação..."
                className="mt-1 bg-[#0A0F14] border-white/10 text-white"
                rows={3}
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t border-white/10">
              {selectedReport.status === REPORT_STATUS.PENDING && (
                <Button
                  onClick={() =>
                    updateReportStatus(
                      selectedReport.id,
                      REPORT_STATUS.INVESTIGATING,
                      adminNotes,
                    )
                  }
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Iniciar Investigação
                </Button>
              )}
              {(selectedReport.status === REPORT_STATUS.PENDING ||
                selectedReport.status === REPORT_STATUS.INVESTIGATING) && (
                <>
                  <Button
                    onClick={() =>
                      updateReportStatus(
                        selectedReport.id,
                        REPORT_STATUS.RESOLVED,
                        adminNotes,
                      )
                    }
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Resolver
                  </Button>
                  <Button
                    onClick={() =>
                      updateReportStatus(
                        selectedReport.id,
                        REPORT_STATUS.DISMISSED,
                        adminNotes,
                      )
                    }
                    variant="outline"
                    className="border-gray-500/30"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Arquivar
                  </Button>
                </>
              )}
            </div>
          </div>
        </AccessibleDialog>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: DisplayReport;
  onViewDetails: (report: DisplayReport) => void;
}

function ReportCard({ report, onViewDetails }: ReportCardProps) {
  const typeConfig =
    REPORT_TYPES_CONFIG[report.report_type as keyof typeof REPORT_TYPES_CONFIG];
  const Icon = typeConfig?.icon || FileText;

  return (
    <Card
      className={cn(
        "bg-[#1E2529] border-white/10 p-4 hover:border-white/20 transition-colors",
        report.severity === REPORT_SEVERITY.CRITICAL &&
          "border-red-500/50 bg-red-500/5",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-3 rounded-lg",
            report.severity === REPORT_SEVERITY.CRITICAL
              ? "bg-red-500/20"
              : "bg-white/5",
          )}
        >
          <Icon
            className={cn(
              "w-6 h-6",
              report.severity === REPORT_SEVERITY.CRITICAL
                ? "text-red-400"
                : "text-gray-400",
            )}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white">{report.title}</h3>
              <p className="text-sm text-gray-400">
                {report.reporter_name} •{" "}
                {formatDistanceToNow(new Date(report.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge
                className={cn(
                  "text-xs",
                  SEVERITY_CONFIG[report.severity].color,
                )}
              >
                {SEVERITY_CONFIG[report.severity].label}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-3 line-clamp-2">
            {report.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-xs text-gray-400">
              <span>{typeConfig?.label}</span>
              {report.ride_origin && (
                <span>
                  • {report.ride_origin} → {report.ride_destination}
                </span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(report)}
              className="border-white/10 hover:bg-white/5"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

