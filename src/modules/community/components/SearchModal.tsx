import React from "react";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { useSearch } from "../hooks/useSearch";
import { PostCard } from "./PostCard";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { CommunityPost } from "@/core/community/types";
/**
 * Modal profissional de busca
 *
 * Features:
 * - Input com foco automático
 * - Busca em tempo real (debounced)
 * - Histórico de buscas
 * - Sugestões inteligentes
 * - Resultados com scroll
 * - Atalho de teclado (Ctrl+K)
 * - Loading states
 * - Empty states
 */

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostClick?: (postId: string) => void;
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

  // Foco automático ao abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Atalho de teclado Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (!isOpen) {
          // Abrir modal (precisa ser implementado no componente pai)
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    clearSearch();
    onClose();
  };

  const handleHistoryClick = (historyQuery: string) => {
    search(historyQuery);
  };

  const showHistory = !query && searchHistory.length > 0;
  const showResults = query && !isSearching && results.posts.length > 0;
  const showEmpty = query && !isSearching && results.posts.length === 0;
  const showSuggestions = query && results.suggestions.length > 0;

  const toFeedPost = (post: CommunityPost) => ({
    ...post,
    updated_at: "updated_at" in post && typeof post.updated_at === "string" ? post.updated_at : post.created_at,
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] p-0 gap-0 border-0"
        style={{ backgroundColor: "#1E2529" }}
        aria-describedby="search-dialog-description"
      >
        <span id="search-dialog-description" className="sr-only">
          Busque por conteúdo, usuários ou empresas
        </span>
        {/* Header com Input */}
        <div
          className="flex items-center gap-3 p-4 border-b"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <Search
            className="w-5 h-5 flex-shrink-0"
            style={{ color: "#4FD1C5" }}
          />

          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Buscar posts, tags, autores..."
            className="flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ color: "#FFFFFF" }}
          />

          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="w-8 h-8 flex-shrink-0"
            >
              <X className="w-4 h-4" style={{ color: "#9CA3AF" }} />
            </Button>
          )}

          {isSearching && (
            <Loader2
              className="w-5 h-5 animate-spin flex-shrink-0"
              style={{ color: "#4FD1C5" }}
            />
          )}
        </div>

        {/* Conteúdo */}
        <ScrollArea className="flex-1 max-h-[calc(80vh-80px)]">
          <div className="p-4">
            {/* Histórico de Buscas */}
            {showHistory && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                  <span
                    className="text-sm font-medium"
                    style={INLINE_STYLES.textSecondary}
                  >
                    Buscas Recentes
                  </span>
                </div>

                <div className="space-y-1">
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between group p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <button
                        onClick={() => handleHistoryClick(item)}
                        className="flex-1 text-left text-sm"
                        style={INLINE_STYLES.textPrimary}
                      >
                        {item}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromHistory(item)}
                        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões */}
            {showSuggestions && (
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="w-4 h-4"
                    style={{ color: "#9CA3AF" }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={INLINE_STYLES.textSecondary}
                  >
                    Sugestões
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {results.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => search(suggestion)}
                      className="h-8 px-3 text-xs border-white/10 hover:border-white/20"
                      style={{
                        backgroundColor: "transparent",
                        color: "#A0AEC0",
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados */}
            {showResults && (
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
                      post={toFeedPost(post) as never}
                      onLike={() => {}}
                      onComment={() => {}}
                      onReport={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {showEmpty && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle
                  className="w-12 h-12 mb-3"
                  style={{ color: "#4B5563" }}
                />
                <p
                  className="text-sm font-medium"
                  style={INLINE_STYLES.textSecondary}
                >
                  Nenhum resultado encontrado
                </p>
                <p className="text-xs mt-1" style={INLINE_STYLES.textMuted}>
                  Tente search por outras palavras-chave
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer com dica */}
        <div
          className="p-3 border-t text-center"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <p className="text-xs" style={INLINE_STYLES.textMuted}>
            Dica: Use{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">
              Ctrl+K
            </kbd>{" "}
            para abrir a busca rapidamente
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
