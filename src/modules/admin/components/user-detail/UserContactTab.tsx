import type { ReactNode } from "react";
import { Copy, ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";
import type { AdminUserDetail } from "@/modules/admin/hooks/useAdminUserDetail";
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
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { toast } from "sonner";

interface UserContactTabProps {
  user: AdminUserDetail;
}

export function UserContactTab({ user }: UserContactTabProps) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error(`Não foi possível copiar ${label.toLowerCase()}.`);
    }
  };

  const openWhatsApp = () => {
    const url = buildWhatsAppUrl(user.phone);
    if (url) {
      openSafeExternalUrl(url, { context: "admin-user-contact-whatsapp" });
    }
  };

  const sendEmail = () => {
    if (user.email) {
      openContactUrl(buildMailtoUrl(user.email));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-sm">Informações de contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContactRow
            icon={Mail}
            iconClassName="text-info"
            label="E-mail"
            value={user.email || "Não informado"}
            actions={
              user.email ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copyToClipboard(user.email, "E-mail")}
                    aria-label="Copiar e-mail"
                  >
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  </Button>
                  <Button size="sm" onClick={sendEmail}>
                    <ExternalLink className="mr-1 h-3 w-3" aria-hidden="true" />
                    Enviar
                  </Button>
                </div>
              ) : null
            }
          />

          <ContactRow
            icon={Phone}
            iconClassName="text-success"
            label="Telefone"
            value={user.phone || "Não informado"}
            actions={
              user.phone ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void copyToClipboard(user.phone, "Telefone")}
                  aria-label="Copiar telefone"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                </Button>
              ) : null
            }
          />

          {user.phone ? (
            <Button onClick={openWhatsApp} className="w-full">
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Abrir WhatsApp
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  iconClassName,
  label,
  value,
  actions,
}: {
  icon: typeof Mail;
  iconClassName: string;
  label: string;
  value: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${iconClassName}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="break-all text-sm text-foreground">{value}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}
