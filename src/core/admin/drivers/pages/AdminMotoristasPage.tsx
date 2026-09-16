/**
 * AdminMotoristasPage
 *
 * Página de gestão de motoristas.
 * Moderação e presença operacional são authorities diferentes: o Admin pode
 * suspender/reativar/moderar, mas não pode forjar o estado online do motorista.
 */

import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { useAdminGuard } from "@/core/admin/hooks/useAdminGuard";
import { RIDE_STATUS } from "@/shared/types/constants";
import {
  ConfirmationDialog,
  DriverReviewDialog,
  SuspensionHistoryDialog,
} from "../components/dialogs";
import { useDriverManagement } from "../hooks";
import {
  AdminMotoristasEmptySection,
  AdminMotoristasFiltersSection,
  AdminMotoristasHeaderSection,
  AdminMotoristasListSection,
  AdminMotoristasStatsSection,
  AdminMotoristasTabsSection,
} from "../sections";
import type {
  ConfirmDialogState,
  DriverRequest,
  FilterStatus,
  SuspensionHistoryEntry,
} from "../sections/types";
import { calculateDriverStats, filterDrivers } from "../utils";
import { AdminMotoristasLayout } from "./AdminMotoristasLayout";

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
  const [suspensionHistory, setSuspensionHistory] = useState<
    SuspensionHistoryEntry[]
  >([]);
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
    setRejectionReason("");
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

  const executeSuspend = async (driver: DriverRequest) => {
    await handleSuspend(
      driver,
      rejectionReason.trim() || "Suspenso pelo administrador",
    );
    setConfirmDialog((current) => ({ ...current, open: false }));
  };

  const handleSuspendDriver = (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "Suspender motorista",
      description: `Tem certeza que deseja suspender ${
        driver.name ?? "este motorista"
      }? Esta ação bloqueia a elegibilidade operacional; a presença online continua sendo estado físico do próprio motorista.`,
      variant: "destructive",
      action: () => void executeSuspend(driver),
    });
  };

  const executeReactivate = async (driver: DriverRequest) => {
    await handleReactivate(driver);
    setConfirmDialog((current) => ({ ...current, open: false }));
  };

  const handleReactivateDriver = (driver: DriverRequest) => {
    setConfirmDialog({
      open: true,
      title: "Reativar motorista",
      description: `Tem certeza que deseja reativar ${
        driver.name ?? "este motorista"
      }? A reativação remove a suspensão, mas o motorista precisa entrar online por conta própria para receber ofertas.`,
      variant: "default",
      action: () => void executeReactivate(driver),
    });
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
    onViewHistory: (driverProfileId: string) => void handleViewHistory(driverProfileId),
  };

  if (!isChecking && !canModerate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-sm text-center">
          <Shield
            className="mx-auto mb-4 h-16 w-16 text-destructive"
            aria-hidden="true"
          />
          <h1 className="mb-2 text-2xl font-bold">Acesso negado</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status">
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Carregando gestão de motoristas</span>
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
        onOpenChange={(open) => {
          setReviewOpen(open);
          if (!open) {
            setSelectedDriver(null);
            setRejectionReason("");
          }
        }}
        driver={selectedDriver}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        onApprove={() => void handleApproveDriver()}
        onReject={() => void handleRejectDriver()}
        processing={processing}
      />

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((current) => ({ ...current, open }))
        }
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
