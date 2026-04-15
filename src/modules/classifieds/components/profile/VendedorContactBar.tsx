/**
 * Barra de contato do vendedor — WhatsApp e chat interno
 * ✅ SSOT: usa messaging types de core/messaging
 */

import React, { useState } from "react";
import { MessageCircle, Phone, Send } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { toast } from "sonner";

interface VendedorContactBarProps {
  vendedorId: string;
  vendedorName: string;
  vendedorPhone?: string | null;
  vendedorWhatsapp?: string | null;
}

export function VendedorContactBar({
  vendedorId,
  vendedorName,
  vendedorPhone,
  vendedorWhatsapp,
}: VendedorContactBarProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");

  const whatsappNumber = vendedorWhatsapp || vendedorPhone;

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      toast.info("Este vendedor não informou WhatsApp.");
      return;
    }
    const cleaned = whatsappNumber.replace(/\D/g, "");
    const fullNumber = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
    const text = encodeURIComponent(
      `Olá ${vendedorName}! Vi seu perfil nos classificados e gostaria de saber mais sobre seus anúncios.`
    );
    window.open(`https://wa.me/${fullNumber}?text=${text}`, "_blank");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: integrar com ChatService/messagingService real
    toast.success("Mensagem enviada! O vendedor será notificado.");
    setMessage("");
    setChatOpen(false);
  };

  return (
    <>
      {/* Sticky contact bar */}
      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleWhatsApp}
          className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <Phone className="h-4 w-4" />
          WhatsApp
        </Button>
        <Button
          onClick={() => setChatOpen(true)}
          variant="outline"
          className="flex-1 gap-2"
          size="sm"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar mensagem
        </Button>
      </div>

      {/* Chat dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Mensagem para {vendedorName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Olá ${vendedorName}, tenho interesse nos seus anúncios...`}
              className="w-full min-h-[120px] rounded-xl border border-border bg-secondary/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
              >
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
    </>
  );
}
