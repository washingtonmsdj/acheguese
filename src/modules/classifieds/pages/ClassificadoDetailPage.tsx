/**
 * ClassificadoDetailPage — Página de detalhe item-first
 *
 * ? Foco total no produto/anúncio
 * ? Galeria imersiva com navegação touch
 * ? Badge de condição (novo/seminovo/usado)
 * ? Vendedor como info secundária
 * ? Anúncios do mesmo vendedor
 * ? Anúncios relacionados
 * ? Mobile-first, responsivo para desktop
 */

import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Heart, MapPin, Clock, Eye,
  MessageCircle, Phone, Star, ChevronLeft, ChevronRight,
  X, Shield, BadgeCheck, Tag, Flag, Camera, Package,
  ExternalLink, Zap,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useClassificadoDetail } from "@/modules/classifieds/hooks/useClassificadoDetail";
import { useClassificados } from "@/modules/classifieds/hooks/useClassificados";
import { useSellerAds } from "@/modules/classifieds/hooks/useSellerAds";
import { getCategoryEmoji } from "@/modules/classifieds/constants/categories";
import { classifiedReportService, classifiedUrlService } from "@/modules/classifieds/services";
import { useToast } from "@/shared/components/ui/use-toast";
import { cn } from "@/shared/utils/cn";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// -- Types -----------------------------------------------------

type ReportReason = "fraud" | "fake" | "inappropriate" | "spam" | "duplicate" | "wrong-category" | "sold" | "other";

interface ClassificadoDetailPageProps {
  classifiedId?: string;
}

// -- Page ------------------------------------------------------

