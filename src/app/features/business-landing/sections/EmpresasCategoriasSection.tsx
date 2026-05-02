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
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="mx-auto flex min-w-max justify-center gap-3 px-4 pb-1">
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
