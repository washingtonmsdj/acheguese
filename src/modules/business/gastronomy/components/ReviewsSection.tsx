/**
 * ReviewsSection - Seção completa de avaliações
 */

import { useState } from 'react';
import { Star, MessageSquarePlus } from 'lucide-react';

import type { Review } from '@/core/business/services/gastronomy.review.queries';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { getRecordValue } from '@/shared/utils/recordLookup';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { useReviewsManager } from '../hooks/useGastronomyReviews';
import { useUserReviewVote } from '../hooks/useGastronomyReviews';

interface ReviewsSectionProps {
  businessProfileId: string;
  businessName: string;
}

export function ReviewsSection({
  businessProfileId,
  businessName,
}: ReviewsSectionProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);

  const {
    reviews,
    stats,
    canReview,
    isLoadingReviews,
    isLoadingStats,
    createReview,
    deleteReview,
    reportReview,
    voteReview,
    isCreating,
    user,
    activeProfile,
  } = useReviewsManager(businessProfileId);

  const handleCreateReview = async (data: {
    rating: number;
    comment: string;
    photos: string[];
  }) => {
    if (!activeProfile?.id) {
      return;
    }

    await createReview({
      reviewed_profile_id: businessProfileId,
      reviewer_profile_id: activeProfile.id,
      rating: data.rating,
      comment: data.comment,
      photos: data.photos,
    });

    setShowReviewForm(false);
  };

  const handleVote = async (reviewId: string, isHelpful: boolean) => {
    if (!activeProfile?.id) {
      return;
    }

    await voteReview({
      review_id: reviewId,
      voter_profile_id: activeProfile.id,
      is_helpful: isHelpful,
    });
  };

  if (isLoadingStats) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const distribution = stats?.distribution || {};
  const total = stats?.total || 0;
  const average = stats?.average || 0;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Avaliações</h2>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? 'Seja o primeiro a avaliar'
              : `${total} ${total === 1 ? 'avaliação' : 'avaliações'}`}
          </p>
        </div>

        {canReview && (
          <Button onClick={() => setShowReviewForm(true)}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Avaliar
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      {total > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Média geral */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{average.toFixed(1)}</div>
                <div className="mt-1 flex items-center justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < Math.round(average)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-muted text-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {total} {total === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>

              <Separator orientation="vertical" className="h-24" />

              {/* Distribuição */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = getRecordValue(distribution, String(stars)) || 0;
                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="w-8 text-xs text-muted-foreground">
                        {stars} ★
                      </span>
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="w-8 text-right text-xs text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de avaliações */}
      {isLoadingReviews ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCardWithVote
              key={review.id}
              review={review}
              canEdit={review.reviewer_profile_id === activeProfile?.id}
              onDelete={() => deleteReview(review.id)}
              onReport={() =>
                activeProfile &&
                reportReview({
                  review_id: review.id,
                  reason: 'inappropriate',
                })
              }
              onVote={(isHelpful) => handleVote(review.id, isHelpful)}
              voterProfileId={activeProfile?.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <MessageSquarePlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma avaliação ainda</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Seja o primeiro a compartilhar sua experiência com {businessName}
          </p>
          {canReview && (
            <Button onClick={() => setShowReviewForm(true)} className="mt-4">
              Escrever avaliação
            </Button>
          )}
        </div>
      )}

      {/* Dialog de criar avaliação */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Avaliar {businessName}</DialogTitle>
            <DialogDescription>
              Compartilhe sua experiência para ajudar outros clientes
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            onSubmit={handleCreateReview}
            onCancel={() => setShowReviewForm(false)}
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

// Componente auxiliar para gerenciar voto individual
function ReviewCardWithVote({
  review,
  canEdit,
  onDelete,
  onReport,
  onVote,
  voterProfileId,
}: {
  review: Review;
  canEdit: boolean;
  onDelete: () => void;
  onReport: () => void;
  onVote: (isHelpful: boolean) => void;
  voterProfileId?: string;
}) {
  const { data: userVote } = useUserReviewVote({
    reviewId: review.id,
    voterProfileId: voterProfileId || '',
    enabled: !!voterProfileId,
  });

  return (
    <ReviewCard
      review={review}
      canEdit={canEdit}
      userVote={userVote}
      onDelete={onDelete}
      onReport={onReport}
      onVote={onVote}
    />
  );
}
