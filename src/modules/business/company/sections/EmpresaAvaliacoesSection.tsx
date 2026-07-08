import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { RatingDistribution, RatingSummary } from '../components/rating';
import { ReviewCard } from '../components/cards';
import type { EmpresaAvaliacoesSectionProps } from './types';

export function EmpresaAvaliacoesSection({
  business,
  reviews,
  user,
  navigate,
  reviewUrl,
  ratingBreakdown,
  embedded = false,
}: EmpresaAvaliacoesSectionProps) {
  const hasDetailedReviews = reviews.length > 0;
  const hasAggregateRating = (business.rating || 0) > 0 || (business.total_reviews || 0) > 0;
  const canWriteDetailedReview = Boolean(reviewUrl);
  const aggregateRating = business.rating || 0;
  const totalReviews = business.total_reviews || 0;
  const featuredReviews = embedded ? reviews.slice(0, 1) : reviews;

  if (!hasDetailedReviews && !hasAggregateRating && !canWriteDetailedReview) {
    return null;
  }

  const content = (
      <div className="rounded-[28px] border border-white/10 bg-[#0c151c]/96 p-5 sm:p-6 xl:p-4 [@media(max-height:1100px)]:rounded-[26px] [@media(max-height:1100px)]:p-3 [@media(max-height:980px)]:p-[0.6875rem]">
        <div className="mb-3 flex items-center justify-between xl:mb-2 [@media(max-height:1100px)]:mb-[0.4375rem]">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-teal-300" />
            <h2 className="text-lg font-semibold text-white">Avaliacoes</h2>
          </div>
          {hasAggregateRating ? (
            <button
              type="button"
              onClick={() => {
                if (!reviewUrl) return;
                if (!user) {
                  navigate?.('/login');
                  return;
                }
                navigate?.(reviewUrl);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-200 transition-colors hover:text-teal-100 disabled:cursor-default disabled:opacity-60"
              disabled={!reviewUrl}
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {hasAggregateRating ? (
          <div className="mb-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5 xl:mb-2 xl:p-[0.8125rem] [@media(max-height:1100px)]:mb-[0.4375rem] [@media(max-height:1100px)]:rounded-[22px] [@media(max-height:1100px)]:p-[0.6875rem]">
            {embedded && (hasDetailedReviews || ratingBreakdown) ? (
              <div className="grid grid-cols-[160px_minmax(190px,0.86fr)_minmax(220px,1fr)] items-center gap-3.5 [@media(max-height:1100px)]:grid-cols-[138px_minmax(156px,0.82fr)_minmax(190px,1fr)] [@media(max-height:1100px)]:gap-2.5">
                <RatingSummary
                  rating={aggregateRating}
                  totalReviews={totalReviews}
                />
                <RatingDistribution
                  reviews={reviews}
                  ratingBreakdown={ratingBreakdown}
                  totalReviews={totalReviews}
                />
                {featuredReviews[0] ? <ReviewCard review={featuredReviews[0]} compact /> : null}
              </div>
            ) : hasDetailedReviews || ratingBreakdown ? (
              <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)]">
                <RatingSummary
                  rating={aggregateRating}
                  totalReviews={totalReviews}
                />
                <RatingDistribution
                  reviews={reviews}
                  ratingBreakdown={ratingBreakdown}
                  totalReviews={totalReviews}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-5">
                <div className="sm:hidden">
                  <div className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-4">
                    <div className="flex items-end justify-between gap-4">
                      <div className="shrink-0">
                        <p className="text-[2.5rem] font-semibold leading-none text-white">
                          {aggregateRating.toFixed(1)}
                        </p>
                        <p className="mt-1 text-sm text-white/58">{totalReviews} aval.</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={[
                              'h-[18px] w-[18px]',
                              index < Math.floor(aggregateRating)
                                ? 'fill-teal-300 text-teal-300'
                                : 'text-white/18',
                            ].join(' ')}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <RatingSummary rating={aggregateRating} totalReviews={totalReviews} />
                </div>
                <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3.5 text-left">
                  <p className="text-sm font-semibold text-white">Resumo publico de reputacao</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Este perfil mostra a nota geral e a quantidade de avaliacoes publicas.
                    Comentarios detalhados aparecem apenas quando ha feed de reviews carregado.
                  </p>
                  {canWriteDetailedReview ? (
                    <div className="mt-4">
                      <Button
                        onClick={() => {
                          if (!user) {
                            navigate?.('/login');
                            return;
                          }
                          navigate?.(reviewUrl);
                        }}
                        variant="outline"
                        className="gap-2 border-teal-400/20 bg-transparent text-teal-200 hover:bg-teal-400/8"
                      >
                        <Star className="h-4 w-4" /> Escrever avaliacao
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {hasDetailedReviews && !embedded ? (
          <div className="space-y-3">
            {featuredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : !hasAggregateRating ? (
          <div className="mb-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/54">
            Ainda nao ha avaliacoes publicadas para este estabelecimento.
          </div>
        ) : null}

        {hasDetailedReviews && !embedded ? (
          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-center">
            <p className="mb-1 text-sm font-semibold text-white">Ja visitou {business.name}?</p>
            <p className="mb-3 text-xs text-white/48">Compartilhe sua experiencia com os vizinhos</p>
            {canWriteDetailedReview ? (
              <Button
                onClick={() => {
                  if (!user) {
                    navigate?.('/login');
                    return;
                  }
                  navigate?.(reviewUrl);
                }}
                variant="outline"
                className="gap-2 border-teal-400/20 bg-transparent text-teal-200 hover:bg-teal-400/8"
              >
                <Star className="h-4 w-4" /> Escrever avaliacao
              </Button>
            ) : (
              <p className="text-xs text-white/44">
                Avaliacoes detalhadas ficam disponiveis nas experiencias com fluxo publico ativo.
              </p>
            )}
          </div>
        ) : null}
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10">
      {content}
    </section>
  );
}
