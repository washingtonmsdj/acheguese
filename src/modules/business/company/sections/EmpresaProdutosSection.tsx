import { ArrowRight, ChevronDown, ChevronUp, Package, Plus } from 'lucide-react';
import { ProductCard } from '../components/cards';
import type { EmpresaProdutosSectionProps } from './types';

export function EmpresaProdutosSection({
  products,
  selectedCategory,
  showAllProducts,
  embedded = false,
  onSelectCategory,
  onToggleShowAll,
}: EmpresaProdutosSectionProps) {
  const hasProducts = products.length > 0;
  if (!hasProducts) return null;

  const categories = ['todos', ...new Set(products.map((product) => product.category))];

  const filteredProducts =
    selectedCategory === 'todos'
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const displayedProducts = showAllProducts
    ? filteredProducts
    : filteredProducts.slice(0, 4);
  const shouldRenderPeekTile = embedded && !showAllProducts && filteredProducts.length > displayedProducts.length;
  const canExpandProducts = filteredProducts.length > 4;

  const content = (
      <div className="rounded-[28px] border border-white/10 bg-[#0c151c]/96 p-5 sm:p-6 xl:p-4 [@media(max-height:1100px)]:rounded-[26px] [@media(max-height:1100px)]:p-3 [@media(max-height:980px)]:p-[0.6875rem] [@media(max-height:860px)]:rounded-[24px] [@media(max-height:860px)]:p-[0.6875rem]">
        <div className="mb-3 flex items-center justify-between xl:mb-[0.4625rem] [@media(max-height:1100px)]:mb-1.5 [@media(max-height:860px)]:mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-300 [@media(max-height:860px)]:h-[18px] [@media(max-height:860px)]:w-[18px]" />
            <h2 className="text-lg font-semibold text-white [@media(max-height:860px)]:text-[0.98rem]">Produtos e servicos</h2>
          </div>
          {embedded && canExpandProducts ? (
            <button
              type="button"
              onClick={onToggleShowAll}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-200 transition-colors hover:text-teal-100"
            >
              {showAllProducts ? 'Mostrar menos' : 'Ver cardapio completo'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="text-xs text-white/44">{products.length} itens</span>
          )}
        </div>

        <div className="mb-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:mb-1.5 xl:overflow-visible xl:pb-0 [@media(max-height:1100px)]:mb-[0.3125rem] [@media(max-height:980px)]:mb-[0.3125rem] [@media(max-height:860px)]:mb-2">
          <div className="flex min-w-max gap-2 xl:min-w-0 xl:flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={[
                  'shrink-0 rounded-full border px-3.5 py-[0.4375rem] text-xs font-medium transition-colors xl:px-3 xl:py-[0.3125rem] xl:text-[11px] [@media(max-height:980px)]:px-3 [@media(max-height:980px)]:py-[0.3125rem] [@media(max-height:860px)]:px-2.5 [@media(max-height:860px)]:py-1 [@media(max-height:860px)]:text-[11px]',
                  selectedCategory === category
                    ? 'border-teal-400/30 bg-teal-400/12 text-teal-100'
                    : 'border-white/10 bg-white/[0.03] text-white/68 hover:border-white/20 hover:bg-white/[0.05]',
                ].join(' ')}
              >
                {category === 'todos' ? 'Todos' : category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5 xl:gap-2 [@media(max-height:1100px)]:gap-[0.4375rem] [@media(max-height:980px)]:gap-1.5 [@media(max-height:860px)]:gap-2">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {shouldRenderPeekTile ? (
            <button
              type="button"
              onClick={onToggleShowAll}
              className="group flex min-h-[13rem] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/14 bg-white/[0.02] px-4 text-center transition-colors hover:border-teal-400/28 hover:bg-teal-400/[0.05] xl:min-h-[9.75rem] [@media(max-height:1100px)]:min-h-[8.85rem] [@media(max-height:980px)]:min-h-[8.4rem] [@media(max-height:860px)]:min-h-[10rem]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-teal-400/24 bg-teal-400/8 text-teal-200 transition-transform group-hover:scale-[1.04] xl:h-11 xl:w-11 [@media(max-height:1100px)]:h-10 [@media(max-height:1100px)]:w-10">
                <Plus className="h-6 w-6" />
              </span>
              <span className="mt-3 text-sm font-medium text-white xl:mt-2 xl:text-[13px] [@media(max-height:1100px)]:mt-1.5 [@media(max-height:1100px)]:text-[12px]">Ver mais itens</span>
              <span className="mt-1 text-xs text-white/48 xl:text-[11px]">
                {filteredProducts.length - displayedProducts.length} restantes
              </span>
            </button>
          ) : null}
        </div>

        {canExpandProducts && !embedded ? (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/74 transition-colors hover:border-white/18 hover:bg-white/[0.05]"
          >
            {showAllProducts ? (
              <>
                <ChevronUp className="h-4 w-4" /> Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" /> Ver todos os {filteredProducts.length} itens
              </>
            )}
          </button>
        ) : null}
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-[1400px] px-4 sm:px-6 xl:px-8 2xl:max-w-[1480px] 2xl:px-10">
      {content}
    </section>
  );
}
