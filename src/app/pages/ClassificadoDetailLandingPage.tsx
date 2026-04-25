/**
 * ClassificadoDetailLandingPage — Página pública de detalhe de classificado
 * Estilo consistente com EmpresaDetailLandingPage e ClassificadosLandingPage (dark + teal)
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Heart,
  Share2,
  Tag,
  MessageCircle,
  Shield,
  Clock,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Package,
  Car,
  Home,
  Laptop,
  Shirt,
  Sofa,
  Bike,
  ShoppingBag,
  User,
  CalendarDays,
  Eye,
  Flag,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";

// ── Category Icons ───────────────────────────────────────────────────
// ── Status config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: "Disponível", color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  reserved: { label: "Reservado", color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  sold: { label: "Vendido", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

// ── Category names ───────────────────────────────────────────────────
const CATEGORY_NAMES: Record<string, string> = {
  veiculos: "Veículos",
  imoveis: "Imóveis",
  eletronicos: "Eletrônicos",
  roupas: "Roupas",
  moveis: "Móveis",
  esportes: "Esportes",
  outros: "Outros",
};

// ── Mock classified data ─────────────────────────────────────────────
interface MockClassified {
  id: string;
  titulo: string;
  description: string;
  preco: number;
  categoria: string;
  bairro: string;
  fotos: string[];
  status: string;
  vendedor: {
    name: string;
    avatar: string | null;
    bairro: string;
    whatsapp: string;
    rating: number;
    reviews_count: number;
    is_verified: boolean;
    member_since: string;
  };
  created_at: string;
  views: number;
}

function getCategoryIcon(category: string): React.ElementType {
  switch (category) {
    case "veiculos":
      return Car;
    case "imoveis":
      return Home;
    case "eletronicos":
      return Laptop;
    case "roupas":
      return Shirt;
    case "moveis":
      return Sofa;
    case "esportes":
      return Bike;
    case "outros":
      return Package;
    default:
      return Package;
  }
}

function getStatusConfig(status: string): { label: string; color: string; dot: string } {
  switch (status) {
    case "active":
      return STATUS_CONFIG.active;
    case "reserved":
      return STATUS_CONFIG.reserved;
    case "sold":
      return STATUS_CONFIG.sold;
    default:
      return STATUS_CONFIG.active;
  }
}

function getCategoryName(category: string): string {
  switch (category) {
    case "veiculos":
      return CATEGORY_NAMES.veiculos;
    case "imoveis":
      return CATEGORY_NAMES.imoveis;
    case "eletronicos":
      return CATEGORY_NAMES.eletronicos;
    case "roupas":
      return CATEGORY_NAMES.roupas;
    case "moveis":
      return CATEGORY_NAMES.moveis;
    case "esportes":
      return CATEGORY_NAMES.esportes;
    case "outros":
      return CATEGORY_NAMES.outros;
    default:
      return category;
  }
}

const MOCK_CLASSIFIEDS: Record<string, MockClassified> = {
  "1": {
    id: "1",
    titulo: "iPhone 13 Pro 256GB",
    description:
      "iPhone 13 Pro 256GB em perfeito estado de conservação. Bateria com 92% de saúde. Acompanha caixa original, carregador e fone. Sem marcas de uso, sempre usado com película e capa. Aceito troca por iPhone 14 com volta minha.",
    preco: 3200,
    categoria: "eletronicos",
    bairro: "Pituba",
    fotos: [],
    status: "active",
    vendedor: {
      name: "Carlos Mendes",
      avatar: null,
      bairro: "Pituba",
      whatsapp: "71999991111",
      rating: 4.9,
      reviews_count: 23,
      is_verified: true,
      member_since: "2024-06-10",
    },
    created_at: "2026-03-25T14:30:00Z",
    views: 342,
  },
  "2": {
    id: "2",
    titulo: "Sofá 3 lugares retrátil e reclinável",
    description:
      "Sofá 3 lugares retrátil e reclinável na cor cinza. Em ótimo estado, sem rasgos ou manchas. Ideal para sala de estar. Vendo por motivo de mudança. Comprador retira no local.",
    preco: 850,
    categoria: "moveis",
    bairro: "Rio Vermelho",
    fotos: [],
    status: "active",
    vendedor: {
      name: "Ana Paula Silva",
      avatar: null,
      bairro: "Rio Vermelho",
      whatsapp: "71988882222",
      rating: 4.7,
      reviews_count: 15,
      is_verified: true,
      member_since: "2025-01-20",
    },
    created_at: "2026-03-22T09:15:00Z",
    views: 178,
  },
  "3": {
    id: "3",
    titulo: "Bicicleta MTB Caloi Elite 30",
    description:
      "Bicicleta Caloi Elite 30, aro 29, quadro 17. Câmbio Shimano Deore, suspensão Rock Shox. Revisada recentemente. Pneus novos. Perfeita para trilhas e uso urbano.",
    preco: 1100,
    categoria: "esportes",
    bairro: "Ondina",
    fotos: [],
    status: "active",
    vendedor: {
      name: "Roberto Lima",
      avatar: null,
      bairro: "Ondina",
      whatsapp: "71977773333",
      rating: 5.0,
      reviews_count: 8,
      is_verified: false,
      member_since: "2025-08-15",
    },
    created_at: "2026-03-20T16:45:00Z",
    views: 95,
  },
};

// ── Related ads (mock) ───────────────────────────────────────────────
function getMockClassifiedById(classifiedId?: string): MockClassified | null {
  if (!classifiedId) {
    return null;
  }

  switch (classifiedId) {
    case "1":
      return MOCK_CLASSIFIEDS["1"];
    case "2":
      return MOCK_CLASSIFIEDS["2"];
    case "3":
      return MOCK_CLASSIFIEDS["3"];
    default:
      return null;
  }
}

const RELATED_ADS = [
  { id: "4", titulo: "Notebook Dell i5 8GB", preco: 2400, categoria: "eletronicos", bairro: "Stiep" },
  { id: "5", titulo: "Cama box casal queen", preco: 700, categoria: "moveis", bairro: "Pituba" },
  { id: "6", titulo: "Vestido festa longo", preco: 180, categoria: "roupas", bairro: "Barra" },
];

// ── Helper ───────────────────────────────────────────────────────────
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
  return formatDate(dateString);
}

// ── NAV LINKS ────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Início", path: "/" },
  { label: "Classificados", path: "/classificados" },
];

// ── PAGE ─────────────────────────────────────────────────────────────

export default function ClassificadoDetailLandingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isFavorite, setIsFavorite] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Mock data lookup
  const ad = getMockClassifiedById(id);
  const loading = false;
  const notFound = !ad;

  // ── LOADING ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-72 sm:h-96 w-full rounded-2xl mb-6" />
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-60" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── NOT FOUND ────────────────────────────────────────────────────
  if (notFound || !ad) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14">
            <button
              onClick={() => navigate("/classificados")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <Tag className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">Anúncio não encontrado</h1>
          <p className="text-muted-foreground mb-6">O anúncio que você procura não existe ou foi removido.</p>
          <Button
            onClick={() => navigate("/classificados")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver todos os classificados
          </Button>
        </div>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────
  const CatIcon = getCategoryIcon(ad.categoria);
  const status = getStatusConfig(ad.status);
  const categoryName = getCategoryName(ad.categoria);
  const photos = ad.fotos.length > 0 ? ad.fotos : [];
  const hasPhotos = photos.length > 0;
  const currentPhotoUrl = photos.at(currentPhoto) ?? photos[0] ?? "";
  const seller = ad.vendedor;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium hidden sm:inline">Voltar</span>
            </button>
            <div className="h-5 w-px bg-border hidden sm:block" />
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Heart
                className={`h-4 w-4 transition-all ${isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
              />
            </button>
            <button
              onClick={() =>
                navigator.share?.({ title: ad.titulo, url: window.location.href }).catch(() => {})
              }
              className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── IMAGE GALLERY / PLACEHOLDER ────────────────────────── */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative mt-4 sm:mt-6 rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[21/9]">
            {hasPhotos ? (
              <>
                <img
                  src={currentPhotoUrl}
                  alt={ad.titulo}
                  className="w-full h-full object-cover"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPhoto((p) => (p - 1 + photos.length) % photos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 text-foreground" />
                    </button>
                    <button
                      onClick={() => setCurrentPhoto((p) => (p + 1) % photos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-card transition-colors"
                    >
                      <ChevronRight className="h-5 w-5 text-foreground" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPhoto(i)}
                          className={`h-2 rounded-full transition-all ${
                            i === currentPhoto ? "w-6 bg-primary" : "w-2 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-secondary flex items-center justify-center">
                <CatIcon className="h-24 w-24 text-primary/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

            {/* Status badge */}
            <div
              className={`absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm ${status.color}`}
            >
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.label}
            </div>

            {/* Photo count */}
            {hasPhotos && (
              <div className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1 text-xs font-medium text-foreground">
                {currentPhoto + 1}/{photos.length}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-5 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── LEFT: Ad details ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title & Price card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xl"
            >
              {/* Category breadcrumb */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <button
                  onClick={() => navigate("/classificados")}
                  className="hover:text-primary transition-colors"
                >
                  Classificados
                </button>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">{categoryName}</span>
              </div>

              <h1 className="text-xl sm:text-3xl font-bold text-foreground font-heading leading-tight mb-3">
                {ad.titulo}
              </h1>

              <div className="flex items-center flex-wrap gap-3 mb-4">
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  R$ {ad.preco.toLocaleString("pt-BR")}
                </span>
                <Badge
                  className={`${status.color} border text-xs font-semibold`}
                >
                  {status.label}
                </Badge>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {ad.bairro}, {TERRITORY_CONFIG.launch.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo(ad.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {ad.views} visualizações
                </span>
              </div>

              {/* Category tag */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg border border-border">
                  <CatIcon className="h-3.5 w-3.5" />
                  {categoryName}
                </span>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <h2 className="text-base font-bold text-foreground font-heading mb-3">Descrição</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {ad.description}
              </p>
            </motion.div>

            {/* Safety tips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-warning/5 border border-warning/20 rounded-xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="bg-warning/10 p-2 rounded-lg shrink-0">
                  <Shield className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Dicas de Segurança</h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <span className="text-warning mt-0.5">•</span>
                      Sempre combine encontros em locais públicos e movimentados
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-warning mt-0.5">•</span>
                      Verifique o produto antes de efetuar o pagamento
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-warning mt-0.5">•</span>
                      Desconfie de preços muito abaixo do mercado
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Seller card & actions ──────────────────── */}
          <div className="space-y-4">
            {/* Seller card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <h2 className="text-base font-bold text-foreground font-heading mb-4">Vendedor</h2>

              <div className="flex items-center gap-3 mb-4">
                {seller.avatar ? (
                  <img
                    src={seller.avatar}
                    alt={seller.name}
                    className="h-14 w-14 rounded-xl object-cover border-2 border-border"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl border-2 border-border bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {getInitials(seller.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-bold text-foreground truncate">{seller.name}</p>
                    {seller.is_verified && (
                      <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {seller.bairro}
                  </p>
                </div>
              </div>

              {/* Seller stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                    <span className="text-lg font-bold text-primary">{seller.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nota</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{seller.reviews_count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avaliações</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
                <CalendarDays className="h-3.5 w-3.5" />
                Membro desde {formatDate(seller.member_since)}
              </p>

              {/* Action buttons */}
              <div className="space-y-2.5">
                <a
                  href={`https://wa.me/55${seller.whatsapp}?text=${encodeURIComponent(`Olá! Vi seu anúncio "${ad.titulo}" e tenho interesse.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-success/15 hover:bg-success/25 text-success font-semibold text-sm py-3 rounded-xl border border-success/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chamar no WhatsApp
                </a>

                <Button
                  onClick={() => navigate(user ? `/classificado/${id}/chat` : "/login")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-xl h-11"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>
            </motion.div>

            {/* Report */}
            <div className="bg-card border border-border rounded-xl p-4">
              <button className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1">
                <Flag className="h-3.5 w-3.5" />
                Denunciar anúncio
              </button>
            </div>

            {/* CTA for sellers */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 rounded-xl p-5 text-center">
              <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">Quer vender algo?</p>
              <p className="text-xs text-muted-foreground mb-3">Publique seu anúncio gratuitamente</p>
              <Button
                onClick={() => navigate(user ? "/classificados/novo" : "/login")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg h-9"
              >
                Anunciar Grátis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── RELATED ADS ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full pb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground font-heading">Anúncios Relacionados</h2>
          <button
            onClick={() => navigate("/classificados")}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            Ver todos <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {RELATED_ADS.map((related, i) => {
            const RelIcon = getCategoryIcon(related.categoria);
            return (
              <motion.div
                key={related.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/classificado/${related.id}`)}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="relative h-32 overflow-hidden bg-secondary">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <RelIcon className="h-10 w-10 text-primary/30" />
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="text-sm font-bold text-white drop-shadow-lg bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      R$ {related.preco.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors mb-2">
                    {related.titulo}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{related.bairro}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/20 via-card to-accent/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">
            Explore mais classificados
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
            Milhares de anúncios de moradores de{" "}
            {TERRITORY_CONFIG.launch.name}. Encontre ótimas oportunidades perto de você.
          </p>
          <Button
            onClick={() => navigate("/classificados")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-11 px-8 rounded-lg shadow-lg"
          >
            Ver todos os classificados
          </Button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="w-full border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Tag className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Classificados Locais — {TERRITORY_CONFIG.launch.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">
              Início
            </button>
            <button onClick={() => navigate(LAUNCH_URLS.community)} className="hover:text-primary transition-colors">
              Comunidade
            </button>
            <button onClick={() => navigate(LAUNCH_URLS.services)} className="hover:text-primary transition-colors">
              Serviços
            </button>
            <button onClick={() => navigate(LAUNCH_URLS.business)} className="hover:text-primary transition-colors">
              Empresas
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

