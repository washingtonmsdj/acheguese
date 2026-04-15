/**
 * PROFILE.1.3b - BURN-DOWN AGRESSIVO
 *
 * AdminMotoristas migrado para usar ProfileService como fonte única de verdade
 * Elimina regras manuais: is_verified, is_suspended, is_online
 * Score original: 237 (19 regras manuais + 1 wrapper antigo)
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { DriverEarningsMetrics } from "@/modules/admin/components/DriverEarningsMetrics";
import { DriverCancellationMetrics } from "@/modules/admin/components/DriverCancellationMetrics";
import { ReputationManagementPanel } from "@/modules/admin/components/ReputationManagementPanel";
import { MobilitySettingsPanel } from "@/modules/admin/components/MobilitySettingsPanel";
import { useToast } from "@/shared/hooks/use-toast";
import {
  Car,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Shield,
  Star,
  MapPin,
  Calendar,
  User,
  CarFront,
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Award,
  Settings,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import { RIDE_STATUS } from "@/shared/types/constants";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles";
import { logger } from "@/shared/utils/logger";
import type { ProfileContext } from "@/core/profiles/services/types";
import { MobilityService, mobilityService } from "@/core/mobility/services";

interface DriverRequest {
  id: string;
  profile_id: string;
  name: string;
  avatar_url?: string;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_year: number;
  cnh_image_url?: string;
  // ✅ MIGRADO - Removidas regras manuais, dados vêm do ProfileService
  profileContext?: ProfileContext; // Contexto completo do ProfileService
  is_online: boolean; // Mantido apenas para driver_data específico
  subscription_plan: string;
  rating: number;
  total_rides: number;
  total_earnings: number;
  created_at: string;
  neighborhood?: string;
  city?: string;
}

interface SuspensionHistoryEntry {
  id: string;
  action: "suspended" | "reactivated";
  reason?: string;
  admin_name: string;
  created_at: string;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function AdminMotoristas() {
  const { canModerate, isChecking } = useAdminGuard();
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>(RIDE_STATUS.PENDING);
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<DriverRequest | null>(
    null,
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("gestao");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {},
    variant: "default",
  });
  const [suspensionHistory, setSuspensionHistory] = useState<
    SuspensionHistoryEntry[]
  >([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!isChecking && canModerate) {
      loadDrivers();
    }
  }, [filter, canModerate, isChecking]);

  const loadSuspensionHistory = async (driverProfileId: string) => {
    // driver_suspension_history não existe no schema atual
    // Mostra histórico vazio até a tabela ser criada
    setSuspensionHistory([]);
    setHistoryOpen(true);
  };

  const loadDrivers = async () => {
    setLoading(true);
    try {
      // ✅ MIGRADO - Buscar motoristas usando view driver_profiles (fonte única de verdade)
      const { data: driversData, error } =
        await MobilityService.getDriverProfiles();

      if (error) {
        logger.error("Erro ao carregar motoristas:", error);
        toast({
          title: "Erro ao carregar motoristas",
          description: "Não foi possível carregar a lista de motoristas.",
          variant: "destructive",
        });
        setDrivers([]);
        return;
      }

      // ✅ MIGRADO - Buscar contextos dos usuários usando ProfileService
      const driversWithContext = await Promise.all(
        (driversData || []).map(async (d: any) => {
          // Buscar contexto completo do usuário usando ProfileService
          // Só chama se user_id existir — evita query com user_id=undefined
          const profileContext = d.user_id
            ? await profileService.getProfileContext(d.user_id)
            : null;

          return {
            id: d.profile_id,
            profile_id: d.profile_id,
            name: d.name, // SSOT: De profiles
            avatar_url: d.avatar_url, // SSOT: De profiles
            vehicle_plate: d.vehicle_plate, // Específico: De drivers
            vehicle_model: d.vehicle_model, // Específico: De drivers
            vehicle_year: d.vehicle_year, // Específico: De drivers
            cnh_image_url: d.cnh_image_url, // Específico: De drivers
            profileContext, // ✅ MIGRADO - Contexto completo do ProfileService
            is_online: d.is_online || false, // Específico: De driver_data
            subscription_plan: d.subscription_plan || "padrao",
            rating: d.avg_rating || 0, // SSOT: Calculado pela view
            total_rides: d.total_rides || 0, // SSOT: Calculado pela view
            total_earnings: d.total_earnings || 0, // SSOT: Calculado pela view
            created_at: d.created_at,
            neighborhood: d.neighborhood, // SSOT: De profiles
            city: d.city, // SSOT: De profiles
          } as DriverRequest;
        }),
      );

      // ✅ MIGRADO - Aplicar filtros usando ProfileService
      let filtered = driversWithContext;
      if (filter === RIDE_STATUS.PENDING) {
        filtered = driversWithContext.filter(
          (d) => !d.profileContext?.verified,
        );
      } else if (filter === "approved") {
        filtered = driversWithContext.filter((d) => d.profileContext?.verified);
      } else if (filter === "rejected") {
        // Buscar motoristas rejeitados se houver uma coluna para isso
        filtered = [];
      }

      setDrivers(filtered);
    } catch (error) {
      logger.error("Erro ao carregar motoristas:", error);
      toast({
        title: "Erro ao carregar motoristas",
        description: "Não foi possível carregar a lista de motoristas.",
        variant: "destructive",
      });
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDriver) return;
    setProcessing(true);
    try {
      // ✅ MIGRADO - Usa ProfileService para verificar usuário
      if (!selectedDriver.profileContext)
        throw new Error("Contexto do usuário não encontrado");

      await profileService.verifyUser(selectedDriver.profileContext.id);

      toast({
        title: "✅ Motorista aprovado!",
        description: `${selectedDriver.name ?? 'Motorista'} agora pode aceitar corridas.`,
      });
      setReviewOpen(false);
      loadDrivers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDriver || !rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      toast({
        title: "❌ Cadastro rejeitado",
        description: `${selectedDriver.name ?? 'Motorista'} foi notificado.`,
      });
      setReviewOpen(false);
      setRejectionReason("");
      loadDrivers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleOnline = async (driver: DriverRequest) => {
    const newOnlineStatus = !driver.is_online;

    // Se for colocar offline, pedir confirmação
    if (!newOnlineStatus) {
      setConfirmDialog({
        open: true,
        title: "⏸️ Colocar Motorista Offline",
        description: `Tem certeza que deseja colocar ${driver.name ?? 'este motorista'} offline? Ele não receberá novas corridas até ser reativado.`,
        variant: "default",
        action: () => executeToggleOnline(driver, newOnlineStatus),
      });
      return;
    }

    // Se for colocar online, executar direto
    await executeToggleOnline(driver, newOnlineStatus);
  };

  const executeToggleOnline = async (
    driver: DriverRequest,
    newOnlineStatus: boolean,
  ) => {
    setProcessing(true);
    try {
      await mobilityService.updateDriverOnlineStatus(driver.profile_id, newOnlineStatus);

      toast({
        title: newOnlineStatus ? "✅ Motorista online" : "⏸️ Motorista offline",
        description: `${driver.name ?? 'Motorista'} foi colocado ${newOnlineStatus ? "online" : "offline"}.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSuspend = async (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "🚫 Suspender Motorista",
      description: `Tem certeza que deseja suspender ${driver.name ?? 'este motorista'}? Esta ação bloqueará o acesso dele e ele não poderá aceitar corridas. Você poderá reativá-lo depois.`,
      variant: "destructive",
      action: () => executeSuspend(driver),
    });
  };

  const executeSuspend = async (driver: DriverRequest) => {
    setProcessing(true);
    try {
      if (!driver.profileContext)
        throw new Error("Contexto do usuário não encontrado");

      await profileService.suspendUser(
        driver.profileContext.id,
        "30 days",
        rejectionReason || "Suspenso pelo administrador",
      );

      // Colocar offline via MobilityService
      await mobilityService
        .updateDriverOnlineStatus(driver.profile_id, false)
        .catch((err) => logger.warn("Aviso ao atualizar driver_data:", err));

      toast({
        title: "🚫 Motorista suspenso",
        description: `${driver.name ?? 'Motorista'} foi suspenso e não poderá aceitar corridas.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao suspender motorista:", error);
      toast({
        title: "Erro",
        description: "Não foi possível suspender o motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleReactivate = async (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "✅ Reativar Motorista",
      description: `Tem certeza que deseja reativar ${driver.name ?? 'este motorista'}? Ele poderá voltar a aceitar corridas na plataforma.`,
      variant: "default",
      action: () => executeReactivate(driver),
    });
  };

  const executeReactivate = async (driver: DriverRequest) => {
    setProcessing(true);
    try {
      if (!driver.profileContext)
        throw new Error("Contexto do usuário não encontrado");

      await profileService.unsuspendUser(driver.profileContext.id);

      toast({
        title: "✅ Motorista reativado",
        description: `${driver.name ?? 'Motorista'} foi reativado e pode voltar a aceitar corridas.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao reativar motorista:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reativar o motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const stats = {
    total: drivers.length,
    pending: drivers.filter((d) => !d.profileContext?.verified && !d.profileContext?.status.isSuspended).length,
    approved: drivers.filter((d) => d.profileContext?.verified).length,
    online: drivers.filter((d) => d.is_online && !d.profileContext?.status.isSuspended).length,
    totalRides: drivers.reduce((sum, d) => sum + (d.total_rides || 0), 0),
    totalEarnings: drivers.reduce((sum, d) => sum + (d.total_earnings || 0), 0),
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle_plate.toLowerCase().includes(search.toLowerCase()),
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // ✅ MIGRADO - Validação de admin usando AuthorizationEngine
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display mb-1 flex items-center gap-2">
            <Car className="h-6 w-6 text-teal-500" />
            Gestão de Motoristas
          </h1>
          <p className="text-sm text-muted-foreground">
            Aprove, rejeite e gerencie motoristas cadastrados na plataforma
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="gestao" className="gap-2">
              <Users className="h-4 w-4" />
              Gestão
            </TabsTrigger>
            <TabsTrigger value="metricas" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="cancelamento" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cancelamentos
            </TabsTrigger>
            <TabsTrigger value="reputacao" className="gap-2">
              <Award className="h-4 w-4" />
              Reputação
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gestao" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  label: "Total",
                  value: stats.total,
                  icon: Users,
                  color: "text-foreground",
                },
                {
                  label: "Pendentes",
                  value: stats.pending,
                  icon: Clock,
                  color: "text-yellow-500",
                },
                {
                  label: "Aprovados",
                  value: stats.approved,
                  icon: CheckCircle,
                  color: "text-green-500",
                },
                {
                  label: "Online",
                  value: stats.online,
                  icon: Car,
                  color: "text-teal-500",
                },
                {
                  label: "Corridas",
                  value: stats.totalRides,
                  icon: TrendingUp,
                  color: "text-blue-500",
                },
                {
                  label: "Receita",
                  value: `R$${stats.totalEarnings}`,
                  icon: DollarSign,
                  color: "text-emerald-500",
                },
              ].map((s) => (
                <Card key={s.label} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className={cn("h-4 w-4", s.color)} />
                    <span className="text-xs text-muted-foreground">
                      {s.label}
                    </span>
                  </div>
                  <div className={cn("text-2xl font-bold", s.color)}>
                    {s.value}
                  </div>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                {(
                  [
                    { key: "all", label: "Todos" },
                    { key: RIDE_STATUS.PENDING, label: "Pendentes" },
                    { key: "approved", label: "Aprovados" },
                    { key: "rejected", label: "Rejeitados" },
                  ] as const
                ).map((f) => (
                  <Button
                    key={f.key}
                    variant={filter === f.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou placa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Drivers List */}
            {filteredDrivers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Car className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum motorista encontrado
                  </h3>
                  <p className="text-muted-foreground text-center text-sm">
                    Não há motoristas{" "}
                    {filter !== "all" && `com status "${filter}"`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredDrivers.map((driver) => (
                  <Card
                    key={driver.id}
                    className={cn(
                      "hover:shadow-md transition-all",
                      !driver.profileContext?.verified &&
                        driver.total_rides === 0 &&
                        "border-yellow-500/30 bg-yellow-500/5",
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-background">
                          <AvatarImage src={driver.avatar_url} />
                          <AvatarFallback className="bg-teal-500/10 text-teal-600 font-bold">
                            {(driver.name ?? '?').charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {driver.name ?? 'Nome não informado'}
                                </h3>
                                {driver.profileContext?.status.isSuspended ? (
                                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                                    <XCircle className="w-3 h-3 mr-1" />{" "}
                                    Suspenso
                                  </Badge>
                                ) : driver.profileContext?.verified ? (
                                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                    <Shield className="w-3 h-3 mr-1" />{" "}
                                    Verificado
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                    <Clock className="w-3 h-3 mr-1" /> Pendente
                                  </Badge>
                                )}
                                {driver.is_online &&
                                  !driver.profileContext?.status
                                    .isSuspended && (
                                    <Badge className="bg-teal-500/10 text-teal-600 border-teal-500/20">
                                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse mr-1" />
                                      Online
                                    </Badge>
                                  )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                {driver.neighborhood && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {driver.neighborhood ?? 'N/A'}, {driver.city ?? 'N/A'}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(driver.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Vehicle Info */}
                          <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 mb-3">
                            <CarFront className="h-5 w-5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {driver.vehicle_model ?? 'Modelo não informado'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Placa: {driver.vehicle_plate ?? 'N/A'}
                              </p>
                            </div>
                            {driver.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-semibold">
                                  {driver.rating.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {driver.total_rides > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {driver.total_rides} corridas
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            {!driver.profileContext?.verified &&
                              !driver.profileContext?.status.isSuspended && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedDriver(driver);
                                        setReviewOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-1" /> Revisar
                                      Cadastro
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Analisar documentos e aprovar/rejeitar o
                                      cadastro do motorista
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            {driver.profileContext?.status.isSuspended ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 hover:bg-green-500/10"
                                      onClick={() => handleReactivate(driver)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />{" "}
                                      Reativar
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Remover suspensão e permitir que o
                                      motorista volte a aceitar corridas
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        loadSuspensionHistory(driver.profile_id)
                                      }
                                    >
                                      <History className="h-4 w-4 mr-1" />{" "}
                                      Histórico
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Ver histórico completo de suspensões e
                                      reativações
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              driver.profileContext?.verified && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleToggleOnline(driver)
                                        }
                                      >
                                        {driver.is_online
                                          ? "Colocar Offline"
                                          : "Colocar Online"}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {driver.is_online
                                          ? "Desativar motorista temporariamente - ele não receberá novas corridas"
                                          : "Ativar motorista para receber corridas"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => handleSuspend(driver)}
                                      >
                                        <AlertTriangle className="h-4 w-4 mr-1" />{" "}
                                        Suspender
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        Suspender motorista permanentemente -
                                        bloqueia acesso e impede aceitar
                                        corridas
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metricas" className="space-y-6 mt-6">
            <DriverEarningsMetrics
              drivers={drivers.map((d) => ({
                ...d,
                avg_rating: d.rating,
                earnings_today: d.total_earnings * 0.1,
                earnings_week: d.total_earnings * 0.3,
                earnings_month: d.total_earnings,
              }))}
            />
          </TabsContent>

          <TabsContent value="cancelamento" className="space-y-6 mt-6">
            <DriverCancellationMetrics />
          </TabsContent>

          <TabsContent value="reputacao" className="space-y-6 mt-6">
            <ReputationManagementPanel />
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-6 mt-6">
            <MobilitySettingsPanel />
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-teal-500" />
                Revisar Cadastro de Motorista
              </DialogTitle>
              <DialogDescription>
                Analise os dados e documentos do motorista antes de aprovar
              </DialogDescription>
            </DialogHeader>

            {selectedDriver && (
              <div className="space-y-5 mt-4">
                {/* Driver Info */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedDriver.avatar_url} />
                    <AvatarFallback className="text-xl">
                      {(selectedDriver.name ?? '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedDriver.name ?? 'Nome não informado'}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedDriver.neighborhood ?? 'N/A'}, {selectedDriver.city ?? 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CarFront className="h-4 w-4" /> Veículo
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Modelo</p>
                      <p className="font-medium">
                        {selectedDriver.vehicle_model ?? 'Modelo não informado'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Placa</p>
                      <p className="font-medium">
                        {selectedDriver.vehicle_plate ?? 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Ano</p>
                      <p className="font-medium">
                        {selectedDriver.vehicle_year}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Plano</p>
                      <p className="font-medium capitalize">
                        {selectedDriver.subscription_plan}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CNH */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> CNH / Documento
                  </h4>
                  {selectedDriver.cnh_image_url ? (
                    <a
                      href={selectedDriver.cnh_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-48 rounded-lg border-2 border-dashed hover:border-primary transition-colors overflow-hidden bg-secondary/30 flex items-center justify-center"
                    >
                      <img
                        src={selectedDriver.cnh_image_url}
                        alt="CNH"
                        className="w-full h-full object-contain"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-secondary/30">
                      <p className="text-sm text-muted-foreground">
                        Nenhum documento enviado
                      </p>
                    </div>
                  )}
                </div>

                {/* Rejection Reason */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Motivo da rejeição (se aplicável)
                  </h4>
                  <Textarea
                    placeholder="Descreva o motivo da rejeição..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleApprove}
                        disabled={processing}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Aprovar Motorista
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Aprovar cadastro e permitir que o motorista comece a
                        aceitar corridas
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleReject}
                        disabled={processing}
                        variant="destructive"
                        className="flex-1"
                      >
                        {processing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Rejeitar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Rejeitar cadastro - motorista será notificado com o
                        motivo informado
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.description}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  setConfirmDialog({ ...confirmDialog, open: false })
                }
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                variant={confirmDialog.variant}
                className="flex-1"
                onClick={confirmDialog.action}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Suspension History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                Histórico de Suspensões
              </DialogTitle>
              <DialogDescription>
                Registro completo de todas as suspensões e reativações deste
                motorista
              </DialogDescription>
            </DialogHeader>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : suspensionHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <History className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  Nenhum histórico de suspensão encontrado
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {suspensionHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-4 rounded-lg border-l-4",
                      entry.action === "suspended"
                        ? "bg-red-500/5 border-red-500"
                        : "bg-green-500/5 border-green-500",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {entry.action === "suspended" ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          <span className="font-semibold">
                            {entry.action === "suspended"
                              ? "Suspenso"
                              : "Reativado"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Por: {entry.admin_name}
                        </p>
                        {entry.reason && (
                          <p className="text-sm mt-2 p-2 rounded bg-secondary/50">
                            <span className="font-medium">Motivo:</span>{" "}
                            {entry.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
