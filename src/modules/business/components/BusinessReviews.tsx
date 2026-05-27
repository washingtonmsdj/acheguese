import React from "react";
import { Star, User } from "lucide-react";
import type { Review } from "@/core/business/types";
interface BusinessReviewsProps {
  reviews: Review[];
  isLoading: boolean;
  averageRating: number;
}

export function BusinessReviews({
  reviews,
  isLoading,
  averageRating,
}: BusinessReviewsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Avaliações</h2>
        <p className="text-gray-600">Loading avaliações...</p>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Avaliações</h2>
        <p className="text-gray-600">
          Ainda não há avaliações para esta business.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Avaliações</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={
                  i < Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-lg font-semibold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-gray-600">
            ({reviews.length}{" "}
            {reviews.length === 1 ? "avaliação" : "avaliações"})
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-b border-gray-200 pb-6 last:border-b-0"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {review.user_avatar ? (
                  <img
                    src={review.user_avatar}
                    alt={review.user_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={24} className="text-gray-500" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {review.user_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 whitespace-pre-line">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
