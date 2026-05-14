/**
 * ⭐ EVENT REVIEWS
 * 
 * Sistema de avaliações e reviews de eventos
 * Permite usuários avaliarem eventos passados
 * 
 * @version 1.0.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, Flag, User, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface EventReviewsProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  canReview?: boolean;
}

const STORAGE_KEY = 'acheguese_event_reviews';

export function EventReviews({
  eventId,
  eventTitle,
  eventDate,
  reviews: initialReviews = [],
  averageRating: initialAverage = 0,
  totalReviews: initialTotal = 0,
  canReview = true,
}: EventReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');

  // Calculate stats
  const stats = useMemo(() => {
    const total = reviews.length || initialTotal;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = total > 0 ? sum / total : initialAverage;
    
    const distribution = [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: reviews.filter(r => r.rating === stars).length,
      percentage: total > 0 ? (reviews.filter(r => r.rating === stars).length / total) * 100 : 0,
    }));

    return { total, average, distribution };
  }, [reviews, initialTotal, initialAverage]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    switch (filter) {
      case 'positive':
        return reviews.filter(r => r.rating >= 4);
      case 'negative':
        return reviews.filter(r => r.rating <= 2);
      default:
        return reviews;
    }
  }, [reviews, filter]);

  // Submit review
  const handleSubmitReview = () => {
    if (rating === 0 || !comment.trim()) {
      alert('Por favor, selecione uma nota e escreva um comentário.');
      return;
    }

    const newReview: Review = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Você',
      rating,
      comment: comment.trim(),
      date: new Date().toISOString(),
      helpful: 0,
      verified: true,
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);

    // Save to localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allReviews = stored ? JSON.parse(stored) : {};
      allReviews[eventId] = updatedReviews;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
    } catch (error) {
      console.error('Failed to save review:', error);
    }

    // Reset form
    setRating(0);
    setComment('');
    setShowReviewForm(false);
  };

  // Mark helpful
  const handleMarkHelpful = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
      )
    );
  };

  // Render stars
  const renderStars = (count: number, interactive = false, size = 'default') => {
    const sizeClass = size === 'small' ? 'h-3 w-3' : size === 'large' ? 'h-6 w-6' : 'h-4 w-4';
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setRating(star)}
            className={cn(
              "transition-all",
              interactive && "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                sizeClass,
                star <= (interactive ? (hoverRating || rating) : count)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Star className="h-4 w-4" />
              Avaliações
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              O que as pessoas acharam
            </h2>
          </div>

          {/* Stats Overview */}
          <div className="mb-8 grid gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-2">
            {/* Average Rating */}
            <div className="text-center sm:border-r sm:border-border">
              <div className="mb-2 text-5xl font-bold text-foreground">
                {stats.average.toFixed(1)}
              </div>
              {renderStars(Math.round(stats.average), false, 'large')}
              <p className="mt-2 text-sm text-muted-foreground">
                {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {stats.distribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-8 text-sm font-medium text-foreground">{stars}★</span>
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

          {/* Write Review Button */}
          {canReview && !showReviewForm && (
            <Button
              onClick={() => setShowReviewForm(true)}
              className="mb-6 w-full gap-2 sm:w-auto"
            >
              <Star className="h-4 w-4" />
              Escrever avaliação
            </Button>
          )}

          {/* Review Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden rounded-xl border border-border bg-card p-6"
              >
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Sua avaliação
                </h3>
                
                {/* Rating */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Nota
                  </label>
                  {renderStars(rating, true, 'large')}
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Comentário
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Conte como foi sua experiência..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleSubmitReview}>
                    Publicar avaliação
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReviewForm(false);
                      setRating(0);
                      setComment('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter */}
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
                Positivas ({reviews.filter(r => r.rating >= 4).length})
              </Button>
              <Button
                variant={filter === 'negative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('negative')}
              >
                Negativas ({reviews.filter(r => r.rating <= 2).length})
              </Button>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Star className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {reviews.length === 0
                    ? 'Seja o primeiro a avaliar este evento!'
                    : 'Nenhuma avaliação encontrada com este filtro.'}
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
                  {/* User Info */}
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

                  {/* Comment */}
                  <p className="mb-3 text-sm text-foreground">{review.comment}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkHelpful(review.id)}
                      className="gap-1 text-xs"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Útil ({review.helpful})
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
