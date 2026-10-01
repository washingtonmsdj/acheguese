import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { BusinessService } from "@/core/business/services/BusinessService";
import { useDashboardAccess } from "@/core/business/hooks/useDashboardAccess";
import { Button } from "@/shared/components/ui/button";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";
import { useActiveBusinessDashboardContext } from "../businessDashboardContext";

export function BusinessSettingsRiskAction() {
  const { businessId, business } = useActiveBusinessDashboardContext();
  const { permissions, loading, error, checkedProfileId } = useDashboardAccess(
    business.profile_id,
  );
  const [busy, setBusy] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const queryClient = useQueryClient();
  const canDeactivate =
    !loading &&
    !error &&
    checkedProfileId === business.profile_id &&
    permissions.role === "owner" &&
    !["inactive", "deleted"].includes(business.status);

  async function deactivate() {
    if (!canDeactivate || busy) return;
    setBusy(true);
    try {
      if (
        !(await confirm({
          title: "Desativar empresa?",
          description: `A empresa ${business.name} será desativada e removida do catálogo público. Os registros são preservados, mas não existe reativação nesta tela.`,
          confirmLabel: "Desativar empresa",
          variant: "destructive",
        }))
      )
        return;
      await BusinessService.deleteBusiness(businessId);
      await queryClient.invalidateQueries({
        queryKey: ["business", businessId],
      });
      toast.success("Empresa desativada.");
    } catch {
      toast.error("Não foi possível desativar a empresa. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (!canDeactivate) return null;
  return (
    <section
      className="business-management-panel border-destructive/30"
      aria-labelledby="business-risk-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2
            id="business-risk-title"
            className="flex items-center gap-2 font-semibold"
          >
            <CircleAlert
              className="h-5 w-5 text-destructive"
              aria-hidden="true"
            />
            Área de risco
          </h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Desativar remove a empresa do catálogo público. Os registros são
            preservados, mas não existe reativação nesta tela.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={busy}
          onClick={() => void deactivate()}
        >
          {busy ? "Aguarde…" : "Desativar empresa"}
        </Button>
      </div>
      <ConfirmDialog />
    </section>
  );
}
