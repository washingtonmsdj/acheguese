/**
 * EmpresasCategoriasSection
 * 
 * Seção de categorias no topo da página
 */

import { CategoryCard } from "../components/cards";
import type { EmpresasCategoriasSectionProps } from "./types";

export function EmpresasCategoriasSection({
  categories,
  businessUrls,
  navigate,
}: EmpresasCategoriasSectionProps) {
  return (
    <section className="w-full bg-card/50 border-b border-border py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat.label}
              category={cat}
              onClick={() => navigate(`${businessUrls.list}/categoria/${cat.slug}`)}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
