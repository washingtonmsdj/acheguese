import React from "react";
import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Plus, ShoppingBag, Package, Edit, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { ProdutosTabProps } from "@/modules/business/types/components";
import { formatBrl } from "@/shared/utils/currency";

export function ProdutosTab({
  business,
  products,
  isOwner,
  onUpdate,
}: ProdutosTabProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [sort, setSort] = useState<
    "recentes" | "name_az" | "name_za" | "price_asc" | "price_desc"
  >("recentes");

  const categories = Array.from(
    new Set(
      products
        .map((p) => (p.category ?? "geral").trim() || "geral")
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "todas") {
      const cat = (p.category ?? "geral").trim() || "geral";
      if (cat !== categoryFilter) return false;
    }
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      (p.description ?? "").toLowerCase().includes(searchLower)
    );
  });

  const sortedProducts = (() => {
    const base = [...filteredProducts];
    switch (sort) {
      case "name_az":
        return base.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      case "name_za":
        return base.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
      case "price_asc":
        return base.sort((a, b) => {
          if (a.price == null && b.price == null) return 0;
          if (a.price == null) return 1;
          if (b.price == null) return -1;
          return a.price - b.price;
        });
      case "price_desc":
        return base.sort((a, b) => {
          if (a.price == null && b.price == null) return 0;
          if (a.price == null) return 1;
          if (b.price == null) return -1;
          return b.price - a.price;
        });
      default:
        return base;
    }
  })();

  return (
    <div>
      {/* Header */}
      {isOwner && (
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold">Catálogo de Produtos</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie os products da sua business
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
      )}

      {/* Filtros */}
      {products.length > 0 && (
        <Card className="p-4 border-2 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="relative">
              <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorys" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorys</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as typeof sort)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="name_az">Nome (A-Z)</SelectItem>
                <SelectItem value="name_za">Nome (Z-A)</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {sortedProducts.length}{" "}
              {sortedProducts.length === 1
                ? "product encontrado"
                : "products encontrados"}
            </span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-primary hover:underline"
              >
                Limpar busca
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Lista de Produtos */}
      {products.length === 0 ? (
        <Card className="p-12 border-2 border-dashed">
          <div className="text-center text-muted-foreground">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-base mb-2">
              Nenhum product cadastrado
            </h3>
            <p className="text-sm mb-4">
              Comece adicionando products ao seu catálogo
            </p>
            {isOwner && (
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Produto
              </Button>
            )}
          </div>
        </Card>
      ) : sortedProducts.length === 0 ? (
        <Card className="p-12 border-2">
          <div className="text-center text-muted-foreground">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-base mb-2">
              Nenhum product encontrado
            </h3>
            <p className="text-sm">
              Tente ajustar os filtros ou search por outro termo
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map((product) => (
            <Card
              key={product.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden border-2 hover:border-primary/30"
            >
              {/* Imagem */}
              <div className="relative aspect-square bg-secondary overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {product.featured && (
                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-yellow-500 text-white">
                      Destaque
                    </span>
                  )}
                  {product.promotion && (
                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-red-500 text-white">
                      Promoção
                    </span>
                  )}
                </div>

                {/* Botões de ação */}
                {isOwner && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 shadow-lg"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0 shadow-lg"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {product.category}
                  </p>
                </div>

                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </p>
                )}

                {product.price !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">
                      {typeof product.price === "number"
                        ? formatBrl(product.price)
                        : "--"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Sob consulta
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
