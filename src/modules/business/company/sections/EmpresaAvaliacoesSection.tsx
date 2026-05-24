/**
 * EmpresaAvaliacoesSection
 *
 * Secao de avaliacoes com resumo de rating, distribuicao e lista de reviews.
 */

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { RatingSummary, RatingDistribution } from '../components/rating';
import { ReviewCard } from '../components/cards';
import type { EmpresaAvaliacoesSectionProps } from './types';

export function EmpresaAvaliacoesSection({
  business,
  reviews,
  user,
  navigate,
  reviewUrl,
}: EmpresaAvaliacoesSectionProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Avaliações</h2>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <RatingSummary
              rating={business.rating || 0}
              totalReviews={business.total_reviews || 0}
            />
            <RatingDistribution reviews={reviews} />
          </div>
        </div>

        <div className="space-y-3">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Ainda não há avaliações publicadas para este estabelecimento.
            </div>
          )}
        </div>

        <div className="mt-4 bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">
            Já visitou {business.name}?
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Compartilhe sua experiência com os vizinhos
          </p>
          {(!user || reviewUrl) && (
            <Button
              onClick={() => {
                if (!user) {
                  navigate?.('/login');
                  return;
                }
                if (reviewUrl) {
                  navigate?.(reviewUrl);
                }
              }}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/5 gap-2"
            >
              <Star className="h-4 w-4" /> Escrever avaliação
            </Button>
          )}
          {user && !reviewUrl && (
            <p className="text-xs text-muted-foreground">
              Avaliações disponíveis para estabelecimentos com página de cardápio.
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}
