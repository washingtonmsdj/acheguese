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
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, Wrench, Star, MapPin, ChevronRight, ArrowRight,
  Sparkles, BadgeCheck, MessageCircle, Shield, TrendingUp,
  Clock, Users, Phone, Filter, Trophy, Zap, Heart,
} from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useSessionContext } from "@/core/session";
import { TerritoryIndicator, useTerritoryLabels } from "@/core/location";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useServicos } from "@/modules/services/hooks/useServicos";
import { useTopRatedProfessionals } from "@/modules/services/hooks/useTopRatedProfessionals";
import {
  SERVICE_CATEGORY_OPTIONS,
  getServiceCategoryIcon,
  getServiceCategoryLabel,
} from "@/modules/services/domain/professionalCategories";
import type { ProfessionalItem } from "@/modules/services/domain/professionalViewModels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

import heroImg from "@/assets/servicos-hero.jpg";

// ── Dados estáticos ──────────────────────────────────────────────────

const STATS = [
  { icon: Users,  value: "250+",  label: "profissionais",      color: "text-primary" },
  { icon: Star,   value: "4.8",   label: "avaliação média",    color: "text-warning" },
  { icon: Shield, value: "100%",  label: "verificados",        color: "text-success" },
  { icon: Clock,  value: "< 2h",  label: "tempo de resposta",  color: "text-accent"  },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Search, title: "Busque o serviço",    description: "Encontre o profissional ideal filtrando por categoria, avaliação ou proximidade." },
  { step: "02", icon: Phone,  title: "Entre em contato",    description: "Fale diretamente via WhatsApp ou chat. Sem intermediários, sem taxas." },
  { step: "03", icon: Star,   title: "Avalie o serviço",    description: "Após concluir, avalie o profissional para ajudar outros moradores." },
];

const BENEFITS = [
  { icon: BadgeCheck, title: "Profissionais Verificados", description: "Todos os prestadores passam por verificação de identidade e histórico.",                                    color: "text-primary", bgColor: "bg-primary/10" },
  { icon: MapPin,     title: "Perto de Você",             description: "Profissionais da sua região, com menor tempo de deslocamento e maior compromisso.",                        color: "text-accent",  bgColor: "bg-accent/10"  },
  { icon: Shield,     title: "Garantia Comunitária",      description: "Avaliações reais de moradores como você. Transparência total.",                                            color: "text-success", bgColor: "bg-success/10" },
  { icon: Zap,        title: "Resposta Rápida",           description: "Os profissionais se comprometem a responder em até 2 horas durante o horário comercial.",                  color: "text-warning", bgColor: "bg-warning/10" },
];

// ── Componentes auxiliares ────────────────────────────────────────────

