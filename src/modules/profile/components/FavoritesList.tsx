import React from "react";
import { Button } from "@/shared/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Star, BadgeCheck, Loader2, Search } from "lucide-react";
import type { Business } from "@/core/profiles/services/types";

interface FavoritesListProps {
  favorites: Business[];
  loading: boolean;
  onBusinessClick: (business: Business) => void;
  onExplore: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function FavoritesList({
  favorites,
  loading,
  onBusinessClick,
  onExplore,
}: FavoritesListProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <Heart className="h-5 w-5 text-destructive" />
          Favoritos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {loading
            ? "Carregando..."
            : favorites.length > 0
              ? `${favorites.length} empresa${favorites.length > 1 ? "s" : ""} favoritada${favorites.length > 1 ? "s" : ""}`
              : "Salve suas empresas favoritas para acesso rápido"}
        </p>
      </motion.div>

      {loading ? (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-border bg-card p-16 flex justify-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
      ) : favorites.length === 0 ? (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-destructive/50" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Nenhum favorito ainda
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              Favorite empresas para acessá-las rapidamente
            </p>
            <Button variant="outline" onClick={onExplore} className="gap-2">
              <Search className="h-4 w-4" />
              Explorar Empresas
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((business, i) => (
            <motion.div
              key={business.id}
              {...fadeUp}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.03 }}
              className="rounded-2xl border border-border bg-card cursor-pointer hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
              onClick={() => onBusinessClick(business)}
            >
              <div className="p-4">
                <div className="flex gap-3.5">
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt={business.name || "Empresa favorita"}
                      className="h-14 w-14 rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center text-xl border border-border">
                      🏪
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {business.name}
                      </h3>
                      {business.verified && (
                        <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="capitalize">{business.category}</span>
                      {business.neighborhood && (
                        <>
                          <span className="text-border">•</span>
                          <span>{business.neighborhood}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {Number(business.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
