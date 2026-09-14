import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  MessageSquarePlus,
  ShieldCheck,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { ReviewQueryService } from "@/core/business/services/gastronomy.review.queries";
import { useSessionContext } from "@/core/session";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ReviewForm } from "../ReviewForm";
import type { OrderWithItems } from "../../services/OrderService";

interface OrderPublicReviewPanelProps {
  order: OrderWithItems;
  compact?: boolean;
  preview?: boolean;
}

const REVIEWABLE_ORDER_STATUSES = new Set(["delivered", "completed"]);

export function OrderPublicReviewPanel({
  order,
  compact = false,
  preview = false,
}: OrderPublicReviewPanelProps) {
  const { user, activeProfile, profiles } = useSessionContext();
  const [canReview, setCanReview] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const customerProfile = useMemo(
    () =>
      profiles.find((profile) => profile.id === order.customer_id) ??
      (activeProfile?.id === order.customer_id ? activeProfile : null),
    [activeProfile, order.customer_id, profiles],
  );
  const reviewerProfileId = customerProfile?.id ?? null;
  const isCustomerOrder = Boolean(reviewerProfileId);
  const isReviewableStatus = REVIEWABLE_ORDER_STATUSES.has(order.status);

  useEffect(() => {
    let cancelled = false;

    async function checkReviewPermission() {
      if (!user?.id || !isCustomerOrder || !isReviewableStatus || submitted) {
        setCanReview(false);
        return;
      }

      setIsChecking(true);
      try {
        const allowed = await ReviewQueryService.canUserReviewBusiness({
          userId: user.id,
          businessProfileId: order.merchant_profile_id,
          reviewerProfileId,
        });
        if (!cancelled) setCanReview(allowed);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }

    void checkReviewPermission();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    isCustomerOrder,
    isReviewableStatus,
    order.merchant_profile_id,
    reviewerProfileId,
    submitted,
  ]);

  const statusMessage = useMemo(() => {
    if (!isCustomerOrder) return null;
    if (!isReviewableStatus) {
      return "A avaliação pública da loja fica disponível quando o pedido for entregue.";
    }
    if (submitted)
      return "Avaliação registrada. Obrigado por ajudar a comunidade local.";
    if (!canReview && !isChecking)
      return "Você já avaliou esta loja ou ainda não está elegível para avaliar.";
    return null;
  }, [canReview, isChecking, isCustomerOrder, isReviewableStatus, submitted]);

  const canShowCompactPreview = compact && preview;
  if (!isCustomerOrder && !canShowCompactPreview) return null;

  if (compact && (canReview || preview) && !submitted && !isExpanded) {
    return (
      <Card className="border-territory-border bg-territory-surface text-territory-ink">
        <CardHeader className="pb-3 md:pb-2">
          <CardTitle className="text-base md:text-sm">Como foi sua experiência com a loja?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:flex md:items-center md:gap-4 md:space-y-0 md:pb-3">
          <div className="flex items-center justify-center gap-2 md:justify-start" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-7 w-7 text-territory-muted" />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full border-territory-brand bg-territory-surface text-territory-brand hover:bg-territory-raised hover:text-territory-brand md:min-h-9 md:w-auto md:min-w-28"
            onClick={() => setIsExpanded(true)}
          >
            Avaliar a loja
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (data: {
    rating: number;
    comment: string;
    photos: string[];
  }) => {
    if (!reviewerProfileId) {
      toast.error("Perfil do cliente obrigatório para avaliar este pedido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await ReviewQueryService.createReview({
        reviewed_profile_id: order.merchant_profile_id,
        reviewer_profile_id: reviewerProfileId,
        rating: data.rating,
        comment: data.comment,
        photos: data.photos,
        order_id: order.id,
      });

      setSubmitted(true);
      setCanReview(false);
      toast.success("Avaliação publicada com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao publicar avaliação.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-amber-600" />
              Avaliar experiência
            </CardTitle>
            <CardDescription>
              Sua avaliação pública ajuda outros moradores. Sinais críticos
              também entram no SSOT privado de confiança para revisão
              operacional.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-amber-300 bg-white text-amber-700"
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Pós-entrega
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isChecking ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : canReview ? (
          <ReviewForm
            onSubmit={handleSubmit}
            submitLabel="Publicar avaliação da loja"
            isSubmitting={isSubmitting}
          />
        ) : (
          <div
            className="flex items-start gap-3 rounded-lg border bg-white p-4 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {submitted ? (
              <Star className="mt-0.5 h-4 w-4 fill-amber-400 text-amber-400" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
            )}
            <p>{statusMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
