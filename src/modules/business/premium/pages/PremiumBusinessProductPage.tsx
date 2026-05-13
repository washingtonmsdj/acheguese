import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MenuItemDetailDrawer } from "@/modules/business/gastronomy/components";
import { formatBrl } from "@/modules/business/gastronomy/utils/currency";
import { usePremiumBusinessSiteContext } from "@/modules/business/premium/context/PremiumBusinessSiteContext";
import { toProductSlug } from "@/modules/business/premium/utils/productSlug";

export default function PremiumBusinessProductPage() {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const { hasGastronomy, gastronomySnapshot, routes } = usePremiumBusinessSiteContext();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const business = gastronomySnapshot?.gastronomy.business ?? null;
  const menu = gastronomySnapshot?.gastronomy.menu ?? null;
  const menuItems = useMemo(
    () =>
      (menu?.categories ?? [])
        .flatMap((category) => category.items)
        .filter((item) => item.is_available),
    [menu],
  );

  if (!hasGastronomy || !gastronomySnapshot || !business) {
    return <Navigate to={routes.home} replace />;
  }

  const item = menuItems.find((menuItem) => toProductSlug(menuItem.name) === productSlug) ?? null;
  const absoluteCanonical =
    typeof window !== "undefined" && productSlug
      ? `${window.location.origin}${routes.product(productSlug)}`
      : undefined;

  if (!item) {
    return <Navigate to={routes.menu} replace />;
  }

  return (
    <>
      <Helmet>
        <title>{`${item.name} | ${business.name}`}</title>
        <meta
          name="description"
          content={`Detalhes de ${item.name} no cardapio premium de ${business.name}.`}
        />
        {absoluteCanonical && <link rel="canonical" href={absoluteCanonical} />}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="space-y-5 pb-16">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Produto</h1>
          <Button asChild variant="outline">
            <Link to={routes.menu}>Voltar ao cardapio</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="grid gap-4 p-5 md:grid-cols-[220px_minmax(0,1fr)]">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="aspect-[4/3] w-full rounded-xl border object-cover md:aspect-auto md:h-full"
              />
            ) : (
              <div className="aspect-[4/3] w-full rounded-xl border bg-muted md:aspect-auto md:h-full" />
            )}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">{item.name}</h2>
              <p className="text-sm text-muted-foreground">
                {item.description || "Sem descricao adicional."}
              </p>
              <p className="text-lg font-bold text-primary">{formatBrl(item.base_price)}</p>
              <div className="flex flex-wrap gap-2">
                {item.is_featured && <Badge>Destaque</Badge>}
                {item.is_vegan && <Badge variant="outline">Vegano</Badge>}
                {item.is_gluten_free && <Badge variant="outline">Sem gluten</Badge>}
              </div>
              <Button onClick={() => setDrawerOpen(true)}>Escolher adicionais e adicionar</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <MenuItemDetailDrawer
        business={business}
        item={item}
        open={drawerOpen}
        hydrateFromServer={false}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            navigate(routes.menu);
          }
        }}
      />
    </>
  );
}
