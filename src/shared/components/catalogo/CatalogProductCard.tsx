import React from "react";

import { Star, Sparkles } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { formatBrl } from "@/shared/utils/currency";
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string;
  featured: boolean;
  promotion: boolean;
}


export default function CatalogProductCard({
  product: p,
}: {
  product: Product;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card overflow-hidden ${p.featured ? "ring-2 ring-primary/30" : ""}`}
    >
      <div className="flex gap-3 p-3">
        <div className="h-16 w-16 rounded-xl bg-secondary overflow-hidden shrink-0 border relative">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full" />
          )}
          {p.featured && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                {p.promotion && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-1.5 py-0">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    Promoção
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {p.category || "geral"}
              </p>
            </div>
            {typeof p.price === "number" && (
              <p className="text-sm font-bold text-primary whitespace-nowrap">
                {formatBrl(p.price)}
              </p>
            )}
          </div>
          {p.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {p.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
