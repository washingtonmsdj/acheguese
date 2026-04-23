/**
 * useNovaRecomendacao — Hook para criar perguntas Q&A
 *
 * Q&A é territorial: location_id é obrigatório.
 * Usa homeDistrict.id do usuário como território canônico.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { logger } from "@/shared/utils/logger";
import { CommunityQAService } from "@/core/community/services/CommunityQAService";
import { buildRecommendationPrefillFromSearchParams } from "@/core/community/utils/recommendationPrefill";
import type { CreateQuestionInput } from "@/core/community/qa-types";

export interface NovaRecomendacaoData {
  titulo: string;
  description: string;
  category: string;
}

export function useNovaRecomendacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const appUrls = useAppUrls();
  const { homeDistrict, homeCity, hasHome, loading: territoryLoading } = useUserTerritory();
  const [loading, setLoading] = useState(false);

  const prefill = useMemo(
    () => buildRecommendationPrefillFromSearchParams(searchParams),
    [searchParams],
  );

  const [formData, setFormData] = useState<NovaRecomendacaoData>({
    titulo: prefill.titulo || "",
    description: prefill.description || "",
    category: prefill.category || "",
  });

  useEffect(() => {
    if (!prefill.titulo && !prefill.description && !prefill.category) return;
    setFormData((previous) => ({
      titulo: prefill.titulo || previous.titulo,
      description: prefill.description || previous.description,
      category: prefill.category || previous.category,
    }));
  }, [prefill]);

  const updateField = (field: keyof NovaRecomendacaoData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // location_id canônico: bairro do usuário, ou cidade como fallback
  const locationId = homeDistrict?.id ?? homeCity?.id ?? null;

  const validateForm = (): boolean => {
    if (!user) {
      toast({ title: "Faça login para perguntar", variant: "destructive" });
      navigate(appUrls.auth.login);
      return false;
    }

    if (!locationId) {
      toast({
        title: "Configure seu bairro no perfil antes de perguntar",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.titulo.trim() || !formData.category) {
      toast({ title: "Preencha o título e a categoria", variant: "destructive" });
      return false;
    }

    return true;
  };

  const submitRecomendacao = async (): Promise<boolean> => {
    if (!validateForm()) return false;

    setLoading(true);
    try {
      const questionInput: CreateQuestionInput = {
        autor_id: user!.id,
        titulo: formData.titulo.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location_id: locationId!,
      };

      const newQuestion = await CommunityQAService.createQuestion(questionInput);
      if (!newQuestion) throw new Error("Failed to create question");

      toast({ title: "Pergunta publicada!" });
      navigate(appUrls.community.recommendationDetail(newQuestion.id));
      return true;
    } catch (error) {
      logger.error("Error creating recommendation:", error);
      toast({ title: "Erro ao publicar", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => navigate(-1);

  const isFormValid = !!(formData.titulo.trim() && formData.category && locationId);

  return {
    formData,
    loading: loading || territoryLoading,
    user,
    locationId,
    hasHome,
    isFormValid,
    updateField,
    submitRecomendacao,
    handleGoBack,
  };
}
