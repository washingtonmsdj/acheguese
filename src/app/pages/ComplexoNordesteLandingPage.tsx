/**
 * ComplexoNordesteLandingPage â€” Landing editorial dedicada ao Complexo do Nordeste de Amaralina
 *
 * PÃ¡gina rica com conteÃºdo cultural pesquisado, hero parallax, seÃ§Ãµes temÃ¡ticas,
 * integraÃ§Ã£o SSOT com dados reais e estÃ©tica editorial premium.
 *
 * SeÃ§Ãµes:
 *   A. Hero parallax (imagem aÃ©rea do complexo)
 *   B. Identidade territorial (badge + descriÃ§Ã£o cultural)
 *   C. Bairros do Complexo (cards visuais dos 4 bairros)
 *   D. EstatÃ­sticas do territÃ³rio
 *   E. Cultura & RaÃ­zes (capoeira, percussÃ£o, blocos afro, carnaval)
 *   F. Projetos Sociais & Protagonismo
 *   G. ComÃ©rcio & Gastronomia local
 *   H. Empresas em destaque (dados reais via SSOT)
 *   I. ServiÃ§os e profissionais (dados reais)
 *   J. Classificados recentes (dados reais)
 *   K. CTA â€” FaÃ§a parte
 *   L. RodapÃ©
 */

import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  MapPin, Users, Store, Wrench, Tag, ArrowRight,
  Heart, Music, GraduationCap, Sparkles, Star,
  BadgeCheck, ChevronRight, Building2, Bus,
  Drum, HandHeart, BookOpen, Theater,
  UtensilsCrossed, Fish, Coffee, ShoppingBag,
  Palette, Trophy, Megaphone, Loader2,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { BusinessLogo } from '@/shared/components/ui/business-logo';
import { useTerritorialContext } from '@/core/routing/components/TerritorialLayout';
import { useTerritoryFilter } from '@/core/location/hooks/useTerritoryFilter';
import { useLandingFeatured } from '@/app/features/landing/hooks/useLandingFeatured';
import { useTerritorialHighlights } from '@/core/territorial/highlights/useTerritorialHighlights';
import { useTerritoryStats } from '@/core/territorial/hooks/useTerritoryStats';
import { MODULE_SLUGS } from '@/core/routing/utils/territoryUrls';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { classifiedUrlService } from '@/modules/classifieds/services/ClassifiedUrlService';
import { useClassifiedUrls } from '@/modules/classifieds/hooks/useClassifiedUrls';
import { TerritoryAIContentSection } from '@/core/territorial/components/TerritoryAIContentSection';
import { useAuth } from '@/core/auth/hooks/useAuth';

// Assets
import heroImg from '@/assets/hero-complexo-nordeste.jpg';
import culturaImg from '@/assets/complexo-cultura.jpg';
import musicaImg from '@/assets/complexo-musica.jpg';
import comercioImg from '@/assets/complexo-comercio.jpg';
import santaCruz from '@/assets/bairro-santa-cruz.jpg';
import nordeste from '@/assets/bairro-nordeste.jpg';
import valePedrinhas from '@/assets/bairro-vale-pedrinhas.jpg';
import chapada from '@/assets/bairro-chapada.jpg';

// â”€â”€ AnimaÃ§Ãµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

// â”€â”€ Dados do territÃ³rio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BAIRROS = [
  {
    name: 'Nordeste de Amaralina',
    slug: 'nordeste-de-amaralina',
    image: nordeste,
    populacao: '21.887 hab.',
    desc: 'Parte do aglomerado do Nordeste de Amaralina e referencia historica da ocupacao da regiao.',
  },
  {
    name: 'Santa Cruz',
    slug: 'santa-cruz',
    image: santaCruz,
    populacao: '27.083 hab.',
    desc: 'Maior populacao entre os quatro bairros do Complexo segundo a base ObservaSSA/IBGE 2010.',
  },
  {
    name: 'Vale das Pedrinhas',
    slug: 'vale-das-pedrinhas',
    image: valePedrinhas,
    populacao: '5.162 hab.',
    desc: 'Territorio de menor populacao no Complexo, com comercio de proximidade e redes comunitarias.',
  },
  {
    name: 'Chapada do Rio Vermelho',
    slug: 'chapada-do-rio-vermelho',
    image: chapada,
    populacao: '21.955 hab.',
    desc: 'Bairro de conexao com Rio Vermelho, Amaralina e Vasco da Gama.',
  },
];

