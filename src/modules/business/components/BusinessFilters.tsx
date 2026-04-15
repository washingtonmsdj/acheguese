/**
 * 🏆 BUSINESS FILTERS - REFATORADO (NÍVEL AAA)
 *
 * ✅ CARACTERÍSTICAS:
 * - Filtros com debounce
 * - Busca otimizada
 * - Categorias animadas
 * - Acessibilidade completa
 * - Performance otimizada
 *
 * @version 2.0.0
 * @author Kiro AI
 * @date 2026-03-13
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
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

// 🎯 TYPES
export interface Category {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface BusinessFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
  categories?: Category[];
  debounceMs?: number;
  searchPlaceholder?: string;
}

// 🎨 DEFAULT CATEGORIES
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

// 🎯 DEBOUNCE HOOK
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

/**
 * Category Button Component
 */
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

/**
 * Business Filters Component
 * Filtros de busca e categoria com debounce
 */
export const BusinessFilters = memo(
  ({
    searchQuery,
    selectedCategory,
    onSearchChange,
    onCategoryChange,
    categories = DEFAULT_CATEGORIES,
    debounceMs = 300,
    searchPlaceholder,
  }: BusinessFiltersProps) => {
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const debouncedSearch = useDebounce(localSearch, debounceMs);
    const isFirstRender = useRef(true);

    // 🎯 SYNC DEBOUNCED SEARCH
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      onSearchChange(debouncedSearch);
    }, [debouncedSearch, onSearchChange]);

    // 🎯 HANDLERS
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

    return (
      <div className="space-y-4">
        {/* Search Bar */}
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

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          role="tablist"
          aria-label="Categorias de empresas"
        >
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              isActive={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </motion.div>

        {/* Active Filters Indicator */}
        {(localSearch || selectedCategory !== "todos") && (
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
                {categories.find((c) => c.id === selectedCategory)?.label}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
                onCategoryChange("todos");
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
