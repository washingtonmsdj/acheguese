// @ts-nocheck
/**
 * ReviewCard - Card de avaliação individual
 */

import { useState } from 'react';
import { BadgeCheck, Flag, Star, ThumbsDown, ThumbsUp, MoreVertical } from 'lucide-react';

import { formatRelativeTime } from '@/shared/utils/textUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Separator } from '@/shared/components/ui/separator';
import type { Review } from '../services/review.queries';

interface ReviewCardProps {
  review: Review;
  canEdit?: boolean;
  canReport?: boolean;
  userVote?: boolean | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onVote?: (isHelpful: boolean) => void;
}

export function ReviewCard({
  review,
  canEdit = false,
  canReport = true,
  userVote,
  onEdit,
  onDelete,
  onReport,
  onVote,
}: ReviewCardProps) {
  const [showFullComment, setShowFullComment] = useState(false);

  const initials = review.reviewer_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = formatRelativeTime(review.created_at);

  const commentPreview = review.comment?.slice(0, 200);
  const needsTruncation = (review.comment?.length || 0) > 200;
  const displayComment =
    showFullComment || !needsTruncation ? review.comment : commentPreview;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.reviewer_avatar || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{review.reviewer_name}</p>
              {review.is_verified && (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                >
                  <BadgeCheck className="h-3 w-3" />
                  Verificado
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Menu de ações */}
        {(canEdit || canReport) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={onEdit}>Editar avaliação</DropdownMenuItem>
              )}
              {canEdit && onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  Excluir avaliação
                </DropdownMenuItem>
              )}
              {canReport && onReport && (
                <DropdownMenuItem onClick={onReport}>
                  <Flag className="mr-2 h-4 w-4" />
                  Denunciar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Comentário */}
      {review.comment && (
        <div className="mt-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {displayComment}
          </p>
          {needsTruncation && (
            <button
              type="button"
              onClick={() => setShowFullComment(!showFullComment)}
              className="mt-1 text-sm font-medium text-primary hover:underline"
            >
              {showFullComment ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>
      )}

      {/* Fotos */}
      {review.photos && review.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Foto ${index + 1} da avaliação`}
              className="h-20 w-20 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {/* Resposta do estabelecimento */}
      {review.business_response && (
        <div className="mt-3 rounded-lg border-l-4 border-primary bg-muted/30 p-3">
          <p className="text-xs font-semibold text-primary">
            Resposta do estabelecimento
          </p>
          <p className="mt-1 text-sm text-foreground">{review.business_response}</p>
          {review.business_response_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatRelativeTime(review.business_response_at)}
            </p>
          )}
        </div>
      )}

      {/* Ações de helpfulness */}
      {onVote && (
        <>
          <Separator className="my-3" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Esta avaliação foi útil?</span>
            <div className="flex items-center gap-1">
              <Button
                variant={userVote === true ? 'default' : 'ghost'}
                size="sm"
                className="h-7 gap-1 px-2"
                onClick={() => onVote(true)}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="text-xs">{review.helpful_count}</span>
              </Button>
              <Button
                variant={userVote === false ? 'default' : 'ghost'}
                size="sm"
                className="h-7 gap-1 px-2"
                onClick={() => onVote(false)}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                <span className="text-xs">{review.not_helpful_count}</span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
