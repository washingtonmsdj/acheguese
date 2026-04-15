import React from "react";
import { MessageCircle, Loader2, Shield, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/shared/components/ui/button";

interface AdActionsProps {
  isOwner: boolean;
  startingChat: boolean;
  onStartChat: () => void;
  onWhatsApp: () => void;
}

export function AdActions({
  isOwner,
  startingChat,
  onStartChat,
  onWhatsApp,
}: AdActionsProps) {
  if (isOwner) return null;

  return (
    <>
      {/* Safety tips */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 mx-4 bg-warning/5 border border-warning/20 rounded-2xl p-3"
      >
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-warning">
              Dicas de segurança
            </p>
            <ul className="text-[11px] text-muted-foreground mt-1 space-y-0.5 leading-relaxed">
              <li>• Combine encontros em locais públicos e movimentados</li>
              <li>• Não faça pagamentos antecipados sem ver o produto</li>
              <li>• Verifique a avaliação do vendedor antes de negociar</li>
              <li>• Desconfie de preços muito abaixo do mercado</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-16 left-0 right-0 z-40 px-4 py-3 bg-card/95 backdrop-blur-lg border-t"
      >
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl font-semibold"
            disabled={startingChat}
            onClick={onStartChat}
          >
            {startingChat ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl font-semibold"
            onClick={onWhatsApp}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            className="flex-1 rounded-xl font-semibold bg-success hover:bg-success/90 shadow-lg shadow-success/20"
            onClick={onWhatsApp}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
        </div>
      </motion.div>
    </>
  );
}
