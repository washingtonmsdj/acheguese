import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Minus, Plus } from "lucide-react";
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
import {
  fulfillmentModeLabel,
  getEnabledFulfillmentModes,
  resolveDefaultFulfillmentMode,
  resolveDeliveryFeeForFulfillment,
} from "../checkout/checkoutRules";
import type { GastronomyBusiness } from "../types/gastronomy";
import type { MenuItemAddon, MenuItemVariant, MenuItemWithRelations } from "../types";
import { formatBrl, money } from "../utils/currency";
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
  const { item: hydratedItem } = useMenuItem(hydrateFromServer ? itemId : undefined);
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

  const matchesPizzaByText = /pizza/i.test(resolvedItem?.name ?? "");
  const mayUsePizzaCatalog =
    matchesPizzaByText ||
    /pizza|pizzaria/i.test(business.gastronomy_profile?.niche_key ?? "") ||
    /pizza|pizzaria/i.test(business.gastronomy_profile?.cuisine_type ?? "");

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

    if (!mayUsePizzaCatalog) {
      setPizzaMenuItemConfig(null);
      setShouldUsePizzaBuilder(false);
      setShouldUsePredefinedPizzaBuilder(false);
      return () => {
        mounted = false;
      };
    }

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
            : "Não foi possível carregar configurações da pizzaria.",
        );
      });

    return () => {
      mounted = false;
    };
  }, [business.business_data_id, matchesPizzaByText, mayUsePizzaCatalog, open, resolvedItem]);

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

  const basePrice = Number.isFinite(Number(resolvedItem?.base_price ?? 0))
    ? Number(resolvedItem?.base_price ?? 0)
    : 0;
  const selectedVariantAdjustment = Number.isFinite(
    Number(selectedVariant?.price_adjustment ?? 0),
  )
    ? Number(selectedVariant?.price_adjustment ?? 0)
    : 0;

  const lineTotal = useMemo(
    () => money((basePrice + selectedVariantAdjustment) * quantity + addonsTotal),
    [addonsTotal, basePrice, quantity, selectedVariantAdjustment],
  );

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

  const enabledFulfillmentModes = getEnabledFulfillmentModes(business);
  const defaultFulfillmentMode = resolveDefaultFulfillmentMode(business);
  const hasOrderableFulfillment = enabledFulfillmentModes.length > 0;
  const orderableModeLabel = fulfillmentModeLabel(defaultFulfillmentMode);
  const cartDeliveryFee = resolveDeliveryFeeForFulfillment(business, defaultFulfillmentMode);
  const businessDataId = business.business_data_id;
  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId((current) => (current === variantId ? current : variantId));
  };

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
        delivery_fee: cartDeliveryFee,
        fulfillment_mode: defaultFulfillmentMode,
        item_input: {
          item: resolvedItem,
          quantity,
          variant_id: selectedVariant?.id ?? selectedVariantId,
          addon_quantities: addonQuantities,
          special_instructions: specialInstructions,
        },
      });

      toast.success("Item adicionado ao carrinho.", { position: "top-center" });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível adicionar o item ao carrinho.";
      toast.error(message);
    }
  };

  const handleAddPizzaToCart = (selection: PizzaBuildSelection) => {
    if (!pizzaCatalog) return;

    try {
      const cartItem = PizzaCartItemBuilder.build(selection, pizzaCatalog);
      addCartItem({
        business_id: businessDataId,
        delivery_fee: cartDeliveryFee,
        fulfillment_mode: defaultFulfillmentMode,
        cart_item: cartItem,
      });

      toast.success("Pizza adicionada ao carrinho.", { position: "top-center" });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível adicionar a pizza ao carrinho.";
      toast.error(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{resolvedItem.name}</SheetTitle>
          {resolvedItem.description && <SheetDescription>{resolvedItem.description}</SheetDescription>}
          
          {/* Badges de características dietéticas */}
          <div className="flex flex-wrap gap-2 pt-2">
            {resolvedItem.is_vegan && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                🌱 Vegano
              </Badge>
            )}
            {resolvedItem.is_vegetarian && !resolvedItem.is_vegan && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                🥬 Vegetariano
              </Badge>
            )}
            {resolvedItem.is_gluten_free && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                🌾 Sem Glúten
              </Badge>
            )}
            {resolvedItem.is_lactose_free && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                🥛 Sem Lactose
              </Badge>
            )}
            {resolvedItem.is_spicy && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                🌶️ Picante {resolvedItem.spicy_level ? `(${resolvedItem.spicy_level}/5)` : ''}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-28">
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
                {pizzaCatalogError ?? "Carregando configurações da pizzaria..."}
              </div>
            ))}

          {!shouldUsePizzaBuilder && (
            <>
              <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço base</p>
                  <p className="text-2xl font-bold text-primary">{formatBrl(resolvedItem.base_price)}</p>
                  {resolvedItem.calories && (
                    <p className="text-xs text-muted-foreground mt-1">{resolvedItem.calories} kcal</p>
                  )}
                </div>

                <Badge variant="outline">
                  {hasOrderableFulfillment ? orderableModeLabel : "Pedido online indisponivel"}
                </Badge>
              </div>

              {/* Ingredientes e Alérgenos */}
              {(resolvedItem.ingredients?.length || resolvedItem.allergens?.length) && (
                <section className="space-y-3 rounded-xl border bg-muted/30 p-4">
                  {resolvedItem.ingredients && resolvedItem.ingredients.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Ingredientes</h4>
                      <p className="text-sm text-muted-foreground">
                        {resolvedItem.ingredients.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {resolvedItem.allergens && resolvedItem.allergens.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        Contém alérgenos
                      </h4>
                      <p className="text-sm text-amber-600">
                        {resolvedItem.allergens.join(', ')}
                      </p>
                    </div>
                  )}
                </section>
              )}

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
                          onClick={() => handleSelectVariant(variant.id)}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "hover:border-primary/30"
                          }`}
                        >
                          <span className="font-medium">{variant.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {variant.price_adjustment > 0
                              ? `+ ${formatBrl(variant.price_adjustment)}`
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
                            <p className="text-sm text-muted-foreground">{formatBrl(addon.price)} cada</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => updateAddonQuantity(addon, -1)}
                              disabled={selectedQuantity === 0}
                              aria-label={`Remover ${addon.name}`}
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
                              aria-label={`Adicionar ${addon.name}`}
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
                    quantity={quantity}
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
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((current) => current + 1)}
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold">Observações (opcional)</h3>
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
                      {formatBrl(money((basePrice + selectedVariantAdjustment) * quantity))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Adicionais</span>
                    <span>{formatBrl(addonsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total do item</span>
                    <span className="text-primary">{formatBrl(lineTotal)}</span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        {!shouldUsePizzaBuilder && (
          <SheetFooter className="sticky bottom-0 z-20 -mx-6 mt-6 border-t bg-background/95 px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total do item</p>
                <p className="truncate text-lg font-semibold text-primary">
                  {formatBrl(lineTotal)}
                </p>
              </div>
              <Button
                type="button"
                className="shrink-0"
                size="lg"
                disabled={!resolvedItem.is_available || !hasOrderableFulfillment}
                onClick={handleAddToCart}
              >
                {hasOrderableFulfillment ? "Adicionar ao carrinho" : "Pedido online indisponivel"}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
