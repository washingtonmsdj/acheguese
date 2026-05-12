import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { GastronomyCheckoutSheet } from "@/modules/business/gastronomy/components";
import type { GastronomyCheckoutOrderRecord } from "@/modules/business/gastronomy/services/GastronomyCheckoutService";
import { usePremiumBusinessSiteContext } from "@/modules/business/premium/context/PremiumBusinessSiteContext";
import { useGastronomyCart } from "@/modules/business/gastronomy/hooks";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

export default function PremiumBusinessCheckoutPage() {
  const { hasGastronomy, gastronomySnapshot, routes } = usePremiumBusinessSiteContext();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(true);
  const createdOrderIdRef = useRef<string | null>(null);
  const business = gastronomySnapshot?.gastronomy.business ?? null;
  const { hasCart } = useGastronomyCart(business);

  if (!hasGastronomy || !gastronomySnapshot || !business) {
    return <Navigate to={routes.home} replace />;
  }

  const absoluteCanonical =
    typeof window !== "undefined" ? `${window.location.origin}${routes.checkout}` : undefined;

  return (
    <>
      <Helmet>
        <title>{`Checkout | ${business.name}`}</title>
        <meta name="description" content={`Checkout premium de ${business.name}.`} />
        {absoluteCanonical && <link rel="canonical" href={absoluteCanonical} />}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use o checkout oficial para confirmar o pedido desta empresa.</p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={routes.cart}>Voltar ao carrinho</Link>
              </Button>
              <Button onClick={() => setSheetOpen(true)} disabled={!hasCart}>
                Abrir checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <GastronomyCheckoutSheet
        business={business}
        open={sheetOpen}
        onOrderCreated={(order: GastronomyCheckoutOrderRecord) => {
          createdOrderIdRef.current = order.id;
        }}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            if (createdOrderIdRef.current) {
              navigate(businessManagementRoutes.gastronomyPedidoPublico(createdOrderIdRef.current));
              createdOrderIdRef.current = null;
              return;
            }

            navigate(routes.cart);
          }
        }}
      />
    </>
  );
}
