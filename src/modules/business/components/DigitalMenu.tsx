import React from "react";

import { useState, useMemo } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Tag,
  Star,
  ShoppingBag,
  Leaf,
  Wheat,
  Beef,
  Coffee,
  Plus,
  Minus,
  ShoppingCart,
  Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";
import { toast } from "sonner";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  business_id: string;
  active: boolean;
  category: string;
  destaque: boolean;
  promocao: boolean;
}

interface DigitalMenuProps {
  products: Product[];
  businessName: string;
  isOwner?: boolean;
  onAddToCart?: (product: Product, quantity: number) => void;
}

function getCategoryIcon(category: string): LucideIcon {
  switch (category) {
    case "lanches":
      return Beef;
    case "bebidas":
      return Coffee;
    case "doces":
      return Tag;
    case "salgados":
      return Package;
    case "vegetariano":
      return Leaf;
    case "sem-gluten":
      return Wheat;
    case "destaques":
      return Star;
    case "promocoes":
      return Tag;
    case "geral":
      return Package;
    default:
      return Package;
  }
}

const FILTER_OPTIONS = [
  { id: "vegetariano", label: "Vegetariano", icon: Leaf },
  { id: "sem-gluten", label: "Sem Glúten", icon: Wheat },
  { id: "promocoes", label: "Promoções", icon: Tag },
  { id: "destaques", label: "Destaques", icon: Star },
];

export default function DigitalMenu({
  products,
  businessName,
  isOwner = false,
  onAddToCart,
}: DigitalMenuProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const showPromotions = isLaunchSurfaceEnabled("coupons");
  const filterOptions = useMemo(
    () => (showPromotions ? FILTER_OPTIONS : FILTER_OPTIONS.filter((filter) => filter.id !== "promocoes")),
    [showPromotions],
  );

  // Filtra products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Filtro por category
    if (activeFilters.length > 0) {
      filtered = filtered.filter(
        (p) =>
          activeFilters.includes(p.category) ||
          (showPromotions && activeFilters.includes("promocoes") && p.promocao) ||
          (activeFilters.includes("destaques") && p.destaque),
      );
    }

    return filtered;
  }, [products, searchTerm, activeFilters, showPromotions]);

  // Agrupa products por category
  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, Product[]>();

    filteredProducts.forEach((product) => {
      const category = !showPromotions && product.category === "promocoes"
        ? "geral"
        : product.category;
      const existing = grouped.get(category);
      if (existing) {
        existing.push(product);
        return;
      }
      grouped.set(category, [product]);
    });

    return grouped;
  }, [filteredProducts, showPromotions]);

  const getQuantity = (productId: string): number => quantities.get(productId) ?? 0;

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId],
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const increaseQuantity = (productId: string) => {
    setQuantities((prev) => {
      const next = new Map(prev);
      const currentQuantity = next.get(productId) ?? 0;
      next.set(productId, currentQuantity + 1);
      return next;
    });
  };

  const decreaseQuantity = (productId: string) => {
    setQuantities((prev) => {
      const next = new Map(prev);
      const currentQuantity = next.get(productId) ?? 0;
      const updatedQuantity = Math.max(0, currentQuantity - 1);
      if (updatedQuantity === 0) {
        next.delete(productId);
        return next;
      }
      next.set(productId, updatedQuantity);
      return next;
    });
  };

  const handleAddToCart = (product: Product) => {
    const quantity = Math.max(1, getQuantity(product.id));
    if (onAddToCart) {
      onAddToCart(product, quantity);
    }
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
  };

  const shareProduct = (product: Product) => {
    const priceText =
      product.price && typeof product.price === "number"
        ? formatBrl(product.price)
        : "--";
    const text = `Olha esta opção do cardápio:\n\n*${product.name}*\n${product.description || ""}\n\nPreço: ${priceText}\n\nConfira no cardápio de ${businessName}`;
    navigator.clipboard.writeText(text);
    toast.success("Produto copiado para compartilhar");
  };

  if (products.length === 0) {
    return (
      <Card className="p-8 border-2 border-dashed">
        <div className="text-center text-muted-foreground">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h3 className="font-semibold text-lg mb-2">Cardápio Digital</h3>
          <p className="text-sm mb-4">Nenhum product disponível no momento</p>
          {isOwner && (
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Produtos
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">Cardápio Digital</h2>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "item" : "itens"} disponíveis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar no cardápio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filtros
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilters.includes(filter.id);
            return (
              <Button
                key={filter.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(filter.id)}
                className={cn("gap-2", isActive && "shadow-md")}
              >
                <Icon className="h-3 w-3" />
                {filter.label}
              </Button>
            );
          })}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilters([])}
              className="text-xs"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Lista de categorys com products */}
      <div className="space-y-4">
        {Array.from(productsByCategory.entries()).map(
          ([category, categoryProducts]) => {
            const Icon = getCategoryIcon(category);
            const isExpanded = expandedCategories.includes(category);

            return (
              <Card key={category} className="border-2 overflow-hidden">
                {/* Cabeçalho da category */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold capitalize">{category}</h3>
                      <p className="text-xs text-muted-foreground">
                        {categoryProducts.length}{" "}
                        {categoryProducts.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {/* Produtos da category (se expandida) */}
                {isExpanded && (
                  <div className="border-t p-4 space-y-4">
                    {categoryProducts.map((product) => {
                      const quantity = getQuantity(product.id);
                      const Icon = getCategoryIcon(product.category);

                      return (
                        <div
                          key={product.id}
                          className="flex gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                        >
                          {/* Imagem do product */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Icon className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Informações do product */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm line-clamp-1">
                                  {product.name}
                                </h4>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {product.destaque && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Star className="h-3 w-3 mr-1" />
                                    Destaque
                                  </Badge>
                                )}
                                {showPromotions && product.promocao && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    Promoção
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">
                                  {product.price &&
                                  typeof product.price === "number"
                                    ? formatBrl(product.price)
                                    : "--"}
                                </span>

                                {/* Contador de quantidade */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => decreaseQuantity(product.id)}
                                    disabled={quantity === 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {quantity || 0}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => increaseQuantity(product.id)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => shareProduct(product)}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => handleAddToCart(product)}
                                  disabled={quantity === 0}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                  Adicionar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          },
        )}
      </div>

      {/* Resumo do carrinho (se houver itens) */}
      {Array.from(quantities.values()).some((qty) => qty > 0) && (
        <Card className="sticky bottom-4 border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold">Seu Pedido</h4>
                <p className="text-xs text-muted-foreground">
                  {Array.from(quantities.values()).filter((qty) => qty > 0).length}{" "}
                  itens
                </p>
              </div>
              <Button size="sm" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Finalizar Pedido
              </Button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Array.from(quantities.entries())
                .filter(([_, qty]) => qty > 0)
                .map(([productId, qty]) => {
                  const product = products.find((p) => p.id === productId);
                  if (!product) {
                    return null;
                  }

                  return (
                    <div
                      key={productId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex-1 truncate">
                        {qty}x {product.name}
                      </span>
                      <span className="font-medium">
                        {formatBrl((product.price || 0) * qty)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
