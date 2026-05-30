import React from "react";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MapPin,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Users,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { useSessionContext } from "@/core/session";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import {
  useInfiniteScroll,
  usePaginatedState,
} from "@/shared/hooks/useInfiniteScroll";
import { lostFoundRuntimeService as lostFoundService } from "@/core/community/services/LostFoundRuntimeService";
import {
  getLostFoundCategoryLabel,
  LOST_FOUND_FILTER_OPTIONS,
} from "@/shared/validation/schemas/lostfound.schema";
import { getRecordValue } from "@/shared/utils/recordLookup";
type LostFoundTipoFilter = "todos" | "perdido" | "achado";

interface LostFoundItem {
  id: string;
  tipo: string;
  categoria: string;
  titulo: string;
  descricao: string;
  foto_url: string;
  bairro_publico: string;
  location_id: string | null;
  data_ocorrido: string;
  resolvido: boolean;
  created_at: string;
}

export default function AchadosPerdidosPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<LostFoundTipoFilter>("todos");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [locationLabels, setLocationLabels] = useState<Record<string, string>>({});

  // ✅ Verificação de autenticação
  const { activeProfile } = useSessionContext();
  const { hasHome, homeDistrict, loading: territoryLoading } = useUserTerritory();
  const territoryLocationId = homeDistrict?.id ?? null;

  const {
    items,
    page,
    hasMore,
    loading,
    initialLoading,
    setLoading,
    setInitialLoading,
    appendItems,
    nextPage,
    reset,
    PAGE_SIZE,
  } = usePaginatedState<LostFoundItem>();

  const fetchPage = useCallback(
    async (
      pageNum: number,
      tipo: "perdido" | "achado" | "todos",
      categoria: string,
      locationId: string | null,
    ) => {
      setLoading(true);
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const territoryFilter = locationId
        ? { scope: "location" as const, location_id: locationId }
        : { scope: "none" as const };

      // ✅ LOTE 9A - Usar lostFoundService.getPostsPage (SSOT para lost_found_posts)
      const data = await lostFoundService.getPostsPage(
        { tipo, categoria, territoryFilter },
        from,
        to,
      );

      if (data) {
        appendItems(
          data.map((p) => ({
            id: p.id,
            tipo: p.tipo,
            categoria: p.categoria,
            titulo: p.titulo,
            descricao: p.descricao || "",
            foto_url: p.imagens?.[0] || "",
            bairro_publico: "",
            location_id: p.location_id ?? null,
            data_ocorrido: p.data_perdido || "",
            resolvido: p.resolvido || false,
            created_at: p.created_at || "",
          })),
          pageNum === 0,
        );
      }
      setLoading(false);
      setInitialLoading(false);
    },
    [
      PAGE_SIZE,
      setLoading,
      setInitialLoading,
      appendItems,
    ],
  );

  useEffect(() => {
    reset();
    void fetchPage(0, filterTipo, filterCategoria, territoryLocationId);
  }, [filterTipo, filterCategoria, territoryLocationId, reset, fetchPage]);
  useEffect(() => {
    if (page > 0) {
      void fetchPage(page, filterTipo, filterCategoria, territoryLocationId);
    }
  }, [page, filterTipo, filterCategoria, territoryLocationId, fetchPage]);

  useEffect(() => {
    const missingLocationIds = Array.from(
      new Set(
        items
          .map((item) => item.location_id)
          .filter((id): id is string => Boolean(id) && !getRecordValue(locationLabels, id)),
      ),
    );

    if (missingLocationIds.length === 0) return;

    let cancelled = false;
    const repo = createLocationRepository();

    Promise.all(
      missingLocationIds.map(async (id) => {
        const location = await repo.findById(id);
        return [id, location?.name ?? "Território não informado"] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setLocationLabels((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [items, locationLabels]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: nextPage,
  });

  const resolveItemTerritoryLabel = (item: LostFoundItem) => {
    if (item.location_id) {
      return getRecordValue(locationLabels, item.location_id) ?? "Carregando território...";
    }

    return item.bairro_publico || "Território não informado";
  };

  const searchLower = search.toLowerCase();
  const filtered = items.filter(
    (p) =>
      !search ||
      p.titulo.toLowerCase().includes(searchLower) ||
      p.descricao.toLowerCase().includes(searchLower) ||
      resolveItemTerritoryLabel(p).toLowerCase().includes(searchLower),
  );

  // Bloquear se não estiver logado
  if (!activeProfile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Faça login para acessar achados e perdidos
            </h2>
            <p className="text-gray-400 mb-6">
              Os achados e perdidos são exclusivos para moradores cadastrados do bairro.
            </p>
            <Button onClick={() => navigate(appUrls.auth.login)} className="bg-teal-500 hover:bg-teal-400">
              Fazer Login
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aguardar resolução do território
  if (territoryLoading) {
    return (
      <div className="min-h-screen bg-[#12181B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Bloquear se não tiver bairro cadastrado
  if (!hasHome) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Escolha seu bairro
            </h2>
            <p className="text-gray-400 mb-6">
              Para acessar achados e perdidos da comunidade, escolha seu bairro principal.
            </p>
            <Button onClick={() => navigate(appUrls.community.feed)} className="bg-teal-500 hover:bg-teal-400">
              Escolher meu bairro
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold font-display">
              Achados e Perdidos
            </h1>
            <p className="text-sm text-muted-foreground">
              Ajude a comunidade a encontrar o que perdeu
            </p>
          </div>
          <Button size="sm" onClick={() => navigate(appUrls.community.newLostAndFound)}> {/* ✅ SSOT */}
            <Plus className="h-4 w-4 mr-1" /> Publicar
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Tipo filter */}
      <div className="flex gap-2 px-4 py-2">
        {[
          { id: "todos", label: "Todos", color: "" },
          { id: "perdido", label: "Perdidos", color: "text-destructive" },
          { id: "achado" as const, label: "Encontrados", color: "text-success" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTipo(t.id as LostFoundTipoFilter)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
              filterTipo === t.id
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Categoria filter */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
        {LOST_FOUND_FILTER_OPTIONS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategoria(cat.id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-all flex-shrink-0",
              filterCategoria === cat.id
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 px-4 py-2">
        {initialLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground mb-3">
              Nenhum item publicado ainda.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(appUrls.community.newLostAndFound)} // ✅ SSOT
            >
              Publicar item
            </Button>
          </div>
        ) : (
          filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 5) * 0.04 }}
              onClick={() => navigate(appUrls.community.lostAndFoundDetail(item.id))}
              className={cn(
                "flex gap-3 bg-card rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow",
                item.resolvido && "opacity-60",
              )}
            >
              {item.foto_url ? (
                <img
                  src={item.foto_url}
                  alt={item.titulo}
                  className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 px-2 text-center">
                  <span className="text-[11px] font-semibold leading-tight text-muted-foreground">
                    {getLostFoundCategoryLabel(item.categoria)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge
                    variant={
                      item.tipo === "perdido" ? "destructive" : "default"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {item.tipo === "perdido" ? "Perdido" : "Encontrado"}
                  </Badge>
                  {item.resolvido && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 gap-0.5"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5" /> Resolvido
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-bold truncate">{item.titulo}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {item.descricao}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {resolveItemTerritoryLabel(item)}
                  </span>
                  {item.data_ocorrido && (
                    <span>
                      {format(
                        new Date(item.data_ocorrido + "T12:00:00"),
                        "dd/MM/yyyy",
                      )}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {loading && !initialLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}
