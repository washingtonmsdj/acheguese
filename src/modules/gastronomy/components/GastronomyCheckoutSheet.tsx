import { useMemo, useState } from "react";
import { CreditCard, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { useGastronomyCart, useGastronomyCheckout } from "../hooks";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { CartItem } from "../types/menu";

interface Props {
  business: GastronomyBusiness;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_OPTIONS = [
  {
    value: "pix",
    label: "PIX direto ao merchant",
    icon: Wallet,
  },
  {
    value: "card_on_delivery",
    label: "Cartao na entrega",
    icon: CreditCard,
  },
  {
    value: "cash",
    label: "Dinheiro",
    icon: Wallet,
  },
] as const;

function buildItemSummary(item: CartItem): string[] {
  const summary: string[] = [];

  if (item.variant?.name) {
    summary.push(item.variant.name);
  }

  if (item.addons.length) {
    summary.push(
      item.addons
        .map((addon) => `${addon.quantity}x ${addon.name}`)
        .join(", "),
    );
  }

  if (item.special_instructions) {
    summary.push(item.special_instructions);
  }

  return summary;
}

export function GastronomyCheckoutSheet({
  business,
  open,
  onOpenChange,
}: Props) {
  const {
    cart,
    hasCart,
    minimumOrderReached,
    minimumOrderRemaining,
    removeItem,
  } = useGastronomyCart(business);
  const { checkout, isSubmitting, hasActiveProfile } = useGastronomyCheckout();
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [customerNotes, setCustomerNotes] = useState("");

  const isCheckoutDisabled =
    !hasCart || !minimumOrderReached || isSubmitting || !hasActiveProfile;

  const minimumOrderLabel = useMemo(() => {
    if (minimumOrderRemaining <= 0) return null;
    return `Faltam R$ ${minimumOrderRemaining.toFixed(2)} para atingir o pedido minimo.`;
  }, [minimumOrderRemaining]);

  const handleSubmit = async () => {
    try {
      const order = await checkout({
        business,
        cart,
        payment_method: paymentMethod,
        notes: customerNotes.trim() || undefined,
      });

      onOpenChange(false);
      setCustomerNotes("");
      toast.success(`Pedido ${order.id.slice(0, 8)} criado com sucesso.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao concluir o pedido.";
      toast.error(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Revisar pedido</SheetTitle>
          <SheetDescription>
            O pagamento acontece direto com o estabelecimento. O app registra o
            pedido e acompanha a operacao da entrega.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Itens</h3>
              <Badge variant="outline">{cart.items.length} linhas</Badge>
            </div>

            <div className="space-y-3">
              {cart.items.map((item) => {
                const summary = buildItemSummary(item);

                return (
                  <div
                    key={item.line_id}
                    className="rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.quantity}x</span>
                          <p className="font-semibold">{item.name}</p>
                        </div>
                        {summary.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {summary.map((entry) => (
                              <p
                                key={`${item.line_id}-${entry}`}
                                className="text-sm text-muted-foreground"
                              >
                                {entry}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            R$ {item.subtotal.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Base R$ {item.base_price.toFixed(2)}
                          </p>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.line_id!)}
                          aria-label={`Remover ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!cart.items.length && (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Nenhum item no carrinho.
                </div>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="font-semibold">Forma de pagamento</h3>
            <div className="grid gap-2">
              {PAYMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = paymentMethod === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaymentMethod(option.value)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {isSelected && <Badge>Selecionado</Badge>}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Observacoes do pedido</h3>
            <Textarea
              placeholder="Ex.: interfone 12, troco para 100, entregar na portaria."
              value={customerNotes}
              onChange={(event) => setCustomerNotes(event.target.value)}
              maxLength={280}
            />
          </section>

          <section className="rounded-xl border bg-muted/30 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entrega</span>
                <span>R$ {cart.delivery_fee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">R$ {cart.total.toFixed(2)}</span>
              </div>
            </div>

            {minimumOrderLabel && (
              <p className="mt-3 text-sm text-amber-700">{minimumOrderLabel}</p>
            )}

            {!hasActiveProfile && (
              <p className="mt-3 text-sm text-amber-700">
                Selecione um perfil ativo para concluir o pedido.
              </p>
            )}
          </section>
        </div>

        <SheetFooter className="mt-6">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={isCheckoutDisabled}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Criando pedido..." : "Confirmar pedido"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
