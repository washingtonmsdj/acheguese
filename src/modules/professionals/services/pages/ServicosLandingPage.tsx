/**
 * ServicosLandingPage — Vitrine pública de serviços
 * Estilo editorial: dark theme, acentos teal, motion.
 *
 * ✅ SSOT compliant:
 * - Recebe resolved + activeMemberIds (padrão modular)
 * - useServicos com filtro territorial
 * - useServiceUrls para navegação
 * - SERVICE_CATEGORY_OPTIONS do SSOT
 * - TerritoryIndicator para contexto territorial
 */

import { useState, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Search, Wrench, Star, MapPin, ChevronRight, ArrowRight,
  Sparkles, BadgeCheck, MessageCircle, Shield, TrendingUp,
  Clock, Users, Phone, Filter, Trophy, Zap, Heart, LayoutList,
  Building2, Tag, UtensilsCrossed,
} from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useSessionContext } from "@/core/session";
import { TerritoryIndicator, useModuleTerritoryFilter, useTerritoryLabels } from "@/core/location";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { useServicos } from "@/modules/professionals/services/hooks/useServicos";
import { useTopRatedProfessionals } from "@/modules/professionals/services/hooks/useTopRatedProfessionals";
import { buildWhatsAppUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { ServicosHeader } from "@/modules/professionals/services/components";
import {
  SERVICE_CATEGORY_OPTIONS,
  SERVICE_FORM_CATEGORY_OPTIONS,
  getServiceCategoryIcon,
  getServiceCategoryLabel,
} from "@/modules/professionals/services/domain/professionalCategories";
import type { ProfessionalItem } from "@/modules/professionals/services/domain/professionalViewModels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { withQueryParams } from "@/core/landing/utils/landingPresentation";

import heroImg from "@/assets/servicos-hero.jpg";

// ── Dados estáticos ──────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: "01", icon: Search, title: "Busque o serviço",    description: "Encontre o profissional ideal filtrando por categoria, avaliação ou proximidade." },
  { step: "02", icon: Phone,  title: "Entre em contato",    description: "Fale diretamente via WhatsApp ou chat. Sem intermediários, sem taxas." },
  { step: "03", icon: Star,   title: "Avalie o serviço",    description: "Após concluir, avalie o profissional para ajudar outros moradores." },
];

const BENEFITS = [
  { icon: BadgeCheck, title: "Perfis verificados", description: "Profissionais verificados aparecem identificados no perfil e nos resultados.",                                    color: "text-primary", bgColor: "bg-primary/10" },
  { icon: MapPin,     title: "Perto de Você",             description: "Profissionais da sua região, com menor tempo de deslocamento e maior compromisso.",                        color: "text-accent",  bgColor: "bg-accent/10"  },
  { icon: Shield,     title: "Garantia Comunitária",      description: "Avaliações reais de moradores como você. Transparência total.",                                            color: "text-success", bgColor: "bg-success/10" },
  { icon: Zap,        title: "Contato direto",           description: "Quando o profissional informa WhatsApp ou prazo de resposta, esses dados aparecem no perfil.",                  color: "text-warning", bgColor: "bg-warning/10" },
];

const COMMUNITY_MODULE_TABS = [
  { key: "feed", label: "Feed", icon: LayoutList },
  { key: "business", label: "Empresas", icon: Building2 },
  { key: "services", label: "Serviços", icon: Wrench },
  { key: "classifieds", label: "Classificados", icon: Tag },
  { key: "gastronomy", label: "Gastronomia", icon: UtensilsCrossed },
  { key: "map", label: "Mapa", icon: MapPin },
] as const;

// ── Componentes auxiliares ────────────────────────────────────────────

