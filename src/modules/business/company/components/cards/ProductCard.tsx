import { Percent, Sparkles, Utensils } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { formatPrice } from '../../utils';
import type { ProductCardProps } from '../../sections/types';

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] transition-colors hover:border-teal-400/24">
      <div className="relative aspect-[1.28/1] overflow-hidden bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(8,17,24,0.96))] xl:aspect-[1.54/1] [@media(max-height:1100px)]:aspect-[1.62/1] [@media(max-height:980px)]:aspect-[1.7/1] [@media(max-height:860px)]:aspect-[1.72/1]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Utensils className="h-10 w-10 text-teal-300/32" />
          </div>
        )}
        {product.featured ? (
          <Badge className="absolute left-3 top-3 border-0 bg-amber-500/90 text-slate-950 shadow-lg">
            <Sparkles className="mr-1 h-3 w-3" /> Destaque
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-1.5 p-3 xl:space-y-1 xl:p-[0.5625rem] [@media(max-height:1100px)]:space-y-[0.1875rem] [@media(max-height:1100px)]:p-[0.4625rem] [@media(max-height:980px)]:space-y-0.5 [@media(max-height:980px)]:p-[0.4375rem] [@media(max-height:860px)]:space-y-0.5 [@media(max-height:860px)]:p-[0.4rem]">
        <div className="space-y-1 xl:space-y-[0.1875rem]">
          <h3 className="line-clamp-2 text-sm font-semibold text-white sm:text-[15px] xl:text-[13.5px] [@media(max-height:1100px)]:text-[12.5px] [@media(max-height:860px)]:text-[12px]">
            {product.name}
          </h3>
        </div>

        <div className="space-y-0.5 [@media(max-height:980px)]:space-y-0">
          {product.promotional_price ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-teal-200 sm:text-[15px]">
                {formatPrice(product.promotional_price)}
              </span>
              <span className="text-xs text-white/36 line-through">{formatPrice(product.price)}</span>
              <Badge className="border border-emerald-400/20 bg-emerald-400/10 text-[10px] text-emerald-200">
                <Percent className="mr-1 h-2.5 w-2.5" /> Oferta
              </Badge>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-medium text-white/40 xl:text-[10px]">A partir de</p>
              <span className="text-[1.08rem] font-bold leading-none text-white sm:text-[1.12rem] xl:text-[1rem] [@media(max-height:980px)]:text-[0.95rem] [@media(max-height:860px)]:text-[0.9rem]">
                {formatPrice(product.price)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
