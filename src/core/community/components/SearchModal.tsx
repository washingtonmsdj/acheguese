import React, { useEffect, useRef } from "react";
import {
  AlertCircle,
  Clock,
  Loader2,
  Search,
  TrendingUp,
  X,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

import { useSearch } from "../hooks/useSearch";
import PostCard from "./PostCard";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
import type { CommunityPost as SearchFeedPost } from "@/core/posts/types.ts";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostClick?: (postId: string) => void;
}

function normalizeSearchPost(post: SearchFeedPost): SearchFeedPost {
  return {
    id: post.id,
    author_profile_id: post.author_profile_id,
    type: post.type as SearchFeedPost["type"],
    content: post.content,
    images: post.images,
    tags: post.tags ?? [],
    location_id: post.location_id ?? "",
    location: post.location,
    reach: post.reach ?? "neighborhood",
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    created_at: post.created_at,
    updated_at: post.created_at,
    is_liked: post.is_liked,
    is_saved: post.is_saved,
    author_name: post.author_name,
    author_avatar: post.author_avatar,
    city: post.city,
    neighborhood: post.neighborhood,
    is_verified_resident: post.is_verified_resident,
    is_verified: post.is_verified,
    is_edited: post.is_edited,
    confirmations_count: post.confirmations_count,
  };
}

export function SearchModal({
  isOpen,
  onClose,
  onPostClick,
}: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    results,
    isSearching,
    searchHistory,
    search,
    clearSearch,
    removeFromHistory,
  } = useSearch();

  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    clearSearch();
    onClose();
  };

  const showHistory = !query && searchHistory.length > 0;
  const showResults = query && !isSearching && results.posts.length > 0;
  const showEmpty = query && !isSearching && results.posts.length === 0;
  const showSuggestions = query && results.suggestions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[80vh] max-w-3xl gap-0 border-0 p-0"
        style={{ backgroundColor: "#1E2529" }}
        aria-describedby="search-dialog-description"
      >
        <span id="search-dialog-description" className="sr-only">
          Busque por conteudo, usuarios ou empresas.
        </span>

        <div
          className="flex items-center gap-3 border-b p-4"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <Search
            className="h-5 w-5 shrink-0"
            style={{ color: "#4FD1C5" }}
          />

          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => search(event.target.value)}
            placeholder="Buscar posts, tags, autores..."
            className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ color: "#FFFFFF" }}
          />

          {query ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="h-8 w-8 shrink-0"
              type="button"
            >
              <X className="h-4 w-4" style={{ color: "#9CA3AF" }} />
            </Button>
          ) : null}

          {isSearching ? (
            <Loader2
              className="h-5 w-5 shrink-0 animate-spin"
              style={{ color: "#4FD1C5" }}
            />
          ) : null}
        </div>

        <ScrollArea className="max-h-[calc(80vh-80px)] flex-1">
          <div className="p-4">
            {showHistory ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                  <span
                    className="text-sm font-medium"
                    style={INLINE_STYLES.textSecondary}
                  >
                    Buscas recentes
                  </span>
                </div>

                <div className="space-y-1">
                  {searchHistory.map((item) => (
                    <div
                      key={item}
                      className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-white/5"
                    >
                      <button
                        type="button"
                        onClick={() => search(item)}
                        className="flex-1 text-left text-sm"
                        style={INLINE_STYLES.textPrimary}
                      >
                        {item}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromHistory(item)}
                        className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        type="button"
                      >
                        <X className="h-3 w-3" style={{ color: "#9CA3AF" }} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {showSuggestions ? (
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="h-4 w-4"
                    style={{ color: "#9CA3AF" }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={INLINE_STYLES.textSecondary}
                  >
                    Sugestoes
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {results.suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => search(suggestion)}
                      className="h-8 border-white/10 px-3 text-xs hover:border-white/20"
                      style={{
                        backgroundColor: "transparent",
                        color: "#A0AEC0",
                      }}
                      type="button"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {showResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium"
                    style={INLINE_STYLES.textSecondary}
                  >
                    {results.total} resultado{results.total !== 1 ? "s" : ""}{" "}
                    encontrado{results.total !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={normalizeSearchPost(post)}
                      onLike={() => {}}
                      onComment={() => {}}
                      onSave={() => {}}
                      onShare={() => {}}
                      onReport={() => {}}
                      onPostClick={(postId) => {
                        onPostClick?.(postId);
                        handleClose();
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {showEmpty ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle
                  className="mb-3 h-12 w-12"
                  style={{ color: "#4B5563" }}
                />
                <p
                  className="text-sm font-medium"
                  style={INLINE_STYLES.textSecondary}
                >
                  Nenhum resultado encontrado
                </p>
                <p className="mt-1 text-xs" style={INLINE_STYLES.textMuted}>
                  Tente buscar por outras palavras-chave.
                </p>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <div
          className="border-t p-3 text-center"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <p className="text-xs" style={INLINE_STYLES.textMuted}>
            Dica: use{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
              Ctrl+K
            </kbd>{" "}
            para abrir a busca rapidamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
