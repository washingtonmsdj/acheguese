/**
 * ProductCard
 * 
 * Card de produto/serviço com imagem, nome, descrição e preço.
 * Suporta preço promocional e badge de destaque.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Utensils, Tag, Percent } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { formatPrice } from '../../utils';
import type { ProductCardProps } from '../../sections/types';

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg transition-all group">
      <div className="flex gap-4">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-20 w-20 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
            <Utensils className="h-6 w-6 text-primary/30" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.featured && (
              <Tag className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            )}
          </div>
          
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {product.description}
            </p>
          )}
          
          <div className="flex items-center gap-2">
            {product.promotional_price ? (
              <>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(product.promotional_price)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                  <Percent className="h-2.5 w-2.5 mr-0.5" /> OFF
                </Badge>
              </>
            ) : (
              <span className="text-sm font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