const SERVICE_CATEGORY_STYLE_BY_ID: Record<string, { color: string; bg: string }> = {
  eletricista: { color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/20" },
  encanador: { color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/20" },
  pedreiro: { color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/20" },
  pintor: { color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/20" },
  diarista: { color: "text-pink-400", bg: "bg-pink-500/15 border-pink-500/20" },
  tecnico_celular: { color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/20" },
  mecanico: { color: "text-gray-400", bg: "bg-gray-500/15 border-gray-500/20" },
  chaveiro: { color: "text-yellow-500", bg: "bg-yellow-600/15 border-yellow-600/20" },
  jardineiro: { color: "text-green-400", bg: "bg-green-500/15 border-green-500/20" },
  saude: { color: "text-red-400", bg: "bg-red-500/15 border-red-500/20" },
  beleza: { color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/20" },
  educacao: { color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/20" },
  tecnologia: { color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/20" },
  construcao: { color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/20" },
  consultoria: { color: "text-teal-400", bg: "bg-teal-500/15 border-teal-500/20" },
  design: { color: "text-fuchsia-400", bg: "bg-fuchsia-500/15 border-fuchsia-500/20" },
  fotografia: { color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/20" },
  juridico: { color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/20" },
  contabilidade: { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20" },
  outros: { color: "text-muted-foreground", bg: "bg-muted/40 border-border" },
};

const SERVICE_CATEGORY_RAIL = SERVICE_FORM_CATEGORY_OPTIONS.map((category) => ({
  ...category,
  ...(SERVICE_CATEGORY_STYLE_BY_ID[category.id] ?? SERVICE_CATEGORY_STYLE_BY_ID.outros),
}));

function formatServicesMetric(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatAverageRating(value: number | null): string {
  return value == null ? "Sem nota" : value.toFixed(1).replace(".", ",");
}

function ProfessionalCard({ pro, index, onClick }: { pro: ProfessionalItem; index: number; onClick: () => void }) {
  const CategoryIcon = getServiceCategoryIcon(pro.category);
  const hasRating = pro.rating && pro.rating > 0;
  const hasWhatsApp = !!pro.whatsapp;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasWhatsApp) {
      const url = buildWhatsAppUrl(pro.whatsapp);
      if (url) {
        openSafeExternalUrl(url, { context: "services-whatsapp" });
      }
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 10) * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex min-h-[104px] flex-row overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md cursor-pointer sm:min-h-[96px]"
      role="article"
      aria-label={`${pro.name} - ${pro.category}`}
    >
      {/* Foto ou icone canonico a esquerda */}
      <div className="relative h-auto w-[84px] shrink-0 overflow-hidden sm:w-[88px]">
        {pro.avatar_url ? (
          <img
            src={pro.avatar_url}
            alt={pro.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <CategoryIcon className="h-9 w-9 text-primary" />
          </div>
        )}

        {/* Verificado badge */}
        <div className="absolute top-1 left-1">
          <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20" />
        </div>
      </div>

      {/* Conteúdo à direita */}
      <div className="flex min-w-0 flex-1 flex-col justify-between px-2.5 py-2.5 sm:py-2">
        {/* Nome */}
        <h3 className="line-clamp-2 text-[13px] font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:line-clamp-1 sm:text-sm">
          {pro.name}
        </h3>

        {/* Categoria */}
        <p className="text-[11px] text-muted-foreground truncate">{pro.category}</p>

        {/* Rating + preço */}
        <div className="flex items-center gap-2">
          {hasRating && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {pro.rating!.toFixed(1)}
              {pro.reviews_count && (
                <span className="text-muted-foreground">({pro.reviews_count})</span>
              )}
            </span>
          )}
          {pro.price_range && (
            <span className="text-[11px] font-semibold text-primary">{pro.price_range}</span>
          )}
        </div>

        {/* Localização + WhatsApp */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {pro.neighborhood && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{pro.neighborhood}</span>
            </span>
          )}

          {hasWhatsApp && (
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center gap-0.5 shrink-0 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              <MessageCircle className="h-2.5 w-2.5" />
              WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      </div>
    </motion.article>
  );
}

function TopRatedCard({ pro, rank, onClick }: { pro: ProfessionalItem; rank: number; onClick: () => void }) {
  const CategoryIcon = getServiceCategoryIcon(pro.category);
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
      transition={{ delay: rank * 0.1 }}
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-card border border-border rounded-2xl p-3 hover:shadow-xl hover:border-warning/30 transition-all text-left group"
    >
      <div className="relative">
        {pro.avatar_url ? (
          <img src={pro.avatar_url} alt={pro.name} className="h-24 w-full rounded-xl object-cover mb-2 group-hover:scale-[1.02] transition-transform" loading="lazy" />
        ) : (
          <div className="h-24 w-full rounded-xl bg-gradient-to-br from-warning/10 to-primary/10 flex items-center justify-center mb-2">
            <CategoryIcon className="h-8 w-8 text-primary" />
          </div>
        )}
        <span className="absolute -top-1 -left-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-warning-foreground">
          #{rank + 1}
        </span>
      </div>
      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{pro.name}</p>
      <p className="text-[10px] text-muted-foreground truncate">{pro.service}</p>
      <div className="flex items-center gap-1 mt-1">
        <Star className="h-3 w-3 text-warning fill-warning" />
        <span className="text-xs font-semibold text-foreground">{pro.rating?.toFixed(1) || "0.0"}</span>
        <span className="text-[10px] text-muted-foreground">({pro.reviews_count})</span>
      </div>
    </motion.button>
  );
}

function ServiceCategoryRail({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}) {
  return (
    <section className="w-full border-b border-border bg-card/50 py-3 sm:py-4">
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max justify-start gap-2 px-4 pb-1 sm:mx-auto sm:justify-center sm:gap-3">
          {SERVICE_CATEGORY_RAIL.map((cat, i) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectCategory(isActive ? "todos" : cat.id)}
                className={`group flex min-w-[64px] shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-card/80 px-2.5 py-2 backdrop-blur-sm transition-colors duration-200 sm:min-w-[72px] sm:p-2.5 ${cat.bg} ${isActive ? "ring-2 ring-primary/40" : ""}`}
              >
                <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
                  <Icon className={`h-6 w-6 ${cat.color}`} />
                </motion.div>
                <span className="text-center text-[10px] font-semibold leading-tight text-foreground">
                  {cat.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NeighborhoodServicesHero({
  territoryName,
  professionalsCount,
  averageRating,
  verifiedCount,
  selectedCategory,
  onResetCategory,
  primaryHref,
  primaryLabel,
  secondaryHref,
  moduleUrls,
}: {
  territoryName: string;
  professionalsCount: string;
  averageRating: string;
  verifiedCount: string;
  selectedCategory: string;
  onResetCategory: () => void;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  moduleUrls: ReturnType<typeof useFriendlyModuleUrls>;
}) {
  const moduleLinks = [
    { ...COMMUNITY_MODULE_TABS[2], href: moduleUrls.services, isActive: true },
    { ...COMMUNITY_MODULE_TABS[0], href: moduleUrls.community, isActive: false },
    { ...COMMUNITY_MODULE_TABS[1], href: moduleUrls.business, isActive: false },
    { ...COMMUNITY_MODULE_TABS[3], href: moduleUrls.classifieds, isActive: false },
    { ...COMMUNITY_MODULE_TABS[4], href: moduleUrls.gastronomy, isActive: false },
    { ...COMMUNITY_MODULE_TABS[5], href: moduleUrls.map, isActive: false },
  ] as const;

  return (
    <section className="max-w-7xl mx-auto w-full px-4 py-3 sm:px-6 md:py-5">
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,24,32,0.98),rgba(7,17,24,0.98))] text-white shadow-xl shadow-black/10">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {moduleLinks.map((item) => {
              const Icon = item.icon;
              return item.isActive ? (
                <span
                  key={item.key}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/12 px-4 text-xs font-semibold text-teal-100"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.key}
                  to={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-teal-300">
              {territoryName}
            </p>
            <h1 className="mt-2 max-w-[14ch] text-[1.75rem] font-semibold leading-[1.05] sm:max-w-none sm:text-[2rem]">
              Serviços e profissionais do bairro
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
              Explore profissionais locais, compare reputação e encontre quem atende dentro do território com contexto comunitário real.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-teal-300/30 bg-teal-300/10 px-3 text-xs font-semibold text-teal-100">
                Descoberta pública
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-3 text-xs font-semibold text-amber-100">
                Recomendações locais
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:max-w-xl sm:grid-cols-2 sm:gap-3">
              <Link
                to={primaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400"
              >
                <Wrench className="mr-2 h-4 w-4" />
                {primaryLabel}
              </Link>
              <Link
                to={secondaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/14 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Ver mapa do bairro
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onResetCategory}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold transition-colors ${
                  selectedCategory === "todos"
                    ? "border border-teal-300/35 bg-teal-300/12 text-teal-100"
                    : "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]"
                }`}
              >
                Todos os serviços
              </button>
            </div>
          </div>

          <div className="grid gap-2 rounded-[18px] border border-white/10 bg-black/20 p-3 sm:gap-3 sm:rounded-[20px] sm:p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Panorama local
              </p>
              <p className="mt-1 text-[13px] leading-5 text-white/65 sm:text-sm">
                {professionalsCount} profissionais e média de {averageRating} no território.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 sm:px-3">
                <p className="text-base font-semibold text-white sm:text-lg">{professionalsCount}</p>
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/45 sm:text-[0.68rem] sm:tracking-[0.18em]">Perfis</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 sm:px-3">
                <p className="text-base font-semibold text-white sm:text-lg">{verifiedCount}</p>
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/45 sm:text-[0.68rem] sm:tracking-[0.18em]">Verificados</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 sm:px-3">
                <p className="text-base font-semibold text-white sm:text-lg">{averageRating}</p>
                <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/45 sm:text-[0.68rem] sm:tracking-[0.18em]">Média</p>
              </div>
            </div>
            <div className="rounded-2xl border border-teal-300/15 bg-teal-300/[0.05] px-3 py-3 text-sm text-white/68">
              Serviços do bairro usam o território como contexto principal. Isso evita páginas genéricas e mantém descoberta, reputação e proximidade na mesma base.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Props ─────────────────────────────────────────────────────────────

interface ServicosLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
  presentation?: "standalone" | "embedded";
}

// ── Página principal ──────────────────────────────────────────────────

export default function ServicosLandingPage({
  resolved,
  activeMemberIds,
  presentation = "standalone",
}: ServicosLandingPageProps) {
  const territorialContext = useTerritorialContextOptional();
  const routeResolved = territorialContext?.resolved ?? resolved ?? null;
  const routeActiveMemberIds = territorialContext?.activeMemberIds ?? activeMemberIds;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSessionContext();
  const territoryLabels = useTerritoryLabels(routeResolved);
  const moduleTerritory = useModuleTerritoryFilter({
    routeResolved,
    activeMemberIds: routeActiveMemberIds,
  });
  const moduleUrls = useFriendlyModuleUrls();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const isCommunityScopedSurface = location.pathname.includes("/comunidade/");
  const isEmbedded = presentation === "embedded";

  // ✅ SSOT: Nome do território com preposição
  const territoryName = useMemo(() => {
    return territoryLabels.inTerritory || `em ${moduleTerritory.displayLabel}`;
  }, [moduleTerritory.displayLabel, territoryLabels]);

  const { topRated } = useTopRatedProfessionals({
    routeResolved,
    activeMemberIds: routeActiveMemberIds,
    territoryFilter: moduleTerritory.territoryFilter,
    limit: 6,
  });
  // ✅ SSOT global para todas as URLs — inclui services, business, classifieds, community
  const appUrls = useAppUrls(routeResolved);
  const communityPrimaryHref = useMemo(
    () => (user ? appUrls.services.register : withQueryParams(appUrls.auth.login, { redirect: appUrls.services.register })),
    [appUrls.auth.login, appUrls.services.register, user],
  );
  const communityPrimaryLabel = user ? "Cadastrar serviço" : "Entrar para interagir";

  // ✅ SSOT: useServicos com filtro territorial — respeita resolved + activeMemberIds
  const { professionals, initialLoading } = useServicos({
    sortBy: "rating",
    filter: selectedCategory,
    search: searchQuery,
    routeResolved,
    activeMemberIds: routeActiveMemberIds,
    territoryFilter: moduleTerritory.territoryFilter,
  });

  const serviceAggregate = useMemo(() => {
    const ratings = professionals
      .map((professional) => professional.rating)
      .filter((rating) => Number.isFinite(rating) && rating > 0);
    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
    const verifiedCount = professionals.filter((professional) => professional.is_verified).length;
    const responseTime = professionals.find((professional) => professional.response_time.trim())?.response_time.trim();

    return {
      averageRating,
      verifiedCount,
      responseTime,
    };
  }, [professionals]);

  const serviceStats = useMemo(() => {
    const ratings = professionals
      .map((professional) => professional.rating)
      .filter((rating) => Number.isFinite(rating) && rating > 0);
    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
    const verifiedCount = professionals.filter((professional) => professional.is_verified).length;
    const responseTime = professionals.find((professional) => professional.response_time.trim())?.response_time.trim();

    return [
      {
        icon: Users,
        value: initialLoading ? "..." : formatServicesMetric(professionals.length),
        label: professionals.length === 1 ? "profissional" : "profissionais",
        color: "text-primary",
      },
      {
        icon: Star,
        value: initialLoading ? "..." : formatAverageRating(averageRating),
        label: "avaliação média",
        color: "text-warning",
      },
      {
        icon: Shield,
        value: initialLoading ? "..." : formatServicesMetric(verifiedCount),
        label: verifiedCount === 1 ? "verificado" : "verificados",
        color: "text-success",
      },
      {
        icon: Clock,
        value: initialLoading ? "..." : responseTime || "Sob consulta",
        label: "tempo de resposta",
        color: "text-accent",
      },
    ];
  }, [initialLoading, professionals]);

  const communityAverageRating = initialLoading ? "..." : formatAverageRating(serviceAggregate.averageRating);
  const communityVerifiedCount = initialLoading ? "..." : formatServicesMetric(serviceAggregate.verifiedCount);

  const handleProfessionalClick = useCallback(
    (pro: ProfessionalItem) =>
      navigate(
        appUrls.services.detail({
          id: pro.id,
          profile_id: pro.profile_id,
          slug: pro.slug,
          geographic_path: pro.geographic_path,
          state: pro.state,
          city: pro.city,
        }),
      ),
    [navigate, appUrls],
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={isEmbedded
        ? "flex w-full min-w-0 flex-col bg-background text-foreground focus:outline-none"
        : "flex min-h-screen w-full flex-col bg-background text-foreground focus:outline-none"}
      data-module-presentation={presentation}
    >
      {!resolved && (
        <Helmet>
          <title>Serviços locais | Achegue-se</title>
          <meta
            name="description"
            content="Encontre profissionais e serviços locais no Achegue-se. Busque prestadores avaliados pela comunidade, acompanhe orçamentos e navegue por território."
          />
        </Helmet>
      )}

      {/* ── HEADER COM BUSCA ──────────────────────────────────────── */}
      {!isCommunityScopedSurface ? (
        <ServicosHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      ) : null}

      {/* ── CATEGORIAS (ESTILO GASTRONOMIA - TOPO) ───────────────── */}
      {!isCommunityScopedSurface ? (
        <ServiceCategoryRail
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      ) : null}

      {/* ── BANNER PROMOCIONAL ────────────────────────────────────── */}
      {!isCommunityScopedSurface ? (
        <>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Cadastre-se grátis!</span>{" "}
            Ofereça seus serviços para milhares de moradores na sua região.
          </span>
          <button onClick={() => navigate(appUrls.services.register)}
            className="text-primary font-semibold hover:underline ml-1 flex items-center gap-0.5">
            Começar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <CanonicalHero
        moduleName="Serviços"
        moduleIcon={Wrench}
        territoryName={territoryName?.replace(/^n[oa]\s/, '')}
        territoryFallback="Sua Região"
        title="Encontre o Profissional"
        titleHighlight={`Ideal ${territoryName}`}
        subtitle="Eletricistas, encanadores, pintores, diaristas e muito mais. Avaliados por moradores da sua comunidade."
        backgroundImage={heroImg}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Buscar eletricista, encanador...",
        }}
        primaryCTA={{ label: "Buscar", onClick: () => {} }}
        quickFilters={SERVICE_CATEGORY_OPTIONS.slice(1, 6).map((cat) => ({
          label: cat.name,
          isActive: selectedCategory === cat.id,
          onClick: () => setSelectedCategory(cat.id),
        }))}
      />
        </>
      ) : !isEmbedded ? (
        <NeighborhoodServicesHero
          territoryName={territoryName}
          professionalsCount={initialLoading ? "..." : formatServicesMetric(professionals.length)}
          averageRating={communityAverageRating}
          verifiedCount={communityVerifiedCount}
          selectedCategory={selectedCategory}
          onResetCategory={() => setSelectedCategory("todos")}
          primaryHref={communityPrimaryHref}
          primaryLabel={communityPrimaryLabel}
          secondaryHref={moduleUrls.map}
          moduleUrls={moduleUrls}
        />
      ) : null}

      {isCommunityScopedSurface ? (
        <ServiceCategoryRail
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      ) : null}

      {/* ── ESTATÍSTICAS ──────────────────────────────────────────── */}
      {!isCommunityScopedSurface ? (
        <section className="max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 md:py-14">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {serviceStats.map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="rounded-2xl border border-border bg-card p-4 text-center transition-all hover:border-primary/20 hover:shadow-lg sm:p-5">
                <div className="mb-2 flex justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 sm:h-10 sm:w-10">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── TOP RATED ─────────────────────────────────────────────── */}
      {topRated.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 pb-8 sm:px-6 md:pb-14">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-bold text-foreground font-heading">Mais Bem Avaliados</h2>
              </div>
            </div>
            <button onClick={() => navigate(appUrls.services.list)}
              className="hidden items-center gap-1 text-sm text-primary font-semibold hover:underline sm:flex">
              Ver todos <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {topRated.slice(0, 6).map((pro, i) => (
              <TopRatedCard key={pro.id} pro={pro} rank={i} onClick={() => handleProfessionalClick(pro)} />
            ))}
          </div>
          <div className="mt-4 sm:hidden">
            <Button
              variant="outline"
              onClick={() => navigate(appUrls.services.list)}
              className="w-full rounded-lg border-border text-muted-foreground"
            >
              Ver todos os profissionais
            </Button>
          </div>
        </section>
      )}

      {/* ── PROFISSIONAIS ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-4 pb-8 sm:px-6 md:pb-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              {selectedCategory === "todos" 
                ? "Profissionais Disponíveis" 
                : getServiceCategoryLabel(selectedCategory) || selectedCategory
              }
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{professionals.length} profissionais encontrados</p>
          </div>
          <Button variant="outline" onClick={() => navigate(appUrls.services.list)}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-lg hidden sm:flex">
            Ver todos
          </Button>
        </div>

        {initialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : professionals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.slice(0, 9).map((pro, i) => (
              <ProfessionalCard key={pro.id} pro={pro} index={i} onClick={() => handleProfessionalClick(pro)} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-2xl px-6 py-12 text-center">
            <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum profissional encontrado nesta categoria.</p>
            <Button variant="outline" onClick={() => setSelectedCategory("todos")} className="mt-3">Ver todos os profissionais</Button>
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Button variant="outline" onClick={() => navigate(appUrls.services.list)}
            className="w-full border-border text-muted-foreground font-medium text-sm rounded-lg">
            Ver todos os profissionais
          </Button>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────── */}
      {!isCommunityScopedSurface ? (
        <>
      <section className="w-full bg-gradient-to-br from-primary/8 via-card to-accent/8 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Como Funciona</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Simples, rápido e sem burocracia. Conecte-se diretamente com profissionais da sua região.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl hover:border-primary/30 transition-all group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  PASSO {item.step}
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 mt-2 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Por Que Usar a Plataforma?</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Vantagens exclusivas para quem busca e oferece serviços na comunidade.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((benefit, i) => (
            <motion.div key={benefit.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all">
              <div className={`${benefit.bgColor} p-3 rounded-xl shrink-0`}>
                <benefit.icon className={`h-5 w-5 ${benefit.color}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA CADASTRO ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 md:pb-16 w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative bg-gradient-to-br from-primary/15 via-card to-accent/15 border border-primary/20 rounded-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 font-heading">É Profissional? Cadastre-se Grátis!</h2>
              <p className="text-muted-foreground text-sm md:text-base mb-4 max-w-lg">
                Aumente sua visibilidade, receba avaliações dos moradores e conquiste novos clientes na sua região. Sem taxas, sem intermediários.
              </p>
              <div className="flex items-center gap-4 justify-center md:justify-start text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-primary" /> Perfil verificado</span>
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-accent" /> Avaliações reais</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-success" /> Mais clientes</span>
              </div>
            </div>
            <Button onClick={() => navigate(user ? appUrls.services.register : appUrls.auth.login)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-12 px-8 rounded-xl shadow-lg shrink-0">
              Cadastrar Agora <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/20 via-card to-accent/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">Precisa de um Serviço?</h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
            Encontre profissionais avaliados pela comunidade. Rápido, confiável e perto de você.
          </p>
          <Button onClick={() => navigate(appUrls.services.list)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-11 px-8 rounded-lg shadow-lg">
            Explorar Serviços
          </Button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="w-full bg-card border-t border-border px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Serviços Locais</span>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(appUrls.business.list)} className="hover:text-primary transition-colors">Empresas</button>
          <button onClick={() => navigate(appUrls.classifieds.list)} className="hover:text-primary transition-colors">Classificados</button>
          <button onClick={() => navigate(appUrls.community.feed)} className="hover:text-primary transition-colors">Comunidade</button>
        </div>
      </footer>
        </>
      ) : null}

    </main>
  );
}


