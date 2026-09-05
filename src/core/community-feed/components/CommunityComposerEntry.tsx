import React from "react";
import { UserRound } from "lucide-react";

import type { PostType } from "@/core/posts/types";
import { useSessionContext } from "@/core/session";
import { cn } from "@/shared/utils/cn";

interface CommunityComposerEntryProps {
  communityName: string;
  onOpenCreatePost: (defaultType?: PostType) => void;
  id?: string;
  className?: string;
  avatarUrl?: string | null;
}

export function CommunityComposerEntry({
  communityName,
  onOpenCreatePost,
  id,
  className,
  avatarUrl,
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
          placeholder={`Publicar no ${communityName}...`}
          aria-label={`Criar publicação em ${communityName}`}
          className="min-h-11 min-w-0 flex-1 cursor-text rounded-xl border border-border bg-muted/40 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground hover:border-primary/40 hover:bg-background focus:border-primary focus:bg-background focus-visible:ring-2 focus-visible:ring-primary/30"
        />
      </div>
    </section>
  );
}
