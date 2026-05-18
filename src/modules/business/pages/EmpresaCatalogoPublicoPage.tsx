import React from "react";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Copy,
  Package,
  Search,
  Loader2,
  Star,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import {
  useInfiniteScroll,
  usePaginatedState,
} from "@/shared/hooks/useInfiniteScroll";

import CatalogHeader from "@/shared/components/catalogo/CatalogHeader";
import CatalogBusinessCard from "@/shared/components/catalogo/CatalogBusinessCard";
import CatalogProductCard from "@/shared/components/catalogo/CatalogProductCard";
import { useBusinessNavigation } from "@/modules/business/hooks/useBusinessNavigation";
import { useBusinessUrls } from "@/modules/business/hooks/useBusinessUrls";
import { ALERT_STATUS } from "@/shared/types/constants";
import { BusinessService } from "@/core/business";
import { logger } from "@/shared/utils/logger";
type Biz = {
  id: string;
  name: string;
  category: string;
  logo: string | null;
  capa: string | null;
  neighborhood: string | null;
  description: string | null;
  slug?: string;
  nicho?: string;
  city?: string;
  is_premium?: boolean;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string;
  active: boolean;
  featured: boolean;
  promotion: boolean;
  destaque: boolean;
  promocao: boolean;
};

const PAGE_SIZE = 20;

export default function EmpresaCatalogoPublicoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { navigateToBusiness } = useBusinessNavigation();
  const businessUrls = useBusinessUrls();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = (searchParams.get("category") || "todas").trim();
  const [search, setSearch] = useState("");

  const { data: biz, isLoading: bizLoading } = useQuery({
    queryKey: ["business", "catalog", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const data = await BusinessService.getBusinessById(id);
        if (!data || (data.status && data.status !== ALERT_STATUS.ACTIVE)) return null;

        return {
          id: data.id,
          name: data.name,
          category: data.category,
          logo: data.logo_url || null,
          capa: data.banner_url || null,
          neighborhood: data.location?.name || null,
          description: data.description || null,
          slug: data.slug,
          nicho: data.category,
          city: data.location?.name || data.geographic_path?.split('/').at(-1),
          is_premium: data.is_premium,
        } as Biz;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  // Paginated products
  const {
    items: products,
    page,
    hasMore,
    loading,
    initialLoading,
    setLoading,
    setInitialLoading,
    appendItems,
    nextPage,
    reset,
  } = usePaginatedState<Product>();

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        if (!id) {
          appendItems([], pageNum === 0);
          return;
        }

        const data = await BusinessService.getProductsPage(id, pageNum, PAGE_SIZE);
        const mappedProducts: Product[] = data.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description || null,
          price: product.price || null,
          image_url: product.image_url || null,
          category: product.category || "geral",
          active: product.active,
          featured: product.featured,
          promotion: product.promotion,
          destaque: product.featured,
          promocao: product.promotion,
        }));

        appendItems(mappedProducts, pageNum === 0);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [id, setLoading, setInitialLoading, appendItems],
  );

  useEffect(() => {
    if (id) fetchPage(0);
  }, [fetchPage, id]);
  useEffect(() => {
    if (page > 0) fetchPage(page);
  }, [fetchPage, page]);

  const onLoadMore = useCallback(() => nextPage(), [nextPage]);
  const { sentinelRef } = useInfiniteScroll({ hasMore, loading, onLoadMore });

  // Categories from loaded products
  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const p of products) unique.add((p.category || "geral").trim());
    return ["todas", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const selectedCategory = categories.includes(categoryParam)
    ? categoryParam
    : "todas";

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          selectedCategory === "todas" ||
          (p.category || "geral").trim() === selectedCategory,
      )
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q),
      );
  }, [products, search, selectedCategory]);

  const setCategory = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === "todas") next.delete("category");
    else next.set("category", cat);
    setSearchParams(next, { replace: true });
  };

  const share = async () => {
    const url = window.location.href;
    if ('share' in navigator && typeof (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share === 'function') {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ title: biz?.name || "Catálogo", url });
        return;
      } catch (err) {
        logger.error("Share failed", err as Error, {
          page: "EmpresaCatalogoPublicoPage",
          action: "share",
          businessId: biz?.id,
        });
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  if (bizLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 px-4 py-3 border-b bg-card/80 backdrop-blur">
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-9" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!biz) {
    return (
      <div className="min-h-screen bg-background">
        <CatalogHeader
          onBack={() => navigate(businessUrls.list)}
          title="Catálogo"
        />
        <div className="px-4 py-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-lg font-bold font-display">
            Catálogo indisponível
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Essa empresa não está disponível para visualização pública.
          </p>
          <Button className="mt-5" onClick={() => navigate(businessUrls.list)}>
            Ver empresas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader
        onBack={() =>
          navigateToBusiness({
            id: biz.id,
            slug: biz.slug,
            is_premium: biz.is_premium,
          })
        }
        title="Catálogo"
        onShare={share}
      />
      
      <div className="px-4 py-4">
        <CatalogBusinessCard biz={biz} />

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no catálogo..."
            className="pl-9 h-9"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border",
              )}
            >
              {cat === "todas" ? "Todas" : cat}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {initialLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum item encontrado
              {selectedCategory !== "todas" ? ` em "${selectedCategory}"` : ""}.
            </div>
          ) : (
            filteredProducts.map((p) => (
              <CatalogProductCard key={p.id} product={p} />
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
    </div>
  );
}
