/**
 * Barra de contato do vendedor - WhatsApp e chat interno
 * SSOT: integra com core/messaging para conversas reais.
 */

import React, { useState } from "react";
import { MessageCircle, Phone, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";
import { useSessionContext } from "@/core/session";
import { classifiedMessagingService } from "@/core/messaging/services/ClassifiedMessagingService";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { buildWhatsAppUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

interface VendedorContactBarProps {
  vendedorId: string;
  vendedorName: string;
  vendedorPhone?: string | null;
  vendedorWhatsapp?: string | null;
  initialClassifiedId?: string | null;
}

export function VendedorContactBar({
  vendedorId,
  vendedorName,
  vendedorPhone,
  vendedorWhatsapp,
  initialClassifiedId,
}: VendedorContactBarProps) {
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const showInternalChat = isLaunchSurfaceEnabled("communityCommunication");

  const whatsappNumber = vendedorWhatsapp || vendedorPhone;

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      toast.info("Este vendedor não informou WhatsApp.");
      return;
    }

    const text = `Olá ${vendedorName}! Vi seu perfil nos classificados e gostaria de saber mais sobre seus anúncios.`;
    const url = buildWhatsAppUrl(whatsappNumber, text);

    if (url) {
      openSafeExternalUrl(url, { context: "classified-seller-whatsapp" });
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (!user?.id || !activeProfile?.id) {
      toast.error("Faça login para enviar mensagens.");
      return;
    }

    if (activeProfile?.id === vendedorId) {
      toast.info("Você não pode enviar mensagem para o próprio perfil.");
      return;
    }

    if (!initialClassifiedId) {
      toast.info("Abra um anúncio deste vendedor para iniciar conversa.");
      return;
    }

    try {
      const conversation = await classifiedMessagingService.findOrCreateConversation(
        initialClassifiedId,
      );

      if (!conversation?.id) {
        toast.error("Não foi possível iniciar conversa agora.");
        return;
      }

      await classifiedMessagingService.sendMessage({
        conversation_id: conversation.id,
        text: message.trim(),
      });

      toast.success("Mensagem enviada com sucesso.");
      setMessage("");
      setChatOpen(false);
      navigate(appUrls.chat(conversation.id));
    } catch {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
  };

  return (
    <>
      <div className="mt-4 flex gap-2">
        <Button
          onClick={handleWhatsApp}
          className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
          size="sm"
        >
          <Phone className="h-4 w-4" />
          WhatsApp
        </Button>
        {showInternalChat ? (
          <Button
            onClick={() => setChatOpen(true)}
            variant="outline"
            className="flex-1 gap-2"
            size="sm"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar mensagem
          </Button>
        ) : null}
      </div>

      {showInternalChat ? (
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Mensagem para {vendedorName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Olá ${vendedorName}, tenho interesse nos seus anúncios...`}
              className="min-h-[120px] w-full resize-none rounded-xl border border-border bg-secondary/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      ) : null}
    </>
  );
}
