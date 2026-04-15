import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { OrdaxSpec, ChatMsg } from "@/lib/ordax/types";
import { supabase } from "@/integrations/supabase/client";

export interface UseCoachTipsProps {
  setStage: (stage: string) => void;
  addMessage: (message: ChatMsg) => void;
}

export interface UseCoachTipsReturn {
  // State
  isRequesting: boolean;
  
  // Actions
  requestCoachTips: (spec: OrdaxSpec) => Promise<void>;
}

export const useCoachTips = ({
  setStage,
  addMessage,
}: UseCoachTipsProps): UseCoachTipsReturn => {
  const [isRequesting, setIsRequesting] = useState(false);

  const requestCoachTips = useCallback(async (spec: OrdaxSpec) => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    setStage("coaching");

    try {
      const { data, error } = await supabase.functions.invoke("game-ai-chat", {
        body: {
          action: "COACH_TIPS",
          spec,
        },
      });

      if (error) {
        console.error("[useCoachTips] Erro ao buscar dicas:", error);
        toast.error("Não foi possível carregar dicas de melhoria");
        setStage("idle");
        return;
      }

      const tips = data?.tips as string[] | undefined;
      const nextSteps = data?.nextSteps as string[] | undefined;

      if (tips?.length || nextSteps?.length) {
        const messageContent = [
          "🎯 **Dicas de melhoria:**",
          ...(tips?.map(tip => `• ${tip}`) || []),
          "",
          "🚀 **Próximos passos sugeridos:**",
          ...(nextSteps?.map(step => `• ${step}`) || []),
        ].join("\n");

        addMessage({
          role: "assistant",
          content: messageContent,
        });
      } else {
        addMessage({
          role: "assistant",
          content: "✅ Jogo gerado! Peça ajustes ou melhorias quando quiser.",
        });
      }
    } catch (error) {
      console.error("[useCoachTips] Exception:", error);
      addMessage({
        role: "assistant",
        content: "✅ Jogo gerado! Você pode pedir ajustes a qualquer momento.",
      });
    } finally {
      setIsRequesting(false);
      setStage("idle");
    }
  }, [isRequesting, setStage, addMessage]);

  return {
    isRequesting,
    requestCoachTips,
  };
};