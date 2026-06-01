/**
 * Página de perfil do vendedor — exibe info, anúncios filtráveis e avaliações
 * ✅ SSOT: usa categories de constants/categories, messaging types de core/messaging
 */

import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Star, Clock, MessageCircle, ShieldCheck,
  Package, Zap,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { useVendedorPerfil } from "../hooks/useVendedorPerfil";
import type { VendedorPerfil } from "../hooks/useVendedorPerfil";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { VendedorAdFilters, applyAdFilters, type AdFilters } from "../components/profile/VendedorAdFilters";
import { VendedorContactBar } from "../components/profile/VendedorContactBar";
import { classifiedUrlService } from "@/core/classifieds/services";

export default function VendedorPerfilPage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const navigate = useNavigate();
  const { vendedor, isLoading } = useVendedorPerfil(sellerId);

  const [filters, setFilters] = useState<AdFilters>({
    category: "todos",
    condition: "todos",
    priceRange: null,
    sortBy: 'recent',
  });

  const filteredAds = useMemo<VendedorPerfil["all_ads"]>(() => {
    if (!vendedor) return [];
    return applyAdFilters(vendedor.all_ads, filters);
  }, [vendedor, filters]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!vendedor) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Vendedor não encontrado</h2>
        <p className="text-muted-foreground mb-6">Este perfil não existe ou foi removido.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const memberSince = new Date(vendedor.member_since).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0 overflow-hidden ring-3 ring-primary/20">
            {vendedor.avatar_url ? (
              <img src={vendedor.avatar_url} alt={vendedor.name} className="w-full h-full object-cover" />
            ) : (
              vendedor.name?.[0]?.toUpperCase() || "?"
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{vendedor.name}</h1>
              {vendedor.response_rate >= 90 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Zap className="h-3 w-3" /> Resposta rápida
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              {vendedor.neighborhood && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {vendedor.neighborhood}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Membro desde {memberSince}
              </span>
            </div>

            {vendedor.bio && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{vendedor.bio}</p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatCard icon={<Package className="h-4 w-4" />} label="Anúncios" value={vendedor.active_ads_count.toString()} />
          <StatCard
            icon={<Star className="h-4 w-4 fill-current text-yellow-500" />}
            label="Avaliação"
            value={vendedor.avg_rating.toFixed(1)}
            sub={`(${vendedor.total_reviews})`}
          />
          <StatCard icon={<MessageCircle className="h-4 w-4" />} label="Taxa de resposta" value={`${vendedor.response_rate}%`} />
          <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Vendas" value={`${vendedor.total_reviews}+`} />
        </div>

        {/* Contact bar */}
        <VendedorContactBar
          vendedorId={vendedor.id}
          vendedorName={vendedor.name}
          vendedorPhone={vendedor.phone}
          vendedorWhatsapp={vendedor.whatsapp}
          initialClassifiedId={vendedor.all_ads[0]?.id ?? null}
        />
      </motion.div>

      {/* Tabs: Anúncios / Avaliações */}
      <Tabs defaultValue="anuncios" className="w-full">
        <TabsList className="w-full bg-secondary/50 rounded-xl p-1">
          <TabsTrigger value="anuncios" className="flex-1 rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Anúncios ({filteredAds.length})
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="flex-1 rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Avaliações ({vendedor.reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anuncios" className="mt-4 space-y-4">
          {/* Filters */}
          <VendedorAdFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalAds={vendedor.all_ads.length}
            filteredCount={filteredAds.length}
          />

          {/* Ads grid */}
          {filteredAds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum anúncio encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAds.map((ad, i) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    const publicUrl = classifiedUrlService.buildPublicUrl(ad);
                    if (publicUrl) navigate(publicUrl);
                  }}
                  className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[4/3] bg-secondary">
                    {ad.photos?.[0] ? (
                      <img src={ad.photos[0]} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="h-8 w-8 opacity-40" aria-hidden="true" />
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 text-[10px] bg-background/80 backdrop-blur-sm text-foreground border-0">
                      {ad.condition}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {ad.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-base font-bold text-primary">
                        R$ {ad.price.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{ad.category}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="avaliacoes" className="mt-4 space-y-3">
          {/* Rating summary */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{vendedor.avg_rating.toFixed(1)}</div>
              <div className="flex items-center gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-3.5 w-3.5",
                      s <= Math.round(vendedor.avg_rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{vendedor.total_reviews} avaliações</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = vendedor.reviews.filter((r) => r.rating === star).length;
                const pct = vendedor.reviews.length > 0 ? (count / vendedor.reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground">{star}</span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-5 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list */}
          {vendedor.reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                  {review.reviewer_avatar ? (
                    <img src={review.reviewer_avatar} alt={review.reviewer_name} className="w-full h-full object-cover" />
                  ) : (
                    review.reviewer_name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{review.reviewer_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "h-3 w-3",
                          s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-secondary/50 rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-primary mb-1">{icon}</div>
      <div className="text-lg font-bold text-foreground">
        {value} {sub && <span className="text-xs text-muted-foreground font-normal">{sub}</span>}
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
