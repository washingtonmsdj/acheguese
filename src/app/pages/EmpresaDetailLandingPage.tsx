// @ts-nocheck
/**
 * EmpresaDetailLandingPage — Página pública profissional de empresa
 * Landing page completa com todas as seções: hero, CTAs, resumo, info, produtos, avaliações
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StandaloneMap from "@/shared/components/standalone/StandaloneMap";
import {
  ArrowLeft, Star, MapPin, Phone, Globe, Mail, Clock, Heart, Share2,
  BadgeCheck, Store, Sparkles, ChevronRight, MessageCircle, Instagram,
  Facebook, CreditCard, Banknote, Truck, Users, Award, Navigation,
  Wifi, ParkingSquare, Accessibility, Baby, Dog, ImageIcon, Send, X,
  ChevronDown, ThumbsUp, Route, Shield, Footprints,
  Car, TrendingUp, Flame, Eye, Bookmark, Zap,
  Home, ExternalLink, Map as MapIcon, ShoppingBag, Calendar, Info,
  MapPinned, Copy, Check, Package, Tag, Percent, ArrowUpRight,
  Building2, Utensils, ClipboardList, ChevronUp,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { BusinessService } from "@/core/business/services/BusinessService";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { toast } from "sonner";
import type { Business } from "@/modules/business/types";
import BusinessSEO from "@/shared/components/seo/BusinessSEO";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import BranchNetworkBlock from "@/modules/business/components/BranchNetworkBlock";
import { useGastronomyProfile } from "@/modules/gastronomy/hooks";
import { GastronomyCTA } from "@/modules/gastronomy/components/GastronomyCTA";
import { CoverageBadge } from "@/core/geospatial/components/CoverageBadge";
import { normalizePublicTerritoryPath } from "@/core/routing/utils/territoryUrls";

// ── Mock data ────────────────────────────────────────────────────────
const MOCK_BUSINESSES: Record<string, any> = {
  "sabor-da-bahia": {
    id: "sabor-da-bahia", profile_id: "sabor-da-bahia",
    name: "Sabor da Bahia",
    description: "Comida baiana autêntica com ingredientes frescos do mercado local. Especialidade em moqueca, acarajé e pratos típicos da culinária nordestina. Ambiente familiar e acolhedor no coração do bairro, servindo a comunidade há mais de 8 anos.",
    category: "restaurante", subcategoria: "Culinária Baiana",
    phone: "(71) 3333-4444", whatsapp: "5571999998888",
    email: "contato@sabordabahia.com.br", website: "https://sabordabahia.com.br",
    location_id: "salvador-pituba",
    location: { name: "Pituba", full_name: "Pituba, Salvador - BA", geographic_path: "/br/ba/salvador/pituba" },
    address: { street: "Rua das Palmeiras", number: "123", complement: "Loja A", postal_code: "41810-001", latitude: -12.975, longitude: -38.476 },
    geographic_path: "/br/ba/salvador/pituba",
    horario_funcionamento: {
      segunda: { open: "11:00", close: "22:00" }, terca: { open: "11:00", close: "22:00" },
      quarta: { open: "11:00", close: "22:00" }, quinta: { open: "11:00", close: "22:00" },
      sexta: { open: "11:00", close: "23:00" }, sabado: { open: "11:00", close: "23:00" },
      domingo: { open: "12:00", close: "21:00" },
    },
    tem_delivery: true, aceita_cartao: true, aceita_pix: true,
    status: "active", rating: 4.8, total_reviews: 234, total_products: 12,
    is_premium: true, is_verified: true, is_featured: true, slug: "sabor-da-bahia",
    formas_pagamento: ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Vale Refeição"],
    especialidades: ["Moqueca de Camarão", "Acarajé", "Vatapá", "Caruru", "Bobó de Camarão"],
    facilidades: ["estacionamento", "acessibilidade", "wifi", "kids", "pet_friendly"],
    modos_atendimento: ["presencial", "delivery"],
    instagram: "sabordabahia", facebook: "sabordabahia",
    created_at: "2018-01-15T00:00:00Z", updated_at: "2026-03-01T00:00:00Z",
    logo_url: null, banner_url: null, fotos: [],
  },
  "farmacia-saude-plus": {
    id: "farmacia-saude-plus", profile_id: "farmacia-saude-plus",
    name: "Farmácia Saúde+",
    description: "Medicamentos, higiene pessoal e atendimento farmacêutico 24h. Equipe especializada para orientação sobre medicamentos e saúde preventiva. Entrega rápida para todo o bairro.",
    category: "farmacia", phone: "(71) 3222-5555", whatsapp: "5571988887777",
    email: "atendimento@farmaciasaudemais.com.br",
    location_id: "salvador-pituba",
    location: { name: "Pituba", full_name: "Pituba, Salvador - BA", geographic_path: "/br/ba/salvador/pituba" },
    address: { street: "Av. Tancredo Neves", number: "450", postal_code: "41820-020" },
    geographic_path: "/br/ba/salvador/pituba",
    tem_delivery: true, aceita_cartao: true, aceita_pix: true,
    status: "active", rating: 4.6, total_reviews: 189, total_products: 0,
    is_premium: false, is_verified: true, slug: "farmacia-saude-plus",
    formas_pagamento: ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"],
    especialidades: ["Manipulação", "Dermocosméticos", "Homeopatia"],
    facilidades: ["estacionamento", "acessibilidade"],
    modos_atendimento: ["presencial", "delivery"],
    created_at: "2020-02-10T00:00:00Z", updated_at: "2026-02-15T00:00:00Z",
    logo_url: null, banner_url: null, fotos: [],
  },
};

const MOCK_PRODUCTS = [
  { id: "1", name: "Moqueca de Camarão", description: "Receita tradicional baiana com leite de coco e dendê", price: 59.90, promotional_price: 49.90, category: "Pratos Principais", image_url: null, featured: true, active: true },
  { id: "2", name: "Acarajé Completo", description: "Com vatapá, caruru, camarão e salada", price: 18.00, category: "Lanches", image_url: null, featured: true, active: true },
  { id: "3", name: "Bobó de Camarão", description: "Creme de mandioca com camarões frescos", price: 54.90, category: "Pratos Principais", image_url: null, featured: false, active: true },
  { id: "4", name: "Vatapá", description: "Feito com pão, camarão seco e amendoim", price: 32.00, category: "Porções", image_url: null, featured: false, active: true },
  { id: "5", name: "Suco de Maracujá", description: "Natural, sem açúcar", price: 10.00, category: "Bebidas", image_url: null, featured: false, active: true },
  { id: "6", name: "Cocada Baiana", description: "Doce artesanal de coco", price: 8.00, promotional_price: 6.50, category: "Sobremesas", image_url: null, featured: true, active: true },
];

const MOCK_REVIEWS = [
  { id: "1", user_name: "Maria Silva", rating: 5, comment: "Excelente atendimento! Recomendo muito. A equipe é super atenciosa e a comida é maravilhosa.", created_at: "2026-03-15", isNeighbor: true, avatar: null },
  { id: "2", user_name: "João Santos", rating: 4, comment: "Ótima experiência, bom custo-benefício. Voltarei com certeza!", created_at: "2026-03-10", isNeighbor: true, avatar: null },
  { id: "3", user_name: "Ana Costa", rating: 5, comment: "Lugar incrível! Preço justo e atendimento impecável. A moqueca é a melhor do bairro.", created_at: "2026-02-28", isNeighbor: false, avatar: null },
  { id: "4", user_name: "Carlos Mendes", rating: 5, comment: "Frequento há anos. Nunca decepciona. Delivery sempre pontual.", created_at: "2026-02-20", isNeighbor: true, avatar: null },
];

const NEARBY_BUSINESSES = [
  { id: "farmacia-saude-plus", name: "Farmácia Saúde+", category: "Farmácia", distance: "120m", rating: 4.6, isOpen: true },
  { id: "padaria-pao-quente", name: "Padaria Pão Quente", category: "Padaria", distance: "90m", rating: 4.9, isOpen: true },
  { id: "mercadinho-familia", name: "Mercadinho Família", category: "Mercado", distance: "200m", rating: 4.5, isOpen: true },
  { id: "salao-beleza-rosa", name: "Salão Beleza Rosa", category: "Beleza", distance: "450m", rating: 4.7, isOpen: false },
];

const AREAS_ATENDIDAS = ["Pituba", "Itaigara", "Caminho das Árvores", "Iguatemi", "Nordeste de Amaralina", "Santa Cruz", "Vale das Pedrinhas"];

const FACILITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, estacionamento: ParkingSquare, acessibilidade: Accessibility, kids: Baby, pet_friendly: Dog,
};

const FACILITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi grátis", estacionamento: "Estacionamento", acessibilidade: "Acessível", kids: "Espaço Kids", pet_friendly: "Pet Friendly",
};

const MODOS_CONFIG: Record<string, { label: string; icon: typeof Store; color: string }> = {
  presencial: { label: "Atendimento presencial", icon: Store, color: "bg-primary/10 text-primary border-primary/20" },
  delivery: { label: "Delivery", icon: Truck, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  domicilio: { label: "Atendimento a domicílio", icon: Home, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  online: { label: "Atendimento online", icon: Globe, color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
};

const DAY_NAMES: Record<string, string> = {
  segunda: "Segunda-feira", terca: "Terça-feira", quarta: "Quarta-feira", quinta: "Quinta-feira",
  sexta: "Sexta-feira", sabado: "Sábado", domingo: "Domingo"
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function getYearsActive(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const years = Math.floor((now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) return "Menos de 1 ano";
  return `${years} ano${years > 1 ? "s" : ""}`;
}

function isCurrentlyOpen(hours: any): { open: boolean; todayHours: string | null } {
  if (!hours) return { open: false, todayHours: null };
  const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const now = new Date();
  const dayKey = days[now.getDay()];
  const todaySchedule = hours[dayKey];
  if (!todaySchedule || todaySchedule.closed) return { open: false, todayHours: "Fechado hoje" };
  
  // Verificar se open e close existem e são strings
  if (!todaySchedule.open || !todaySchedule.close || typeof todaySchedule.open !== 'string' || typeof todaySchedule.close !== 'string') {
    return { open: false, todayHours: null };
  }
  
  const todayHours = `${todaySchedule.open} – ${todaySchedule.close}`;
  const [openH, openM] = todaySchedule.open.split(":").map(Number);
  const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  return { open: currentMinutes >= openMinutes && currentMinutes <= closeMinutes, todayHours };
}

// ── Component ────────────────────────────────────────────────────────

interface EmpresaDetailLandingPageProps {
  businessId?: string;
}

export default function EmpresaDetailLandingPage({ businessId: propBusinessId }: EmpresaDetailLandingPageProps = {}) {
  const { id: paramId } = useParams();
  const id = propBusinessId || paramId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>("todos");

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    const load = async () => {
      try {
        if (MOCK_BUSINESSES[id]) { setBusiness(MOCK_BUSINESSES[id]); setLoading(false); return; }
        const data = await BusinessService.getBusinessById(id);
        if (data) setBusiness(data); else setNotFound(true);
      } catch { setNotFound(true); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const openStatus = useMemo(() => {
    if (!business) return { open: false, todayHours: null };
    return isCurrentlyOpen(business.horario_funcionamento);
  }, [business]);

  const addressText = useMemo(() => {
    if (!business) return null;
    if (typeof business.address === "object" && business.address) {
      return [business.address.street, business.address.number, business.address.complement].filter(Boolean).join(", ");
    }
    return typeof business.address === "string" ? business.address : null;
  }, [business]);

  const locationText = useMemo(() => {
    if (!business) return null;
    return business.location?.full_name || business.location?.name || null;
  }, [business]);

  const products = MOCK_PRODUCTS;
  const productCategories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return ["todos", ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const list = selectedProductCategory === "todos" ? products : products.filter(p => p.category === selectedProductCategory);
    return showAllProducts ? list : list.slice(0, 4);
  }, [products, selectedProductCategory, showAllProducts]);

  const yearsActive = business ? getYearsActive(business.created_at) : "";
  const isDeliveryBusiness = business?.tem_delivery || business?.modos_atendimento?.includes("delivery");

  // Check if business has gastronomy profile
  const { data: gastronomyProfile } = useGastronomyProfile(business?.profile_id);
  const gastronomyUrl = useMemo(() => {
    if (!business || !gastronomyProfile) return null;
    // Build gastronomy URL: /gastronomia/:state/:city/:district/:slug
    const path = normalizePublicTerritoryPath(business.geographic_path || "");
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 3) {
      const [state, city, district] = parts;
      return `/gastronomia/${state}/${city}/${district}/${business.slug}`;
    }
    return null;
  }, [business, gastronomyProfile]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleShare = async () => {
    const shareData = { title: business?.name, text: `Confira ${business?.name}`, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        const maybeAbort = error as { name?: string };
        if (maybeAbort?.name !== "AbortError") {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copiado!");
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const handleCopyPhone = () => {
    if (business?.phone) {
      navigator.clipboard.writeText(business.phone);
      setCopiedPhone(true);
      toast.success("Telefone copiado!");
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleRoute = () => {
    const addr = addressText || business?.name || "";
    const loc = locationText || "";
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr + " " + loc)}`, "_blank");
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 sm:h-72 w-full rounded-2xl" />
          <div className="flex gap-4"><Skeleton className="h-20 w-20 rounded-xl" /><div className="flex-1 space-y-3"><Skeleton className="h-8 w-60" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-80" /></div></div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" /><span className="text-sm font-medium">Voltar</span>
            </button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <Store className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Empresa não encontrada</h1>
          <p className="text-muted-foreground mb-6">A empresa que você procura não existe ou foi removida.</p>
          <Button onClick={() => navigate("/empresas-landing")} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg">
            <ArrowLeft className="h-4 w-4 mr-2" /> Ver todas as empresas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <BusinessSEO
        name={business.name}
        description={business.description || ""}
        image={business.banner_url || business.logo_url}
        url={(() => {
          const geoPath = (business as any).geographic_path || business.location?.geographic_path;
          if (business.slug && geoPath) {
            try {
              return window.location.origin + BusinessUrlService.getCanonicalUrl({
                id: (business as any).profile_id || business.id,
                slug: business.slug,
                is_premium: business.is_premium,
                geographic_path: geoPath,
              });
            } catch { return window.location.href; }
          }
          return window.location.href;
        })()}
        category={business.category}
        rating={business.rating}
        reviewCount={business.total_reviews}
        address={addressText || ""}
        phone={business.phone}
        email={business.email}
        website={business.website}
        latitude={typeof business.address === 'object' ? business.address?.latitude : undefined}
        longitude={typeof business.address === 'object' ? business.address?.longitude : undefined}
        priceRange="$$"
        openingHours={business.horario_funcionamento}
        paymentMethods={business.formas_pagamento}
      />
      
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* ══════════════════════════════════════════════════════════════
          1. HERO — Logo, Nome, Identidade, Badges, Status, Rating
      ══════════════════════════════════════════════════════════════ */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full">
        {/* Banner */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative mt-4 sm:mt-6 rounded-2xl overflow-hidden aspect-[21/9] sm:aspect-[3/1]">
            {business.banner_url ? (
              <img src={business.banner_url} alt={`Banner de ${business.name}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/10 to-secondary flex items-center justify-center">
                <Store className="h-20 w-20 text-primary/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

            {/* Status badges on banner */}
            <div className="absolute top-3 left-3 flex gap-2">
              {openStatus.open ? (
                <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg px-3 py-1.5 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1.5" /> Aberto agora
                </Badge>
              ) : (
                <Badge className="bg-destructive/90 text-destructive-foreground border-0 shadow-lg px-3 py-1.5 text-xs">Fechado</Badge>
              )}
              {openStatus.todayHours && (
                <Badge className="bg-background/80 backdrop-blur-sm text-foreground border border-border shadow-lg px-3 py-1.5 text-xs">
                  <Clock className="h-3 w-3 mr-1" /> {openStatus.todayHours}
                </Badge>
              )}
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              {business.is_premium && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg px-3 py-1.5 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> Premium
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Company card overlapping banner */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-xl">
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Logo */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl border-2 border-border shadow-md shrink-0 overflow-hidden">
                <BusinessLogo
                  name={business.name}
                  logoUrl={business.logo_url}
                  alt={business.name}
                  initialsClassName="text-3xl sm:text-4xl"
                />
              </div>
              <div className="flex-1 min-w-0">
                {/* Name + verification */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">{business.name}</h1>
                  {business.is_verified && <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />}
                </div>

                {/* Public identity / slug */}
                {business.slug && (
                  <p className="text-sm text-primary font-medium mb-1">@{business.slug}</p>
                )}

                {/* Category + territory */}
                <p className="text-sm text-muted-foreground capitalize mb-2">
                  {business.category}
                  {business.subcategoria && <> · {business.subcategoria}</>}
                  {locationText && (
                    <> · <MapPin className="h-3 w-3 inline-block -mt-0.5" /> {locationText}</>
                  )}
                </p>

                {/* Rating + reviews */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    <span className="text-sm font-bold text-primary">{business.rating?.toFixed(1) || "0.0"}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({business.total_reviews || 0} avaliações)</span>
                  {yearsActive && (
                    <>
                      <div className="h-4 w-px bg-border" />
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Há {yearsActive} no bairro
                      </span>
                    </>
                  )}
                  {/* Coverage Badge */}
                  <CoverageBadge
                    entityType="business"
                    entityId={business.id}
                    className="ml-auto"
                  />
                </div>

                {/* Service modes */}
                {business.modos_atendimento && business.modos_atendimento.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.modos_atendimento.map((modo) => {
                      const config = MODOS_CONFIG[modo];
                      if (!config) return null;
                      const ModoIcon = config.icon;
                      return (
                        <span key={modo} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${config.color}`}>
                          <ModoIcon className="h-3 w-3" /> {config.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════
          CTAs — WhatsApp, Ligar, Rota, Favoritos, Delivery CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-3">
          {/* Primary CTA for delivery businesses */}
          {isDeliveryBusiness && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-xl shadow-lg gap-2">
                <ShoppingBag className="h-5 w-5" /> Pedir Agora
              </Button>
              <Button variant="outline" className="w-full h-12 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-base rounded-xl gap-2">
                <ClipboardList className="h-5 w-5" /> Ver Cardápio
              </Button>
            </div>
          )}

          {/* Action grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {business.whatsapp && (
              <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-emerald-400/40 hover:shadow-lg transition-all group">
                <div className="bg-emerald-400/10 p-2 sm:p-2.5 rounded-lg"><MessageCircle className="h-5 w-5 text-emerald-400" /></div>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-emerald-400 transition-colors">WhatsApp</span>
              </a>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`}
                className="flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-primary/40 hover:shadow-lg transition-all group">
                <div className="bg-primary/10 p-2 sm:p-2.5 rounded-lg"><Phone className="h-5 w-5 text-primary" /></div>
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">Ligar</span>
              </a>
            )}
            <button onClick={() => setShowRouteOptions(!showRouteOptions)}
              className="flex flex-col items-center gap-1.5 bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-amber-400/40 hover:shadow-lg transition-all group">
              <div className="bg-amber-400/10 p-2 sm:p-2.5 rounded-lg"><Navigation className="h-5 w-5 text-amber-400" /></div>
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground group-hover:text-amber-400 transition-colors">Como chegar</span>
            </button>
            <button onClick={() => { setIsFavorite(!isFavorite); toast.success(isFavorite ? "Removido dos favoritos" : "Salvo nos favoritos!"); }}
              className={`flex flex-col items-center gap-1.5 bg-card border rounded-xl p-3 sm:p-4 transition-all group ${isFavorite ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:shadow-lg"}`}>
              <div className={`p-2 sm:p-2.5 rounded-lg ${isFavorite ? "bg-primary/20" : "bg-primary/10"}`}>
                <Bookmark className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : "text-primary"}`} />
              </div>
              <span className={`text-[11px] sm:text-xs font-medium ${isFavorite ? "text-primary" : "text-muted-foreground"}`}>Salvar</span>
            </button>
            <button onClick={() => { setHasRecommended(!hasRecommended); toast.success(hasRecommended ? "Recomendação removida" : "Obrigado pela recomendação!"); }}
              className={`flex flex-col items-center gap-1.5 bg-card border rounded-xl p-3 sm:p-4 transition-all group ${hasRecommended ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 hover:shadow-lg"}`}>
              <div className={`p-2 sm:p-2.5 rounded-lg ${hasRecommended ? "bg-primary/20" : "bg-primary/10"}`}>
                <ThumbsUp className={`h-5 w-5 ${hasRecommended ? "fill-primary text-primary" : "text-primary"}`} />
              </div>
              <span className={`text-[11px] sm:text-xs font-medium ${hasRecommended ? "text-primary" : "text-muted-foreground"}`}>Recomendar</span>
            </button>
          </div>

          {/* Route options */}
          <AnimatePresence>
            {showRouteOptions && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Escolha como chegar</p>
                  {[
                    { icon: Footprints, label: "A pé", detail: "~5 min", color: "text-primary", onClick: handleRoute },
                    { icon: Car, label: "De carro", detail: "~2 min", color: "text-amber-400", onClick: handleRoute },
                    { icon: ExternalLink, label: "Abrir no Google Maps", detail: "Navegação externa", color: "text-sky-400", onClick: handleRoute },
                  ].map((opt, i) => (
                    <button key={i} onClick={opt.onClick}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <opt.icon className={`h-5 w-5 ${opt.color}`} />
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.detail}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          GASTRONOMY CTA — Se negócio tem perfil gastronômico
      ══════════════════════════════════════════════════════════════ */}
      {gastronomyUrl && business && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25 }}
          >
            <GastronomyCTA 
              gastronomyUrl={gastronomyUrl} 
              businessName={business.name} 
            />
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          2. RESUMO OBJETIVO
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Sobre a empresa</h2>
          </div>
          {business.description && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">{business.description}</p>
          )}
          {/* Quick facts */}
          <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
            {yearsActive && (
              <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Há {yearsActive} no bairro
              </span>
            )}
            {business.total_reviews > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg">
                <Star className="h-3.5 w-3.5 text-primary" /> {business.total_reviews} avaliações
              </span>
            )}
            {business.is_verified && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/20">
                <BadgeCheck className="h-3.5 w-3.5" /> Empresa verificada
              </span>
            )}
          </div>
          {/* Specialties */}
          {business.especialidades && business.especialidades.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {business.especialidades.map((esp, idx) => (
                  <span key={idx} className="bg-primary/5 text-primary text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/10">{esp}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. INFORMAÇÕES PRÁTICAS
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left column: address, hours, contact */}
          <div className="lg:col-span-2 space-y-4">
            {/* Address + Map with Route */}
            {business.address?.latitude && business.address?.longitude ? (
              <StandaloneMap business={business as any} />
            ) : (
              // Fallback: Card com endereço se não houver coordenadas
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="relative h-44 sm:h-52 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/20 cursor-pointer group" onClick={handleRoute}>
                  <div className="absolute inset-0 opacity-10">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={`h-${i}`} className="absolute border-b border-foreground/20" style={{ top: `${(i + 1) * 12}%`, left: 0, right: 0 }} />
                    ))}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={`v-${i}`} className="absolute border-r border-foreground/20" style={{ left: `${(i + 1) * 8}%`, top: 0, bottom: 0 }} />
                    ))}
                  </div>
                  {/* Business pin */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="absolute -inset-6 bg-primary/10 rounded-full animate-pulse" />
                      <div className="h-10 w-10 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center relative z-10">
                        <Store className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
                    </div>
                  </div>
                  {/* Open in maps overlay */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Abrir no mapa
                    </span>
                  </div>
                </div>

                {/* Address details */}
                <div className="p-5 space-y-3">
                  {addressText && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{addressText}</p>
                        {locationText && <p className="text-xs text-muted-foreground">{locationText}</p>}
                        {typeof business.address === "object" && business.address?.postal_code && (
                          <p className="text-xs text-muted-foreground">CEP: {business.address.postal_code}</p>
                        )}
                      </div>
                    </div>
                  )}
                  <Button onClick={handleRoute} variant="outline" className="w-full gap-2 rounded-lg border-primary/20 text-primary hover:bg-primary/5">
                    <Navigation className="h-4 w-4" /> Traçar rota no Google Maps
                  </Button>
                </div>
              </div>
            )}

            {/* Operating hours */}
            {business.horario_funcionamento && (
              <div className="bg-card border border-border rounded-xl p-5">
                <button onClick={() => setShowAllHours(!showAllHours)} className="w-full flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h2 className="text-base font-bold text-foreground">Horário de funcionamento</h2>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAllHours ? "rotate-180" : ""}`} />
                </button>
                {/* Today's status */}
                <div className={`flex items-center gap-2 mb-3 p-2.5 rounded-lg ${openStatus.open ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-destructive/10 border border-destructive/20"}`}>
                  <div className={`h-2 w-2 rounded-full ${openStatus.open ? "bg-emerald-500 animate-pulse" : "bg-destructive"}`} />
                  <span className={`text-sm font-semibold ${openStatus.open ? "text-emerald-400" : "text-destructive"}`}>
                    {openStatus.open ? "Aberto agora" : "Fechado"}
                  </span>
                  {openStatus.todayHours && (
                    <span className="text-sm text-muted-foreground">· Hoje: {openStatus.todayHours}</span>
                  )}
                </div>
                {/* Full schedule */}
                <AnimatePresence>
                  {showAllHours && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden">
                      {Object.entries(business.horario_funcionamento).map(([day, hours]) => {
                        const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
                        const isToday = days[new Date().getDay()] === day;
                        return (
                          <div key={day} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isToday ? "bg-primary/5 border border-primary/10" : ""}`}>
                            <span className={`text-sm ${isToday ? "font-bold text-primary" : "text-foreground"}`}>
                              {DAY_NAMES[day] || day} {isToday && <span className="text-xs ml-1">(hoje)</span>}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {hours?.open && hours?.close ? `${hours.open} – ${hours.close}` : "Fechado"}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Service modes & delivery areas */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Formas de atendimento</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {business.modos_atendimento?.map((modo) => {
                  const config = MODOS_CONFIG[modo];
                  if (!config) return null;
                  const ModoIcon = config.icon;
                  return (
                    <div key={modo} className={`flex items-center gap-3 p-3 rounded-lg border ${config.color}`}>
                      <ModoIcon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                  );
                })}
              </div>
              {/* Delivery areas */}
              {isDeliveryBusiness && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Área de atendimento / delivery</p>
                  <div className="flex flex-wrap gap-2">
                    {AREAS_ATENDIDAS.map((area, i) => (
                      <span key={i} className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-lg">
                        <MapPinned className="h-3 w-3 inline-block mr-1 -mt-0.5" />{area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment methods */}
            {(business.formas_pagamento?.length > 0 || business.aceita_pix || business.aceita_cartao) && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Formas de pagamento</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {business.aceita_pix && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium px-3 py-2 rounded-lg">
                      <Banknote className="h-3.5 w-3.5" /> PIX
                    </span>
                  )}
                  {business.aceita_cartao && (
                    <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium px-3 py-2 rounded-lg">
                      <CreditCard className="h-3.5 w-3.5" /> Cartão
                    </span>
                  )}
                  {business.formas_pagamento?.map((method, idx) => (
                    <span key={idx} className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-2 rounded-lg border border-border">{method}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: contact, social, facilities */}
          <div className="space-y-4">
            {/* Contact info */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-base font-bold text-foreground mb-4">Contato</h2>
              <div className="space-y-3">
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <a href={`tel:${business.phone}`} className="text-sm text-foreground hover:text-primary transition-colors flex-1">{business.phone}</a>
                    <button onClick={handleCopyPhone} className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80">
                      {copiedPhone ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  </div>
                )}
                {business.whatsapp && (
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <a href={`https://wa.me/${business.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-foreground hover:text-emerald-400 transition-colors">WhatsApp</a>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <a href={`mailto:${business.email}`} className="text-sm text-foreground hover:text-primary transition-colors truncate">{business.email}</a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex items-center gap-1">
                      {business.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
              {/* Social */}
              {(business.instagram || business.facebook) && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  {business.instagram && (
                    <a href={`https://instagram.com/${business.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                      <Instagram className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">@{business.instagram}</span>
                    </a>
                  )}
                  {business.facebook && (
                    <a href={`https://facebook.com/${business.facebook}`} target="_blank" rel="noopener noreferrer"
                      className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center hover:border-sky-500/40 transition-colors">
                      <Facebook className="h-4 w-4 text-sky-400" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Facilities */}
            {business.facilidades && business.facilidades.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-bold text-foreground mb-3">Facilidades</h2>
                <div className="space-y-2.5">
                  {business.facilidades.map((fac, idx) => {
                    const Icon = FACILITY_ICONS[fac] || Store;
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2.5">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground font-medium">{FACILITY_LABELS[fac] || fac.replace(/_/g, " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Claim CTA */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 rounded-xl p-5 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">Esta é a sua empresa?</p>
              <p className="text-xs text-muted-foreground mb-3">Reivindique e gerencie seu perfil gratuitamente</p>
              <Button onClick={() => navigate("/empresas/criar-empresa")} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg h-9">
                Reivindicar empresa
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. PRODUTOS / SERVIÇOS
      ══════════════════════════════════════════════════════════════ */}
      {products.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Produtos & Serviços</h2>
              </div>
              <span className="text-xs text-muted-foreground">{products.length} itens</span>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
              {productCategories.map((cat) => (
                <button key={cat} onClick={() => setSelectedProductCategory(cat)}
                  className={`shrink-0 text-xs font-medium px-4 py-2 rounded-lg transition-all ${
                    selectedProductCategory === cat
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                  }`}>
                  {cat === "todos" ? "Todos" : cat}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg transition-all group">
                  <div className="flex gap-4">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-20 w-20 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
                        <Utensils className="h-6 w-6 text-primary/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                        {product.featured && <Tag className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {product.promotional_price ? (
                          <>
                            <span className="text-sm font-bold text-primary">
                              R$ {product.promotional_price.toFixed(2).replace(".", ",")}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              R$ {product.price.toFixed(2).replace(".", ",")}
                            </span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0">
                              <Percent className="h-2.5 w-2.5 mr-0.5" /> OFF
                            </Badge>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-foreground">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show more */}
            {products.length > 4 && (
              <button onClick={() => setShowAllProducts(!showAllProducts)}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary hover:underline">
                {showAllProducts ? (
                  <><ChevronUp className="h-4 w-4" /> Mostrar menos</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> Ver todos os {products.length} itens</>
                )}
              </button>
            )}
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          5. AVALIAÇÕES
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Avaliações</h2>
            </div>
          </div>

          {/* Rating summary */}
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center shrink-0">
                <p className="text-5xl font-bold text-foreground">{business.rating?.toFixed(1) || "0.0"}</p>
                <div className="flex items-center gap-0.5 mt-2 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.floor(business.rating || 0) ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{business.total_reviews || 0} avaliações</p>
              </div>
              <div className="flex-1 w-full space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = MOCK_REVIEWS.filter((r) => r.rating === star).length;
                  const pct = MOCK_REVIEWS.length > 0 ? (count / MOCK_REVIEWS.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-3">{star}</span>
                      <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Individual reviews */}
          <div className="space-y-3">
            {MOCK_REVIEWS.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                    {getInitials(review.user_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground">{review.user_name}</h3>
                        {review.isNeighbor && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                            <Home className="h-2.5 w-2.5 mr-0.5" /> Vizinho
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(review.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Write review CTA */}
          <div className="mt-4 bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">Já visitou {business.name}?</p>
            <p className="text-xs text-muted-foreground mb-3">Compartilhe sua experiência com os vizinhos</p>
            <Button onClick={() => user ? toast.info("Em breve!") : navigate("/login")}
              variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 gap-2">
              <Star className="h-4 w-4" /> Escrever avaliação
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. FOTOS
      ══════════════════════════════════════════════════════════════ */}
      {business.fotos && business.fotos.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Fotos</h2>
              <span className="text-xs text-muted-foreground">({business.fotos.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {business.fotos.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          REDE / FILIAIS
      ══════════════════════════════════════════════════════════════ */}
      {(business as any).business_role && (business as any).business_role !== 'standalone' && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
          <BranchNetworkBlock
            businessRole={(business as any).business_role}
            parentBusinessId={(business as any).parent_business_id ?? null}
            currentBranchId={(business as any).id}
            brandHubId={(business as any).id}
            brandName={(business as any).business_name || business.name}
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          7. EMPRESAS PRÓXIMAS
      ══════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-8 pb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Empresas próximas</h2>
            </div>
            <button onClick={() => navigate("/empresas-landing")} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NEARBY_BUSINESSES.filter(b => b.id !== business.id).slice(0, 4).map((biz) => (
              <button key={biz.id} onClick={() => navigate(`/empresa/${biz.id}`)}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-lg transition-all text-left group">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{biz.name}</h3>
                      {biz.isOpen ? (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="shrink-0 h-2 w-2 rounded-full bg-muted-foreground/40" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{biz.category}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-primary font-semibold">
                        <MapPin className="h-3 w-3" /> {biz.distance}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3 w-3 fill-primary text-primary" /> {biz.rating}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-1 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">Empresas <span className="text-primary">Locais</span></span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => navigate("/empresas-landing")} className="hover:text-primary transition-colors">Todas as empresas</button>
              <button onClick={() => navigate("/termos")} className="hover:text-primary transition-colors">Termos</button>
              <button onClick={() => navigate("/privacidade")} className="hover:text-primary transition-colors">Privacidade</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
