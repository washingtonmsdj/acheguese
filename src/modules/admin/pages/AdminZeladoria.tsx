/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";

import { useState, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Construction,
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  Eye,
  MessageCircle,
  Users,
  TrendingUp,
  Download,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { adminCommunityService } from "@/core/admin/services/AdminCommunityService";
import { cn } from "@/shared/utils/cn";
import { USER_ROLE } from "@/shared/types/constants";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization";
import { logger } from "@/shared/utils/logger";

interface CivicReport {
  id: string;
  problem_type: string;
  title: string;
  description: string;
  images: string[];
  status: "pendente" | "em_analise" | "resolvido" | "rejeitado";
  supporters_count: number;
  is_critical: boolean;
  neighborhood: string;
  created_at: string;
  reporter_name: string;
}

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", icon: Clock, color: "bg-yellow-500" },
  { value: "em_analise", label: "Em Análise", icon: Eye, color: "bg-blue-500" },
  {
    value: "resolvido",
    label: "Resolvido",
    icon: CheckCircle,
    color: "bg-green-500",
  },
  {
    value: "rejeitado",
    label: "Rejeitado",
    icon: XCircle,
    color: "bg-red-500",
  },
];

export default function AdminZeladoria() {
  const { activeProfile } = useSessionContext();
  const [canModerate, setCanModerate] = useState<boolean | null>(null);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendente");
  const [stats, setStats] = useState({
    total: 0,
    pendente: 0,
    em_analise: 0,
    resolvido: 0,
    rejeitado: 0,
    critical: 0,
  });

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [activeTab]);

  // Check moderation permission via AuthorizationEngine
  useEffect(() => {
    if (!activeProfile) {
      setCanModerate(false);
      return;
    }
    AuthorizationEngine.canProfilePerformAction(
      activeProfile.id,
      "moderateContent",
      {},
    ).then(setCanModerate);
  }, [activeProfile?.id]);

  // Validação de admin
  if (canModerate === false) {
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const mapped = await adminCommunityService.getCivicReports(activeTab);
      setReports(mapped);
    } catch (error) {
      logger.error("Erro ao buscar reportes:", error);
      toast.error("Erro ao carregar reportes");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await adminCommunityService.getCivicReportStats();
      setStats(stats);
    } catch (error) {
      logger.error("Erro ao buscar estatísticas:", error);
    }
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      await adminCommunityService.updateCivicReportStatus(reportId, newStatus);
      toast.success("Status atualizado!");
      fetchReports();
      fetchStats();
    } catch (error) {
      logger.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Construction className="w-8 h-8 text-orange-500" />
          Administração de Zeladoria
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie reportes de problemas urbanos da comunidade
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </Card>
        <Card className="p-4 border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-500">
            {stats.pendente}
          </div>
          <div className="text-xs text-muted-foreground">Pendentes</div>
        </Card>
        <Card className="p-4 border-blue-500/30">
          <div className="text-2xl font-bold text-blue-500">
            {stats.em_analise}
          </div>
          <div className="text-xs text-muted-foreground">Em Análise</div>
        </Card>
        <Card className="p-4 border-green-500/30">
          <div className="text-2xl font-bold text-green-500">
            {stats.resolvido}
          </div>
          <div className="text-xs text-muted-foreground">Resolvidos</div>
        </Card>
        <Card className="p-4 border-red-500/30">
          <div className="text-2xl font-bold text-red-500">
            {stats.rejeitado}
          </div>
          <div className="text-xs text-muted-foreground">Rejeitados</div>
        </Card>
        <Card className="p-4 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10">
          <div className="text-2xl font-bold text-orange-500 flex items-center gap-1">
            <Flame className="w-5 h-5" />
            {stats.critical}
          </div>
          <div className="text-xs text-muted-foreground">Críticos</div>
        </Card>
      </div>

      {/* Tabs por Status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="em_analise">Em Análise</TabsTrigger>
          <TabsTrigger value="resolvido">Resolvidos</TabsTrigger>
          <TabsTrigger value="rejeitado">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando reportes...
            </div>
          ) : reports.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Nenhum reporte neste status
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ReportCardProps {
  report: CivicReport;
  onUpdateStatus: (id: string, status: string) => void;
}

function ReportCard({ report, onUpdateStatus }: ReportCardProps) {
  return (
    <Card
      className={cn(
        "p-4",
        report.is_critical &&
          "border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/5 to-transparent",
      )}
    >
      <div className="flex gap-4">
        {/* Imagem */}
        {report.images[0] && (
          <img
            src={report.images[0]}
            alt={report.title}
            className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
          />
        )}

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {report.title}
                {report.is_critical && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                    <Flame className="w-3 h-3 mr-1" />
                    CRÍTICO
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {report.neighborhood} • {report.reporter_name}
              </p>
            </div>
          </div>

          <p className="text-sm mb-3 line-clamp-2">{report.description}</p>

          <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{report.supporters_count}</span>
              <span>apoios</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              <span>0 comentários</span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            {STATUS_OPTIONS.filter((s) => s.value !== report.status).map(
              (status) => {
                const Icon = status.icon;
                return (
                  <Button
                    key={status.value}
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateStatus(report.id, status.value)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {status.label}
                  </Button>
                );
              },
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

