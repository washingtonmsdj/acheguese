/**
 * AdminMotoristasPage (REFATORADO)
 * 
 * Página de Gestão de Motoristas
 * 
 * REFATORAÇÃO: 1.131 linhas → ~250 linhas (orquestração limpa)
 * SSOT: Todas as sections e componentes tipados
 * Sem gambiarras: Código profissional e modular
 */

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import { useAdminGuard } from "@/core/admin/hooks/useAdminGuard";
import { RIDE_STATUS } from "@/shared/types/constants";
import type { FilterStatus, DriverRequest, ConfirmDialogState } from "../sections/types";
import { AdminMotoristasLayout } from "./AdminMotoristasLayout";
import {
  AdminMotoristasHeaderSection,
  AdminMotoristasStatsSection,
  AdminMotoristasFiltersSection,
  AdminMotoristasListSection,
  AdminMotoristasEmptySection,
  AdminMotoristasTabsSection,
} from "../sections";
import {
  DriverReviewDialog,
  ConfirmationDialog,
  SuspensionHistoryDialog,
} from "../components/dialogs";
import { useDriverManagement } from "../hooks";
import { calculateDriverStats, filterDrivers } from "../utils";

export default function AdminMotoristasPage() {
  const { canModerate, isChecking } = useAdminGuard();
  
  // ============================================
  // State Management
  // ============================================
  const [filter, setFilter] = useState<FilterStatus>(RIDE_STATUS.PENDING);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("gestao");
  const [selectedDriver, setSelectedDriver] = useState<DriverRequest | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    action: () => {},
    variant: "default",
  });
  const [suspensionHistory, setSuspensionHistory] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ============================================
  // Driver Management Hook
  // ============================================
  const {
    drivers,
    loading,
    processing,
    handleApprove,
    handleReject,
    handleToggleOnline,
    handleSuspend,
    handleReactivate,
    loadSuspensionHistory,
  } = useDriverManagement(filter, canModerate, isChecking);

  // ============================================
  // Computed Values
  // ============================================
  const stats = calculateDriverStats(drivers);
  const filteredDrivers = filterDrivers(drivers, filter, search);

  // ============================================
  // Event Handlers
  // ============================================
  const handleReviewDriver = (driver: DriverRequest) => {
    setSelectedDriver(driver);
    setReviewOpen(true);
  };

  const handleApproveDriver = async () => {
    if (!selectedDriver) return;
    await handleApprove(selectedDriver);
    setReviewOpen(false);
  };

  const handleRejectDriver = async () => {
    if (!selectedDriver) return;
    await handleReject(selectedDriver, rejectionReason);
    setReviewOpen(false);
    setRejectionReason("");
  };

  const handleToggleDriverOnline = (driver: DriverRequest) => {
    const newOnlineStatus = !driver.is_online;

    if (!newOnlineStatus) {
      setConfirmDialog({
        open: true,
        title: "⏸️ Colocar Motorista Offline",
        description: `Tem certeza que deseja colocar ${driver.name ?? "este motorista"} offline? Ele não receberá novas corridas até ser reativado.`,
        variant: "default",
        action: () => executeToggleOnline(driver, newOnlineStatus),
      });
      return;
    }

    executeToggleOnline(driver, newOnlineStatus);
  };

  const executeToggleOnline = async (driver: DriverRequest, newOnlineStatus: boolean) => {
    await handleToggleOnline(driver, newOnlineStatus);
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleSuspendDriver = (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "🚫 Suspender Motorista",
      description: `Tem certeza que deseja suspender ${driver.name ?? "este motorista"}? Esta ação bloqueará o acesso dele e ele não poderá aceitar corridas. Você poderá reativá-lo depois.`,
      variant: "destructive",
      action: () => executeSuspend(driver),
    });
  };

  const executeSuspend = async (driver: DriverRequest) => {
    await handleSuspend(driver, rejectionReason || "Suspenso pelo administrador");
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleReactivateDriver = (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "✅ Reativar Motorista",
      description: `Tem certeza que deseja reativar ${driver.name ?? "este motorista"}? Ele poderá voltar a aceitar corridas na plataforma.`,
      variant: "default",
      action: () => executeReactivate(driver),
    });
  };

  const executeReactivate = async (driver: DriverRequest) => {
    await handleReactivate(driver);
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleViewHistory = async (driverProfileId: string) => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const history = await loadSuspensionHistory(driverProfileId);
      setSuspensionHistory(history);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ============================================
  // Driver Actions
  // ============================================
  const driverActions = {
    onReview: handleReviewDriver,
    onToggleOnline: handleToggleDriverOnline,
    onSuspend: handleSuspendDriver,
    onReactivate: handleReactivateDriver,
    onViewHistory: handleViewHistory,
  };

  // ============================================
  // Guard Validation
  // ============================================
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

  // ============================================
  // Main Render
  // ============================================
  return (
    <AdminMotoristasLayout>
      {/* Header */}
      <AdminMotoristasHeaderSection />

      {/* Tabs */}
      <AdminMotoristasTabsSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        drivers={drivers}
      >
        {/* Stats */}
        <AdminMotoristasStatsSection stats={stats} />

        {/* Filters */}
        <AdminMotoristasFiltersSection
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />

        {/* List or Empty */}
        {filteredDrivers.length === 0 ? (
          <AdminMotoristasEmptySection filter={filter} />
        ) : (
          <AdminMotoristasListSection
            drivers={filteredDrivers}
            actions={driverActions}
          />
        )}
      </AdminMotoristasTabsSection>

      {/* Dialogs */}
      <DriverReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        driver={selectedDriver}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onApprove={handleApproveDriver}
        onReject={handleRejectDriver}
        processing={processing}
      />

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        variant={confirmDialog.variant}
        processing={processing}
      />

      <SuspensionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={suspensionHistory}
        loading={historyLoading}
      />
    </AdminMotoristasLayout>
  );
}
