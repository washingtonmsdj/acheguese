// @ts-nocheck
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
import { useProfile } from "@/core/profiles/hooks/useProfile";
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
import { ptBR } from "date-fns/locale";
import {
  useInfiniteScroll,
  usePaginatedState,
} from "@/shared/hooks/useInfiniteScroll";
import { lostFoundService } from "@/core/lostfound/services/LostFoundService";
import { ViewOnMapButton } from "@/core/maps/components/ViewOnMapButton";

const CATEGORIAS = [
  { id: "todos", label: "Todos", icon: "🔍" },
  { id: "animal", label: "Animal", icon: "🐾" },
  { id: "celular", label: "Celular", icon: "📱" },
  { id: "documentos", label: "Documentos", icon: "📄" },
  { id: "chaves", label: "Chaves", icon: "🔑" },
  { id: "carteira", label: "Carteira", icon: "👛" },
  { id: "objetos", label: "Objetos", icon: "📦" },
  { id: "outro", label: "Outro", icon: "❓" },
];

interface LostFoundItem {
  id: string;
  tipo: string;
  category: string;
  titulo: string;
  description: string;
  photo_url: string;
  neighborhood: string;
  date_ocorrido: string;
  resolvido: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

export default function AchadosPerdidosPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterCategoria, setFilterCategoria] = useState("todos");

  // ✅ Verificação de autenticação
  const { profile } = useProfile();
  const { hasHome, loading: territoryLoading } = useUserTerritory();

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
    async (pageNum: number) => {
      setLoading(true);
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // ✅ LOTE 9A - Usar lostFoundService.getPostsPage (SSOT para lost_found_posts)
      const data = await lostFoundService.getPostsPage(
        { tipo: filterTipo, categoria: filterCategoria },
        from,
        to,
      );

      if (data) {
        appendItems(
          data.map((p) => ({
            id: p.id,
            tipo: p.tipo,
            category: p.category,
            titulo: p.titulo,
            description: p.description || "",
            photo_url: p.photo_url || "",
            neighborhood: p.neighborhood || "",
            date_ocorrido: p.data_ocorrido || "",
            resolvido: p.resolvido || false,
            created_at: p.created_at || "",
            latitude: p.latitude,
            longitude: p.longitude,
          })),
          pageNum === 0,
        );
      }
      setLoading(false);
      setInitialLoading(false);
    },
    [
      filterTipo,
      filterCategoria,
      PAGE_SIZE,
      setLoading,
      setInitialLoading,
      appendItems,
    ],
  );

  useEffect(() => {
    reset();
    fetchPage(0);
  }, [filterTipo, filterCategoria]);
  useEffect(() => {
    if (page > 0) fetchPage(page);
  }, [page]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore: nextPage,
  });

  const searchLower = search.toLowerCase();
  const filtered = items.filter(
    (p) =>
      !search ||
      p.titulo.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.neighborhood.toLowerCase().includes(searchLower),
  );

  const getCatIcon = (cat: string) =>
    CATEGORIAS.find((c) => c.id === cat)?.icon || "❓";

  // Bloquear se não estiver logado
  if (!profile) {
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
            <Button onClick={() => window.location.href = appUrls.auth.login} className="bg-teal-500 hover:bg-teal-400">
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
              Complete seu cadastro
            </h2>
            <p className="text-gray-400 mb-6">
              Para acessar os achados e perdidos, você precisa cadastrar seu bairro no perfil.
            </p>
            <Button onClick={() => window.location.href = appUrls.profile.central} className="bg-teal-500 hover:bg-teal-400">
              Completar Perfil
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
          { id: "perdido", label: "🔴 Perdido", color: "text-destructive" },
          { id: "encontrado", label: "🟢 Encontrado", color: "text-success" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTipo(t.id)}
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
        {CATEGORIAS.map((cat) => (
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
            {cat.icon} {cat.label}
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
            <p className="text-4xl mb-3">🔎</p>
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
              onClick={() => navigate(`/achados-perdidos/${item.id}`)}
              className={cn(
                "flex gap-3 bg-card rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow",
                item.resolvido && "opacity-60",
              )}
            >
              {item.photo_url ? (
                <img
                  src={item.photo_url}
                  alt={item.titulo}
                  className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
                  {getCatIcon(item.category)}
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
                  {item.description}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {item.neighborhood || "Não informado"}
                  </span>
                  {item.date_ocorrido && (
                    <span>
                      {format(
                        new Date(item.date_ocorrido + "T12:00:00"),
                        "dd/MM/yyyy",
                      )}
                    </span>
                  )}
                </div>
                {item.latitude && item.longitude && (
                  <div className="mt-2">
                    <ViewOnMapButton
                      latitude={item.latitude}
                      longitude={item.longitude}
                      itemId={item.id}
                      itemType="achado_perdido"
                      itemName={item.titulo}
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px]"
                      onClick={() => {}}
                    />
                  </div>
                )}
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
