import { memo, forwardRef, useMemo, useCallback } from "react";
import {
  ChevronRight,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { getGroupCategory } from "@/shared/constants/groupTaxonomy";

interface Group {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
  members_count: number;
  posts_count: number;
  avatar_url?: string | null;
  description?: string | null;
  is_private: boolean;
  is_member: boolean;
  join_policy?: string | null;
  posting_policy?: string | null;
  member_visibility?: string | null;
  media_policy?: string | null;
  capabilities?: Record<string, boolean> | null;
}

interface GrupoCardProps {
  group: Group;
  variant?: "grid" | "list" | "compact";
  index?: number;
  onClick: () => void;
  onJoin?: (e: React.MouseEvent, groupId: string) => void;
  className?: string;
}

const CARD_ANIMATION = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
};

const HOVER_SCALE = 1;
const TAP_SCALE = 0.98;

function getCategoryInfo(categoryId: string | null) {
  const category = getGroupCategory(categoryId);
  return {
    token: category.token,
    label: category.label,
    color: category.tone || "text-muted-foreground",
  };
}

function isNewGroup(date: string): boolean {
  try {
    const now = new Date();
    const groupDate = new Date(date);
    const diffInDays = (now.getTime() - groupDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays < 7;
  } catch {
    return false;
  }
}

function isPopularGroup(membersCount: number): boolean {
  return membersCount >= 50;
}

export const GrupoCardEnhanced = memo(
  forwardRef<HTMLDivElement, GrupoCardProps>(function GrupoCardEnhanced(
    { group, variant = "list", index = 0, onClick, onJoin, className },
    ref,
  ) {
    const categoryInfo = useMemo(() => getCategoryInfo(group.category), [group.category]);
    const isNew = useMemo(() => isNewGroup(group.created_at), [group.created_at]);
    const isPopular = useMemo(() => isPopularGroup(group.members_count), [group.members_count]);

    const isPrivate = group.is_private || (group as { visibility?: string }).visibility === "private";
    const isMember = group.is_member;

    const handleClick = useCallback(() => {
      onClick();
    }, [onClick]);

    const handleJoinClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onJoin?.(e, group.id);
      },
      [onJoin, group.id],
    );

    if (variant === "compact") {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 5) * 0.05 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={handleClick}
          className={cn(
            "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md",
            className,
          )}
          role="article"
          aria-label={`Grupo: ${group.name}`}
        >
          <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10 p-4">
            {group.avatar_url ? (
              <img src={group.avatar_url} alt={group.name} className="h-full w-full rounded-xl object-cover" loading="lazy" />
            ) : (
              <span className="text-xl font-bold">{categoryInfo.token}</span>
            )}
            {isPrivate && (
              <div className="absolute left-2 top-2">
                <Badge className="h-5 border-0 bg-amber-500/90 text-[10px] font-bold text-white backdrop-blur-sm">
                  <Lock className="h-2.5 w-2.5" />
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 p-3">
            <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {group.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {group.members_count} membros
            </div>
          </div>
        </motion.article>
      );
    }

    if (variant === "grid") {
      return (
        <motion.article
          ref={ref}
          {...CARD_ANIMATION}
          transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
          whileHover={{ scale: HOVER_SCALE }}
          whileTap={{ scale: TAP_SCALE }}
          onClick={handleClick}
          className={cn(
            "group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#10191d] p-3 sm:p-4 text-white shadow-xl shadow-black/10 transition-all duration-300 hover:border-teal-300/40",
            className,
          )}
          role="article"
          aria-label={`Grupo: ${group.name}`}
        >
          <div className="mb-2 flex min-h-[20px] items-start justify-end gap-1 sm:mb-2.5">
            {isNew && (
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-300">
                <TrendingUp className="mr-0.5 h-2.5 w-2.5" />
                Novo
              </Badge>
            )}
            {isPopular && (
              <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] font-bold text-amber-300">
                <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                Popular
              </Badge>
            )}
          </div>

          <div className="mb-2.5 flex items-start gap-2.5 sm:mb-3 sm:gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-400/15 to-cyan-400/10 sm:h-14 sm:w-14">
              {group.avatar_url ? (
                <img src={group.avatar_url} alt={group.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="text-sm font-bold text-teal-100 sm:text-base">{categoryInfo.token}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h3 className="line-clamp-2 [word-break:break-word] text-[13px] font-bold leading-tight text-white transition-colors group-hover:text-teal-200 sm:text-sm">
                  {group.name}
                </h3>
                {isPrivate && <Lock className="h-4 w-4 shrink-0 text-amber-400" />}
              </div>
              <p className={cn("mt-0.5 truncate text-[11px] font-medium sm:text-xs", categoryInfo.color)}>
                {categoryInfo.label}
              </p>
            </div>
          </div>

          {group.description && (
            <p className="mb-2.5 line-clamp-2 break-words text-[11px] leading-relaxed text-white/55 sm:mb-3 sm:text-xs">
              {group.description}
            </p>
          )}

          <div className="mb-2.5 flex min-w-0 flex-wrap items-center gap-2.5 text-[11px] text-white/50 sm:mb-3 sm:gap-3 sm:text-xs">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {group.members_count} membros
            </span>
            {group.posts_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {group.posts_count} posts
              </span>
            )}
          </div>

          {group.posting_policy === "admins" && (
            <div className="mb-2.5 sm:mb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200 sm:py-1 sm:text-[11px]">
                <ShieldCheck className="h-3 w-3" />
                admins postam
              </span>
            </div>
          )}

          <div className="mt-auto">
            {isMember ? (
              <Badge variant="secondary" className="h-8 w-full justify-center py-1.5 text-[11px] font-semibold sm:h-9 sm:py-2 sm:text-xs">
                Membro
              </Badge>
            ) : onJoin ? (
              <Button size="sm" onClick={handleJoinClick} className="h-8 w-full text-[11px] bg-teal-500 font-semibold text-white hover:bg-teal-400 sm:h-9 sm:text-xs">
                {group.join_policy === "approval" ? "Solicitar entrada" : "Entrar no grupo"}
              </Button>
            ) : null}
          </div>
        </motion.article>
      );
    }

    return (
      <motion.article
        ref={ref}
        {...CARD_ANIMATION}
        transition={{ ...CARD_ANIMATION.transition, delay: Math.min(index, 8) * 0.04 }}
        whileHover={{ scale: HOVER_SCALE }}
        whileTap={{ scale: TAP_SCALE }}
        onClick={handleClick}
        className={cn(
          "group flex cursor-pointer gap-3 overflow-hidden rounded-xl border border-border/50 bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-lg",
          className,
        )}
        role="article"
        aria-label={`Grupo: ${group.name}`}
      >
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10">
          {group.avatar_url ? (
            <img src={group.avatar_url} alt={group.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="text-sm font-bold">{categoryInfo.token}</span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                    {group.name}
                  </h3>
                  {isPrivate && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
                </div>
                <p className={cn("text-xs font-medium", categoryInfo.color)}>{categoryInfo.label}</p>
              </div>

              <div className="flex shrink-0 gap-1">
                {isNew && (
                  <Badge className="h-5 border-emerald-500/20 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                    <TrendingUp className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {isPopular && (
                  <Badge className="h-5 border-amber-500/20 bg-amber-500/10 text-[10px] font-bold text-amber-400">
                    <Sparkles className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
            </div>

            {group.description && (
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{group.description}</p>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {group.members_count}
              </span>
              {group.posts_count > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {group.posts_count}
                </span>
              )}
            </div>

            {isMember ? (
              <Badge variant="secondary" className="h-6 px-2 text-[10px] font-semibold">
                Membro
              </Badge>
            ) : onJoin ? (
              <Button size="sm" onClick={handleJoinClick} variant="outline" className="h-7 px-3 text-xs font-semibold">
                Entrar
              </Button>
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            )}
          </div>
        </div>
      </motion.article>
    );
  }),
);

GrupoCardEnhanced.displayName = "GrupoCardEnhanced";
