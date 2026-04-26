import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { PizzaCartItemBuilder } from "../PizzaCartItemBuilder";
import { PizzaPricingService } from "../PizzaPricingService";
import { PizzaValidationService } from "../PizzaValidationService";
import type { PizzaBuildSelection, PizzaCatalog, PizzaFlavor } from "../types";
import type { MenuItemWithRelations } from "../../../types/menu";
import { PizzaSliceVisualizer } from "./PizzaSliceVisualizer";
import { findFlavorByMenuItemName } from "../utils/flavorMatch";
import { resolvePizzaRenderSize, textHasPizzaCrustHint } from "../utils/pizzaVisualRules";

interface Props {
  businessId: string;
  item: MenuItemWithRelations;
  catalog: PizzaCatalog;
  onAddToCart: (selection: PizzaBuildSelection) => void;
  defaultEdgeId?: string | null;
}

function getEqualFractions(count: number): number[] {
  if (count <= 1) return [1];
  return Array.from({ length: count }, () => Number((1 / count).toFixed(4)));
}

export function PizzaBuilder({ businessId, item, catalog, onAddToCart, defaultEdgeId = null }: Props) {
  const [sizeId, setSizeId] = useState(catalog.sizes[0]?.id ?? "");
  const [flavorIds, setFlavorIds] = useState<string[]>([]);
  const [flavorSearch, setFlavorSearch] = useState("");
  const [edgeId, setEdgeId] = useState<string | null>(defaultEdgeId);
  const [doughId, setDoughId] = useState<string | null>(catalog.doughs[0]?.id ?? null);

  const inferredFlavor = useMemo(
    () =>
      findFlavorByMenuItemName(catalog.flavors, item.name) ??
      catalog.flavors.find((entry) => entry.is_available) ??
      null,
    [catalog.flavors, item.name],
  );
  const fallbackVisualFlavor = useMemo<PizzaFlavor>(
    () => ({
      id: `visual-flavor-${item.id}`,
      business_id: businessId,
      name: item.name,
      description: "Visualizacao da pizza",
      category: "visual",
      base_price: item.base_price,
      is_available: true,
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      is_spicy: item.is_spicy,
      allergens: [],
      ingredients: [],
      display_order: 0,
      created_at: "1970-01-01T00:00:00.000Z",
      updated_at: "1970-01-01T00:00:00.000Z",
    }),
    [businessId, item.base_price, item.id, item.is_spicy, item.is_vegan, item.is_vegetarian, item.name],
  );

  useEffect(() => {
    if (!inferredFlavor) {
      setFlavorIds([]);
      return;
    }
    setFlavorIds([inferredFlavor.id]);
  }, [inferredFlavor, item.id]);

  useEffect(() => {
    setEdgeId(defaultEdgeId);
  }, [defaultEdgeId, item.id]);

  const size = catalog.sizes.find((entry) => entry.id === sizeId) ?? null;
  const edge = edgeId ? catalog.edges.find((entry) => entry.id === edgeId) ?? null : null;
  const dough = doughId ? catalog.doughs.find((entry) => entry.id === doughId) ?? null : null;
  const fractions = getEqualFractions(flavorIds.length);
  const flavorSelection = flavorIds.map((flavorId, index) => ({
    flavor_id: flavorId,
    fraction: fractions[index] ?? 0,
  }));

  const validation = useMemo(
    () =>
      PizzaValidationService.validateBuild({
        size,
        flavors: catalog.flavors,
        flavor_selection: flavorSelection,
        edge,
        dough,
      }),
    [catalog.flavors, dough, edge, flavorSelection, size],
  );

  const price = useMemo(() => {
    if (!size || !validation.is_valid) return null;
    return PizzaPricingService.calculate({
      size,
      flavors: catalog.flavors,
      flavor_selection: flavorSelection,
      rule: catalog.config.default_price_rule,
      edge,
      dough,
      quantity: 1,
    });
  }, [catalog, dough, edge, flavorSelection, size, validation.is_valid]);

  const selectedFlavors = useMemo(
    () =>
      flavorIds
        .map((flavorId) => catalog.flavors.find((flavor) => flavor.id === flavorId))
        .filter((flavor): flavor is PizzaFlavor => Boolean(flavor)),
    [catalog.flavors, flavorIds],
  );
  const filteredFlavors = useMemo(() => {
    const normalizedSearch = flavorSearch.trim().toLowerCase();
    const available = catalog.flavors.filter((entry) => entry.is_available);
    if (!normalizedSearch) return available;
    return available.filter((flavor) => {
      const name = flavor.name.toLowerCase();
      const ingredients = flavor.ingredients.join(" ").toLowerCase();
      return name.includes(normalizedSearch) || ingredients.includes(normalizedSearch);
    });
  }, [catalog.flavors, flavorSearch]);
  const visibleFlavors = useMemo(() => filteredFlavors.slice(0, 200), [filteredFlavors]);

  const visualBaseFlavor = selectedFlavors[0] ?? inferredFlavor ?? fallbackVisualFlavor;
  const visualAdditionalFlavors = selectedFlavors.slice(1);
  const shouldShowCrust = Boolean(edgeId || textHasPizzaCrustHint(item.name, item.description));
  const visualSize = resolvePizzaRenderSize({
    sizeLabel: size?.name,
    diameterCm: size?.diameter_cm ?? null,
    slices: size?.slices ?? null,
  });

  const toggleFlavor = (flavorId: string) => {
    setFlavorIds((current) => {
      if (current.includes(flavorId)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((id) => id !== flavorId);
      }

      if (!size || current.length >= size.max_flavors) {
        return current;
      }

      return [...current, flavorId];
    });
  };

  const handleAdd = () => {
    const selection: PizzaBuildSelection = {
      item,
      business_id: businessId,
      size_id: sizeId,
      flavors: flavorSelection,
      edge_id: edgeId,
      dough_id: doughId,
      quantity: 1,
      price_rule: catalog.config.default_price_rule,
    };

    PizzaCartItemBuilder.build(selection, catalog);
    onAddToCart(selection);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monte sua pizza</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <h3 className="font-medium">Tamanho</h3>
          <div className="flex flex-wrap gap-2">
            {catalog.sizes.filter((entry) => entry.is_available).map((entry) => (
              <Button
                key={entry.id}
                type="button"
                variant={sizeId === entry.id ? "default" : "outline"}
                onClick={() => {
                  setSizeId(entry.id);
                  setFlavorIds((current) => current.slice(0, entry.max_flavors));
                }}
              >
                {entry.name} · até {entry.max_flavors}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">Sabores</h3>
          <Input
            value={flavorSearch}
            onChange={(event) => setFlavorSearch(event.target.value)}
            placeholder="Buscar sabor..."
          />
          {filteredFlavors.length > visibleFlavors.length && (
            <p className="text-xs text-muted-foreground">
              Exibindo os primeiros {visibleFlavors.length} sabores. Refine a busca.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleFlavors.map((flavor) => (
              <button
                key={flavor.id}
                type="button"
                onClick={() => toggleFlavor(flavor.id)}
                className={`rounded-lg border p-3 text-left ${
                  flavorIds.includes(flavor.id) ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <p className="font-medium">{flavor.name}</p>
                <p className="text-sm text-muted-foreground">R$ {flavor.base_price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </section>

        {size && visualBaseFlavor && (
          <section className="rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-4 text-center text-sm font-medium">
              {size.name} · {size.slices} fatias · {selectedFlavors.length || 1} sabor(es)
            </h4>
            <PizzaSliceVisualizer
              baseFlavor={visualBaseFlavor}
              additionalFlavors={visualAdditionalFlavors}
              totalSlices={size.slices}
              size={visualSize}
              showCrust={shouldShowCrust}
            />
          </section>
        )}

        <section className="space-y-2">
          <h3 className="font-medium">Borda</h3>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={!edgeId ? "default" : "outline"} onClick={() => setEdgeId(null)}>
              Sem borda
            </Button>
            {catalog.edges.filter((entry) => entry.is_available).map((entry) => (
              <Button
                key={entry.id}
                type="button"
                variant={edgeId === entry.id ? "default" : "outline"}
                onClick={() => setEdgeId(entry.id)}
              >
                {entry.name} +R$ {entry.price.toFixed(2)}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="font-medium">Massa</h3>
          <div className="flex flex-wrap gap-2">
            {catalog.doughs.filter((entry) => entry.is_available).map((entry) => (
              <Button
                key={entry.id}
                type="button"
                variant={doughId === entry.id ? "default" : "outline"}
                onClick={() => setDoughId(entry.id)}
              >
                {entry.name} +R$ {entry.price_adjustment.toFixed(2)}
              </Button>
            ))}
          </div>
        </section>

        {validation.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {validation.errors.join(" ")}
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="font-medium">Total</span>
          <span className="text-lg font-bold text-primary">
            {price ? `R$ ${price.line_total.toFixed(2)}` : "--"}
          </span>
        </div>

        <Button type="button" className="w-full" disabled={!validation.is_valid} onClick={handleAdd}>
          Adicionar pizza ao carrinho
        </Button>
      </CardContent>
    </Card>
  );
}
