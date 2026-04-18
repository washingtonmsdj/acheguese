/**
 * EmpresaProdutosSection
 * 
 * Seção de produtos/serviços com filtro por categoria e grid de cards.
 * Botão "ver mais" para expandir lista.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion } from 'framer-motion';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { ProductCard } from '../components/cards';
import type { EmpresaProdutosSectionProps } from './types';

export function EmpresaProdutosSection({
  products,
  selectedCategory,
  showAllProducts,
  onSelectCategory,
  onToggleShowAll,
}: EmpresaProdutosSectionProps) {
  if (products.length === 0) return null;

  // Get unique categories
  const categories = ['todos', ...new Set(products.map((p) => p.category))];

  // Filter products
  const filteredProducts =
    selectedCategory === 'todos'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  // Limit display
  const displayedProducts = showAllProducts
    ? filteredProducts
    : filteredProducts.slice(0, 4);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Produtos & Serviços
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {products.length} itens
          </span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`shrink-0 text-xs font-medium px-4 py-2 rounded-lg transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
              }`}
            >
              {cat === 'todos' ? 'Todos' : cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Show more */}
        {filteredProducts.length > 4 && (
          <button
            onClick={onToggleShowAll}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:underline"
          >
            {showAllProducts ? (
              <>
                <ChevronUp className="h-4 w-4" /> Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" /> Ver todos os{' '}
                {filteredProducts.length} itens
              </>
            )}
          </button>
        )}
      </motion.div>
    </section>
  );
}
