import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { usePremiumBusinessSiteContext } from "@/modules/business/premium/context/PremiumBusinessSiteContext";
import { useGastronomyCart } from "@/modules/business/gastronomy/hooks";
import { formatBrl } from "@/modules/business/gastronomy/utils/currency";

export default function PremiumBusinessCartPage() {
  const { hasGastronomy, gastronomySnapshot, routes } = usePremiumBusinessSiteContext();
  const business = gastronomySnapshot?.gastronomy.business ?? null;
  const { cart, hasCart, itemCount, removeItem, clearCart, minimumOrderRemaining } =
    useGastronomyCart(business);

  if (!hasGastronomy || !gastronomySnapshot || !business) {
    return <Navigate to={routes.home} replace />;
  }

  const absoluteCanonical =
    typeof window !== "undefined" ? `${window.location.origin}${routes.cart}` : undefined;

  return (
    <>
      <Helmet>
        <title>{`Carrinho | ${business.name}`}</title>
        <meta name="description" content={`Carrinho premium de ${business.name}.`} />
        {absoluteCanonical && <link rel="canonical" href={absoluteCanonical} />}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Carrinho</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={routes.menu}>Voltar ao cardapio</Link>
            </Button>
            <Button asChild>
              <Link to={routes.checkout}>Ir para checkout</Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {itemCount} {itemCount === 1 ? "item" : "itens"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasCart && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Seu carrinho esta vazio.
              </div>
            )}

            {cart.items.map((line) => (
              <div key={line.line_id ?? `${line.item_id}-${line.name}`} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {line.quantity}x {line.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatBrl(line.subtotal)}</p>
                  </div>
                  {line.line_id && (
                    <Button variant="ghost" size="sm" onClick={() => removeItem(line.line_id as string)}>
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {hasCart && (
              <>
                <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatBrl(cart.subtotal)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Entrega</span>
                    <span>{formatBrl(cart.delivery_fee)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatBrl(cart.total)}</span>
                  </div>
                  {minimumOrderRemaining > 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      Faltam {formatBrl(minimumOrderRemaining)} para o pedido minimo.
                    </p>
                  )}
                </div>

                <Button variant="outline" onClick={clearCart}>
                  Limpar carrinho
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
