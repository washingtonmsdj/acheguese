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
import {
  PizzaAdminService,
  PizzaBuilder,
  PizzaPredefinedBuilder,
  PizzaCartItemBuilder,
  PizzaSliceVisualizer,
  type PizzaBuildSelection,
  type PizzaCatalog,
  type PizzaFlavor,
  type PizzaMenuItemConfig,
} from "../niches";
import { findFlavorByMenuItemName } from "../niches/pizzaria/utils/flavorMatch";
import {
  extractPizzaSizeLabel,
  hasSelectedCrustAddon,
  resolvePizzaRenderSize,
  textHasPizzaCrustHint,
} from "../niches/pizzaria/utils/pizzaVisualRules";

interface Props {
  business: GastronomyBusiness;
  item: MenuItemWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hydrateFromServer?: boolean;
}

function getInitialVariant(item: MenuItemWithRelations | null): string | null {
  if (!item?.variants?.length) return null;
  return item.variants.find((variant) => variant.is_default)?.id || item.variants[0]?.id || null;
}

function parseSlicesFromLabel(...values: Array<string | null | undefined>): number | null {
  for (const value of values) {
    if (!value) continue;
    const match = value.match(/(\d+)\s*fatias?/i);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
}

function resolveSlicesCount(
  selectedVariant: MenuItemVariant | undefined,
  variants: MenuItemVariant[],
  item: MenuItemWithRelations | null,
): number | null {
  return (
    parseSlicesFromLabel(selectedVariant?.name) ??
    variants.reduce<number | null>((found, variant) => found ?? parseSlicesFromLabel(variant.name), null) ??
    parseSlicesFromLabel(item?.name, item?.category?.name, item?.description)
  );
}

export function MenuItemDetailDrawer({
  business,
  item,
  open,
  onOpenChange,
  hydrateFromServer = true,
}: Props) {
  const itemId = item?.id;
  const { data: hydratedItem } = useMenuItem(hydrateFromServer ? itemId : undefined);
  const addItem = useGastronomyCartStore((state) => state.addItem);
  const addCartItem = useGastronomyCartStore((state) => state.addCartItem);
  const resolvedItem = hydratedItem ?? item;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [pizzaCatalog, setPizzaCatalog] = useState<PizzaCatalog | null>(null);
  const [pizzaMenuItemConfig, setPizzaMenuItemConfig] = useState<PizzaMenuItemConfig | null>(null);
  const [pizzaCatalogError, setPizzaCatalogError] = useState<string | null>(null);
  const [shouldUsePizzaBuilder, setShouldUsePizzaBuilder] = useState(false);
  const [shouldUsePredefinedPizzaBuilder, setShouldUsePredefinedPizzaBuilder] = useState(false);

  const matchesPizzaByText =
    /pizza/i.test(resolvedItem?.category?.name ?? "") || /pizza/i.test(resolvedItem?.name ?? "");

  useEffect(() => {
    if (!resolvedItem) return;

    setQuantity(1);
    setSelectedVariantId(getInitialVariant(resolvedItem));
    setAddonQuantities({});
    setSpecialInstructions("");
    setShouldUsePizzaBuilder(matchesPizzaByText);
    setShouldUsePredefinedPizzaBuilder(false);
    setPizzaMenuItemConfig(null);
  }, [matchesPizzaByText, open, resolvedItem]);

  useEffect(() => {
    if (!open || !resolvedItem) return;

    let mounted = true;
    setPizzaCatalogError(null);
    setPizzaCatalog(null);

    Promise.all([
      PizzaAdminService.getCatalog(business.business_data_id),
      PizzaAdminService.getMenuItemConfig(business.business_data_id, resolvedItem.id),
    ])
      .then(([catalog, menuItemConfig]) => {
        if (!mounted) return;

        const linkedAsPizza = Boolean(menuItemConfig?.is_buildable);
        const flavorMatch = Boolean(findFlavorByMenuItemName(catalog.flavors, resolvedItem.name));
        const shouldUsePizza = linkedAsPizza || flavorMatch || matchesPizzaByText;

        setPizzaCatalog(catalog);
        setPizzaMenuItemConfig(menuItemConfig ?? null);
        setShouldUsePizzaBuilder(shouldUsePizza);
        setShouldUsePredefinedPizzaBuilder(shouldUsePizza && flavorMatch);
      })
      .catch((error) => {
        if (!mounted) return;
        setPizzaCatalogError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar configuracoes da pizzaria.",
        );
      });

    return () => {
      mounted = false;
    };
  }, [business.business_data_id, matchesPizzaByText, open, resolvedItem]);

  const availableVariants = useMemo(
    () => (resolvedItem?.variants ?? []).filter((variant) => variant.is_available),
    [resolvedItem?.variants],
  );
  const availableAddons = useMemo(
    () => (resolvedItem?.addons ?? []).filter((addon) => addon.is_available),
    [resolvedItem?.addons],
  );

  const selectedVariant = useMemo<MenuItemVariant | undefined>(
    () => availableVariants.find((variant) => variant.id === selectedVariantId) || availableVariants[0],
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
    return money((resolvedItem.base_price + (selectedVariant?.price_adjustment ?? 0)) * quantity + addonsTotal);
  }, [addonsTotal, quantity, resolvedItem, selectedVariant?.price_adjustment]);

  const fallbackSlices = useMemo(
    () => resolveSlicesCount(selectedVariant, availableVariants, resolvedItem),
    [availableVariants, resolvedItem, selectedVariant],
  );

  const fallbackHasSelectedCrustAddon = useMemo(
    () => hasSelectedCrustAddon(availableAddons, addonQuantities),
    [addonQuantities, availableAddons],
  );

  const fallbackHasDefaultCrust = useMemo(
    () =>
      Boolean(pizzaMenuItemConfig?.default_edge_id) ||
      textHasPizzaCrustHint(resolvedItem?.name, resolvedItem?.description),
    [pizzaMenuItemConfig?.default_edge_id, resolvedItem?.description, resolvedItem?.name],
  );

  const shouldShowPizzaSvgFallback = useMemo(
    () => Boolean(!shouldUsePizzaBuilder && fallbackSlices),
    [fallbackSlices, shouldUsePizzaBuilder],
  );

  const fallbackShowCrust = useMemo(
    () => fallbackHasSelectedCrustAddon || fallbackHasDefaultCrust,
    [fallbackHasDefaultCrust, fallbackHasSelectedCrustAddon],
  );

  const fallbackDefaultSize = useMemo(() => {
    if (!pizzaCatalog || !pizzaMenuItemConfig?.default_size_id) return null;
    return pizzaCatalog.sizes.find((size) => size.id === pizzaMenuItemConfig.default_size_id) ?? null;
  }, [pizzaCatalog, pizzaMenuItemConfig?.default_size_id]);

  const fallbackSizeLabel = useMemo(
    () =>
      extractPizzaSizeLabel(selectedVariant?.name) ??
      fallbackDefaultSize?.name ??
      extractPizzaSizeLabel(resolvedItem?.name) ??
      "Pizza",
    [fallbackDefaultSize?.name, resolvedItem?.name, selectedVariant?.name],
  );

  const fallbackVisualizerSize = useMemo(
    () =>
      resolvePizzaRenderSize({
        sizeLabel: fallbackSizeLabel,
        diameterCm: fallbackDefaultSize?.diameter_cm ?? null,
        slices: fallbackSlices,
      }),
    [fallbackDefaultSize?.diameter_cm, fallbackSizeLabel, fallbackSlices],
  );

  const fallbackVisualFlavor = useMemo<PizzaFlavor | null>(() => {
    if (!resolvedItem) return null;
    return {
      id: `fallback-${resolvedItem.id}`,
      business_id: business.business_data_id,
      name: resolvedItem.name,
      description: resolvedItem.description ?? null,
      category: resolvedItem.category?.name ?? "pizza",
      base_price: resolvedItem.base_price,
      is_available: true,
      is_vegetarian: resolvedItem.is_vegetarian,
      is_vegan: resolvedItem.is_vegan,
      is_spicy: resolvedItem.is_spicy,
      allergens: resolvedItem.allergens ?? [],
      ingredients: resolvedItem.ingredients ?? [],
      display_order: 0,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    };
  }, [business.business_data_id, resolvedItem]);

  if (!resolvedItem) return null;

  const deliveryEnabled = business.gastronomy_profile?.delivery_enabled ?? false;
  const businessDataId = business.business_data_id;

  const updateAddonQuantity = (addon: MenuItemAddon, delta: number) => {
    setAddonQuantities((current) => {
      const nextValue = Math.max(0, Math.min((current[addon.id] ?? 0) + delta, addon.max_quantity || 1));
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
        error instanceof Error ? error.message : "Nao foi possivel adicionar o item ao carrinho.";
      toast.error(message);
    }
  };

  const handleAddPizzaToCart = (selection: PizzaBuildSelection) => {
    if (!pizzaCatalog) return;

    try {
      const cartItem = PizzaCartItemBuilder.build(selection, pizzaCatalog);
      addCartItem({
        business_id: businessDataId,
        delivery_fee: business.gastronomy_profile?.delivery_fee ?? 0,
        cart_item: cartItem,
      });

      toast.success("Pizza adicionada ao carrinho.");
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel adicionar a pizza ao carrinho.";
      toast.error(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{resolvedItem.name}</SheetTitle>
          {resolvedItem.description && <SheetDescription>{resolvedItem.description}</SheetDescription>}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {resolvedItem.image_url && (
            <img
              src={resolvedItem.image_url}
              alt={resolvedItem.name}
              className="h-56 w-full rounded-xl object-cover"
            />
          )}

          {shouldUsePizzaBuilder &&
            (pizzaCatalog ? (
              shouldUsePredefinedPizzaBuilder ? (
                <PizzaPredefinedBuilder
                  businessId={businessDataId}
                  item={resolvedItem}
                  catalog={pizzaCatalog}
                  defaultEdgeId={pizzaMenuItemConfig?.default_edge_id ?? null}
                  onAddToCart={handleAddPizzaToCart}
                />
              ) : (
                <PizzaBuilder
                  businessId={businessDataId}
                  item={resolvedItem}
                  catalog={pizzaCatalog}
                  defaultEdgeId={pizzaMenuItemConfig?.default_edge_id ?? null}
                  onAddToCart={handleAddPizzaToCart}
                />
              )
            ) : (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                {pizzaCatalogError ?? "Carregando configuracoes da pizzaria..."}
              </div>
            ))}

          {!shouldUsePizzaBuilder && (
            <>
              <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preco base</p>
                  <p className="text-2xl font-bold text-primary">R$ {resolvedItem.base_price.toFixed(2)}</p>
                </div>

                {!deliveryEnabled && <Badge variant="outline">Delivery indisponivel</Badge>}
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
                            isSelected ? "border-primary bg-primary/5" : "hover:border-primary/30"
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
                        <div key={addon.id} className="flex items-center justify-between rounded-xl border p-4">
                          <div>
                            <p className="font-medium">{addon.name}</p>
                            <p className="text-sm text-muted-foreground">R$ {addon.price.toFixed(2)} cada</p>
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
                            <span className="w-8 text-center font-medium">{selectedQuantity}</span>
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

              {shouldShowPizzaSvgFallback && fallbackVisualFlavor && fallbackSlices && (
                <section className="rounded-lg border bg-muted/30 p-4">
                  <h4 className="mb-4 text-center text-sm font-medium">
                    Visualizacao da pizza ({fallbackSizeLabel} · {fallbackSlices} fatias)
                  </h4>
                  <PizzaSliceVisualizer
                    baseFlavor={fallbackVisualFlavor}
                    additionalFlavors={[]}
                    totalSlices={fallbackSlices}
                    size={fallbackVisualizerSize}
                    showCrust={fallbackShowCrust}
                  />
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
                  <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
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
                <h3 className="font-semibold">Observacoes (opcional)</h3>
                <Textarea
                  placeholder="Algo a destacar para a cozinha?"
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
                      {money((resolvedItem.base_price + (selectedVariant?.price_adjustment ?? 0)) * quantity).toFixed(2)}
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
            </>
          )}
        </div>

        {!shouldUsePizzaBuilder && (
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
        )}
      </SheetContent>
    </Sheet>
  );
}
