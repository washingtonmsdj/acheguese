/**
 * Filtros de empresas com busca, categoria e ordenação.
 */

import { memo, useCallback, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Store,
  ShoppingBag,
  Heart,
  Scissors,
  Dumbbell,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

export interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface BusinessFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  selectedSortBy?: SortOptionId;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onSortChange?: (sortBy: SortOptionId) => void;
  categories?: Category[];
  sortOptions?: SortOption[];
  debounceMs?: number;
  searchPlaceholder?: string;
}

export interface SortOption {
  id: SortOptionId;
  label: string;
}

export type SortOptionId =
  | "rating"
  | "recommendations_count"
  | "name"
  | "created_at";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "todos", label: "Todas", icon: Store },
  { id: "restaurante", label: "Restaurantes", icon: ShoppingBag },
  { id: "mercado", label: "Mercados", icon: ShoppingBag },
  { id: "farmacia", label: "Farmácias", icon: Heart },
  { id: "saude", label: "Saúde", icon: Heart },
  { id: "servicos", label: "Serviços", icon: Scissors },
  { id: "educacao", label: "Educação", icon: Store },
  { id: "lazer", label: "Lazer", icon: Dumbbell },
];

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { id: "rating", label: "Melhor avaliação" },
  { id: "recommendations_count", label: "Mais recomendadas" },
  { id: "name", label: "Nome (A-Z)" },
  { id: "created_at", label: "Mais recentes" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface CategoryButtonProps {
  category: Category;
  isActive: boolean;
  onClick: () => void;
}

const CategoryButton = memo(
  ({ category, isActive, onClick }: CategoryButtonProps) => {
    const Icon = category.icon;

    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all font-medium",
          isActive
            ? "bg-gradient-to-r from-teal-400/20 to-cyan-400/10 border-2 border-teal-400 shadow-lg shadow-teal-400/20"
            : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
        )}
        aria-pressed={isActive}
        aria-label={`Filtrar por ${category.label}`}
      >
        <Icon
          className={cn(
            "w-4 h-4 transition-colors",
            isActive ? "text-teal-400" : "text-gray-400",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "text-sm transition-colors",
            isActive ? "text-teal-300" : "text-gray-300",
          )}
        >
          {category.label}
        </span>
      </motion.button>
    );
  },
);
CategoryButton.displayName = "CategoryButton";

export const BusinessFilters = memo(
  ({
    searchQuery,
    selectedCategory,
    selectedSortBy = "rating",
    onSearchChange,
    onCategoryChange,
    onSortChange,
    categories = DEFAULT_CATEGORIES,
    sortOptions = DEFAULT_SORT_OPTIONS,
    debounceMs = 300,
    searchPlaceholder,
  }: BusinessFiltersProps) => {
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const debouncedSearch = useDebounce(localSearch, debounceMs);
    const isFirstRender = useRef(true);
    const educationEnabled = isLaunchSurfaceEnabled("education");
    const visibleCategories = categories.filter((category) => category.id !== "educacao" || educationEnabled);
    const selectedCategoryIsVisible = visibleCategories.some((category) => category.id === selectedCategory);

    useEffect(() => {
      if (!selectedCategoryIsVisible) {
        onCategoryChange("todos");
      }
    }, [selectedCategoryIsVisible, onCategoryChange]);

    // Sincroniza a busca apenas após o debounce.
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onSearchChange(debouncedSearch);
    }, [debouncedSearch, onSearchChange]);

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalSearch(e.target.value);
      },
      [],
    );

    const handleClearSearch = useCallback(() => {
      setLocalSearch("");
      onSearchChange("");
    }, [onSearchChange]);

    const handleCategoryClick = useCallback(
      (categoryId: string) => {
        onCategoryChange(categoryId);
      },
      [onCategoryChange],
    );

    const handleSortChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        onSortChange?.(e.target.value as SortOptionId);
      },
      [onSortChange],
    );

    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={searchPlaceholder || "Buscar empresas, categorias..."}
            value={localSearch}
            onChange={handleSearchChange}
            className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
            aria-label="Buscar empresas"
          />
          {localSearch && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </motion.button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          role="tablist"
          aria-label="Categorias de empresas"
        >
          {visibleCategories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="relative max-w-xs"
        >
          <ArrowUpDown
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <select
            value={selectedSortBy}
            onChange={handleSortChange}
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-200 focus:border-teal-400 focus:outline-none"
            aria-label="Ordenar empresas"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id} className="bg-[#1E2529] text-gray-200">
                {option.label}
              </option>
            ))}
          </select>
        </motion.div>

        {(localSearch || selectedCategory !== "todos" || selectedSortBy !== "rating") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-gray-400"
          >
            <span>Filtros ativos:</span>
            {localSearch && (
              <span className="px-2 py-1 rounded-lg bg-teal-400/10 text-teal-400">
                Busca: "{localSearch}"
              </span>
            )}
            {selectedCategory !== "todos" && (
              <span className="px-2 py-1 rounded-lg bg-teal-400/10 text-teal-400">
                {visibleCategories.find((c) => c.id === selectedCategory)?.label}
              </span>
            )}
            {selectedSortBy !== "rating" && (
              <span className="px-2 py-1 rounded-lg bg-teal-400/10 text-teal-400">
                Ordem: {sortOptions.find((s) => s.id === selectedSortBy)?.label}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
                onCategoryChange("todos");
                onSortChange?.("rating");
              }}
              className="text-gray-400 hover:text-white"
            >
              Limpar filtros
            </Button>
          </motion.div>
        )}
      </div>
    );
  },
);

BusinessFilters.displayName = "BusinessFilters";
