import { useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Eye,
  Mail,
  MessageCircle,
  Shield,
} from "lucide-react";
import { AdminUserService } from "@/core/admin/services/AdminUserService";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  buildMailtoUrl,
  buildWhatsAppUrl,
  openContactUrl,
} from "@/shared/utils/contactLinks";
import { logger } from "@/shared/utils/logger";
import {
  openSafeExternalUrl,
  openSafeUrlInNewTab,
} from "@/shared/utils/safeRedirect";
import { toast } from "sonner";
import { SuspendUserDialog } from "./SuspendUserDialog";

interface UserActionsCardProps {
  user: {
    id: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    phone?: string | null;
    verified?: boolean | null;
    suspended?: boolean | null;
    suspended_until?: string | null;
  };
  onUpdate: () => void;
}

export function UserActionsCard({ user, onUpdate }: UserActionsCardProps) {
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await AdminUserService.verifyUser(user.id);
      logger.info("Usuário verificado", { userId: user.id });
      toast.success(`${user.name || "Usuário"} foi verificado!`);
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
      await AdminUserService.unsuspendProfile(user.id);
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
      toast.error("Usuário sem username público");
      return;
    }

    openSafeUrlInNewTab(buildPublicProfileUrl(username), {
      context: "admin-user-public-profile",
    });
  };

  const sendEmail = () => {
    if (user.email) {
      openContactUrl(buildMailtoUrl(user.email));
    }
  };

  const openWhatsApp = () => {
    const url = buildWhatsAppUrl(user.phone);
    if (url) {
      openSafeExternalUrl(url, { context: "admin-user-actions-whatsapp" });
    }
  };

  return (
    <>
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-sm">Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!user.verified ? (
            <Button
              size="sm"
              className="w-full"
              onClick={() => void handleVerify()}
              disabled={loading}
            >
              <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
              Verificar perfil
            </Button>
          ) : null}

          {user.suspended ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-success/30 text-success hover:bg-success/10 hover:text-success"
              onClick={() => void handleUnsuspend()}
              disabled={loading}
            >
              <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Remover suspensão
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setSuspendDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
              Suspender usuário
            </Button>
          )}

          <div className="my-3 border-t border-border" />

          {user.email ? (
            <Button size="sm" variant="outline" className="w-full" onClick={sendEmail}>
              <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
              Enviar e-mail
            </Button>
          ) : null}

          {user.phone ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={openWhatsApp}
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Abrir WhatsApp
            </Button>
          ) : null}

          <div className="my-3 border-t border-border" />

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={openPublicProfile}
          >
            <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
            Ver perfil público
          </Button>

          {user.suspended ? (
            <div className="mt-3 flex gap-2 rounded border border-destructive/30 bg-destructive/10 p-2 text-xs text-foreground/85">
              <AlertTriangle
                className="h-4 w-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-destructive">Usuário suspenso</p>
                {user.suspended_until ? (
                  <p className="text-muted-foreground">
                    Até: {new Date(user.suspended_until).toLocaleDateString("pt-BR")}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        userId={user.id}
        userName={user.name || "Usuário"}
        onSuccess={onUpdate}
      />
    </>
  );
}
