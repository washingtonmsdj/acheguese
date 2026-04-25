import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  MenuItemCard,
  MenuItemDetailDrawer,
  StickyOrderBar,
} from "@/modules/business/gastronomy/components";
import type { MenuItemWithRelations } from "@/modules/business/gastronomy/types";
import { usePremiumBusinessSiteContext } from "@/modules/business/premium/context/PremiumBusinessSiteContext";
import { toProductSlug } from "@/modules/business/premium/utils/productSlug";
import { useGastronomyCart } from "@/modules/business/gastronomy/hooks";

export default function PremiumBusinessMenuPage() {
  const { hasGastronomy, gastronomySnapshot, routes } = usePremiumBusinessSiteContext();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null);
  const business = gastronomySnapshot?.gastronomy.business ?? null;
  const menu = gastronomySnapshot?.gastronomy.menu ?? null;
  const categories = useMemo(
    () => [...(menu?.categories ?? [])].sort((left, right) => left.display_order - right.display_order),
    [menu],
  );

  useEffect(() => {
    if (!categories.length) {
      setActiveCategory(null);
      return;
    }

    if (!activeCategory || !categories.some((category) => category.id === activeCategory)) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

  const activeCategoryData = categories.find((category) => category.id === activeCategory);
  const activeItems = activeCategoryData?.items ?? [];
  const cart = useGastronomyCart(business);

  if (!hasGastronomy || !gastronomySnapshot || !business) {
    return <Navigate to={routes.home} replace />;
  }

  const absoluteCanonical =
    typeof window !== "undefined" ? `${window.location.origin}${routes.menu}` : undefined;

  return (
    <>
      <Helmet>
        <title>{`${business.name} | Cardapio premium`}</title>
        <meta
          name="description"
          content={`Cardapio oficial de ${business.name} no link premium.`}
        />
        {absoluteCanonical && <link rel="canonical" href={absoluteCanonical} />}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="space-y-5 pb-24">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Cardapio</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categories.length} categorias</Badge>
            <Badge variant="outline">{cart.itemCount} itens no carrinho</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={routes.cart}>Ir para carrinho</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={routes.checkout}>Checkout</Link>
            </Button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category.name} ({category.items.length})
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {activeItems.map((item) => (
            <div key={item.id} className="space-y-2">
              <MenuItemCard item={item} onSelect={setSelectedItem} />
              <div className="flex justify-end">
                <Button asChild variant="link" className="h-auto p-0 text-xs">
                  <Link to={routes.product(toProductSlug(item.name))}>Ver produto</Link>
                </Button>
              </div>
            </div>
          ))}

          {!activeItems.length && (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              Nenhum item disponivel nesta categoria.
            </div>
          )}
        </div>
      </section>

      <MenuItemDetailDrawer
        business={business}
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
      />

      <StickyOrderBar business={business} />
    </>
  );
}
