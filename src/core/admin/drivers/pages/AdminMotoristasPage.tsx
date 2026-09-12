/**
 * AdminMotoristasPage (REFATORADO)
 *
 * Pagina de Gestao de Motoristas.
 * Moderacao e presenca operacional sao authorities diferentes: o Admin pode
 * suspender/reativar/moderar, mas nao pode forjar o estado online do motorista.
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

  const {
    drivers,
    loading,
    processing,
    handleApprove,
    handleReject,
    handleSuspend,
    handleReactivate,
    loadSuspensionHistory,
  } = useDriverManagement(canModerate, isChecking);

  const stats = calculateDriverStats(drivers);
  const filteredDrivers = filterDrivers(drivers, filter, search);

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

  const handleSuspendDriver = (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "Suspender motorista",
      description: `Tem certeza que deseja suspender ${driver.name ?? "este motorista"}? Esta acao bloqueia a elegibilidade operacional; a presenca online continua sendo estado fisico do proprio motorista.`,
      variant: "destructive",
      action: () => executeSuspend(driver),
    });
  };

  const executeSuspend = async (driver: DriverRequest) => {
    await handleSuspend(driver, rejectionReason || "Suspenso pelo administrador");
    setConfirmDialog((current) => ({ ...current, open: false }));
  };

  const handleReactivateDriver = (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "Reativar motorista",
      description: `Tem certeza que deseja reativar ${driver.name ?? "este motorista"}? A reativacao remove a suspensao, mas o motorista precisa entrar online por conta propria para receber ofertas.`,
      variant: "default",
      action: () => executeReactivate(driver),
    });
  };

  const executeReactivate = async (driver: DriverRequest) => {
    await handleReactivate(driver);
    setConfirmDialog((current) => ({ ...current, open: false }));
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

  const driverActions = {
    onReview: handleReviewDriver,
    onSuspend: handleSuspendDriver,
    onReactivate: handleReactivateDriver,
    onViewHistory: handleViewHistory,
  };

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta pagina.
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
    <AdminMotoristasLayout>
      <AdminMotoristasHeaderSection />

      <AdminMotoristasTabsSection
        activeTab={activeTab}
        onTabChange={setActiveTab}
        drivers={drivers}
      >
        <AdminMotoristasStatsSection stats={stats} />

        <AdminMotoristasFiltersSection
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />

        {filteredDrivers.length === 0 ? (
          <AdminMotoristasEmptySection filter={filter} />
        ) : (
          <AdminMotoristasListSection
            drivers={filteredDrivers}
            actions={driverActions}
          />
        )}
      </AdminMotoristasTabsSection>

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
        onOpenChange={(open) => setConfirmDialog((current) => ({ ...current, open }))}
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
