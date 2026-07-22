import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  getCardClasses,
  getCardBackground,
  INLINE_STYLES,
  SPACING,
} from "./styles/communityDesignSystem";
import {
  Filter,
  TrendingUp,
  Clock,
  MapPin,
  X,
} from "lucide-react";
/**
 * Filtros do feed da comunidade
 * Permite filtrar por ordenação
 */

export type FeedSortType = "recent" | "popular" | "nearby";
export type FeedPostType =
  | "all"
  | "discussao"
  | "recomendacao"
  | "enquete";

interface FeedFiltersProps {
  activeSort: FeedSortType;
  activeType: FeedPostType;
  activeTag?: string;
  onSortChange: (sort: FeedSortType) => void;
  onTypeChange: (type: FeedPostType) => void;
  onClearTag?: () => void;
}

export function FeedFilters({
  activeSort,
  activeType,
  activeTag,
  onSortChange,
  onTypeChange,
  onClearTag,
}: FeedFiltersProps) {
  const sortOptions = [
    { value: "recent" as FeedSortType, label: "Mais recentes", icon: Clock },
    { value: "popular" as FeedSortType, label: "Populares", icon: TrendingUp },
    { value: "nearby" as FeedSortType, label: "Perto de mim", icon: MapPin },
  ];

  const typeOptions = [
    { value: "all" as FeedPostType, label: "Tudo", icon: Filter },
    { value: "discussao" as FeedPostType, label: "Conversas", icon: Filter },
    { value: "recomendacao" as FeedPostType, label: "Dicas", icon: Filter },
    { value: "enquete" as FeedPostType, label: "Enquetes", icon: Filter },
  ];

  return (
    <Card
      className={getCardClasses("default")}
      style={getCardBackground("card")}
    >
      <CardContent className="p-2">
        {/* Tag ativa (se houver) */}
        {activeTag && (
          <div className="mb-2">
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px]"
              style={{
                backgroundColor: "rgba(79, 209, 197, 0.2)",
                color: "#4FD1C5",
              }}
            >
              <span>#{activeTag}</span>
              <button
                onClick={onClearTag}
                className="hover:opacity-70 transition-opacity"
                title="Limpar"
                aria-label="Limpar filtro de tag"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        )}

        {/* Ordenação */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeSort === option.value;

            return (
              <Button
                key={option.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onSortChange(option.value)}
                className={`h-6 px-2 text-[10px] font-medium ${
                  isActive
                    ? "border-0"
                    : "border-white/10 hover:border-white/20"
                }`}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)",
                        color: "#FFFFFF",
                      }
                    : { backgroundColor: "transparent", color: "#A0AEC0" }
                }
              >
                <Icon className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Categorias */}
        <div className="flex gap-1.5 flex-wrap">
          {typeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeType === option.value;
            return (
              <Button
                key={option.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onTypeChange(option.value)}
                className={`h-6 px-2 text-[10px] font-medium ${
                  isActive
                    ? "border-0"
                    : "border-white/10 hover:border-white/20"
                }`}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)",
                        color: "#FFFFFF",
                      }
                    : { backgroundColor: "transparent", color: "#A0AEC0" }
                }
              >
                <Icon className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
