import { Shield } from "lucide-react";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import AdminBusinessPage from "./AdminBusinessPage";

export default function AdminEmpresas() {
  const { canModerate, isChecking } = useAdminGuard();

  // Validação de admin
  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <AdminBusinessPage />;
}
