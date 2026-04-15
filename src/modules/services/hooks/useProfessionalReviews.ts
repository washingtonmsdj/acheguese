/**
 * ✅ SSOT COMPLIANT - Hook useProfessionalReviews migrado
 * GATE 3 - FASE 3B: Hook para reviews de profissionais
 * Migrado para usar ReviewsService e novo modelo de identidade
 * Usa profile ativo em vez de user_id
 * Usa useAppUrls para navegação (sem hardcoded URLs)
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useCommunityInteractions } from "@/core/community/hooks/useCommunityInteractions";
import { profileService } from "@/core/profiles";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import type { ReviewWithProfiles } from "@/shared/types/reviews";

export interface ProfessionalReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: { name: string; avatar_url: string } | null;
}

export function useProfessionalReviews(professionalId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { recordInteraction } = useCommunityInteractions();
  const [reviews, setReviews] = useState<ProfessionalReview[]>([]);
  const [userReview, setUserReview] = useState<ProfessionalReview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!professionalId) return;

    async function loadReviews() {
      setLoading(true);

      try {
        // ✅ GATE 3 FASE 3B - Usar ReviewsService para buscar reviews
        const reviewsData = await ReviewsService.getReviewsForProfile(
          professionalId,
          "professional",
        );

        // Mapear para formato compatível
        const mappedReviews: ProfessionalReview[] = reviewsData.map(
          (r: ReviewWithProfiles) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment || "",
            created_at: r.created_at,
            reviewer: {
              name: r.reviewer_profile.name,
              avatar_url: r.reviewer_profile.avatar_url || "",
            },
          }),
        );

        setReviews(mappedReviews);

        // ✅ GATE 3 FASE 3B - Verificar se usuário atual já avaliou
        if (user) {
          const activeProfile = await profileService.getActiveProfile(user.id);
          if (activeProfile) {
            const myReview = reviewsData.find(
              (r) => r.reviewer_profile_id === activeProfile.id,
            );
            if (myReview) {
              setUserReview({
                id: myReview.id,
                rating: myReview.rating,
                comment: myReview.comment || "",
                created_at: myReview.created_at,
                reviewer: {
                  name: myReview.reviewer_profile.name,
                  avatar_url: myReview.reviewer_profile.avatar_url || "",
                },
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading professional reviews:", error);
      }

      setLoading(false);
    }

    loadReviews();
  }, [professionalId, user]);

  const submitReview = useCallback(
    async (rating: number, comment: string, jobType?: string) => {
      if (!user) {
        toast({ title: "Faça login para avaliar", variant: "destructive" });
        navigate(appUrls.auth.login);
        return false;
      }

      if (!professionalId) return false;

      try {
        // ✅ GATE 3 FASE 3B - Usar profile ativo para criar review
        const activeProfile = await profileService.getActiveProfile(user.id);
        if (!activeProfile) {
          toast({
            title: "Perfil ativo não encontrado",
            variant: "destructive",
          });
          return false;
        }

        // ✅ GATE 3 FASE 3B - Usar ReviewsService para criar/atualizar review
        const { review, isNew } = await ReviewsService.upsertReview(
          {
            reviewed_profile_id: professionalId,
            reviewer_profile_id: activeProfile.id,
            rating,
            comment,
            job_type: jobType,
          },
          "professional",
        );

        // Atualizar estado local
        const newReview: ProfessionalReview = {
          id: review.id,
          rating: review.rating,
          comment: review.comment || "",
          created_at: review.created_at,
          reviewer: {
            name: activeProfile.name,
            avatar_url: activeProfile.avatar_url || "",
          },
        };

        if (isNew) {
          setReviews((prev) => [newReview, ...prev]);

          // Registrar interação e ganhar pontos (apenas para novas avaliações)
          recordInteraction(
            "review_written",
            "review",
            review.id,
            {},
            {
              showToast: true,
            },
          );

          toast({ title: "Avaliação enviada! ⭐" });
        } else {
          setReviews((prev) =>
            prev.map((r) => (r.id === review.id ? newReview : r)),
          );

          toast({ title: "Avaliação atualizada!" });
        }

        setUserReview(newReview);

        return true;
      } catch (error: any) {
        toast({
          title: "Erro ao enviar avaliação",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [user, professionalId, toast, navigate, appUrls, recordInteraction],
  );

  return {
    reviews,
    userReview,
    loading,
    submitReview,
  };
}