const MARCOS_CULTURAIS = [
  {
    icon: Drum,
    title: 'Projeto Quabales',
    desc: 'Fundado por Marivaldo dos Santos, atende mais de 400 jovens gratuitamente com aulas de mÃºsica e percussÃ£o desde 2012.',
    color: 'from-amber-500/15 to-amber-500/5',
    border: 'border-amber-500/25',
    iconColor: 'text-amber-500',
  },
  {
    icon: Theater,
    title: 'Circuito Mestre Bimba',
    desc: 'Criado em 2005, reÃºne mais de 70 blocos em quase 2km de percurso, atraindo 20 mil foliÃµes por dia no Carnaval.',
    color: 'from-rose-500/15 to-rose-500/5',
    border: 'border-rose-500/25',
    iconColor: 'text-rose-500',
  },
  {
    icon: Palette,
    title: 'Editorial Nordeste',
    desc: 'Projeto que prepara jovens da comunidade para passarelas e concursos de beleza, valorizando a estÃ©tica negra.',
    color: 'from-violet-500/15 to-violet-500/5',
    border: 'border-violet-500/25',
    iconColor: 'text-violet-500',
  },
  {
    icon: Megaphone,
    title: 'TV MoradÃ´',
    desc: 'Canal digital com 58 mil seguidores que dÃ¡ voz aos talentos do bairro e mostra a riqueza da comunidade.',
    color: 'from-blue-500/15 to-blue-500/5',
    border: 'border-blue-500/25',
    iconColor: 'text-blue-500',
  },
  {
    icon: HandHeart,
    title: 'CSU Requalificado',
    desc: 'Centro Social Urbano com cursos de mÃºsica, danÃ§a, esportes, qualificaÃ§Ã£o profissional e atividades para idosos.',
    color: 'from-emerald-500/15 to-emerald-500/5',
    border: 'border-emerald-500/25',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Trophy,
    title: 'Blocos Afro',
    desc: 'TradiÃ§Ã£o de blocos afro e manifestaÃ§Ãµes culturais que celebram a ancestralidade e a cultura afro-brasileira.',
    color: 'from-orange-500/15 to-orange-500/5',
    border: 'border-orange-500/25',
    iconColor: 'text-orange-500',
  },
];

const RAIZES = [
  {
    icon: Music,
    label: 'Pagode & Samba',
    desc: 'BerÃ§o de grandes mÃºsicos do pagode baiano',
  },
  {
    icon: Heart,
    label: 'Capoeira Regional',
    desc: 'Mestre Bimba viveu no bairro',
  },
  {
    icon: Fish,
    label: 'Pesca Artesanal',
    desc: 'TradiÃ§Ã£o pesqueira Ã  beira-mar',
  },
  {
    icon: BookOpen,
    label: 'ReligiÃµes de Matriz Africana',
    desc: 'Terreiros e tradiÃ§Ãµes preservadas',
  },
];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ');
}

