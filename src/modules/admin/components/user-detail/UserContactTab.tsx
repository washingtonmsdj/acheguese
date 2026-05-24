import { Mail, Phone, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { toast } from "sonner";
import type { AdminUserDetail } from "@/modules/admin/hooks/useAdminUserDetail";
import { buildMailtoUrl, buildWhatsAppUrl, openContactUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";

interface UserContactTabProps {
  user: AdminUserDetail;
}

export function UserContactTab({ user }: UserContactTabProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
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
      <Card className="bg-[#1E2529] border-white/10">
        <CardHeader>
          <CardTitle className="text-sm">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-3 bg-[#0A0F14] rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-white">
                  {user.email || "Não informado"}
                </p>
              </div>
            </div>
            {user.email && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(user.email, "Email")}
                  className="border-white/10"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={sendEmail}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Enviar
                </Button>
              </div>
            )}
          </div>

          {/* Telefone */}
          <div className="flex items-center justify-between p-3 bg-[#0A0F14] rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Telefone</p>
                <p className="text-sm text-white">
                  {user.phone || "Não informado"}
                </p>
              </div>
            </div>
            {user.phone && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(user.phone, "Telefone")}
                className="border-white/10"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* WhatsApp */}
          {user.phone && (
            <Button
              onClick={openWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir WhatsApp
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
