import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useActiveTerritory } from '@/core/location/hooks/useActiveTerritory';
import {
  MapPin, ChevronRight, Loader2, Globe, Building2,
  Star, TrendingUp, Users, ArrowRight, Sparkles,
  Map, Phone, Mail, Shield, Landmark,
  GraduationCap, Heart, TreePine, Bus, Clock,
  ExternalLink, MapPinned, AlertTriangle,
  Ambulance, Flame, Award, Flag, Mountain,
  Instagram, Facebook, Twitter, Youtube,
  Search, Store, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { buildMailtoUrl, buildTelUrl } from '@/shared/utils/contactLinks';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { useNationalFeatured } from '@/core/landing/hooks/useNationalFeatured';
import type { NationalBusiness } from '@/core/landing/types';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import {
  BRASIL_INFO,
  BRASIL_STATS,
  CONTATOS_EMERGENCIA,
  CONTATOS_UTILIDADE,
  GOV_FEDERAL,
  NAV_LINKS,
} from './BrasilShowcaseData';
import {
  buildBrasilSearchUrl,
  fadeUp,
  filterVerifiedBusinesses,
  getBrasilShowcaseHomeUrl,
  groupCitiesByState,
} from './BrasilShowcasePage.model';
import { useBrasilShowcaseAdminAccess } from './useBrasilShowcaseAdminAccess';

export function BrasilShowcasePage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { activeLocation } = useActiveTerritory();
  const [searchQuery, setSearchQuery] = useState('');
  const { sessionLoading, isAuthorized } = useBrasilShowcaseAdminAccess();
  const { stats: platformStats, territories, businesses, isLoading } = useNationalFeatured();


  const cities = useMemo(() => territories.locations.filter(l => l.type === 'city'), [territories.locations]);
  const groups = territories.groups;

  const states = useMemo(() => groupCitiesByState(cities), [cities]);
  const verifiedBusinesses = useMemo(
    () => filterVerifiedBusinesses<NationalBusiness>(businesses as NationalBusiness[]),
    [businesses],
  );

  const scrollTo = (id: string) => {
    if (id.startsWith('#') && id.length > 1) {
      document.getElementById(id.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearch = () => {
    const searchUrl = buildBrasilSearchUrl(searchQuery);
    if (searchUrl) navigate(searchUrl);
  };

  const handleFeaturedBusinessClick = async (business: NationalBusiness) => {
    if (!business.slug || !business.geographic_path) return;

    const url = BusinessUrlService.getCanonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: business.geographic_path,
    });
    navigate(url);
  };

  const homeUrl = getBrasilShowcaseHomeUrl(activeLocation);

  // Mostrar loading enquanto verifica autenticação
  if (sessionLoading || !isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Brasil — Comunidade Conectada (Admin)</title>
        <meta name="description" content="Descubra o Brasil na plataforma Comunidade Conectada. Dados, pontos turísticos, representantes, territórios ativos e muito mais." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen w-full bg-background text-foreground flex flex-col">

        {/* ── NAVBAR ──────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <button
              onClick={() => navigate('/brasil')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Flag className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground font-heading">
                Brasil <span className="text-primary">🇧🇷</span>
              </span>
            </button>

            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(link => (
                <button
                  key={link.label}
                  onClick={() => link.path === 'home' ? navigate(homeUrl) : scrollTo(link.path)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <Button
              onClick={() => navigate(appUrls.auth.login)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-9 px-4 rounded-lg"
            >
              Entrar
            </Button>
          </div>
        </nav>

        {/* ── BANNER ADMIN ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-b border-amber-500/30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="h-5 w-5 text-amber-500" />
              <span className="text-base font-bold text-amber-500">
                🚧 Página em Desenvolvimento
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta é uma prévia da vitrine nacional. Disponível apenas para administradores enquanto finalizamos o conteúdo.
            </p>
          </div>
        </motion.div>

        {/* ── A. HERO ────────────────────────────────────────────── */}
        <section className="relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,40%,45%)]/8 via-primary/4 to-[hsl(217,91%,55%)]/8" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(48,96%,53%)]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-2">
                República Federativa · Independência em 1822
              </p>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4 font-heading">
                Brasil
                <br />
                <span className="text-primary">Ordem e Progresso</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-6">
                Maior país da América Latina, com mais de 200 milhões de habitantes, 
                diversidade cultural incomparável e paisagens que encantam o mundo.
              </p>

              {/* Search */}
              <div className="flex items-center gap-2 mb-4 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar estado, cidade, bairro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 px-5 rounded-lg"
                >
                  Pesquisar
                </Button>
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: MapPinned, label: 'Números', target: '#numeros' },
                  { icon: Map, label: 'Territórios', target: '#territorios' },
                  { icon: Phone, label: 'Contatos', target: '#contatos' },
                ].map(chip => (
                  <button
                    key={chip.label}
                    onClick={() => scrollTo(chip.target)}
                    className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <chip.icon className="h-3.5 w-3.5" />
                    {chip.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Location badge */}
            <div className="absolute bottom-4 right-4 sm:right-6 hidden sm:flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Brasil · América do Sul
            </div>
          </div>
        </section>

        {/* ── B. ESTATÍSTICAS DO BRASIL ───────────────────────────── */}
        <section id="numeros" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Brasil em Números</h2>
            <p className="text-sm text-muted-foreground mt-1">Dados do país que nos inspira</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {BRASIL_STATS.map(stat => (
              <motion.div
                key={stat.label}
                {...fadeUp}
                className={`${stat.bg} border ${stat.border} rounded-2xl p-4 text-center hover:scale-105 transition-transform`}
              >
                <div className="flex justify-center mb-2">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── PLATAFORMA NA PLATAFORMA ────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 w-full">
          <div className="bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/20 rounded-2xl p-6 md:p-8">
            <div className="text-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-foreground font-heading">Na Plataforma</h2>
              <p className="text-sm text-muted-foreground mt-1">O que já está disponível na Comunidade Conectada</p>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Cidades ativas', value: platformStats.cities, icon: Building2, color: 'text-blue-500' },
                  { label: 'Bairros', value: platformStats.districts, icon: MapPin, color: 'text-teal-500' },
                  { label: 'Negócios', value: platformStats.businesses, icon: TrendingUp, color: 'text-amber-500' },
                  { label: 'Profissionais', value: platformStats.services, icon: Users, color: 'text-violet-500' },
                ].map(s => (
                  <motion.div
                    key={s.label}
                    {...fadeUp}
                    className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 text-center"
                  >
                    <s.icon className={`h-6 w-6 ${s.color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── SOBRE O BRASIL ──────────────────────────────────────── */}
        <section id="sobre" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Sobre o Brasil</h2>
            <p className="text-sm text-muted-foreground mt-1">Conheça mais sobre nosso país</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              {...fadeUp}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                História e Cultura
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O Brasil é o maior país da América Latina, com uma história rica que mistura 
                povos indígenas, colonização portuguesa e influências africanas e europeias. 
                Independente desde 1822, o país é conhecido por sua diversidade cultural, 
                música (samba, bossa nova), festas (Carnaval) e culinária única.
              </p>
            </motion.div>
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Economia e Desenvolvimento
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Com a maior economia da América Latina, o Brasil é um importante produtor 
                agrícola (café, soja, carne) e possui indústrias diversificadas. O país 
                investe em tecnologia, energia renovável e tem um mercado interno robusto 
                com mais de 200 milhões de consumidores.
              </p>
            </motion.div>
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <TreePine className="h-5 w-5 text-primary" />
                Natureza e Biodiversidade
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O Brasil abriga a maior floresta tropical do mundo (Amazônia), o Pantanal, 
                a Mata Atlântica e outros biomas únicos. É um dos países com maior 
                biodiversidade do planeta, com milhares de espécies de plantas, animais 
                e ecossistemas diversos.
              </p>
            </motion.div>
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Povo e Sociedade
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O povo brasileiro é conhecido por sua hospitalidade, alegria e diversidade. 
                Com mais de 200 milhões de habitantes, o país é uma mistura de etnias, 
                culturas e tradições que convivem harmoniosamente, criando uma identidade 
                nacional única e acolhedora.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── EMPRESAS VERIFICADAS ────────────────────────────────── */}
        <section id="empresas" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Empresas Verificadas</h2>
            </div>
            <p className="text-sm text-muted-foreground">Negócios com CNPJ presentes na plataforma</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : verifiedBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {verifiedBusinesses.slice(0, 6).map((business, i) => (
                <motion.div
                  key={business.id}
                  {...fadeUp}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    void handleFeaturedBusinessClick(business);
                  }}
                  className="bg-card border border-border rounded-2xl p-5 hover:shadow-xl hover:border-blue-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <BusinessLogo
                        name={business.name}
                        logoUrl={business.logo_url}
                        alt={business.name}
                        initialsClassName="text-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-blue-500 transition-colors truncate">
                          {business.name}
                        </h3>
                        {business.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{business.category}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {business.is_premium && (
                          <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                            Premium
                          </span>
                        )}
                        {business.city_name && (
                          <span className="text-[10px] text-muted-foreground">
                            {business.city_name}
                          </span>
                        )}
                        {business.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-[10px] text-muted-foreground">{business.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Em breve empresas verificadas aparecerão aqui</p>
            </div>
          )}

          {verifiedBusinesses.length > 6 && (
            <div className="text-center mt-6">
              <Button
                onClick={() => navigate('/empresas')}
                variant="outline"
                className="border-border text-foreground hover:border-blue-500 hover:text-blue-500"
              >
                Ver todas as empresas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </section>

        {/* ── D. ESTADOS DO BRASIL ────────────────────────────────── */}
        <section id="estados" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Map className="h-5 w-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Explore por Estado</h2>
            </div>
            <p className="text-sm text-muted-foreground">Navegue pelos estados com cidades ativas</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : states.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {states.map((state, i) => (
                <motion.div
                  key={state.slug}
                  {...fadeUp}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/${state.slug}`)}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer group text-center"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Map className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors uppercase">
                    {state.slug}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {state.cities.length} {state.cities.length === 1 ? 'cidade' : 'cidades'}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
              <Map className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Em breve mais estados serão adicionados</p>
            </div>
          )}
        </section>

        {/* ── E. TERRITÓRIOS ATIVOS ───────────────────────────────── */}
        <section id="territorios" className="w-full bg-gradient-to-br from-primary/8 via-card to-accent/8 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Onde Estamos</h2>
              </div>
              <p className="text-sm text-muted-foreground">Territórios ativos na plataforma</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Grupos territoriais */}
                {groups.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Territórios em destaque
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groups.map((g, i) => (
                        <motion.div
                          key={g.id}
                          {...fadeUp}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => navigate(g.anchor_path ? `${g.anchor_path}/${g.slug}` : '/')}
                          className="bg-card border border-primary/20 rounded-2xl p-5 hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                              <Map className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{g.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {g.member_count} bairros{g.description ? ` · ${g.description}` : ''}
                              </p>
                              <span className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-semibold">
                                Explorar <ArrowRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cidades ativas */}
                {cities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Cidades ativas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cities.map((c, i) => (
                        <motion.div
                          key={c.id}
                          {...fadeUp}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => navigate(c.geographic_path.replace(/^\/br/, ''))}
                          className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group flex items-center gap-4"
                        >
                          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                            {c.parent_name && <p className="text-xs text-muted-foreground">{c.parent_name}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {cities.length === 0 && groups.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                    <Map className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Em breve novas regiões serão adicionadas</p>
                  </div>
                )}
              </>
            )}

            <div className="text-center mt-8">
              <p className="text-xs text-muted-foreground">
                Estamos expandindo para todo o Brasil. Em breve, mais estados e cidades.
              </p>
            </div>
          </div>
        </section>

        {/* ── G. CONTATOS ÚTEIS ───────────────────────────────────── */}
        <section id="contatos" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-success" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Contatos Úteis</h2>
            </div>
            <p className="text-sm text-muted-foreground">Números de emergência e utilidade pública nacional</p>
          </div>

          {/* Emergência */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Emergência
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {CONTATOS_EMERGENCIA.map(c => (
                <a
                  key={c.nome}
                  href={buildTelUrl(c.telefone) ?? undefined}
                  className="bg-card border border-border rounded-2xl p-4 text-center hover:shadow-lg hover:border-destructive/30 transition-all group"
                >
                  <div className="flex justify-center mb-2">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                      <c.icone className={`h-5 w-5 ${c.cor}`} />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground">{c.telefone}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.nome}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Utilidade */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Utilidade Pública
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONTATOS_UTILIDADE.map(c => (
                <a
                  key={c.nome}
                  href={buildTelUrl(c.telefone) ?? undefined}
                  className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                    <p className="text-xs text-primary font-medium">{c.telefone}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── H. CTA ─────────────────────────────────────────────── */}
        <section className="w-full bg-gradient-to-br from-primary/20 via-card to-accent/20 border-t border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">
              Faça Parte da Comunidade Conectada
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
              Conecte-se com sua comunidade, descubra serviços, negócios e oportunidades onde você mora.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate(appUrls.auth.login)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-11 px-8 rounded-lg shadow-lg"
              >
                Começar agora <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/sobre')}
                className="border-border text-muted-foreground hover:border-primary hover:text-primary font-semibold h-11 px-8 rounded-lg"
              >
                Saiba mais
              </Button>
            </div>
          </div>
        </section>

        {/* ── I. RODAPÉ GOV FEDERAL ──────────────────────────────── */}
        <footer className="w-full bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{GOV_FEDERAL.nome}</h3>
                    <p className="text-[10px] text-muted-foreground">Governo Federal</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Brasília, DF
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-4">Contato</h3>
                <div className="space-y-2.5">
                  <a href={buildTelUrl(GOV_FEDERAL.telefone) ?? undefined} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {GOV_FEDERAL.telefone}
                  </a>
                  <a href={buildMailtoUrl(GOV_FEDERAL.email) ?? undefined} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {GOV_FEDERAL.email}
                  </a>
                  <a href={GOV_FEDERAL.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    {GOV_FEDERAL.site.replace('https://', '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-4">Redes Sociais</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: Instagram, label: 'Instagram', url: `https://instagram.com/${GOV_FEDERAL.instagram.replace('@', '')}` },
                    { icon: Facebook, label: 'Facebook', url: `https://facebook.com/${GOV_FEDERAL.facebook}` },
                    { icon: Twitter, label: 'Twitter/X', url: `https://twitter.com/${GOV_FEDERAL.twitter.replace('@', '')}` },
                    { icon: Youtube, label: 'YouTube', url: `https://youtube.com/${GOV_FEDERAL.youtube}` },
                  ].map(s => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-lg px-3 py-2"
                    >
                      <s.icon className="h-4 w-4" />
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <button onClick={() => navigate('/termos')} className="hover:text-primary transition-colors">Termos de Uso</button>
                <button onClick={() => navigate('/privacidade')} className="hover:text-primary transition-colors">Privacidade</button>
                <button onClick={() => navigate('/sobre')} className="hover:text-primary transition-colors">Sobre</button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                © {new Date().getFullYear()} Comunidade Conectada · Vitrine territorial do Brasil
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
