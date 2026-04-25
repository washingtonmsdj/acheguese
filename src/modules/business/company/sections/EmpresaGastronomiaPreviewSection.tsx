import { Link } from 'react-router-dom';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatBrl } from '@/modules/business/gastronomy/utils/currency';
import type { EmpresaGastronomiaPreviewSectionProps } from './types';

export function EmpresaGastronomiaPreviewSection({
  items,
  canonicalUrl,
  businessName,
  isLoading = false,
}: EmpresaGastronomiaPreviewSectionProps) {
  if (isLoading) {
    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Cardapio de {businessName}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A experiencia de cardapio e pedidos fica na pagina de gastronomia.
              </p>
            </div>
            <Button asChild className="shrink-0 gap-2">
              <Link to={canonicalUrl}>
                Abrir cardapio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6"
      aria-label="Previa do cardapio"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Destaques do cardapio
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Veja uma previa. O cardapio completo e os pedidos ficam em Gastronomia.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link to={canonicalUrl}>
            Ver cardapio e pedir
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center bg-muted">
                <UtensilsCrossed className="h-7 w-7 text-muted-foreground/50" />
              </div>
            )}
            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                {item.name}
              </h3>
              <p className="mt-2 text-sm font-bold text-primary">
                A partir de {formatBrl(item.priceFrom)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
