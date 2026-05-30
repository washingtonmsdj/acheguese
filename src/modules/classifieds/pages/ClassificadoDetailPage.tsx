import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Heart, MapPin, Clock,
  ChevronLeft, ChevronRight,
  X, Tag, Flag, Camera, Package,
  ExternalLink, Zap,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useClassificadoDetail } from "@/modules/classifieds/hooks/useClassificadoDetail";
import { useClassifiedFavorite } from "@/modules/classifieds/hooks/useClassifiedFavorite";
import { useClassificados } from "@/modules/classifieds/hooks/useClassificados";
import { useSellerAds } from "@/modules/classifieds/hooks/useSellerAds";
import { getCategoryLabel } from "@/modules/classifieds/constants/categories";
import { CLASSIFIED_STATUS, type ClassifiedStatusValue } from "@/core/classifieds/constants/statuses";
import { ClassifiedCommentsSection } from "@/modules/classifieds/components/detail/ClassifiedCommentsSection";
import {
  ClassifiedStatusOwnerPanel,
  DetailBox,
  MetaChip,
  MiniAdCard,
  SafetyTips,
  SellerCard,
} from "./ClassificadoDetailPageSections";
import { getClassifiedStatusLabel } from "./ClassificadoDetailStatus";
import {
  CLASSIFIED_REPORT_REASON_OPTIONS,
  classifiedReportService,
  classifiedUrlService,
  isClassifiedReportReason,
  markAsSold,
  reactivateClassified,
  updateClassified,
} from "@/modules/classifieds/services";
import { useToast } from "@/shared/components/ui/use-toast";
import { cn } from "@/shared/utils/cn";
import { buildWhatsAppUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { messagingService } from "@/core/messaging";

interface ClassificadoDetailPageProps { classifiedId?: string; }

export default function ClassificadoDetailPage({ classifiedId: propId }: ClassificadoDetailPageProps = {}) {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propId || paramId;

  const navigate = useNavigate();
  const { user, activeProfile } = useSessionContext();
  const appUrls = useAppUrls();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [imgIdx, setImgIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const { classificado, isLoading, error, refetch } = useClassificadoDetail(id!);

  const { classificados: relacionados } = useClassificados({
    filters: { category: classificado?.categoria, sortBy: "recente" },
  });

  const { sellerAds } = useSellerAds(classificado?.vendedor?.id, id);
  const {
    canFavorite,
    isFavorite,
    isPending: isFavoritePending,
    toggleFavorite,
  } = useClassifiedFavorite(id);
  const isOwner = Boolean(activeProfile?.id && classificado?.vendedor?.id === activeProfile.id);
  const statusMutation = useMutation({
    mutationFn: async (nextStatus: ClassifiedStatusValue) => {
      if (!id || !activeProfile?.id) throw new Error("Perfil ativo ausente");
      if (nextStatus === CLASSIFIED_STATUS.SOLD) return markAsSold(id, activeProfile.id);
      if (nextStatus === CLASSIFIED_STATUS.ACTIVE) return reactivateClassified(id, activeProfile.id);
      return updateClassified(id, activeProfile.id, { status: CLASSIFIED_STATUS.INACTIVE });
    },
    onSuccess: async () => {
      toast({ title: "Status do anúncio atualizado" });
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["classificados"] }),
        queryClient.invalidateQueries({ queryKey: ["seller-ads", classificado?.vendedor?.id] }),
      ]);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    },
  });

  const anunciosRelacionados = relacionados.filter((ad) => ad.id !== id).slice(0, 4);

  const nextImg = useCallback(() => {
    if (!classificado?.fotos?.length) return;
    const photoCount = classificado.fotos.length;
    setImgIdx((p) => (p >= photoCount - 1 ? 0 : p + 1));
  }, [classificado]);

  const prevImg = useCallback(() => {
    if (!classificado?.fotos?.length) return;
    const photoCount = classificado.fotos.length;
    setImgIdx((p) => (p <= 0 ? photoCount - 1 : p - 1));
  }, [classificado]);

  const handleWhatsApp = useCallback(() => {
    if (!classificado?.vendedor) return;
    const phone = classificado.vendedor.whatsapp || classificado.vendedor.phone;
    if (!phone) return;
    const url = buildWhatsAppUrl(
      phone,
      `Olá! Vi seu anúncio "${classificado.titulo}" e tenho interesse.`,
    );
    if (url) {
      openSafeExternalUrl(url, { context: "classified-whatsapp" });
    }
  }, [classificado]);

  const handleChat = useCallback(async () => {
    if (!user || !activeProfile?.id) {
      navigate(appUrls.auth.login);
      return;
    }

    const sellerId = classificado?.vendedor?.id;
    if (!id || !sellerId) {
      toast({
        title: "Chat indisponível",
        description: "Não foi possível identificar o vendedor deste anúncio.",
        variant: "destructive",
      });
      return;
    }

    if (sellerId === activeProfile.id) {
      navigate(appUrls.messages);
      return;
    }

    setStartingChat(true);
    try {
      const conversation = await messagingService.findOrCreateConversation(id, activeProfile.id, sellerId);
      if (!conversation) throw new Error("Conversation was not created");
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      toast({
        title: "Não foi possível abrir o chat",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setStartingChat(false);
    }
  }, [activeProfile?.id, appUrls.auth.login, appUrls.messages, classificado?.vendedor?.id, id, navigate, toast, user]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: classificado?.titulo, text: classificado?.descricao, url });
        return;
      }
    } catch {
      void 0;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    } catch {
      toast({
        title: "Não foi possível compartilhar",
        description: "Copie o link direto da barra do navegador.",
        variant: "destructive",
      });
    }
  }, [classificado, toast]);

  const handleToggleFavorite = useCallback(async () => {
    if (!id) return;
    if (!canFavorite) {
      navigate(appUrls.auth.login);
      return;
    }

    try {
      const nextIsFavorite = await toggleFavorite();
      toast({
        title: nextIsFavorite ? "Anúncio salvo" : "Anúncio removido",
        description: nextIsFavorite
          ? "Você pode acessar depois em seus favoritos."
          : "O anúncio foi removido dos favoritos.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível atualizar favoritos",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  }, [appUrls.auth.login, canFavorite, id, navigate, toast, toggleFavorite]);

  const handleReport = useCallback(async () => {
    if (!activeProfile?.id) {
      navigate(appUrls.auth.login);
      return;
    }
    if (!isClassifiedReportReason(reportReason)) return;
    setSubmittingReport(true);
    try {
      await classifiedReportService.createReport(activeProfile.id, {
        classified_id: id!,
        reason: reportReason,
      });
      toast({ title: "Denúncia enviada", description: "Nossa equipe irá analisar em breve." });
      setReportOpen(false);
      setReportReason("");
    } catch {
      toast({ title: "Erro ao enviar denúncia", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setSubmittingReport(false);
    }
  }, [activeProfile?.id, appUrls.auth.login, id, navigate, reportReason, toast]);

  const buildAdUrl = useCallback((ad: {
    id: string;
    public_id?: string | null;
    slug?: string | null;
    geographic_path?: string | null;
    category_slug?: string | null;
    subcategory_slug?: string | null;
  }) => {
    return classifiedUrlService.buildPublicUrl(ad);
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="w-full aspect-[4/3] sm:aspect-video" />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !classificado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Anúncio não encontrado</h2>
          <p className="text-muted-foreground mb-6">O anúncio que você procura não existe ou foi removido.</p>
          <Button onClick={() => navigate(appUrls.classifieds.list)}>Voltar para Classificados</Button>
        </div>
      </div>
    );
  }

  const photos = classificado.fotos || [];
  const hasMultiplePhotos = photos.length > 1;
  const currentPhotoUrl = photos.at(imgIdx) ?? null;
  const categoryLabel = getCategoryLabel(classificado.categoria);
  const timeAgo = formatDistanceToNow(new Date(classificado.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className="min-h-screen bg-background">

      {/* -- Sticky Header ------------------------------- */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full h-9 w-9">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={isFavoritePending}
              className="rounded-full h-9 w-9"
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-red-500 text-red-500")} />
            </Button>
          </div>
        </div>
      </header>

      {/* -- Hero Gallery -------------------------------- */}
      <section className="relative bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2.2/1] overflow-hidden cursor-zoom-in"
            onClick={() => setGalleryOpen(true)}
          >
            {currentPhotoUrl ? (
              <motion.img
                key={imgIdx}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                src={currentPhotoUrl}
                alt={classificado.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <Package className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Navigation arrows */}
            {hasMultiplePhotos && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImg(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm p-2 rounded-full hover:bg-background/90 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImg(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm p-2 rounded-full hover:bg-background/90 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Photo counter */}
            {photos.length > 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
                <Camera className="h-3 w-3" />
                {imgIdx + 1}/{photos.length}
              </div>
            )}

            {/* Bottom info overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  {/* Condition badge */}
                  {classificado.condition && (
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border mb-2",
                      classificado.condition === "novo"
                        ? "bg-success/20 text-success border-success/30"
                        : classificado.condition === "seminovo"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-white/20 text-white border-white/30"
                    )}>
                      <Package className="h-2.5 w-2.5" />
                      {classificado.condition === "novo" ? "Novo" : classificado.condition === "seminovo" ? "Seminovo" : "Usado"}
                    </span>
                  )}
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg leading-tight">
                    {classificado.titulo}
                  </h1>
                </div>
                <span className="text-xl sm:text-3xl font-bold text-primary drop-shadow-lg shrink-0">
                  R$ {classificado.preco?.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {hasMultiplePhotos && (
            <div className="flex gap-1.5 p-3 overflow-x-auto scrollbar-hide bg-card border-b border-border">
              {photos.map((foto, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
                    i === imgIdx ? "border-primary ring-1 ring-primary/30" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* -- Content ------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* -- Left Column: Item Info ------------------ */}
          <div className="lg:col-span-2 space-y-5">

            {/* Meta chips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2"
            >
              <MetaChip icon={Tag} text={classificado.categoria} />
              <MetaChip icon={MapPin} text={classificado.bairro || "Não informado"} />
              <MetaChip icon={Clock} text={timeAgo} />
            </motion.div>

            {isOwner && (
              <ClassifiedStatusOwnerPanel
                status={classificado.status}
                isPending={statusMutation.isPending}
                onStatusChange={(nextStatus) => statusMutation.mutate(nextStatus)}
              />
            )}

            {/* Mobile: Seller + CTA (appears above description on mobile) */}
            <div className="lg:hidden">
              <SellerCard
                vendedor={classificado.vendedor}
                onWhatsApp={handleWhatsApp}
                onChat={handleChat}
                isChatLoading={startingChat}
                activeAdsCount={sellerAds.length + 1}
              />
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                Descrição
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {classificado.descricao}
              </p>
            </motion.div>

            {/* Details grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <DetailBox label="Categoria" value={categoryLabel} />
              <DetailBox label="Condição" value={
                classificado.condition === "novo" ? "Novo"
                : classificado.condition === "seminovo" ? "Seminovo"
                : "Usado"
              } />
              <DetailBox label="Localização" value={classificado.bairro || "-"} />
              <DetailBox label="Status" value={getClassifiedStatusLabel(classificado.status)} />
              <DetailBox label="Publicado" value={timeAgo} />
            </motion.div>

            {/* Safety tips (mobile) */}
            <div className="lg:hidden">
              <SafetyTips />
            </div>
          </div>

          {/* -- Right Column: Seller + Safety (desktop) */}
          <div className="hidden lg:block space-y-5">
            <div className="sticky top-20">
              <SellerCard
                vendedor={classificado.vendedor}
                onWhatsApp={handleWhatsApp}
                onChat={handleChat}
                isChatLoading={startingChat}
                activeAdsCount={sellerAds.length + 1}
              />
              <div className="mt-4">
                <SafetyTips />
              </div>
              <button
                onClick={() => setReportOpen(true)}
                className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Flag className="h-3 w-3" />
                Denunciar anúncio
              </button>
            </div>
          </div>
        </div>

        <ClassifiedCommentsSection
          classifiedId={id!}
          sellerProfileId={classificado?.vendedor?.id ?? null}
        />

        {/* -- Seller's other ads ------------------------ */}
        {sellerAds.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10"
          >
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Mais de {classificado.vendedor?.nome || "este vendedor"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sellerAds.slice(0, 4).map((ad, i) => (
                <MiniAdCard
                  key={ad.id}
                  ad={ad}
                  index={i}
                  onClick={() => {
                    const publicUrl = buildAdUrl(ad);
                    if (publicUrl) navigate(publicUrl);
                  }}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* -- Related ads ------------------------------- */}
        {anunciosRelacionados.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Anúncios Relacionados
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(appUrls.classifieds.list)}
                className="text-primary text-xs"
              >
                Ver todos <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {anunciosRelacionados.map((ad, i) => (
                <MiniAdCard
                  key={ad.id}
                  ad={ad}
                  index={i}
                  onClick={() => {
                    const publicUrl = buildAdUrl(ad);
                    if (publicUrl) navigate(publicUrl);
                  }}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* -- Report link (mobile) ---------------------- */}
        <div className="lg:hidden mt-8 pt-4 border-t border-border text-center">
          <button
            onClick={() => setReportOpen(true)}
            className="text-xs text-muted-foreground hover:text-destructive font-medium inline-flex items-center gap-1"
          >
            <Flag className="h-3 w-3" />
            Denunciar este anúncio
          </button>
        </div>
      </main>

      {/* -- Report Modal -------------------------------- */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setReportOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-5 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" />
                  <h2 className="text-base font-bold text-foreground">Denunciar Anúncio</h2>
                </div>
                <button onClick={() => setReportOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Ajude-nos a manter a comunidade segura.
              </p>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-background border border-border text-foreground text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um motivo</option>
                {CLASSIFIED_REPORT_REASON_OPTIONS.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setReportOpen(false); setReportReason(""); }} className="flex-1 rounded-xl">
                  Cancelar
                </Button>
                <Button
                  onClick={handleReport}
                  disabled={!reportReason || submittingReport}
                  className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {submittingReport ? "Enviando..." : "Denunciar"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -- Gallery Modal ------------------------------- */}
      <AnimatePresence>
        {galleryOpen && currentPhotoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setGalleryOpen(false)}
          >
            <button
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative w-full max-w-5xl px-4" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={imgIdx}
                initial={{ opacity: 0.5, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                src={currentPhotoUrl}
                alt={classificado.titulo}
                className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              />
              {hasMultiplePhotos && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold">
                    {imgIdx + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
