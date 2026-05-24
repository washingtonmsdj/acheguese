 
import React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  BadgeCheck,
  Heart,
  Share2,
  Pencil,
  Sparkles,
  Store,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import ShareBusinessDialog from "@/modules/business/components/ShareBusinessDialog.tsx";
import EmpresaEditSheet from "@/modules/business/components/EmpresaEditSheet.tsx";
import { cn } from "@/shared/utils/cn";
import { useBusinessFavorite } from "@/modules/business/hooks/useBusinessFavorite";
import type { BizData } from "@/modules/business/types";
import type { BizEditData } from "@/modules/business/components/EmpresaEditSheet";
import type { LucideIcon } from "lucide-react";
import { logger } from "@/shared/utils/logger";
import { openSafeUrlInNewTab } from "@/shared/utils/safeRedirect";

interface User {
  id: string;
  email?: string;
}

interface BusinessHeaderProps {
  business: BizData;
  isOwner: boolean;
  user: User | null;
}

export function BusinessHeader({
  business,
  isOwner,
  user: _user,
}: BusinessHeaderProps) {
  const editData: BizEditData = {
    id: business.id,
    name: business.name,
    description: business.description ?? "",
    category: business.category,
    address: typeof business.address === "string" ? business.address : "",
    neighborhood: business.neighborhood ?? "",
    phone: business.phone ?? "",
    whatsapp: business.whatsapp ?? "",
    schedule: business.schedule ?? "",
    schedule_fechamento: business.schedule_fechamento ?? "",
    email: business.email ?? "",
    instagram: business.instagram ?? "",
    facebook: business.facebook ?? "",
    website: business.website ?? "",
    logo: business.logo ?? business.logo_url ?? "",
    capa: business.capa ?? business.banner_url ?? "",
    formas_pagamento: business.formas_pagamento ?? [],
    especialidades: business.especialidades ?? [],
    facilidades: business.facilidades ?? [],
    ano_fundacao: business.ano_fundacao ?? null,
    latitude: business.latitude ?? null,
    longitude: business.longitude ?? null,
    modos_atendimento: business.modos_atendimento ?? ["presencial"],
  };
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { isFavorite, loading: favoriteLoading, toggleFavorite } =
    useBusinessFavorite(business.id);

  const MODOS_ICONS: Record<
    string,
    { icon: LucideIcon; label: string; color: string }
  > = {
    presencial: {
      icon: Store,
      label: "Presencial",
      color: "bg-primary/10 text-primary",
    },
    delivery: {
      icon: Store,
      label: "Delivery",
      color: "bg-green-500/10 text-green-600",
    },
    domicilio: {
      icon: Store,
      label: "A domicílio",
      color: "bg-yellow-500/10 text-yellow-600",
    },
    online: {
      icon: Store,
      label: "Online",
      color: "bg-sky-500/10 text-sky-600",
    },
  };

  return (
    <>
      {/* Hero Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden mb-6 shadow-xl"
      >
        {business.banner_url ? (
          <img
            src={business.banner_url}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary flex items-center justify-center">
            <Store className="h-24 w-24 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Badges & Actions */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2">
          {business.is_premium && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Destaque
              </Badge>
            </motion.div>
          )}
          {isOwner && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditOpen(true)}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/90 backdrop-blur-md flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.2 }}
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-card/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-card transition-colors"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-all duration-300",
                isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-white",
              )}
            />
          </motion.button>
        </div>

        {/* Botão Visitar Página Standalone (apenas para empresas premium) */}
        {business.is_premium && business.slug && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6"
          >
            <Button
              onClick={() => openSafeUrlInNewTab(`/p/${business.slug}`, {
                context: "business-header-premium-page",
              })}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl gap-2 hover:shadow-2xl transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Visitar página da empresa</span>
              <span className="sm:hidden">Visitar</span>
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-5 sm:p-7 border-2 mb-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start gap-4 sm:gap-5 mb-5">
            {business.logo_url ? (
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={business.logo_url}
                alt=""
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 object-cover shadow-md"
              />
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-md"
              >
                {business.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()}
              </motion.div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
                  {business.name}
                </h1>
                {business.is_verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <BadgeCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                  </motion.div>
                )}
              </div>

              {/* Avaliação */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5 transition-all",
                        i < Math.floor(business.rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300",
                      )}
                    />
                  ))}
                </div>
                <span className="text-lg sm:text-xl font-bold">{business.rating}</span>
                <span className="text-sm sm:text-base text-muted-foreground">
                  ({business.total_reviews} {business.total_reviews === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </div>

              <p className="text-sm sm:text-base text-muted-foreground capitalize mb-3">
                {business.category}
                {business.location?.name ? ` • ${business.location.name}` : ""}
              </p>

              {/* Especialidades */}
              {business.especialidades && business.especialidades.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {business.especialidades
                    .slice(0, 6)
                    .map((esp: string, idx: number) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + idx * 0.05 }}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                      >
                        {esp}
                      </motion.span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Modos de Atendimento */}
          {business.modos_atendimento &&
            business.modos_atendimento.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-5 border-t">
                {business.modos_atendimento.map((modo: string, idx: number) => {
                  const m = MODOS_ICONS[modo];
                  if (!m) return null;
                  const Icon = m.icon;
                  return (
                    <motion.span
                      key={modo}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105",
                        m.color,
                      )}
                    >
                      <Icon className="h-4 w-4" /> {m.label}
                    </motion.span>
                  );
                })}
              </div>
            )}
        </Card>
      </motion.div>

      {/* Dialogs */}
      <ShareBusinessDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        businessName={business.name}
        businessDescription={business.description}
        businessUrl={window.location.href}
      />

      {isOwner && (
        <EmpresaEditSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          biz={editData}
          onSaved={(updated) => {
            if (import.meta.env.DEV) {
              logger.info("Empresa atualizada:", updated);
            }
          }}
        />
      )}
    </>
  );
}
