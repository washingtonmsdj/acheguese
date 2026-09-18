import React from "react";
import { CircleHelp, ImagePlus, Send, UserRound } from "lucide-react";

import type { PostType } from "@/core/posts/types";
import { useSessionContext } from "@/core/session";
import { cn } from "@/shared/utils/cn";

interface CommunityComposerEntryProps {
  communityName: string;
  onOpenCreatePost: (defaultType?: PostType) => void;
  id?: string;
  className?: string;
  avatarUrl?: string | null;
  showActions?: boolean;
}

export function CommunityComposerEntry({
  communityName,
  onOpenCreatePost,
  id,
  className,
  avatarUrl,
  showActions = false,
}: CommunityComposerEntryProps) {
  const { activeProfile } = useSessionContext();
  const resolvedAvatarUrl = avatarUrl ?? activeProfile?.avatarUrl ?? null;
  const openComposer = () => onOpenCreatePost("discussao");

  return (
    <section
      id={id}
      data-community-composer="entry"
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-3",
        className,
      )}
      aria-label="Criar publicação"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted/40 text-muted-foreground">
          {resolvedAvatarUrl ? (
            <img
              src={resolvedAvatarUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <UserRound className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <input
          type="text"
          value=""
          readOnly
          onClick={openComposer}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") openComposer();
          }}
          placeholder="O que você quer compartilhar?"
          aria-label={`Criar publicação em ${communityName}`}
          className="min-h-11 min-w-0 flex-1 cursor-text rounded-xl border border-border bg-muted/40 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground hover:border-primary/40 hover:bg-background focus:border-primary focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>
      {showActions ? (
        <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
          <button
            type="button"
            onClick={() => onOpenCreatePost("discussao")}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Foto
          </button>
          <button
            type="button"
            onClick={() => onOpenCreatePost("pergunta")}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            Pergunta
          </button>
          <button
            type="button"
            onClick={openComposer}
            className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Publicar
          </button>
        </div>
      ) : null}
    </section>
  );
}