export default function ClassificadoDetailPage({ classifiedId: propId }: ClassificadoDetailPageProps = {}) {
  const { id: paramId } = useParams<{ id: string }>();
  const id = propId || paramId;

  const navigate = useNavigate();
  const { user } = useSessionContext();
  const appUrls = useAppUrls();
  const { toast } = useToast();

  const [imgIdx, setImgIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const { classificado, isLoading, error } = useClassificadoDetail(id!);

  const { classificados: relacionados } = useClassificados({
    filters: { category: classificado?.categoria, sortBy: "recente" },
  });

  const { sellerAds } = useSellerAds(classificado?.vendedor?.id, id);

  const anunciosRelacionados = relacionados.filter((ad) => ad.id !== id).slice(0, 4);

  // -- Handlers ----------------------------------------

  const nextImg = useCallback(() => {
    if (!classificado?.fotos) return;
    setImgIdx((p) => (p === classificado.fotos.length - 1 ? 0 : p + 1));
  }, [classificado]);

  const prevImg = useCallback(() => {
    if (!classificado?.fotos) return;
    setImgIdx((p) => (p === 0 ? classificado.fotos.length - 1 : p - 1));
  }, [classificado]);

  const handleWhatsApp = useCallback(() => {
    if (!classificado?.vendedor) return;
    const phone = classificado.vendedor.whatsapp || classificado.vendedor.phone;
    if (!phone) return;
    const msg = encodeURIComponent(`Olá! Vi seu anúncio "${classificado.titulo}" e tenho interesse.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }, [classificado]);

  const handleChat = useCallback(() => {
    if (!user) { navigate(appUrls.auth.login); return; }
    navigate(`/classificado/${id}/chat`);
  }, [user, navigate, appUrls, id]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: classificado?.titulo, text: classificado?.descricao, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    }
  }, [classificado, toast]);

  const handleReport = useCallback(async () => {
    if (!reportReason.trim()) return;
    setSubmittingReport(true);
    try {
      await classifiedReportService.createReport(user?.id || null, {
        classified_id: id!,
        reason: reportReason as ReportReason,
      });
      toast({ title: "Denúncia enviada", description: "Nossa equipe irá analisar em breve." });
      setReportOpen(false);
      setReportReason("");
    } catch {
      toast({ title: "Erro ao enviar denúncia", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setSubmittingReport(false);
    }
  }, [reportReason, user, id, toast]);

  const buildAdUrl = useCallback((ad: any) => {
    // ? SSOT: Usar classifiedUrlService para construir URL canônica
    if (ad.geographic_path && ad.category_slug && ad.subcategory_slug && ad.slug && ad.public_id) {
      const urls = classifiedUrlService.buildUrls({
        id: ad.id,
        public_id: ad.public_id,
        geographic_path: ad.geographic_path,
        category_slug: ad.category_slug,
        subcategory_slug: ad.subcategory_slug,
        slug: ad.slug,
      });
      return urls.canonical;
    }
    // Fallback para URL curta
    return `/c/${ad.public_id || ad.id}`;
  }, []);

  // -- Loading -----------------------------------------

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
          <div className="text-6xl mb-4">??</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Anúncio não encontrado</h2>
          <p className="text-muted-foreground mb-6">O anúncio que você procura não existe ou foi removido.</p>
          <Button onClick={() => navigate(appUrls.classifieds.list)}>Voltar para Classificados</Button>
        </div>
      </div>
    );
  }

  const photos = classificado.fotos || [];
  const hasMultiplePhotos = photos.length > 1;
  const categoryEmoji = getCategoryEmoji(classificado.categoria);
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
              onClick={() => setIsFav(!isFav)}
              className="rounded-full h-9 w-9"
            >
              <Heart className={cn("h-4 w-4", isFav && "fill-red-500 text-red-500")} />
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
            {photos.length > 0 ? (
              <motion.img
                key={imgIdx}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                src={photos[imgIdx]}
                alt={classificado.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-primary/10 to-accent/10">
                {categoryEmoji}
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
              <MetaChip icon={Eye} text={`${Math.floor(Math.random() * 100) + 20} views`} />
            </motion.div>

            {/* Mobile: Seller + CTA (appears above description on mobile) */}
            <div className="lg:hidden">
              <SellerCard
                vendedor={classificado.vendedor}
                onWhatsApp={handleWhatsApp}
                onChat={handleChat}
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
                ?? Descrição
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
              <DetailBox label="Categoria" value={`${categoryEmoji} ${classificado.categoria}`} />
              <DetailBox label="Condição" value={
                classificado.condition === "novo" ? "?? Novo"
                : classificado.condition === "seminovo" ? "?? Seminovo"
                : "? Usado"
              } />
              <DetailBox label="Localização" value={classificado.bairro || "—"} />
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
                <MiniAdCard key={ad.id} ad={ad} index={i} onClick={() => navigate(buildAdUrl(ad))} />
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
                <MiniAdCard key={ad.id} ad={ad} index={i} onClick={() => navigate(buildAdUrl(ad))} />
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
                <option value="fraud">Fraude ou golpe</option>
                <option value="fake">Produto falso</option>
                <option value="inappropriate">Conteúdo inapropriado</option>
                <option value="spam">Spam</option>
                <option value="duplicate">Duplicado</option>
                <option value="wrong-category">Categoria incorreta</option>
                <option value="sold">Já vendido</option>
                <option value="other">Outro</option>
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
        {galleryOpen && photos.length > 0 && (
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
                src={photos[imgIdx]}
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

// -- Sub-components -------------------------------------------

function MetaChip({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-[11px] font-medium border border-border">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate max-w-[120px] capitalize">{text}</span>
    </span>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-xs font-bold text-foreground capitalize">{value}</p>
    </div>
  );
}

function SellerCard({
  vendedor,
  onWhatsApp,
  onChat,
}: {
  vendedor: any;
  onWhatsApp: () => void;
  onChat: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-3">Vendedor</p>

      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
          {vendedor?.nome?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-foreground text-sm truncate">{vendedor?.nome || "Vendedor"}</p>
            <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span>4.8 · 23 avaliações</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onClick={onWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold h-11 rounded-xl"
        >
          <Phone className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
        <Button onClick={onChat} variant="outline" className="w-full h-11 rounded-xl font-bold">
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
        </Button>
      </div>
    </motion.div>
  );
}

function SafetyTips() {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
      <div className="flex items-start gap-2">
        <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground mb-1.5">Dicas de Segurança</p>
          <ul className="text-[10px] text-muted-foreground space-y-1 leading-relaxed">
            <li>• Prefira encontros em locais públicos</li>
            <li>• Verifique o produto antes de pagar</li>
            <li>• Desconfie de preços muito baixos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MiniAdCard({ ad, index, onClick }: { ad: any; index: number; onClick: () => void }) {
  const timeAgo = getRelativeTime(ad.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 transition-all"
    >
      <div className="relative h-28 sm:h-36 bg-secondary overflow-hidden">
        {ad.fotos?.[0] ? (
          <img src={ad.fotos[0]} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-primary/10 to-accent/10">
            {getCategoryEmoji(ad.categoria)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-white drop-shadow-lg">
          R$ {ad.preco?.toLocaleString("pt-BR")}
        </span>

        {ad.condition && (
          <span className={cn(
            "absolute top-1.5 right-1.5 text-[7px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-sm",
            ad.condition === "novo"
              ? "bg-success/20 text-success border-success/30"
              : ad.condition === "seminovo"
              ? "bg-primary/20 text-primary border-primary/30"
              : "bg-white/20 text-white border-white/30"
          )}>
            {ad.condition === "novo" ? "Novo" : ad.condition === "seminovo" ? "Semi" : "Usado"}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="text-[10px] sm:text-[11px] font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
          {ad.titulo}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          {ad.bairro && (
            <span className="flex items-center gap-0.5 text-muted-foreground text-[8px]">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[50px]">{ad.bairro}</span>
            </span>
          )}
          {timeAgo && <span className="text-[8px] text-muted-foreground">{timeAgo}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// -- Utils ----------------------------------------------------

function getRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}m`;
  } catch {
    return "";
  }
}

