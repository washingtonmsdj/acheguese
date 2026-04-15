/**
 * EmpresasLandingPage — Página de Empresas (Comunidade)
 * Estilo Nextdoor: mapa, distâncias, recomendações de vizinhos, rotas
 * 
 * Integrado com sistema territorial - usa dados reais quando disponível,
 * fallback para mocks durante migração gradual
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Store, MapPin, Star, Clock, ChevronRight, Home, ArrowRight,
  Sparkles, Building2, ShoppingBag, Utensils, Heart, GraduationCap,
  Wrench, Truck, Filter, TrendingUp, Award, Users, Navigation,
  ThumbsUp, MessageCircle, Share2, Route, Shield, Phone, Bookmark,
  Eye, Flame, Crown, BadgeCheck, ArrowUpRight, Zap, Map as MapIcon,
  X, ExternalLink, Plus,
} from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useState, useMemo, useEffect } from "react";
import { useBusinessList } from "@/modules/business/hooks/useBusinessList";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { useBusinessUrls } from "@/modules/business/hooks/useBusinessUrls";
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { useTerritoryLabels } from "@/core/location";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { NearbyToggle } from "@/core/geospatial/components/NearbyToggle";
import { DistanceBadge } from "@/core/geospatial/components/DistanceBadge";
import { useNearbyEntities } from "@/core/geospatial/hooks/useSpatialSearch";
import { useRobustGeolocation } from "@/shared/hooks";

import heroImg from "@/assets/empresas-hero.jpg";
import heroImg2 from "@/assets/servicos-hero.jpg";
import heroImg3 from "@/assets/gastronomy-hero-bg.jpg";

interface EmpresasLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ── Categorias ───────────────────────────────────────────────────────
const CATEGORIES = [
  { icon: Utensils, label: "Restaurantes", count: "124", iconColor: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/20", slug: "restaurantes" },
  { icon: ShoppingBag, label: "Mercados", count: "67", iconColor: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", slug: "mercados" },
  { icon: Heart, label: "Saúde", count: "89", iconColor: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/20", slug: "saude" },
  { icon: GraduationCap, label: "Educação", count: "45", iconColor: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/20", slug: "educacao" },
  { icon: Wrench, label: "Serviços", count: "156", iconColor: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/20", slug: "servicos" },
  { icon: Store, label: "Lojas", count: "203", iconColor: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/20", slug: "outros" },
];

// Helper para gerar URL de empresa
const getBusinessUrl = (
  business: { id: string; slug?: string; is_premium?: boolean; geographic_path?: string | null },
  fallbackUrl: string
) => {
  if (business.slug) {
    return BusinessUrlService.getCanonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium || false,
      geographic_path: business.geographic_path || null,
    });
  }
  // Fallback para mock sem slug - usa URL dinâmica
  return `${fallbackUrl}/${business.id}`;
};

// ── Empresas com dados comunitários ──────────────────────────────────
const FEATURED_BUSINESSES = [
  {
    id: "sabor-da-bahia", 
    slug: "sabor-da-bahia",
    geographic_path: "/br/ba/salvador/pituba",
    name: "Sabor da Bahia", 
    category: "Restaurante",
    subcategoria: "Culinária Baiana",
    rating: 4.8, 
    reviews: 234, 
    distance: "350m", 
    walkTime: "5 min",
    description: "Comida baiana autêntica com ingredientes frescos do mercado local.",
    tags: ["Delivery", "Presencial"], 
    premium: true, 
    isOpen: true,
    neighborRecs: 47, 
    lastVisit: "Maria recomendou há 2h",
    coords: { lat: -12.975, lng: -38.476 },
    phone: "(71) 3333-4444",
    whatsapp: "5571999998888",
    email: "contato@sabordabahia.com.br",
    website: "https://sabordabahia.com.br",
    is_premium: true,
    is_verified: true,
    horario_funcionamento: {
      segunda: { open: "11:00", close: "22:00" },
      terca: { open: "11:00", close: "22:00" },
      quarta: { open: "11:00", close: "22:00" },
      quinta: { open: "11:00", close: "22:00" },
      sexta: { open: "11:00", close: "23:00" },
      sabado: { open: "11:00", close: "23:00" },
      domingo: { open: "12:00", close: "21:00" },
    },
    formas_pagamento: ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"],
    especialidades: ["Moqueca de Camarão", "Acarajé", "Vatapá"],
    facilidades: ["estacionamento", "acessibilidade", "wifi"],
    modos_atendimento: ["presencial", "delivery"],
  },
  {
    id: "farmacia-saude-plus",
    slug: "farmacia-saude-plus",
    geographic_path: "/br/ba/salvador/pituba",
    name: "Farmácia Saúde+", 
    category: "Farmácia",
    rating: 4.6, 
    reviews: 189, 
    distance: "120m", 
    walkTime: "2 min",
    description: "Medicamentos, higiene pessoal e atendimento farmacêutico 24h.",
    tags: ["Delivery", "24h"], 
    premium: false, 
    isOpen: true,
    neighborRecs: 89, 
    lastVisit: "João visitou ontem",
    coords: { lat: -12.974, lng: -38.477 },
    phone: "(71) 3222-5555",
    whatsapp: "5571988887777",
    email: "atendimento@farmaciasaudemais.com.br",
    is_premium: false,
    is_verified: true,
    horario_funcionamento: {
      segunda: { open: "00:00", close: "23:59" },
      terca: { open: "00:00", close: "23:59" },
      quarta: { open: "00:00", close: "23:59" },
      quinta: { open: "00:00", close: "23:59" },
      sexta: { open: "00:00", close: "23:59" },
      sabado: { open: "00:00", close: "23:59" },
      domingo: { open: "00:00", close: "23:59" },
    },
    formas_pagamento: ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"],
    especialidades: ["Manipulação", "Dermocosméticos", "Homeopatia"],
    facilidades: ["estacionamento", "acessibilidade"],
    modos_atendimento: ["presencial", "delivery"],
  },
  {
    id: "auto-center-nordeste",
    slug: "auto-center-nordeste",
    geographic_path: "/br/ba/salvador/pituba",
    name: "Auto Center Nordeste", 
    category: "Serviços",
    rating: 4.9, 
    reviews: 312, 
    distance: "800m", 
    walkTime: "12 min",
    description: "Mecânica geral, troca de óleo e alinhamento com preço justo.",
    tags: ["Presencial"], 
    premium: true, 
    isOpen: false,
    neighborRecs: 156, 
    lastVisit: "Carlos avaliou com 5★ há 1 dia",
    coords: { lat: -12.976, lng: -38.475 },
    phone: "(71) 99999-9012",
    is_premium: true,
    is_verified: true,
    horario_funcionamento: {
      segunda: { open: "08:00", close: "18:00" },
      terca: { open: "08:00", close: "18:00" },
      quarta: { open: "08:00", close: "18:00" },
      quinta: { open: "08:00", close: "18:00" },
      sexta: { open: "08:00", close: "18:00" },
      sabado: { open: "08:00", close: "12:00" },
      domingo: { closed: true },
    },
    formas_pagamento: ["PIX", "Cartão de Crédito", "Dinheiro"],
    especialidades: ["Mecânica Geral", "Troca de Óleo", "Alinhamento"],
    facilidades: ["estacionamento"],
    modos_atendimento: ["presencial"],
  },
  {
    id: "mercadinho-familia",
    slug: "mercadinho-familia",
    geographic_path: "/br/ba/salvador/pituba",
    name: "Mercadinho Família", 
    category: "Mercado",
    rating: 4.5, 
    reviews: 156, 
    distance: "200m", 
    walkTime: "3 min",
    description: "Produtos frescos, hortifrúti e itens essenciais do dia a dia.",
    tags: ["Delivery", "Presencial"], 
    premium: false, 
    isOpen: true,
    neighborRecs: 203, 
    lastVisit: "Ana comprou hoje",
    coords: { lat: -12.973, lng: -38.478 },
    phone: "(71) 99999-3456",
    is_premium: false,
    is_verified: true,
    horario_funcionamento: {
      segunda: { open: "07:00", close: "20:00" },
      terca: { open: "07:00", close: "20:00" },
      quarta: { open: "07:00", close: "20:00" },
      quinta: { open: "07:00", close: "20:00" },
      sexta: { open: "07:00", close: "20:00" },
      sabado: { open: "07:00", close: "18:00" },
      domingo: { open: "08:00", close: "13:00" },
    },
    formas_pagamento: ["PIX", "Cartão de Crédito", "Dinheiro"],
    especialidades: ["Hortifrúti", "Produtos Frescos", "Mercearia"],
    facilidades: ["estacionamento"],
    modos_atendimento: ["presencial", "delivery"],
  },
  {
    id: "salao-beleza-rosa",
    slug: "salao-beleza-rosa",
    geographic_path: "/br/ba/salvador/pituba",
    name: "Salão Beleza Rosa", 
    category: "Beleza",
    rating: 4.7, 
    reviews: 98, 
    distance: "450m", 
    walkTime: "7 min",
    description: "Cortes, coloração, unhas e tratamentos capilares com agendamento online.",
    tags: ["Agendamento"], 
    premium: false, 
    isOpen: true,
    neighborRecs: 34, 
    lastVisit: "Luísa agendou ontem",
    coords: { lat: -12.977, lng: -38.474 },
    phone: "(71) 99999-7890",
    is_premium: false,
    is_verified: true,
    horario_funcionamento: {
      segunda: { closed: true },
      terca: { open: "09:00", close: "19:00" },
      quarta: { open: "09:00", close: "19:00" },
      quinta: { open: "09:00", close: "19:00" },
      sexta: { open: "09:00", close: "20:00" },
      sabado: { open: "09:00", close: "17:00" },
      domingo: { closed: true },
    },
    formas_pagamento: ["PIX", "Cartão de Crédito", "Dinheiro"],
    especialidades: ["Cortes", "Coloração", "Manicure"],
    facilidades: ["acessibilidade"],
    modos_atendimento: ["presencial"],
  },
  {
    id: "padaria-pao-quente",
    slug: "padaria-pao-quente",
    geographic_path: "/br/ba/salvador/pituba",
    name: "Padaria Pão Quente", 
    category: "Padaria",
    rating: 4.9, 
    reviews: 412, 
    distance: "90m", 
    walkTime: "1 min",
    description: "Pães artesanais, bolos e café fresquinho desde às 5h da manhã.",
    tags: ["Presencial"], 
    premium: true, 
    isOpen: true,
    neighborRecs: 312, 
    lastVisit: "15 vizinhos compraram hoje",
    coords: { lat: -12.974, lng: -38.476 },
    phone: "(71) 99999-2345",
    is_premium: true,
    is_verified: true,
    horario_funcionamento: {
      segunda: { open: "05:00", close: "20:00" },
      terca: { open: "05:00", close: "20:00" },
      quarta: { open: "05:00", close: "20:00" },
      quinta: { open: "05:00", close: "20:00" },
      sexta: { open: "05:00", close: "20:00" },
      sabado: { open: "05:00", close: "20:00" },
      domingo: { open: "06:00", close: "14:00" },
    },
    formas_pagamento: ["PIX", "Cartão de Crédito", "Dinheiro"],
    especialidades: ["Pães Artesanais", "Bolos", "Café"],
    facilidades: ["wifi"],
    modos_atendimento: ["presencial"],
  },
];

// ── Atividade recente dos vizinhos ───────────────────────────────────
const NEIGHBOR_ACTIVITY = [
  { user: "Maria S.", action: "recomendou", business: "Sabor da Bahia", time: "2h atrás", emoji: "👍" },
  { user: "João P.", action: "visitou", business: "Farmácia Saúde+", time: "3h atrás", emoji: "📍" },
  { user: "Ana L.", action: "avaliou com 5★", business: "Padaria Pão Quente", time: "5h atrás", emoji: "⭐" },
  { user: "Carlos M.", action: "pediu delivery de", business: "Mercadinho Família", time: "6h atrás", emoji: "🛵" },
  { user: "Luísa R.", action: "agendou no", business: "Salão Beleza Rosa", time: "1 dia", emoji: "💇" },
];

// ── Stats ────────────────────────────────────────────────────────────
const STATS = [
  { icon: Store, value: "850+", label: "empresas cadastradas" },
  { icon: Star, value: "4.7", label: "avaliação média" },
  { icon: Users, value: "15k+", label: "clientes ativos" },
  { icon: ThumbsUp, value: "2.3k", label: "recomendações de vizinhos" },
];

// ── Quick Filters ────────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: "Perto de mim", icon: Navigation, active: false },
  { label: "Abertos agora", icon: Clock, active: false },
  { label: "Com delivery", icon: Truck, active: false },
  { label: "Recomendados", icon: ThumbsUp, active: false },
  { label: "Verificados", icon: Shield, active: false },
];

// ── NAV LINKS ────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Início", path: "/" },
  { label: "Empresas", path: "/empresas-landing" },
  { label: "Classificados", path: LAUNCH_URLS.classifieds },
  { label: "Serviços", path: LAUNCH_URLS.services },
  { label: "Eventos", path: LAUNCH_URLS.events || "#" },
];

export default function EmpresasLandingPage({ resolved: resolvedProp, activeMemberIds: activeMemberIdsProp }: EmpresasLandingPageProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hook seguro: retorna null fora de TerritorialLayout
  const territorialContext = useTerritorialContextOptional();
  
  const resolved = territorialContext?.resolved ?? resolvedProp;
  const activeMemberIds = territorialContext?.activeMemberIds ?? activeMemberIdsProp;
  
  // ✅ SSOT para labels territoriais
  const territoryLabels = useTerritoryLabels(resolved);
  
  // ✅ Extrair nome do território resolvido com preposição adequada
  const territoryName = useMemo(() => {
    if (!resolved) return "Sua Região";
    const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
    return name;
  }, [resolved]);
  
  // ✅ Nome abreviado para títulos (Complexo -> Cpx)
  const territoryNameShort = useMemo(() => {
    return territoryName.replace(/^Complexo\s+/i, 'Cpx ');
  }, [territoryName]);
  
  // ✅ Determinar preposição correta (de/do/da)
  const territoryPreposition = useMemo(() => {
    if (!resolved) return "de";
    const name = territoryName;
    
    // Regras de preposição
    if (name.toLowerCase().startsWith('complexo')) return 'do';
    if (name.toLowerCase().startsWith('cpx')) return 'do';
    if (name.toLowerCase().startsWith('conjunto')) return 'do';
    if (name.toLowerCase().startsWith('vale')) return 'do';
    if (name.toLowerCase().startsWith('parque')) return 'do';
    if (name.toLowerCase().startsWith('jardim')) return 'do';
    
    // Femininos comuns
    if (name.toLowerCase().endsWith('cidade')) return 'da';
    if (name.toLowerCase().endsWith('vila')) return 'da';
    if (name.toLowerCase().endsWith('praia')) return 'da';
    if (name.toLowerCase().endsWith('chapada')) return 'da';
    
    // Padrão: "de"
    return 'de';
  }, [resolved, territoryName]);
  const businessUrls = useBusinessUrls(resolved);
  const moduleUrls = useFriendlyModuleUrls();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);
  const [savedBusinesses, setSavedBusinesses] = useState<Set<string>>(new Set());
  const [nearbyMode, setNearbyMode] = useState(false);
  
  // Geolocalização do usuário
  const { coords: userLocation } = useRobustGeolocation({ useCache: true });
  
  // Buscar empresas próximas quando modo "perto de mim" ativo
  const { data: nearbyBusinesses, isLoading: isLoadingNearby } = useNearbyEntities({
    userLocation,
    entityType: 'business',
    radiusKm: 5,
    locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
    limit: 50,
  });
  
  // Carrossel de banners
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerImages = [heroImg, heroImg2, heroImg3];
  
  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000); // Troca a cada 5 segundos
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // Buscar empresas reais do banco quando em contexto territorial
  const { businesses: realBusinesses, isLoading } = useBusinessList({
    searchQuery: searchQuery.trim() || undefined,
    enabled: !!resolved, // Só busca se tiver contexto territorial
    routeResolved: resolved,
    activeMemberIds,
  });
  
  // Polígonos do território — SSOT: useTerritoryPolygon (mesmo que MapaPageV4)
  const { polygons: territoryPolygons, isLoading: isLoadingBounds } = useTerritoryPolygon(resolved ?? null);

  // Usar empresas reais se disponíveis, senão usar mocks
  const businessesToShow = useMemo(() => {
    // Se modo "perto de mim" ativo e temos resultados, usar nearbyBusinesses
    if (nearbyMode && nearbyBusinesses && nearbyBusinesses.length > 0) {
      return nearbyBusinesses.map((result: any) => ({
        id: result.entity_id || result.id,
        name: result.entity_data?.name || result.name || 'Empresa',
        category: result.entity_data?.category || "Outros",
        rating: result.entity_data?.rating || 0,
        reviews: result.entity_data?.total_reviews || 0,
        distance: `${((result.distance_meters ?? 0) / 1000).toFixed(1)} km`,
        walkTime: `${Math.round((result.distance_meters ?? 0) / 80)} min`,
        description: result.entity_data?.description || "",
        tags: [],
        premium: result.entity_data?.is_premium || false,
        isOpen: true,
        neighborRecs: 0,
        lastVisit: "",
        coords: { 
          lat: result.entity_data?.address?.latitude || result.latitude || 0, 
          lng: result.entity_data?.address?.longitude || result.longitude || 0 
        },
        phone: result.entity_data?.phone || "",
        slug: result.entity_data?.slug || result.slug,
        is_premium: result.entity_data?.is_premium,
        geographic_path: result.entity_data?.geographic_path,
        distanceMeters: result.distance_meters,
      }));
    }
    
    // Senão, usar empresas do contexto territorial ou mocks
    return realBusinesses.length > 0 
      ? realBusinesses.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category || "Outros",
          rating: b.rating || 0,
          reviews: b.total_reviews || 0,
          distance: "N/A",
          walkTime: "N/A",
          description: b.description || "",
          tags: [],
          premium: b.is_premium || false,
          isOpen: true,
          neighborRecs: 0,
          lastVisit: "",
          coords: { lat: (b.address as any)?.latitude || 0, lng: (b.address as any)?.longitude || 0 },
          phone: b.phone || "",
          slug: b.slug,
          is_premium: b.is_premium,
          geographic_path: (b as any).geographic_path,
        }))
      : FEATURED_BUSINESSES;
  }, [nearbyMode, nearbyBusinesses, realBusinesses]);

  const toggleFilter = (label: string) => {
    setActiveFilters((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedBusinesses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredBusinesses = useMemo(() => {
    let result = businessesToShow;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
      );
    }
    if (activeFilters.includes("Abertos agora")) result = result.filter((b) => b.isOpen);
    if (activeFilters.includes("Com delivery")) result = result.filter((b) => b.tags.includes("Delivery"));
    if (activeFilters.includes("Recomendados")) result = result.filter((b) => b.neighborRecs > 100);
    if (activeFilters.includes("Perto de mim")) {
      result = [...result].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }
    return result;
  }, [businessesToShow, searchQuery, activeFilters]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      
      {/* ─── Categorias no Topo ────────────────── */}
      <section className="w-full bg-card/50 border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`${businessUrls.list}/categoria/${cat.slug}`)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group ${cat.bg}`}
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Icon className={`h-7 w-7 ${cat.iconColor}`} />
                  </motion.div>
                  <span className="text-xs font-semibold text-foreground leading-tight text-center">
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="relative group">
        <CanonicalHero
          moduleName="Empresas"
          moduleIcon={Store}
          territoryName={territoryName}
          territoryFallback="Sua Região"
          title={`Empresas ${territoryPreposition}`}
          titleHighlight={territoryNameShort}
          subtitle="Descubra, avalie e recomende negócios perto de você. Veja o que seus vizinhos estão indicando."
          backgroundImage={bannerImages[currentBannerIndex]}
          search={{
            placeholder: "Buscar empresa, categoria...",
            value: searchQuery,
            onChange: setSearchQuery,
          }}
          primaryCTA={{ 
            label: "Cadastrar Empresa", 
            icon: Plus,
            onClick: () => navigate("/empresas/criar-empresa")
          }}
        />
        
        {/* Setas de navegação */}
        <button
          onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:scale-110"
          aria-label="Banner anterior"
        >
          <ChevronRight className="h-5 w-5 rotate-180 text-foreground" />
        </button>
        
        <button
          onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background hover:scale-110"
          aria-label="Próximo banner"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
        
        {/* Indicadores do carrossel */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentBannerIndex 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Banner ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── FILTROS RÁPIDOS ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4 w-full">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {QUICK_FILTERS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => toggleFilter(chip.label)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                activeFilters.includes(chip.label)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/30'
              }`}
            >
              <chip.icon className="h-3.5 w-3.5" />
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ATIVIDADE DOS VIZINHOS (FEED) ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-2 w-full">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground font-heading">Atividade dos Vizinhos</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {NEIGHBOR_ACTIVITY.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 min-w-[280px] shrink-0 hover:border-primary/30 transition-colors">
              <span className="text-xl">{item.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">
                  <span className="font-semibold">{item.user}</span>{" "}
                  <span className="text-muted-foreground">{item.action}</span>{" "}
                  <span className="font-semibold text-primary">{item.business}</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── MAPA DO BAIRRO ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">{territoryLabels.mapLabel}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Empresas perto de você · clique para ver detalhes</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/mapa")}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary text-xs rounded-lg gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> Mapa completo
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="relative h-96 md:h-[500px]">
            <MapLibreAdapter
              styleUrl={DEFAULT_TILE_STYLE.styleUrl}
              territoryPolygons={territoryPolygons}
              resolved={resolved}
              enableClustering={true}
              markers={businessesToShow
                .filter(b => b.coords.lat && b.coords.lng)
                .map(b => ({
                  id: b.id,
                  type: 'business' as const,
                  coordinates: { latitude: b.coords.lat, longitude: b.coords.lng },
                  title: b.name,
                  status: (b.isOpen ? 'active' : 'inactive') as const,
                  metadata: { category: b.category, rating: b.rating },
                }))}
              onMarkerClick={(id) => {
                const biz = businessesToShow.find(b => b.id === id);
                if (biz?.slug) navigate(`${moduleUrls.business}/${biz.slug}`);
              }}
              controls={{
                search: {
                  type: 'entity-filter',
                  position: 'top-left',
                  placeholder: 'Buscar empresas...',
                },
                location: {
                  enabled: true,
                  position: 'top-right',
                  showAccuracy: true,
                  autoFlyTo: true,
                },
              }}
              userLocationMarker={{ enabled: true, autoAdd: true }}
              className="w-full h-full"
            />
          </div>

          {/* Map bottom bar */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredBusinesses.length}</span> empresas no mapa
              {isLoadingBounds && <span className="ml-2 text-primary">· Carregando limites do bairro...</span>}
              {territoryPolygons.length > 1 && (
                <span className="ml-2 flex items-center gap-1.5 flex-wrap">
                  {territoryPolygons.map(p => (
                    <span key={p.name} className="flex items-center gap-1">
                      <span style={{ background: p.color }} className="inline-block w-2.5 h-2.5 rounded-sm" />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── PERTO DE VOCÊ ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" /> Perto de Você
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {nearbyMode ? 'Ordenado por distância' : 'Empresas do bairro'} · {filteredBusinesses.length} resultados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NearbyToggle
              active={nearbyMode}
              onToggle={setNearbyMode}
              activeText="Perto de mim ✓"
              inactiveText="Perto de mim"
            />
            <Button variant="outline" onClick={() => navigate(businessUrls.list)}
              className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-lg hidden sm:flex">
              Ver todas
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBusinesses.map((biz, i) => (
            <motion.div key={biz.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(getBusinessUrl(biz, moduleUrls.business))}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group relative">

              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0 relative">
                    {biz.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                    {biz.premium && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning flex items-center justify-center">
                        <Crown className="h-2.5 w-2.5 text-warning-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors font-heading">{biz.name}</h3>
                      <BadgeCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{biz.category}</span>
                      <span>·</span>
                      <span className={biz.isOpen ? "text-success font-medium" : "text-destructive"}>{biz.isOpen ? "Aberto" : "Fechado"}</span>
                    </div>
                  </div>
                </div>

                {/* Distance badge */}
                <div className="flex flex-col items-end gap-1">
                  {biz.distanceMeters !== undefined && nearbyMode ? (
                    <DistanceBadge distanceMeters={biz.distanceMeters} showIcon={true} />
                  ) : (
                    <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg">
                      <Navigation className="h-3 w-3 text-primary" />
                      <span className="text-sm font-bold text-primary">{biz.distance}</span>
                    </div>
                  )}
                  {biz.walkTime !== "N/A" && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      🚶 {biz.walkTime}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{biz.description}</p>

              {/* Community signal */}
              <div className="flex items-center gap-1.5 mb-3 bg-secondary/50 rounded-lg px-3 py-2">
                <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{biz.neighborRecs} vizinhos</span> recomendam · {biz.lastVisit}
                </span>
              </div>

              {/* Tags + Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {biz.tags.map((tag) => (
                    <span key={tag} className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full border border-border">
                      {tag}
                    </span>
                  ))}
                  <span className="flex items-center gap-0.5 text-xs text-warning">
                    <Star className="h-3 w-3 fill-warning" /> {biz.rating}
                    <span className="text-muted-foreground ml-0.5">({biz.reviews})</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={(e) => toggleSave(biz.id, e)}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Salvar">
                    <Bookmark className={`h-4 w-4 ${savedBusinesses.has(biz.id) ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Compartilhar">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); }}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Ligar">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(getBusinessUrl(biz, moduleUrls.business)); }}
                    className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Traçar rota">
                    <Route className="h-4 w-4 text-primary" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">Nenhuma empresa encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente mudar os filtros ou a busca</p>
          </div>
        )}

        <div className="mt-4 sm:hidden">
          <Button variant="outline" onClick={() => navigate(businessUrls.list)}
            className="w-full border-border text-muted-foreground font-medium text-sm rounded-lg">
            Ver todas as empresas
          </Button>
        </div>
      </section>

      {/* ── RECOMENDAÇÕES DA COMUNIDADE ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/20 rounded-2xl p-5 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-primary/20 p-2.5 rounded-xl">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">Mais Recomendados pelos Vizinhos</h3>
              <p className="text-sm text-muted-foreground">As empresas com mais indicações da comunidade</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...FEATURED_BUSINESSES].sort((a, b) => b.neighborRecs - a.neighborRecs).slice(0, 3).map((biz, i) => (
              <motion.div key={biz.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                onClick={() => navigate(getBusinessUrl(biz, moduleUrls.business))}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${i === 0 ? "text-warning" : i === 1 ? "text-muted-foreground" : "text-amber-700"}`}>
                      #{i + 1}
                    </span>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{biz.name}</h4>
                  </div>
                  <span className="flex items-center gap-0.5 text-xs text-warning">
                    <Star className="h-3 w-3 fill-warning" /> {biz.rating}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ThumbsUp className="h-3 w-3 text-primary" />
                    <span className="font-semibold text-foreground">{biz.neighborRecs}</span> recomendações
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Navigation className="h-3 w-3" /> {biz.distance}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POR QUE CADASTRAR ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 w-full">
        <div className="bg-secondary/50 border border-border rounded-2xl p-5 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="md:w-1/3">
              <h3 className="text-lg font-bold text-foreground font-heading">Por que cadastrar sua empresa?</h3>
              <p className="text-sm text-muted-foreground mt-1">Cresça com a comunidade local</p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: MapPin, title: "Visibilidade Local", description: "Apareça para clientes do seu bairro", iconClass: "text-primary", bgClass: "bg-primary/10" },
                { icon: Star, title: "Avaliações", description: "Receba feedback e construa reputação", iconClass: "text-warning", bgClass: "bg-warning/10" },
                { icon: TrendingUp, title: "Analytics", description: "Acompanhe visitas e engajamento", iconClass: "text-accent", bgClass: "bg-accent/10" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                  <div className={`${item.bgClass} p-2 rounded-lg shrink-0`}>
                    <item.icon className={`h-5 w-5 ${item.iconClass}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ─────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/20 via-card to-accent/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">
            Cadastre Sua Empresa Gratuitamente
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
            Conecte-se com milhares de clientes no seu bairro. Cadastro rápido, fácil e sem custo.
          </p>
          <Button onClick={() => navigate(user ? "/empresas/criar-empresa" : "/login")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-11 px-8 rounded-lg shadow-lg">
            Cadastrar Minha Empresa
          </Button>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="w-full bg-card border-t border-border px-4 sm:px-6 py-4 text-center text-muted-foreground text-xs">
        Empresas Locais · Salvador, BA · Bairro Conectado
      </footer>
    </div>
  );
}
