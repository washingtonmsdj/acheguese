import React from "react";
import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Plus, Award, Clock, Edit, X } from "lucide-react";
import type { ServicosTabProps } from "@/modules/business/types/components";
import { formatBrl } from "@/shared/utils/currency";

export function ServicosTab({
  business,
  services,
  isOwner,
  onUpdate,
}: ServicosTabProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [sort, setSort] = useState<
    "recentes" | "name_az" | "name_za" | "price_asc" | "price_desc"
  >("recentes");

  const categories = Array.from(
    new Set(services.map((s) => s.category || "geral")),
  ).sort();

  const filteredServices = services.filter((s) => {
    if (categoryFilter !== "todas" && s.category !== categoryFilter)
      return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchLower) ||
      (s.description || "").toLowerCase().includes(searchLower)
    );
  });

  const sortedServices = (() => {
    const base = [...filteredServices];
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
            <h2 className="text-lg font-bold">Serviços Oferecidos</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie os serviços da sua business
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Serviço
          </Button>
        </div>
      )}

      {/* Filtros */}
      {services.length > 0 && (
        <Card className="p-4 border-2 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
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
              {sortedServices.length}{" "}
              {sortedServices.length === 1
                ? "serviço encontrado"
                : "serviços encontrados"}
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

      {/* Lista de Serviços */}
      {services.length === 0 ? (
        <Card className="p-12 border-2 border-dashed">
          <div className="text-center text-muted-foreground">
            <Award className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-base mb-2">
              Nenhum serviço cadastrado
            </h3>
            <p className="text-sm mb-4">
              Comece adicionando serviços ao seu catálogo
            </p>
            {isOwner && (
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Serviço
              </Button>
            )}
          </div>
        </Card>
      ) : sortedServices.length === 0 ? (
        <Card className="p-12 border-2">
          <div className="text-center text-muted-foreground">
            <Award className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-semibold text-base mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-sm">
              Tente ajustar os filtros ou search por outro termo
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedServices.map((service) => (
            <Card
              key={service.id}
              className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    {service.featured && (
                      <Badge className="bg-yellow-500 text-white">
                        Destaque
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {service.category}
                  </p>
                </div>

                {/* Botões de ação */}
                {isOwner && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {service.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  {service.price !== null ? (
                    <p className="text-xl font-bold text-primary">
                      {typeof service.price === "number"
                        ? formatBrl(service.price)
                        : "--"}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Sob consulta
                    </p>
                  )}
                </div>
                {service.duration && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {service.duration}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
