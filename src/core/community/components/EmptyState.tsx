import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  getCardClasses,
  getCardBackground,
  INLINE_STYLES,
} from "./styles/communityDesignSystem";
import { Users, Plus } from "lucide-react";
/**
 * Empty State para quando não há posts
 * Mostra mensagem amigável e call-to-action
 */

interface EmptyStateProps {
  onCreatePost?: () => void;
}

export function EmptyState({ onCreatePost }: EmptyStateProps) {
  return (
    <Card
      className={getCardClasses("default")}
      style={getCardBackground("alt")}
    >
      <CardContent className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          {/* Ícone */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(79, 209, 197, 0.1)" }}
          >
            <Users className="w-10 h-10" style={{ color: "#4FD1C5" }} />
          </div>

          {/* Título */}
          <h3 className="text-xl font-bold" style={INLINE_STYLES.textPrimary}>
            Ainda está quieto por aqui
          </h3>

          {/* Descrição */}
          <p className="text-sm max-w-md" style={INLINE_STYLES.textSecondary}>
            Publique o primeiro e puxe a conversa do bairro. Pode ser uma
            dica, uma pergunta ou uma novidade — o que estiver rolando por aí.
          </p>

          {/* Call to Action */}
          {onCreatePost && (
            <Button
              onClick={onCreatePost}
              className="rounded-lg px-6 h-11 font-bold mt-2 flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)",
                color: "#FFFFFF",
              }}
              aria-label="Publicar no bairro"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Publicar no bairro
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