// â”€â”€ PÃ¡gina principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ComplexoNordesteLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolved, baseUrl } = useTerritorialContext();

  // SSOT: dados reais do territÃ³rio
  const filter = useTerritoryFilter(resolved);
  const { businesses, services, classifieds, stats, isLoading } = useLandingFeatured(filter);
  const { data: allHighlights = [], isLoading: highlightsLoading } = useTerritorialHighlights(resolved);
  const { data: territoryStats, isLoading: statsLoading } = useTerritoryStats(resolved);
  const classifiedUrls = useClassifiedUrls(resolved);

  const highlights = allHighlights.slice(0, 3);

  // URLs dos mÃ³dulos
  const moduleUrls = {
    business: `/${MODULE_SLUGS.business}${baseUrl}`,
    services: `/${MODULE_SLUGS.services}${baseUrl}`,
    classifieds: `/${MODULE_SLUGS.classifieds}${baseUrl}`,
    community: `/${MODULE_SLUGS.community}${baseUrl}`,
  };

  const isGroup = resolved?.kind === 'group';
  const memberList = isGroup ? resolved.group.members.map((m) => m.name) : [];

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <Helmet>
        <title>Complexo do Nordeste de Amaralina | Achegue-se</title>
        <meta
          name="description"
          content="Conheça o Complexo do Nordeste de Amaralina no Achegue-se: comunidade, empresas locais, serviços, classificados e destaques culturais do território."
        />
      </Helmet>

      {/* â”€â”€ A. HERO PARALLAX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Complexo do Nordeste de Amaralina - Vista aÃ©rea"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
        </motion.div>
        <motion.div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight">
              Achegue<span className="text-primary">-se</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex"
              onClick={() => navigate(moduleUrls.community)}
            >
              Comunidade
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
              onClick={() => navigate(user ? '/perfil' : '/login')}
            >
              {user ? 'Meu Perfil' : 'Entrar'}
            </Button>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/90 backdrop-blur-sm border border-primary rounded-full px-5 py-2.5 mb-5 shadow-lg"
            >
              <MapPin className="h-4 w-4 text-primary-foreground" />
              <span className="text-primary-foreground font-bold text-xs tracking-wide uppercase">
                4 Bairros Â· ~45.000 moradores Â· Salvador, BA
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-5 font-heading">
              Complexo do Nordeste
              <br />
              <span className="text-primary">de Amaralina</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/85 mb-3 max-w-2xl mx-auto">
              TerritÃ³rio de resistÃªncia, cultura afro-brasileira e potÃªncia comunitÃ¡ria.
              Um retrato vivo da forÃ§a da periferia soteropolitana.
            </p>
            <p className="text-sm text-white/55 mb-10">
              Nordeste Â· Santa Cruz Â· Vale das Pedrinhas Â· Chapada do Rio Vermelho
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-8 h-13 shadow-2xl shadow-primary/25 w-full sm:w-auto rounded-xl"
                onClick={() => navigate(moduleUrls.community)}
              >
                <Users className="h-5 w-5 mr-2" />
                Entrar na Comunidade
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base px-8 h-13 backdrop-blur-md w-full sm:w-auto rounded-xl"
                onClick={() => navigate(moduleUrls.business)}
              >
                <Store className="h-5 w-5 mr-2" />
                Empresas Locais
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base px-8 h-13 backdrop-blur-md w-full sm:w-auto rounded-xl"
                onClick={() => navigate(moduleUrls.services)}
              >
                <Wrench className="h-5 w-5 mr-2" />
                ServiÃ§os
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 rounded-full bg-white/60" />
          </div>
        </motion.div>
      </section>

      {/* â”€â”€ B. IDENTIDADE TERRITORIAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="w-full py-14 -mt-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
              <Heart className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">ResistÃªncia Â· Cultura Â· Comunidade</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 font-heading">
              Mais do que bairros.{' '}
              <span className="text-primary">Um territÃ³rio.</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              O Complexo do Nordeste de Amaralina nasceu no seculo XX como ocupacao popular a beira-mar
              e se tornou um dos territÃ³rios mais marcantes de Salvador. Com forte identidade cultural afro-brasileira,
              aqui surgiram artistas, mÃºsicos, grupos de capoeira, blocos afro e movimentos sociais que deram
              visibilidade as vozes perifericas da capital baiana.
            </p>
          </motion.div>

          {/* RaÃ­zes culturais */}
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {RAIZES.map((raiz) => (
              <motion.div
                key={raiz.label}
                {...staggerItem}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl border bg-card/80 backdrop-blur-sm border-border hover:border-primary/30 transition-colors text-center"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <raiz.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">{raiz.label}</span>
                <span className="text-[11px] text-muted-foreground leading-snug">{raiz.desc}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* â”€â”€ C. BAIRROS DO COMPLEXO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <motion.div {...fadeUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 mb-4">
            <MapPin className="h-3.5 w-3.5 text-teal-500" />
            <span className="text-xs font-semibold text-teal-500">4 Bairros unidos</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 font-heading">
            ConheÃ§a cada bairro
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Quatro comunidades distintas que compartilham origens, cultura e a luta por oportunidades.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BAIRROS.map((bairro, i) => (
            <motion.div
              key={bairro.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              onClick={() => navigate(`/ba/salvador/${bairro.slug}`)}
              className="relative rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
            >
              <div className="aspect-[3/4]">
                <motion.img
                  src={bairro.image}
                  alt={bairro.name}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.7 }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-bold text-lg drop-shadow-md leading-tight mb-1">{bairro.name}</h3>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="h-3 w-3 text-primary/80" />
                  <span className="text-primary/90 text-xs font-semibold">{bairro.populacao}</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{bairro.desc}</p>
              </div>
              <div className="absolute inset-0 bg-primary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div
                className="absolute top-3 right-3 bg-primary/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.2 }}
              >
                <ArrowRight className="h-3.5 w-3.5 text-primary-foreground" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* â”€â”€ D. ESTATÃSTICAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="w-full py-14 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">
              O Complexo em nÃºmeros
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Dados do territÃ³rio Â· Censo IBGE 2022
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, value: statsLoading ? 'â€”' : territoryStats?.population ? `~${(territoryStats.population / 1000).toFixed(0)}mil` : '~45mil', label: 'Habitantes', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
              { icon: MapPin, value: '4', label: 'Bairros', color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
              { icon: Store, value: isLoading ? 'â€”' : stats.businesses || 'â€”', label: 'Empresas', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { icon: Wrench, value: isLoading ? 'â€”' : stats.services || 'â€”', label: 'Profissionais', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
              { icon: GraduationCap, value: statsLoading ? 'â€”' : territoryStats?.schools ?? 'â€”', label: 'Escolas', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { icon: Bus, value: statsLoading ? 'â€”' : (territoryStats as any)?.bus_lines ?? 'â€”', label: 'Linhas de Ã´nibus', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                {...fadeUp}
                className={`${stat.bg} border ${stat.border} rounded-2xl p-5 text-center hover:scale-105 transition-transform`}
              >
                <div className="flex justify-center mb-3">
                  <div className={`h-11 w-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ E. CULTURA & RAÃZES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
            <Music className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">Cultura viva</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-heading mb-3">
            Onde a cultura <span className="text-primary">pulsa</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Celeiro de artistas, mÃºsicos e movimentos culturais. O Nordeste Ã© referÃªncia na cena do pagode baiano,
            mantÃ©m tradiÃ§Ãµes de capoeira, blocos afro, manifestaÃ§Ãµes religiosas e pesca artesanal.
          </p>
        </motion.div>

        {/* Galeria cultural */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {[
            { img: culturaImg, title: 'Roda de Capoeira', subtitle: 'TradiÃ§Ã£o de Mestre Bimba viva no territÃ³rio' },
            { img: musicaImg, title: 'PercussÃ£o & Pagode', subtitle: 'Sons que ecoam do Nordeste para o mundo' },
            { img: comercioImg, title: 'Feira & ComÃ©rcio', subtitle: 'Economia local que movimenta a comunidade' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden group aspect-[4/3]"
            >
              <img
                src={item.img}
                alt={item.title}
                loading="lazy"
                width={1024}
                height={768}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-white/65 text-sm">{item.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* â”€â”€ F. PROJETOS SOCIAIS & PROTAGONISMO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="w-full py-16 bg-gradient-to-br from-primary/5 via-card to-accent/5 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-500">Protagonismo comunitÃ¡rio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-heading mb-3">
              Projetos que <span className="text-primary">transformam</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              "Aqui tem projetos sociais de futebol, aÃ§Ãµes religiosas, uniÃ£o dos microempresÃ¡rios para distribuir comida,
              tudo feito pela comunidade." â€” Israel Almeida, TV MoradÃ´
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MARCOS_CULTURAIS.map((marco, i) => (
              <motion.div
                key={marco.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: '0 16px 32px -8px hsl(var(--primary) / 0.1)' }}
                className={`relative overflow-hidden bg-gradient-to-br ${marco.color} border ${marco.border} rounded-2xl p-6 transition-all`}
              >
                <div className={`h-12 w-12 rounded-xl bg-card/50 flex items-center justify-center mb-4`}>
                  <marco.icon className={`h-6 w-6 ${marco.iconColor}`} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{marco.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{marco.desc}</p>
                <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-current/5 rounded-full blur-2xl" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ G. SOBRE O TERRITÃ“RIO (IA) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <TerritoryAIContentSection
          territorySlug={resolved?.kind === 'group'
            ? resolved.group.slug || resolved.group.id
            : resolved?.location?.slug || resolved?.location?.id || 'complexo-do-nordeste-de-amaralina'
          }
          territoryName="Complexo do Nordeste de Amaralina"
          members={['Nordeste de Amaralina', 'Santa Cruz', 'Vale das Pedrinhas', 'Chapada do Rio Vermelho']}
          isGroup={true}
        />
      </div>

      {/* â”€â”€ H. DESTAQUES EDITORIAIS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(highlightsLoading || highlights.length > 0) && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 w-full">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              No Complexo agora
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Destaques e novidades do territÃ³rio</p>
          </div>
          {highlightsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {highlights.map((h) => (
                <motion.div
                  key={h.id}
                  {...fadeUp}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{h.title}</p>
                      {h.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{h.subtitle}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* â”€â”€ I. EMPRESAS EM DESTAQUE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">Empresas Locais</h2>
            <p className="text-base text-muted-foreground">ComÃ©rcios e negÃ³cios do territÃ³rio</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(moduleUrls.business)}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-xl hidden sm:flex"
          >
            Ver todas <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businesses.slice(0, 4).map((b) => (
              <motion.div
                key={b.id}
                {...fadeUp}
                onClick={() => {
                  if (!b.slug) return;
                  navigate(BusinessUrlService.getCanonicalUrl({ id: b.id, slug: b.slug, is_premium: b.is_premium, geographic_path: b.geographic_path }));
                }}
                className="bg-card border border-border rounded-2xl p-5 hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <BusinessLogo
                      name={b.name}
                      logoUrl={b.logo_url}
                      alt={b.name}
                      initialsClassName="text-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{b.name}</p>
                      {b.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{formatCategory(b.category)}</p>
                    {b.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-muted-foreground">{b.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Store className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Em breve, negÃ³cios locais aparecerÃ£o aqui.</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-lg" onClick={() => navigate(moduleUrls.business)}>
              Cadastrar empresa <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}
      </section>

      {/* â”€â”€ J. SERVIÃ‡OS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">Profissionais e ServiÃ§os</h2>
            <p className="text-base text-muted-foreground">Quem atende no Complexo</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(moduleUrls.services)}
            className="border-border text-muted-foreground hover:border-violet-500 hover:text-violet-500 font-medium text-sm rounded-xl hidden sm:flex"
          >
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.slice(0, 4).map((s) => (
              <motion.div
                key={s.id}
                {...fadeUp}
                onClick={() => navigate(moduleUrls.services)}
                className="bg-card border border-border rounded-2xl p-5 hover:shadow-xl hover:border-violet-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <BusinessLogo
                      name={s.name}
                      logoUrl={s.logo_url}
                      alt={s.name}
                      initialsClassName="text-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-violet-500 transition-colors">{s.name}</p>
                      {s.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{formatCategory(s.category)}</p>
                    {s.price_range && (
                      <p className="text-xs text-violet-500 font-semibold mt-1">{s.price_range}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Em breve, profissionais da regiÃ£o aparecerÃ£o aqui.</p>
          </div>
        )}
      </section>

      {/* â”€â”€ K. CLASSIFICADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">Classificados</h2>
            <p className="text-base text-muted-foreground">AnÃºncios recentes no territÃ³rio</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(moduleUrls.classifieds)}
            className="border-border text-muted-foreground hover:border-orange-500 hover:text-orange-500 font-medium text-sm rounded-xl hidden sm:flex"
          >
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : classifieds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {classifieds.slice(0, 4).map((c) => {
              const thumb = c.photos?.[0];
              const getUrl = () => {
                if (c.geographic_path && c.category_slug && c.subcategory_slug && c.slug && c.public_id) {
                  try {
                    return classifiedUrlService.buildUrls({
                      id: c.id,
                      public_id: c.public_id,
                      slug: c.slug,
                      geographic_path: c.geographic_path,
                      category_slug: c.category_slug,
                      subcategory_slug: c.subcategory_slug,
                    }).canonical;
                  } catch {
                    return classifiedUrls.short(c.public_id);
                  }
                }
                return classifiedUrls.short(c.public_id);
              };

              return (
                <motion.div
                  key={c.id}
                  {...fadeUp}
                  onClick={() => navigate(getUrl())}
                  className="bg-card border border-border rounded-2xl p-5 hover:shadow-xl hover:border-orange-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt={c.titulo} className="h-full w-full object-cover" />
                      ) : (
                        <Tag className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-orange-500 transition-colors mb-1">{c.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{formatCategory(c.category)}</p>
                      <p className="text-sm font-bold text-orange-500 mt-1">{formatPrice(c.price)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
            <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum anÃºncio ativo no momento.</p>
          </div>
        )}
      </section>

      {/* â”€â”€ L. CTA FINAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative w-full py-28 overflow-hidden">
        <motion.div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Complexo do Nordeste de Amaralina"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-black/80 to-background" />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-heading leading-tight">
              "Ã‰ um bairro rico, que nÃ£o se resume a uma Ãºnica coisa."
            </h2>
            <p className="text-base text-white/60 mb-3 italic">
              â€” Israel Almeida, TV MoradÃ´
            </p>
            <p className="text-base text-white/70 mb-8 max-w-xl mx-auto">
              FaÃ§a parte da plataforma que conecta quem vive, trabalha e constrÃ³i o Complexo do Nordeste.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-10 h-14 shadow-2xl shadow-primary/30 rounded-xl w-full sm:w-auto"
                onClick={() => navigate(user ? moduleUrls.community : '/login')}
              >
                {user ? 'Acessar Comunidade' : 'Cadastrar-se GrÃ¡tis'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base px-8 h-14 backdrop-blur-md rounded-xl w-full sm:w-auto"
                onClick={() => navigate(moduleUrls.business)}
              >
                Divulgar meu negÃ³cio
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer className="w-full bg-card border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-lg font-bold text-foreground font-heading">
              Achegue<span className="text-primary">-se</span>
              <span className="text-xs text-muted-foreground ml-2 font-normal">Â· Complexo do Nordeste de Amaralina</span>
            </span>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">InÃ­cio</button>
              <button onClick={() => navigate(moduleUrls.community)} className="hover:text-primary transition-colors">Comunidade</button>
              <button onClick={() => navigate('/sobre')} className="hover:text-primary transition-colors">Sobre</button>
              <button onClick={() => navigate('/privacidade')} className="hover:text-primary transition-colors">Privacidade</button>
            </div>

            <p className="text-xs text-muted-foreground">
              Â© 2025 Achegue-se Â· Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

