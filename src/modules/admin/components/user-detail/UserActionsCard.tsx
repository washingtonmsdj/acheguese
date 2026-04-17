import { useState } from "react";
import {
  Shield,
  Ban,
  CheckCircle,
  Mail,
  Eye,
  ExternalLink,
  MessageCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { SuspendUserDialog } from "./SuspendUserDialog";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";

interface UserActionsCardProps {
  user: any;
  onUpdate: () => void;
}

export function UserActionsCard({ user, onUpdate }: UserActionsCardProps) {
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await profileService.updateProfile(user.id, {
        is_verified_resident: true,
      });

      logger.info("Usuário verificado", { userId: user.id });
      toast.success(`${user.name} foi verificado!`);
      onUpdate();
    } catch (error) {
      logger.error("Erro ao verificar usuário:", error);
      toast.error("Erro ao verificar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setLoading(true);
    try {
      await profileService.updateProfile(user.id, {
        suspended: false,
        suspended_until: null,
      });

      logger.info("Suspensão removida", { userId: user.id });
      toast.success("Suspensão removida com sucesso!");
      onUpdate();
    } catch (error) {
      logger.error("Erro ao remover suspensão:", error);
      toast.error("Erro ao remover suspensão");
    } finally {
      setLoading(false);
    }
  };

  const openPublicProfile = () => {
    const username = user.username?.trim();
    if (!username) {
      toast.error("Usuario sem username publico");
      return;
    }

    window.open(buildPublicProfileUrl(username), "_blank");
  };

  const sendEmail = () => {
    if (user.email) {
      window.open(`mailto:${user.email}`, "_blank");
    }
  };

  const openWhatsApp = () => {
    const phone = user.phone?.replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/55${phone}`, "_blank");
    }
  };

  return (
    <>
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Verificação */}
          {!user.is_verified_resident && (
            <Button
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleVerify}
              disabled={loading}
            >
              <Shield className="h-4 w-4 mr-2" />
              Verificar Morador
            </Button>
          )}

          {/* Suspensão */}
          {user.suspended ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10"
              onClick={handleUnsuspend}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Remover Suspensão
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => setSuspendDialogOpen(true)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspender Usuário
            </Button>
          )}

          {/* Divider */}
          <div className="border-t border-white/10 my-3" />

          {/* Comunicação */}
          {user.email && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-white/10"
              onClick={sendEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          )}

          {user.phone && (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-white/10"
              onClick={openWhatsApp}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir WhatsApp
            </Button>
          )}

          {/* Divider */}
          <div className="border-t border-white/10 my-3" />

          {/* Visualização */}
          <Button
            size="sm"
            variant="outline"
            className="w-full border-white/10"
            onClick={openPublicProfile}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Perfil Público
          </Button>

          {/* Aviso se suspenso */}
          {user.suspended && (
            <div className="flex gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-200 mt-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Usuário Suspenso</p>
                {user.suspended_until && (
                  <p className="text-red-300/80">
                    Até:{" "}
                    {new Date(user.suspended_until).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Suspensão */}
      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        userId={user.id}
        userName={user.name}
        onSuccess={onUpdate}
      />
    </>
  );
}
