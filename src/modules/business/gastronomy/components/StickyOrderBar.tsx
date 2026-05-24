import { Button } from '@/shared/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGastronomyCart } from '../hooks';
import type { GastronomyBusiness } from '../types';
import { formatBrl } from '../utils/currency';

interface Props {
  business: GastronomyBusiness;
}

export function StickyOrderBar({ business }: Props) {
  const navigate = useNavigate();
  const {
    cart,
    hasCart,
    itemCount,
    minimumOrderReached,
    minimumOrderRemaining,
  } = useGastronomyCart(business);

  if (!hasCart || itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur sm:p-4 sm:pb-4">
      <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </p>
            <p className="text-sm text-muted-foreground">
              Total do pedido: {formatBrl(cart.total)}
            </p>
            {!minimumOrderReached && (
              <p className="text-xs text-amber-700">
                Faltam {formatBrl(minimumOrderRemaining)} para o pedido mínimo.
              </p>
            )}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => navigate("checkout", { state: { business } })}
          disabled={!minimumOrderReached}
        >
          Continuar checkout
        </Button>
      </div>
    </div>
  );
}

