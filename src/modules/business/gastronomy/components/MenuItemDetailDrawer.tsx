import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { useMenuItem } from "../hooks";
import { useGastronomyCartStore } from "../cart/useGastronomyCartStore";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { MenuItemAddon, MenuItemVariant, MenuItemWithRelations } from "../types";
import { money } from "../utils/currency";

interface Props {
  business: GastronomyBusiness;
  item: MenuItemWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitialVariant(item: MenuItemWithRelations | null): string | null {
  if (!item?.variants?.length) return null;
  return (
    item.variants.find((variant) => variant.is_default)?.id ||
    item.variants[0]?.id ||
    null
  );
}

export function MenuItemDetailDrawer({
  business,
  item,
  open,
  onOpenChange,
}: Props) {
  const itemId = item?.id;
  const { data: hydratedItem } = useMenuItem(itemId);
  const addItem = useGastronomyCartStore((state) => state.addItem);
  const resolvedItem = hydratedItem ?? item;
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (!resolvedItem) return;

    setQuantity(1);
    setSelectedVariantId(getInitialVariant(resolvedItem));
    setAddonQuantities({});
    setSpecialInstructions("");
  }, [open, resolvedItem]);

  const availableVariants = useMemo(
    () => (resolvedItem?.variants ?? []).filter((variant) => variant.is_available),
    [resolvedItem?.variants],
  );
  const availableAddons = useMemo(
    () => (resolvedItem?.addons ?? []).filter((addon) => addon.is_available),
    [resolvedItem?.addons],
  );

  const selectedVariant = useMemo<MenuItemVariant | undefined>(
    () =>
      availableVariants.find((variant) => variant.id === selectedVariantId) ||
      availableVariants[0],
    [availableVariants, selectedVariantId],
  );

  const addonsTotal = useMemo(
    () =>
      money(
        availableAddons.reduce((total, addon) => {
          const addonQuantity = addonQuantities[addon.id] ?? 0;
          return total + addon.price * addonQuantity;
        }, 0),
      ),
    [addonQuantities, availableAddons],
  );

  const lineTotal = useMemo(() => {
    if (!resolvedItem) return 0;
    return money(
      (resolvedItem.base_price + (selectedVariant?.price_adjustment ?? 0)) * quantity +
        addonsTotal,
    );
  }, [addonsTotal, quantity, resolvedItem, selectedVariant?.price_adjustment]);

  if (!resolvedItem) return null;

  const deliveryEnabled = business.gastronomy_profile?.delivery_enabled ?? false;
  const businessDataId = business.business_data_id;

  const updateAddonQuantity = (addon: MenuItemAddon, delta: number) => {
    setAddonQuantities((current) => {
      const nextValue = Math.max(
        0,
        Math.min((current[addon.id] ?? 0) + delta, addon.max_quantity || 1),
      );

      return {
        ...current,
        [addon.id]: nextValue,
      };
    });
  };

  const handleAddToCart = () => {
    try {
      addItem({
        business_id: businessDataId,
        delivery_fee: business.gastronomy_profile?.delivery_fee ?? 0,
        item_input: {
          item: resolvedItem,
          quantity,
          variant_id: selectedVariant?.id ?? selectedVariantId,
          addon_quantities: addonQuantities,
          special_instructions: specialInstructions,
        },
      });

      toast.success("Item adicionado ao carrinho.");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel adicionar o item ao carrinho.";
      toast.error(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{resolvedItem.name}</SheetTitle>
          {resolvedItem.description && (
            <SheetDescription>{resolvedItem.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {resolvedItem.image_url && (
            <img
              src={resolvedItem.image_url}
              alt={resolvedItem.name}
              className="h-56 w-full rounded-xl object-cover"
            />
          )}

          <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Preco base</p>
              <p className="text-2xl font-bold text-primary">
                R$ {resolvedItem.base_price.toFixed(2)}
              </p>
            </div>

            {!deliveryEnabled && (
              <Badge variant="outline">Delivery indisponivel</Badge>
            )}
          </div>

          {availableVariants.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold">Escolha a variante</h3>
              <div className="grid gap-2">
                {availableVariants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/30"
                      }`}
                    >
                      <span className="font-medium">{variant.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {variant.price_adjustment > 0
                          ? `+ R$ ${variant.price_adjustment.toFixed(2)}`
                          : "Sem ajuste"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {availableAddons.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold">Adicionais</h3>
              <div className="space-y-3">
                {availableAddons.map((addon) => {
                  const selectedQuantity = addonQuantities[addon.id] ?? 0;

                  return (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between rounded-xl border p-4"
                    >
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {addon.price.toFixed(2)} cada
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateAddonQuantity(addon, -1)}
                          disabled={selectedQuantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedQuantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateAddonQuantity(addon, 1)}
                          disabled={selectedQuantity >= addon.max_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="font-semibold">Quantidade</h3>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-lg font-semibold">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((current) => current + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Observacoes do item</h3>
            <Textarea
              placeholder="Ex.: sem cebola, ponto da carne bem passado."
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              maxLength={200}
            />
          </section>

          <section className="rounded-xl border bg-muted/30 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Base da linha</span>
                <span>
                  R${" "}
                  {money(
                    (resolvedItem.base_price +
                      (selectedVariant?.price_adjustment ?? 0)) *
                      quantity,
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Adicionais</span>
                <span>R$ {addonsTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total da linha</span>
                <span className="text-primary">R$ {lineTotal.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>

        <SheetFooter className="mt-6">
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={!resolvedItem.is_available || !deliveryEnabled}
            onClick={handleAddToCart}
          >
            {deliveryEnabled ? "Adicionar ao carrinho" : "Delivery indisponivel"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

