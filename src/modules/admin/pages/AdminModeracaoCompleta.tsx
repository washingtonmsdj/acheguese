import { Shield } from "lucide-react";
import { TrustEventsQueue } from "@/core/admin/components/TrustEventsQueue";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { TrustAdminActionsLog } from "@/modules/admin/components/moderation/TrustAdminActionsLog";

export default function AdminModeracaoCompleta() {
  const { canModerate, isChecking } = useAdminGuard();

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">Apenas administradores podem acessar esta pagina.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Moderacao Completa</h1>
        <p className="text-muted-foreground">
          SSOT de moderacao: fila unica de confianca + audit log de acoes administrativas.
        </p>
      </div>

      <TrustEventsQueue />
      <TrustAdminActionsLog />
    </div>
  );
}

