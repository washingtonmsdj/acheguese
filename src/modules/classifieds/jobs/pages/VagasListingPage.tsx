/**
 * VagasListingPage — Página pública de listagem de vagas
 * 
 * ✅ SSOT compliant:
 * - Recebe resolved + activeMemberIds (padrão modular)
 * - useVagas com filtro territorial
 * - useAppUrls para navegação dinâmica
 * - TerritoryIndicator para contexto territorial
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  Briefcase, Search, MapPin, Sparkles, ArrowRight,
  Users, Star, Shield, Clock, Zap, TrendingUp,
  ChevronRight, BadgeCheck, MessageCircle, Phone,
} from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useVagas } from "../hooks/useVagas";
import { useVagasLocation } from "../hooks/useVagasLocation";
import { VagasHeader, VagaCard, VagasFilters, VagasLoading, VagasEmpty, VagasError } from "../components";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

import heroImg from "@/assets/empresas-hero.jpg";

// ── Static data ──────────────────────────────────────────────────────

const STATS = [
  { icon: Briefcase, value: "150+",  label: "vagas ativas",       color: "text-primary" },
  { icon: Users,     value: "80+",   label: "empresas contratando", color: "text-accent" },
  { icon: Shield,    value: "100%",  label: "gratuito",            color: "text-success" },
  { icon: Clock,     value: "24h",   label: "novas vagas/dia",     color: "text-warning" },
];

const HOW_IT_WORKS = [
  { step: "01", icon: Search,         title: "Encontre a vaga ideal",   description: "Busque por cargo, área ou localização. Use filtros para refinar os resultados e encontrar oportunidades perto de você." },
  { step: "02", icon: MessageCircle,  title: "Candidate-se",            description: "Entre em contato direto com a empresa via WhatsApp ou e-mail. Sem intermediários, sem cadastros longos." },
  { step: "03", icon: Star,           title: "Conquiste a vaga",        description: "Prepare-se, faça a entrevista e comece sua nova jornada profissional na sua comunidade." },
];

const BENEFITS = [
  { icon: BadgeCheck, title: "Empresas Verificadas",   description: "Vagas publicadas por empresas reais e verificadas da comunidade.",                          color: "text-primary", bgColor: "bg-primary/10" },
  { icon: MapPin,     title: "Vagas Locais",           description: "Oportunidades na sua região. Menos tempo no trânsito, mais qualidade de vida.",   color: "text-accent",  bgColor: "bg-accent/10"  },
  { icon: Shield,     title: "Sem Taxas",              description: "Totalmente gratuito para candidatos e empresas. Sem cobranças ocultas.",                    color: "text-success", bgColor: "bg-success/10" },
  { icon: Zap,        title: "Contato Direto",         description: "Fale diretamente com o RH da empresa por WhatsApp ou e-mail. Resposta rápida garantida.",  color: "text-warning", bgColor: "bg-warning/10" },
];

// ── Props ────────────────────────────────────────────────────────────

interface VagasListingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ── Page ─────────────────────────────────────────────────────────────

export default function VagasListingPage({ resolved, activeMemberIds }: VagasListingPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const appUrls = useAppUrls(resolved);
  const { activeLocationName } = useVagasLocation();

  // ✅ Extrair nome do território resolvido com preposição adequada
  const territoryName = useMemo(() => {
    if (!resolved) return "sua região";
    const name = resolved.kind === 'location' ? resolved.location.name : resolved.group.name;
    // Usar "em" para contexto de localização
    return name;
  }, [resolved]);

  const {
    search, setSearch,
    selectedCategory, setSelectedCategory,
    selectedContract, setSelectedContract,
    selectedModality, setSelectedModality,
    selectedLevel, setSelectedLevel,
    filteredVagas,
    urgentVagas,
    recentVagas,
    featuredVagas,
    hasActiveFilters,
    clearFilters,
    isLoading,
    isError,
  } = useVagas({ resolved, activeMemberIds });

  const handleVagaClick = (id: string) => navigate(`/vagas/detalhe/${id}`);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* ── HEADER COM BUSCA ─────────────────────────────────── */}
      <VagasHeader
        searchQuery={search}
        onSearchChange={setSearch}
      />

      {/* ── PROMO BANNER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-primary/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Contrate talentos locais!</span>{" "}
            Publique vagas gratuitamente e encontre profissionais da sua região.
          </span>
          <button onClick={() => navigate(user ? "/vagas/publicar" : "/login")} className="text-primary font-semibold hover:underline ml-1 flex items-center gap-0.5">
            Publicar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <CanonicalHero
        moduleName="Vagas"
        moduleIcon={Briefcase}
        territoryName={territoryName}
        territoryFallback="Sua Região"
        title="Vagas de Emprego"
        titleHighlight={`em ${territoryName}`}
        subtitle="Encontre oportunidades de trabalho na sua região. Vagas atualizadas diariamente, contato direto com empresas."
        backgroundImage={heroImg}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar cargo, empresa, bairro...",
        }}
        primaryCTA={{ label: "Buscar", onClick: () => {} }}
        quickFilters={["CLT", "Remoto", "Estágio", "PJ", "Urgente"].map((tag) => ({
          label: tag,
          onClick: () => {},
        }))}
      />

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg hover:border-primary/20 transition-all"
            >
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

      {/* ── URGENTES ─────────────────────────────────────────── */}
      {urgentVagas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-bold text-foreground font-heading">Vagas Urgentes</h2>
              <span className="text-xs bg-destructive/10 text-destructive font-bold px-2 py-0.5 rounded-full">{urgentVagas.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentVagas.slice(0, 3).map((vaga, i) => (
                <VagaCard
                  key={vaga.id} 
                  vaga={vaga} 
                  variant="compact"
                  index={i} 
                  onClick={() => handleVagaClick(vaga.id)}
                  locationName={activeLocationName}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FILTROS + LISTAGEM ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground font-heading">Todas as Vagas</h2>
            <p className="text-sm text-muted-foreground mt-1">Encontre a oportunidade perfeita para você</p>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="bg-secondary/50 border border-border rounded-2xl p-5 md:p-6 mb-6">
          <VagasFilters
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedContract={selectedContract}
            onContractChange={setSelectedContract}
            selectedModality={selectedModality}
            onModalityChange={setSelectedModality}
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            resultsCount={filteredVagas.length}
          />
        </div>

        {isLoading ? (
          <VagasLoading />
        ) : isError ? (
          <VagasError />
        ) : filteredVagas.length === 0 ? (
          <VagasEmpty hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVagas.map((vaga, i) => (
              <VagaCard
                key={vaga.id} 
                vaga={vaga} 
                variant="list"
                index={i} 
                onClick={() => handleVagaClick(vaga.id)}
                locationName={activeLocationName}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── DESTAQUES ────────────────────────────────────────── */}
      {featuredVagas.length > 0 && !hasActiveFilters && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5 md:p-8">
            <div className="flex items-center gap-2 mb-5">
              <Star className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-bold text-foreground font-heading">Vagas em Destaque</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredVagas.map((vaga, i) => (
                <VagaCard
                  key={vaga.id} 
                  vaga={vaga} 
                  variant="compact"
                  index={i} 
                  onClick={() => handleVagaClick(vaga.id)}
                  locationName={activeLocationName}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── COMO FUNCIONA ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Como Funciona</h2>
          <p className="text-muted-foreground mt-2">Encontrar emprego na sua região nunca foi tão fácil</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl hover:border-primary/20 transition-all relative"
            >
              <span className="absolute top-4 right-4 text-4xl font-black text-primary/10">{item.step}</span>
              <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2 font-heading">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BENEFÍCIOS ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all"
            >
              <div className={`h-10 w-10 rounded-xl ${b.bgColor} flex items-center justify-center mb-3`}>
                <b.icon className={`h-5 w-5 ${b.color}`} />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">
            Está contratando? Publique sua vaga!
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Alcance milhares de candidatos qualificados da sua região. Publicação gratuita, sem taxas e sem burocracia.
          </p>
          <Button
            onClick={() => navigate(user ? "/vagas/publicar" : "/login")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
          >
            Publicar Vaga Grátis
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Vagas {territoryName}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(appUrls.home)} className="hover:text-primary transition-colors">Início</button>
            <button onClick={() => navigate("/sobre")} className="hover:text-primary transition-colors">Sobre</button>
            <button onClick={() => navigate("/termos")} className="hover:text-primary transition-colors">Termos</button>
            <button onClick={() => navigate("/privacidade")} className="hover:text-primary transition-colors">Privacidade</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
