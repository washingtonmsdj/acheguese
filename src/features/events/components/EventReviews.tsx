import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Flag, Star, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { useToast } from '@/shared/hooks/use-toast';
import {
  EVENT_REVIEW_LIMITS,
  validateEventReviewInput,
  type EventReview,
} from '../services/EventEngagementService';

type SubmitReviewInput = Pick<EventReview, 'rating' | 'comment'>;

interface EventReviewsProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  reviews?: EventReview[];
  averageRating?: number;
  totalReviews?: number;
  canReview?: boolean;
  reviewerProfileId?: string | null;
  onSubmitReview?: (input: SubmitReviewInput) => Promise<EventReview>;
  onMarkHelpful?: (reviewId: string) => Promise<void>;
}

const EMPTY_REVIEWS: EventReview[] = [];
const RATING_STARS = [5, 4, 3, 2, 1] as const;
const INTERACTIVE_STARS = [1, 2, 3, 4, 5] as const;

export function EventReviews({
  eventTitle,
  reviews: initialReviews = EMPTY_REVIEWS,
  averageRating: initialAverage = 0,
  totalReviews: initialTotal = 0,
  canReview = true,
  reviewerProfileId,
  onSubmitReview,
  onMarkHelpful,
}: EventReviewsProps) {
  const [reviews, setReviews] = useState<EventReview[]>(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [helpfulPendingId, setHelpfulPendingId] = useState<string | null>(null);
  const { toast } = useToast();
  const canSubmitReview = canReview && Boolean(reviewerProfileId && onSubmitReview);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const stats = useMemo(() => {
    const total = reviews.length || initialTotal;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = reviews.length > 0 ? sum / reviews.length : initialAverage;
    const distribution = RATING_STARS.map((stars) => {
      const count = reviews.filter((review) => review.rating === stars).length;
      return {
        stars,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });

    return { total, average, distribution };
  }, [reviews, initialTotal, initialAverage]);

  const filteredReviews = useMemo(() => {
    switch (filter) {
      case 'positive':
        return reviews.filter((review) => review.rating >= 4);
      case 'negative':
        return reviews.filter((review) => review.rating <= 2);
      default:
        return reviews;
    }
  }, [reviews, filter]);

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setShowReviewForm(false);
  };

  const handleSubmitReview = async () => {
    const validation = validateEventReviewInput({ rating, comment });
    if (validation.valid === false) {
      toast({
        title: 'Avaliacao incompleta',
        description: validation.message,
        variant: 'destructive',
      });
      return;
    }

    if (!reviewerProfileId || !onSubmitReview) {
      toast({
        title: 'Acesso necessario',
        description: 'Entre com um perfil participante para avaliar este evento.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const savedReview = await onSubmitReview({
        rating,
        comment: validation.comment,
      });

      setReviews((prev) => [
        savedReview,
        ...prev.filter((review) => review.id !== savedReview.id),
      ]);
      resetForm();
      toast({
        title: 'Avaliacao publicada',
        description: 'Obrigado por compartilhar sua experiencia.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao publicar',
        description: error instanceof Error ? error.message : 'Nao foi possivel publicar a avaliacao.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!reviewerProfileId || !onMarkHelpful) {
      toast({
        title: 'Acesso necessario',
        description: 'Entre com um perfil para marcar avaliacoes como uteis.',
        variant: 'destructive',
      });
      return;
    }

    setHelpfulPendingId(reviewId);
    try {
      await onMarkHelpful(reviewId);
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? { ...review, helpful: review.helpful + 1 } : review,
        ),
      );
    } catch (error) {
      toast({
        title: 'Erro ao registrar',
        description: error instanceof Error ? error.message : 'Nao foi possivel registrar utilidade.',
        variant: 'destructive',
      });
    } finally {
      setHelpfulPendingId(null);
    }
  };

  const renderStars = (count: number, interactive = false, size = 'default') => {
    const sizeClass = size === 'small' ? 'h-3 w-3' : size === 'large' ? 'h-6 w-6' : 'h-4 w-4';

    return (
      <div className="flex gap-0.5">
        {INTERACTIVE_STARS.map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || isSubmitting}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setRating(star)}
            className={cn(
              'transition-all',
              interactive && 'cursor-pointer hover:scale-110',
            )}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                sizeClass,
                star <= (interactive ? (hoverRating || rating) : count)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-muted-foreground',
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <section className="bg-muted/30 py-12" aria-label={`Avaliacoes de ${eventTitle}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Star className="h-4 w-4" />
              Avaliacoes
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              O que as pessoas acharam
            </h2>
          </div>

          <div className="mb-8 grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
            <div className="text-center sm:border-r sm:border-border">
              <div className="mb-2 text-5xl font-bold text-foreground">
                {stats.average.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.average), false, 'large')}
              <p className="mt-2 text-sm text-muted-foreground">
                {stats.total} {stats.total === 1 ? 'avaliacao' : 'avaliacoes'}
              </p>
            </div>

            <div className="space-y-2">
              {stats.distribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-8 text-sm font-medium text-foreground">{stars}*</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percentage}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: stars * 0.1 }}
                      className="h-full bg-amber-400"
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {canSubmitReview && !showReviewForm && (
            <Button
              onClick={() => setShowReviewForm(true)}
              className="mb-6 w-full gap-2 sm:w-auto"
            >
              <Star className="h-4 w-4" />
              Escrever avaliacao
            </Button>
          )}

          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden rounded-xl border border-border bg-card p-6"
              >
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Sua avaliacao
                </h3>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Nota
                  </label>
                  {renderStars(rating, true, 'large')}
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Comentario
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Conte como foi sua experiencia..."
                    rows={4}
                    maxLength={EVENT_REVIEW_LIMITS.maxCommentLength}
                    className="resize-none"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comment.trim().length}/{EVENT_REVIEW_LIMITS.maxCommentLength}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview} disabled={isSubmitting}>
                    {isSubmitting ? 'Publicando...' : 'Publicar avaliacao'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {reviews.length > 0 && (
            <div className="mb-4 flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todas ({reviews.length})
              </Button>
              <Button
                variant={filter === 'positive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('positive')}
              >
                Positivas ({reviews.filter((review) => review.rating >= 4).length})
              </Button>
              <Button
                variant={filter === 'negative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('negative')}
              >
                Negativas ({reviews.filter((review) => review.rating <= 2).length})
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Star className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {reviews.length === 0
                    ? 'Nenhuma avaliacao publicada para este evento.'
                    : 'Nenhuma avaliacao encontrada com este filtro.'}
                </p>
              </div>
            ) : (
              filteredReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4 sm:p-6"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{review.userName}</p>
                          {review.verified && (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {renderStars(review.rating, false, 'small')}
                  </div>

                  <p className="mb-3 text-sm text-foreground">{review.comment}</p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkHelpful(review.id)}
                      disabled={helpfulPendingId === review.id}
                      className="gap-1 text-xs"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Util ({review.helpful})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-muted-foreground"
                    >
                      <Flag className="h-3 w-3" />
                      Reportar
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
