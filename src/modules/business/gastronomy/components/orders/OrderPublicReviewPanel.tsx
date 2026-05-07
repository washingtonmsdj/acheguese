import { useEffect, useMemo, useState } from "react";
import { AlertCircle, MessageSquarePlus, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";

import { useSessionContext } from "@/core/session";
import {
  TRUST_ACTOR_ROLES,
  TRUST_CONTEXT_TYPES,
  TRUST_EVENT_TYPES,
  TRUST_VISIBILITIES,
  TrustEventService,
} from "@/core/trust";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ReviewForm } from "../ReviewForm";
import { ReviewQueryService } from "../../services/review.queries";
import type { OrderWithItems } from "../../services/OrderService";

interface OrderPublicReviewPanelProps {
  order: OrderWithItems;
}

const REVIEWABLE_ORDER_STATUSES = new Set(["delivered", "completed"]);

function trustSeverityForRating(rating: number) {
  if (rating <= 1) return "high";
  if (rating <= 2) return "medium";
  return "low";
}

export function OrderPublicReviewPanel({ order }: OrderPublicReviewPanelProps) {
  const { user, activeProfile } = useSessionContext();
  const [canReview, setCanReview] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isCustomerOrder = Boolean(
    activeProfile?.id && order.customer_id && activeProfile.id === order.customer_id,
  );
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
          businessProfileId: order.business_id,
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
  }, [user?.id, isCustomerOrder, isReviewableStatus, order.business_id, submitted]);

  const statusMessage = useMemo(() => {
    if (!isCustomerOrder) return null;
    if (!isReviewableStatus) {
      return "A avaliacao publica da loja fica disponivel quando o pedido for entregue.";
    }
    if (submitted) return "Avaliacao registrada. Obrigado por ajudar a comunidade local.";
    if (!canReview && !isChecking) return "Voce ja avaliou esta loja ou ainda nao esta elegivel para avaliar.";
    return null;
  }, [canReview, isChecking, isCustomerOrder, isReviewableStatus, submitted]);

  if (!isCustomerOrder) return null;

  const handleSubmit = async (data: { rating: number; comment: string; photos: string[] }) => {
    if (!activeProfile?.id) {
      toast.error("Perfil ativo obrigatorio para avaliar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const review = await ReviewQueryService.createReview({
        reviewed_profile_id: order.business_id,
        reviewer_profile_id: activeProfile.id,
        rating: data.rating,
        comment: data.comment,
        photos: data.photos,
        order_id: order.id,
      });

      if (data.rating <= 2) {
        await TrustEventService.upsertOperationalFeedback({
          actor_profile_id: activeProfile.id,
          actor_role: TRUST_ACTOR_ROLES.CUSTOMER,
          subject_profile_id: order.business_id,
          subject_role: TRUST_ACTOR_ROLES.MERCHANT,
          context_type: TRUST_CONTEXT_TYPES.ORDER,
          context_id: order.id,
          event_type: TRUST_EVENT_TYPES.REVIEW,
          rating: data.rating,
          reason_code: "customer_low_public_review",
          severity: trustSeverityForRating(data.rating),
          visibility: TRUST_VISIBILITIES.PRIVATE,
          description: data.comment,
          evidence: {
            review_id: review.id,
            order_total: order.total,
            order_status: order.status,
            source: "gastronomy_customer_public_review",
          },
        });
      }

      setSubmitted(true);
      setCanReview(false);
      toast.success("Avaliacao publicada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao publicar avaliacao.");
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
              Avaliar experiencia
            </CardTitle>
            <CardDescription>
              Sua avaliacao publica ajuda outros moradores. Sinais criticos tambem entram no SSOT privado de confianca para revisao operacional.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit border-amber-300 bg-white text-amber-700">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Pos-entrega
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
            submitLabel="Publicar avaliacao da loja"
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="flex items-start gap-3 rounded-lg border bg-white p-4 text-sm text-muted-foreground">
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