function CategoryPill({ cat, isActive, onClick }: { cat: (typeof SERVICE_CATEGORY_OPTIONS)[number]; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all flex-shrink-0 min-w-[80px] ${
        isActive ? "bg-primary/15 border-primary/50 shadow-lg shadow-primary/10" : "bg-card border-border hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      <span className="text-2xl">{cat.icone}</span>
      <span className={`text-[11px] font-semibold whitespace-nowrap ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {cat.name}
      </span>
    </button>
  );
}

function ProfessionalCard({ pro, index, onClick }: { pro: ProfessionalItem; index: number; onClick: () => void }) {
  const categoryEmoji = getServiceCategoryIcon(pro.category);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: Math.min(index, 6) * 0.05 }}
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group"
    >
      <div className="relative h-36 overflow-hidden bg-secondary">
        {pro.photo ? (
          <img src={pro.photo} alt={pro.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-primary/10 to-accent/10">{categoryEmoji}</div>
        )}
        {pro.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-full px-2 py-1">
            <Star className="h-3 w-3 text-warning fill-warning" />
            <span className="text-xs font-bold text-foreground">{pro.rating.toFixed(1)}</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-semibold px-2 py-1 rounded-md">
          {pro.service || pro.category}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{pro.name}</h3>
          <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{pro.neighborhood}{pro.city ? `, ${pro.city}` : ""}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">{pro.priceMedio || "Sob consulta"}</span>
          {pro.whatsapp && (
            <a href={`https://wa.me/55${pro.whatsapp}`} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          )}
        </div>
        {pro.totalAvaliacoes > 0 && <p className="text-[11px] text-muted-foreground mt-2">{pro.totalAvaliacoes} avaliações</p>}
      </div>
    </motion.div>
  );
}

function TopRatedCard({ pro, rank, onClick }: { pro: ProfessionalItem; rank: number; onClick: () => void }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
      transition={{ delay: rank * 0.1 }}
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-card border border-border rounded-2xl p-3 hover:shadow-xl hover:border-warning/30 transition-all text-left group"
    >
      <div className="relative">
        {pro.photo ? (
          <img src={pro.photo} alt={pro.name} className="h-24 w-full rounded-xl object-cover mb-2 group-hover:scale-[1.02] transition-transform" loading="lazy" />
        ) : (
          <div className="h-24 w-full rounded-xl bg-gradient-to-br from-warning/10 to-primary/10 flex items-center justify-center text-3xl mb-2">
            {getServiceCategoryIcon(pro.category)}
          </div>
        )}
        <span className="absolute -top-1 -left-1 text-lg">{medals[rank] || `#${rank + 1}`}</span>
      </div>
      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{pro.name}</p>
      <p className="text-[10px] text-muted-foreground truncate">{pro.service}</p>
      <div className="flex items-center gap-1 mt-1">
        <Star className="h-3 w-3 text-warning fill-warning" />
        <span className="text-xs font-semibold text-foreground">{pro.rating?.toFixed(1) || "0.0"}</span>
        <span className="text-[10px] text-muted-foreground">({pro.totalAvaliacoes})</span>
      </div>
    </motion.button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────

interface ServicosLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ── Página principal ──────────────────────────────────────────────────

export default function ServicosLandingPage({ resolved, activeMemberIds }: ServicosLandingPageProps) {
  const navigate = useNavigate();
  const { user } = useSessionContext();
  const territoryLabels = useTerritoryLabels(resolved);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // ✅ SSOT: Nome do território com preposição
  const territoryName = useMemo(() => {
    return territoryLabels.inTerritory || "perto de você";
  }, [territoryLabels]);

  const { topRated } = useTopRatedProfessionals({
    routeResolved: resolved,
    activeMemberIds,
    limit: 6,
  });
  // ✅ SSOT global para todas as URLs — inclui services, business, classifieds, community
  const appUrls = useAppUrls(resolved);

  // ✅ SSOT: useServicos com filtro territorial — respeita resolved + activeMemberIds
  const { professionals, initialLoading } = useServicos({
    sortBy: "rating",
    filter: selectedCategory,
    search: searchQuery,
    routeResolved: resolved,
    activeMemberIds,
  });

  const handleProfessionalClick = useCallback(
    (pro: ProfessionalItem) => navigate(appUrls.services.detail(pro.id)),
    [navigate, appUrls],
  );

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">

      {/* ── BANNER PROMOCIONAL ────────────────────────────────────── */}
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
          emoji: cat.icone,
          isActive: selectedCategory === cat.id,
          onClick: () => setSelectedCategory(cat.id),
        }))}
      />

      {/* ── ESTATÍSTICAS ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg hover:border-primary/20 transition-all">
              <div className="flex justify-center mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TOP RATED ─────────────────────────────────────────────── */}
      {topRated.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-bold text-foreground font-heading">Mais Bem Avaliados</h2>
            </div>
            <button onClick={() => navigate(appUrls.services.list)}
              className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline">
              Ver todos <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {topRated.slice(0, 6).map((pro, i) => (
              <TopRatedCard key={pro.id} pro={pro} rank={i} onClick={() => handleProfessionalClick(pro)} />
            ))}
          </div>
        </section>
      )}

      {/* ── CATEGORIAS ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="bg-secondary/50 border border-border rounded-2xl p-5 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground font-heading">Categorias de Serviços</h2>
              <p className="text-sm text-muted-foreground mt-1">Encontre exatamente o que você precisa</p>
            </div>
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {SERVICE_CATEGORY_OPTIONS.map((cat) => (
              <CategoryPill key={cat.id} cat={cat} isActive={selectedCategory === cat.id} onClick={() => setSelectedCategory(cat.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROFISSIONAIS ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              {selectedCategory === "todos" ? "Profissionais Disponíveis" : getServiceCategoryLabel(selectedCategory) || "Profissionais"}
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
            <Button variant="outline" onClick={() => setSelectedCategory("todos")} className="mt-3">Ver todas as categorias</Button>
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

    </div>
  );
}
