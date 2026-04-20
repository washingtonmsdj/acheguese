import React from "react";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import type { PostData } from "@/core/community/hooks/useNovoPost";

interface PostFormProps {
  postData: PostData;
  currentProfile: any;
  onTextChange: (text: string) => void;
}

export function PostForm({
  postData,
  currentProfile,
  onTextChange,
}: PostFormProps) {
  const displayName = currentProfile?.name || "UsuÃ¡rio";

  return (
    <div className="px-4 py-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={currentProfile?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {displayName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-2">{displayName}</p>
          <Textarea
            value={postData.texto}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="O que vocÃª quer compartilhar com o bairro?"
            className="min-h-[120px] resize-none border-0 p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0"
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {postData.texto.length}/2000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

