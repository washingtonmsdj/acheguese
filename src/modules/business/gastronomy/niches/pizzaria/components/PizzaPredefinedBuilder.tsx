import { useEffect, useMemo, useState } from "react";
import { Pizza, Plus, Minus, X, ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { PizzaPricingService } from "../PizzaPricingService";
import { PizzaValidationService } from "../PizzaValidationService";
import type { PizzaBuildSelection, PizzaCatalog, PizzaFlavor } from "../types";
import type { MenuItemAddon, MenuItemWithRelations } from "../../../types/menu";
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

function findFlavorById(flavors: PizzaFlavor[], id: string): PizzaFlavor | undefined {
  return flavors.find((f) => f.id === id);
}

export function PizzaPredefinedBuilder({
  businessId,
  item,
  catalog,
  onAddToCart,
  defaultEdgeId = null,
}: Props) {
  const [hasAdditionalFlavors, setHasAdditionalFlavors] = useState(false);
  const [sizeId, setSizeId] = useState<string>("");
  const [additionalFlavorIds, setAdditionalFlavorIds] = useState<string[]>([]);
  const [edgeId, setEdgeId] = useState<string | null>(defaultEdgeId);
  const [doughId, setDoughId] = useState<string | null>(catalog.doughs[0]?.id ?? null);
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setEdgeId(defaultEdgeId);
  }, [defaultEdgeId, item.id]);

  // Inicializa o tamanho padrão quando o catálogo carrega
  const availableSizes = useMemo(
    () => catalog.sizes.filter((s) => s.is_available).sort((a, b) => a.display_order - b.display_order),
    [catalog.sizes]
  );

  const selectedSize = useMemo(() => {
    if (!sizeId) return availableSizes[0] ?? null;
    return catalog.sizes.find((s) => s.id === sizeId) ?? null;
  }, [catalog.sizes, sizeId, availableSizes]);

  // Encontra o sabor correspondente ao item pré-definido
  const predefinedFlavor = useMemo(() => {
    return findFlavorByMenuItemName(catalog.flavors, item.name) ?? null;
  }, [catalog.flavors, item.name]);

  const additionalFlavors = useMemo(() => {
    return additionalFlavorIds
      .map((id) => findFlavorById(catalog.flavors, id))
      .filter((f): f is PizzaFlavor => f !== undefined);
  }, [catalog.flavors, additionalFlavorIds]);

  const availableExtras = useMemo(
    () => (item.addons ?? []).filter((addon) => addon.is_available),
    [item.addons]
  );

  const edge = useMemo(() => {
    if (!edgeId) return null;
    return catalog.edges.find((e) => e.id === edgeId) ?? null;
  }, [catalog.edges, edgeId]);

  const dough = useMemo(() => {
    if (!doughId) return null;
    return catalog.doughs.find((d) => d.id === doughId) ?? null;
  }, [catalog.doughs, doughId]);

  // Total de sabores selecionados (original + adicionais)
  const totalFlavorCount = hasAdditionalFlavors ? 1 + additionalFlavors.length : 1;

  // Monta a seleção de sabores para cálculo de preço
  const flavorSelection = useMemo(() => {
    const flavors: { flavor_id: string; fraction: number }[] = [];

    if (!predefinedFlavor) return flavors;

    if (!hasAdditionalFlavors || additionalFlavors.length === 0) {
      flavors.push({ flavor_id: predefinedFlavor.id, fraction: 1 });
    } else {
      const fractions = getEqualFractions(totalFlavorCount);
      flavors.push({ flavor_id: predefinedFlavor.id, fraction: fractions[0] ?? 1 });
      additionalFlavors.forEach((flavor, index) => {
        flavors.push({
          flavor_id: flavor.id,
          fraction: fractions[index + 1] ?? 0,
        });
      });
    }

    return flavors;
  }, [predefinedFlavor, hasAdditionalFlavors, additionalFlavors, totalFlavorCount]);

  // Converte extras para formato de addon do carrinho
  const selectedExtras = useMemo(() => {
    return availableExtras
      .map((extra) => {
        const quantity = extraQuantities[extra.id] ?? 0;
        if (quantity <= 0) return null;
        return {
          addon_id: extra.id,
          name: extra.name,
          price: extra.price,
          quantity,
        };
      })
      .filter((extra): extra is NonNullable<typeof extra> => extra !== null);
  }, [availableExtras, extraQuantities]);

  const validation = useMemo(() => {
    if (!selectedSize || !predefinedFlavor) {
      return { is_valid: false, errors: ["Selecione um tamanho e sabor."] };
    }

    return PizzaValidationService.validateBuild({
      size: selectedSize,
      flavors: catalog.flavors,
      flavor_selection: flavorSelection,
      edge,
      dough,
    });
  }, [catalog.flavors, dough, edge, flavorSelection, predefinedFlavor, selectedSize]);

  const price = useMemo(() => {
    if (!selectedSize || !validation.is_valid || !predefinedFlavor) return null;

    return PizzaPricingService.calculate({
      size: selectedSize,
      flavors: catalog.flavors,
      flavor_selection: flavorSelection,
      rule: catalog.config.default_price_rule,
      edge,
      dough,
      addons: selectedExtras,
      quantity: 1,
    });
  }, [catalog, dough, edge, flavorSelection, predefinedFlavor, selectedExtras, selectedSize, validation.is_valid]);

  const canAddMoreFlavors = selectedSize
    ? additionalFlavors.length < selectedSize.max_flavors - 1
    : false;

  const maxAdditionalFlavors = selectedSize ? selectedSize.max_flavors - 1 : 0;

  const handleToggleAdditionalFlavors = () => {
    if (hasAdditionalFlavors) {
      setHasAdditionalFlavors(false);
      setAdditionalFlavorIds([]);
    } else {
      setHasAdditionalFlavors(true);
    }
  };

  const addAdditionalFlavor = () => {
    if (!canAddMoreFlavors) return;
    // Adiciona slot vazio
    setAdditionalFlavorIds((current) => [...current, ""]);
  };

  const updateAdditionalFlavor = (index: number, flavorId: string) => {
    setAdditionalFlavorIds((current) => {
      const updated = [...current];
      updated[index] = flavorId;
      return updated;
    });
  };

  const removeAdditionalFlavor = (index: number) => {
    setAdditionalFlavorIds((current) => current.filter((_, i) => i !== index));
  };

  const updateExtraQuantity = (extra: MenuItemAddon, delta: number) => {
    setExtraQuantities((current) => {
      const nextValue = Math.max(
        0,
        Math.min((current[extra.id] ?? 0) + delta, extra.max_quantity || 5)
      );
      return { ...current, [extra.id]: nextValue };
    });
  };

  const handleAdd = () => {
    if (!selectedSize || !predefinedFlavor) return;

    const selection: PizzaBuildSelection = {
      item,
      business_id: businessId,
      size_id: selectedSize.id,
      flavors: flavorSelection,
      edge_id: edgeId,
      dough_id: doughId,
      addon_quantities: extraQuantities,
      quantity: 1,
      price_rule: catalog.config.default_price_rule,
    };

    onAddToCart(selection);
  };

  const canHaveMultipleFlavors = selectedSize ? selectedSize.max_flavors >= 2 : false;

  // Sabores disponíveis para seleção (exclui o original e já selecionados)
  const getAvailableFlavorsForSlot = (slotIndex: number) => {
    const selectedIds = new Set([
      predefinedFlavor?.id,
      ...additionalFlavorIds.filter((_, i) => i !== slotIndex),
    ].filter(Boolean));
    return catalog.flavors.filter(
      (f) => f.is_available && !selectedIds.has(f.id)
    );
  };

  // Calcula fatias por sabor
  const slicesPerFlavor = useMemo(() => {
    if (!selectedSize?.slices || totalFlavorCount === 0) return null;
    return Math.floor(selectedSize.slices / totalFlavorCount);
  }, [selectedSize?.slices, totalFlavorCount]);

  const shouldShowCrust = Boolean(edgeId || textHasPizzaCrustHint(item.name, item.description));
  const visualSize = resolvePizzaRenderSize({
    sizeLabel: selectedSize?.name ?? null,
    diameterCm: selectedSize?.diameter_cm ?? null,
    slices: selectedSize?.slices ?? null,
  });

  if (!predefinedFlavor) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Este item não está configurado como sabor de pizza. Por favor, escolha um item da categoria "Pizzas" ou monte sua pizza.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pizza className="h-5 w-5" />
          Personalize sua {item.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Ingredientes do sabor pré-definido */}
        {predefinedFlavor.ingredients.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium text-muted-foreground">Ingredientes:</p>
            <p className="text-sm">{predefinedFlavor.ingredients.join(", ")}</p>
          </div>
        )}

        {/* Toggle para adicionar mais sabores */}
        {canHaveMultipleFlavors && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Adicionar mais sabores?</h3>
              <span className="text-xs text-muted-foreground">
                Até {selectedSize?.max_flavors} sabores
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleToggleAdditionalFlavors()}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                  !hasAdditionalFlavors
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Pizza className="h-6 w-6" />
                <span className="text-sm font-medium">Só {item.name}</span>
                <span className="text-xs text-muted-foreground">Inteira</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleAdditionalFlavors()}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                  hasAdditionalFlavors
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="relative">
                  <Pizza className="h-6 w-6" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-full w-px bg-current rotate-45" />
                  </div>
                </div>
                <span className="text-sm font-medium">Múltiplos sabores</span>
                <span className="text-xs text-muted-foreground">
                  +{maxAdditionalFlavors} opcional{maxAdditionalFlavors > 1 ? "is" : ""}
                </span>
              </button>
            </div>
          </section>
        )}

        {/* Tamanho */}
        <section className="space-y-3">
          <h3 className="font-medium">Tamanho</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <Button
                key={size.id}
                type="button"
                variant={selectedSize?.id === size.id ? "default" : "outline"}
                onClick={() => {
                  setSizeId(size.id);
                  // Se mudar para tamanho com menos sabores, ajusta os adicionais
                  const maxAdditional = size.max_flavors - 1;
                  if (additionalFlavorIds.length > maxAdditional) {
                    setAdditionalFlavorIds((current) => current.slice(0, maxAdditional));
                  }
                  if (size.max_flavors < 2) {
                    setHasAdditionalFlavors(false);
                    setAdditionalFlavorIds([]);
                  }
                }}
                className="flex-col items-start h-auto py-2 px-3"
              >
                <span className="font-medium">{size.name}</span>
                <span className="text-xs opacity-80">
                  até {size.max_flavors} sabor{size.max_flavors > 1 ? "es" : ""}
                </span>
              </Button>
            ))}
          </div>
          {selectedSize && (
            <p className="text-sm text-muted-foreground">
              {selectedSize.slices && `${selectedSize.slices} fatias`}
              {selectedSize.slices && selectedSize.diameter_cm && " · "}
              {selectedSize.diameter_cm && `${selectedSize.diameter_cm}cm`}
            </p>
          )}
        </section>

        {/* Seleção de sabores adicionais */}
        {hasAdditionalFlavors && canHaveMultipleFlavors && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Sabores adicionais</h3>
              <span className="text-xs text-muted-foreground">
                {additionalFlavors.length}/{maxAdditionalFlavors} adicionado{additionalFlavors.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Lista de seletores de sabores */}
            <div className="space-y-2">
              {additionalFlavorIds.map((flavorId, index) => {
                const selectedFlavor = findFlavorById(catalog.flavors, flavorId);
                const availableForSlot = getAvailableFlavorsForSlot(index);

                return (
                  <div key={index} className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className={`flex-1 justify-between h-auto py-2 px-3 ${
                            !flavorId ? "text-muted-foreground" : ""
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm">
                              {selectedFlavor?.name || `Escolha o sabor ${index + 1}`}
                            </span>
                            {selectedFlavor && (
                              <span className="text-xs text-muted-foreground">
                                R$ {selectedFlavor.base_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-72 max-h-80 overflow-y-auto">
                        {availableForSlot.map((flavor) => (
                          <DropdownMenuItem
                            key={flavor.id}
                            onClick={() => updateAdditionalFlavor(index, flavor.id)}
                            className="flex flex-col items-start py-2"
                          >
                            <span className="font-medium">{flavor.name}</span>
                            {flavor.ingredients.length > 0 && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {flavor.ingredients.join(", ")}
                              </span>
                            )}
                            <span className="text-xs font-medium text-primary">
                              R$ {flavor.base_price.toFixed(2)}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => removeAdditionalFlavor(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Botão adicionar mais */}
            {canAddMoreFlavors && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addAdditionalFlavor}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar sabor {additionalFlavors.length + 1}
              </Button>
            )}
          </section>
        )}

        {/* Visualização SVG da pizza */}
        {predefinedFlavor && selectedSize && (
          <section className="rounded-lg border bg-muted/30 p-4">
            <h4 className="text-sm font-medium mb-4 text-center">
              {hasAdditionalFlavors && additionalFlavors.length > 0
                ? `${selectedSize.name} · ${selectedSize.slices} fatias`
                : `${selectedSize.name} · ${selectedSize.slices} fatias inteiras de ${predefinedFlavor.name}`}
            </h4>

            <PizzaSliceVisualizer
              baseFlavor={predefinedFlavor}
              additionalFlavors={hasAdditionalFlavors ? additionalFlavors : []}
              totalSlices={selectedSize.slices}
              size={visualSize}
              showCrust={shouldShowCrust}
            />

            {hasAdditionalFlavors && additionalFlavors.length > 0 && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Cada sabor tem {slicesPerFlavor} fatias ({Math.round((1 / totalFlavorCount) * 100)}% da pizza)
              </p>
            )}
          </section>
        )}

        {/* Borda */}
        <section className="space-y-3">
          <h3 className="font-medium">Borda</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={!edgeId ? "default" : "outline"}
              onClick={() => setEdgeId(null)}
              size="sm"
            >
              Sem borda
            </Button>
            {catalog.edges
              .filter((e) => e.is_available)
              .map((e) => (
                <Button
                  key={e.id}
                  type="button"
                  variant={edgeId === e.id ? "default" : "outline"}
                  onClick={() => setEdgeId(e.id)}
                  size="sm"
                >
                  {e.name} +R$ {e.price.toFixed(2)}
                </Button>
              ))}
          </div>
        </section>

        {/* Massa */}
        <section className="space-y-3">
          <h3 className="font-medium">Massa</h3>
          <div className="flex flex-wrap gap-2">
            {catalog.doughs
              .filter((d) => d.is_available)
              .map((d) => (
                <Button
                  key={d.id}
                  type="button"
                  variant={doughId === d.id ? "default" : "outline"}
                  onClick={() => setDoughId(d.id)}
                  size="sm"
                >
                  {d.name}
                  {d.price_adjustment > 0 && ` +R$ ${d.price_adjustment.toFixed(2)}`}
                </Button>
              ))}
          </div>
        </section>

        {/* Extras / Adicionais */}
        {availableExtras.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-medium">Adicionar Extras</h3>
            <div className="space-y-2">
              {availableExtras.map((extra) => {
                const quantity = extraQuantities[extra.id] ?? 0;
                return (
                  <div
                    key={extra.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{extra.name}</p>
                      <p className="text-xs text-muted-foreground">
                        + R$ {extra.price.toFixed(2)} cada
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateExtraQuantity(extra, -1)}
                        disabled={quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateExtraQuantity(extra, 1)}
                        disabled={quantity >= (extra.max_quantity || 5)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Erros de validação */}
        {validation.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {validation.errors.join(" ")}
          </div>
        )}

        {/* Breakdown de preço */}
        {price && (
          <section className="rounded-lg border bg-muted/30 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tamanho</span>
                <span>R$ {price.size_price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sabores</span>
                <span>R$ {price.flavor_price.toFixed(2)}</span>
              </div>
              {price.dough_price > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Massa</span>
                  <span>+ R$ {price.dough_price.toFixed(2)}</span>
                </div>
              )}
              {price.edge_price > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Borda</span>
                  <span>+ R$ {price.edge_price.toFixed(2)}</span>
                </div>
              )}
              {price.addons_total > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Extras</span>
                  <span>+ R$ {price.addons_total.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">R$ {price.line_total.toFixed(2)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Botão Adicionar */}
        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!validation.is_valid}
          onClick={handleAdd}
        >
          Adicionar ao carrinho
        </Button>
      </CardContent>
    </Card>
  );
}
