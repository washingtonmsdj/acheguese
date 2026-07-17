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
        "rounded-2xl border border-white/10 bg-[#071922]/92 p-3 text-white shadow-xl shadow-black/10 backdrop-blur",
        className,
      )}
      aria-label="Criar publicação"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/[0.06] text-white/65">
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
          placeholder={`Compartilhe algo com ${communityName}...`}
          aria-label={`Criar publicação em ${communityName}`}
          className="min-h-11 min-w-0 flex-1 cursor-text rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/55 hover:border-teal-300/35 hover:bg-teal-300/10 focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/25"
        />
      </div>
    </section>
  );
}
