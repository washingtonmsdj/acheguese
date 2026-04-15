/**
 * CidadeLandingPage — Vitrine pública da cidade
 * 
 * Estilo editorial: dark theme, acentos teal, motion.
 * Consistente com HomePageV2 e ServicosLandingPage.
 * 
 * Seções:
 *   A. Hero da cidade
 *   B. Estatísticas (bairros, moradores, empresas, serviços)
 *   C. Bairros em destaque
 *   D. Vagas de emprego
 *   E. Pontos turísticos
 *   F. Políticos eleitos
 *   G. Contatos úteis (emergência, utilidade pública)
 *   H. CTA — Faça parte
 *   I. Rodapé com dados da prefeitura
 */

import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, MapPin, Users, Building2, Store, Wrench,
  ArrowRight, ChevronRight, Star,
  Briefcase, Landmark, Camera, Phone, Mail,
  Globe, Instagram, Facebook, Twitter, Youtube,
  GraduationCap, Heart, Shield, TreePine, Bus,
  Clock, ExternalLink, Award, Vote, MapPinned,
  AlertTriangle, Ambulance, Flame,
  Home, Loader2, BadgeCheck, Tag,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { TERRITORY_CONFIG, LAUNCH_URLS } from "@/config/territory";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useCityMetadata } from "@/core/city/hooks/useCityMetadata";
import { useCityFeatured } from "@/core/city/hooks/useCityFeatured";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { classifiedUrlService } from "@/modules/classifieds/services/ClassifiedUrlService";
import { useClassifiedUrls } from "@/modules/classifieds/hooks/useClassifiedUrls";
import { useTouristPoints } from "@/core/tourist-points/hooks/useTouristPoints";

import heroImg from "@/assets/hero-cidade-salvador.jpg";
import featuredImg from "@/assets/neighborhood-featured.jpg";

// ── Animação base ────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

// ── Helpers ──────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k+`;
  return num.toString();
}

function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ');
}

function formatPrice(price: number): string {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// ── Dados mockados originais (para comparação) ────────────────────────

const EMPRESAS_MOCK = [
  { 
    id: 'mock-1',
    name: "Padaria São Jorge", 
    category: "alimentacao", 
    rating: 4.8, 
    is_verified: true, 
    is_premium: false,
    logo_url: null,
    slug: null,
    geographic_path: null,
  },
  { 
    id: 'mock-2',
    name: "Farmácia Vida", 
    category: "saude", 
    rating: 4.5, 
    is_verified: true, 
    is_premium: true,
    logo_url: null,
    slug: null,
    geographic_path: null,
  },
];

const SERVICOS_MOCK = [
  { 
    id: 'mock-s1',
    name: "João Eletricista", 
    category: "eletrica", 
    price_range: "R$ 80-150/h", 
    is_verified: true,
    logo_url: null,
  },
  { 
    id: 'mock-s2',
    name: "Maria Diarista", 
    category: "limpeza", 
    price_range: "R$ 120/dia", 
    is_verified: true,
    logo_url: null,
  },
];

const CLASSIFICADOS_MOCK = [
  {
    id: 'mock-c1',
    titulo: "Sofá 3 Lugares Novo",
    category: "moveis",
    price: 1200,
    photos: null,
    public_id: 'mock001',
    geographic_path: null,
    category_slug: null,
    subcategory_slug: null,
    slug: null,
  },
  {
    id: 'mock-c2',
    titulo: "iPhone 12 Pro 128GB",
    category: "eletronicos",
    price: 2800,
    photos: null,
    public_id: 'mock002',
    geographic_path: null,
    category_slug: null,
    subcategory_slug: null,
    slug: null,
  },
];

const VAGAS_EMPREGO = [
  { titulo: "Desenvolvedor Full Stack",  empresa: "TechBa Solutions",     tipo: "CLT",        salario: "R$ 6.000 - R$ 9.000", bairro: "Pituba",        tags: ["React", "Node.js"] },
  { titulo: "Auxiliar Administrativo",   empresa: "Grupo Salvador",        tipo: "CLT",        salario: "R$ 1.800 - R$ 2.200", bairro: "Comércio",      tags: ["Excel", "Organização"] },
  { titulo: "Vendedor(a) Externo",       empresa: "Distribuidora Bahia",   tipo: "Comissão",   salario: "R$ 2.500 + comissão",  bairro: "Brotas",        tags: ["Vendas", "Comunicação"] },
  { titulo: "Garçom/Garçonete",          empresa: "Restaurante Mar Azul",  tipo: "CLT",        salario: "R$ 1.500 + gorjetas",  bairro: "Rio Vermelho",  tags: ["Atendimento", "Gastronomia"] },
  { titulo: "Professor(a) de Inglês",    empresa: "Instituto Cultural BA", tipo: "PJ",         salario: "R$ 45/hora",           bairro: "Barra",         tags: ["Educação", "Idiomas"] },
  { titulo: "Motorista de App",          empresa: "Cooperativa Mobilidade",tipo: "Autônomo",   salario: "Livre",                bairro: "Toda cidade",   tags: ["CNH B", "Disponibilidade"] },
];

const POLITICOS = [
  { nome: "Bruno Reis",            cargo: "Prefeito",                   partido: "União Brasil", mandato: "2025-2028", foto: null },
  { nome: "Ana Paula Matos",       cargo: "Vice-Prefeita",             partido: "PDT",           mandato: "2025-2028", foto: null },
  { nome: "Carlos Muniz",          cargo: "Presidente da Câmara",      partido: "PSDB",          mandato: "2025-2026", foto: null },
];

const CONTATOS_EMERGENCIA = [
  { nome: "SAMU",                telefone: "192",     icone: Ambulance,       cor: "text-destructive" },
  { nome: "Bombeiros",           telefone: "193",     icone: Flame,           cor: "text-warning" },
  { nome: "Polícia Militar",     telefone: "190",     icone: Shield,          cor: "text-blue-500" },
  { nome: "Defesa Civil",        telefone: "199",     icone: AlertTriangle,   cor: "text-accent" },
];

const CONTATOS_UTILIDADE = [
  { nome: "Ouvidoria Municipal",  telefone: "156",             tipo: "telefone" },
  { nome: "Iluminação Pública",   telefone: "0800 071 5454",   tipo: "telefone" },
  { nome: "Cagece (Água)",        telefone: "0800 071 0115",   tipo: "telefone" },
  { nome: "Coelba (Energia)",     telefone: "0800 071 0300",   tipo: "telefone" },
];

const PREFEITURA = {
  nome: "Prefeitura Municipal de Salvador",
  endereco: "Praça Municipal, s/n - Centro, Salvador - BA, 40020-010",
  telefone: "(71) 3202-6100",
  email: "ouvidoria@salvador.ba.gov.br",
  site: "https://www.salvador.ba.gov.br",
  instagram: "@preikiatura_ssa",
  facebook: "PrefeituraDeSalvador",
  twitter: "@prefikitura_ssa",
  youtube: "PrefeituraDeSalvador",
  horario: "Seg a Sex, 8h às 17h",
};

// ── Página principal ─────────────────────────────────────────────────

export default function CidadeLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state = 'ba', city = 'salvador' } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Busca metadados da cidade (população, bairros, etc.)
  const { data: cityMetadata, isLoading: metadataLoading } = useCityMetadata(state, city);
  
  // Busca conteúdo em destaque (empresas, serviços, classificados reais)
  const { businesses: businessesReal, services: servicesReal, classifieds: classifiedsReal, isLoading: featuredLoading } = useCityFeatured(state, city);
  
  // Mistura dados reais com mocks para comparação
  // Empresas: 2 mocks + até 4 reais = 6 total
  const businesses = [...EMPRESAS_MOCK, ...businessesReal.slice(0, 4)];
  
  // Serviços: 2 mocks + até 4 reais = 6 total
  const services = [...SERVICOS_MOCK, ...servicesReal.slice(0, 4)];
  
  // Classificados: 2 mocks + até 4 reais = 6 total
  const classifieds = [...CLASSIFICADOS_MOCK, ...classifiedsReal.slice(0, 4)];
  
  // URLs helper para classificados
  const classifiedUrls = useClassifiedUrls(null);

  // Pontos turísticos via SSOT (com fallback para mock)
  const { data: touristPoints = [] } = useTouristPoints({ state, city, limit: 6 });

  const communityUrl = `/${state}/${city}`;

  // Estatísticas dinâmicas da cidade
  const CITY_STATS = [
    { icon: MapPinned,     value: formatNumber(cityMetadata?.districts_count ?? 163),      label: "Bairros",           color: "text-primary",   bg: "bg-primary/10",  border: "border-primary/20"  },
    { icon: Users,         value: formatNumber(cityMetadata?.population ?? 2900000),       label: "Habitantes",        color: "text-accent",    bg: "bg-accent/10",   border: "border-accent/20"   },
    { icon: Store,         value: formatNumber(cityMetadata?.active_businesses ?? 45000),  label: "Empresas ativas",   color: "text-warning",   bg: "bg-warning/10",  border: "border-warning/20"  },
    { icon: GraduationCap, value: formatNumber(cityMetadata?.schools_count ?? 1200),       label: "Escolas",           color: "text-success",   bg: "bg-success/10",  border: "border-success/20"  },
    { icon: Wrench,        value: formatNumber(cityMetadata?.professionals_count ?? 8000), label: "Profissionais",     color: "text-violet-500",bg: "bg-violet-500/10",border: "border-violet-500/20"},
    { icon: Bus,           value: formatNumber(cityMetadata?.bus_lines_count ?? 450),      label: "Linhas de ônibus",  color: "text-rose-500",  bg: "bg-rose-500/10", border: "border-rose-500/20" },
  ];

  const scrollTo = (id: string) => {
    if (id.startsWith("#")) {
      document.getElementById(id.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(id);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">

      {/* ── A. HERO ──────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden min-h-[85vh] md:min-h-[75vh] flex items-center">
        {/* Background image with overlays */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Salvador, Bahia - Vista panorâmica"
            className="w-full h-full object-cover"
            width={1920}
            height={800}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/85 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/90 backdrop-blur-sm border border-primary rounded-full px-4 py-2 mb-4 shadow-lg"
            >
              <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="text-primary-foreground font-bold text-xs tracking-wide uppercase">
                Capital da Bahia · Fundada em 1549
              </span>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] mb-5 font-heading">
              Salvador
              <br />
              <span className="text-primary">Cidade da Alegria</span>
            </h1>

            {/* Description */}
            <p className="text-muted-foreground text-base md:text-xl leading-relaxed mb-8 max-w-xl">
              Primeira capital do Brasil, patrimônio cultural da humanidade. Conheça os bairros, serviços, vagas de emprego e tudo sobre nossa cidade.
            </p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 max-w-xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar bairro, serviço, vaga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-card/95 backdrop-blur-sm border-border text-foreground placeholder:text-muted-foreground rounded-xl text-base shadow-sm"
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-14 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
                Pesquisar
              </Button>
            </motion.div>

            {/* Quick access chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { icon: Home, label: "Página Inicial", onClick: () => navigate("/") },
                { icon: Briefcase, label: "Vagas", onClick: () => scrollTo("#vagas") },
                { icon: Camera, label: "Turismo", onClick: () => scrollTo("#turismo") },
                { icon: Phone, label: "Contatos", onClick: () => scrollTo("#contatos") },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.onClick}
                  className="flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-card transition-all"
                >
                  <chip.icon className="h-4 w-4" />
                  {chip.label}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Location badge - bottom right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute bottom-6 right-6 hidden lg:flex items-center gap-2 bg-card/95 backdrop-blur-md border border-border rounded-xl px-4 py-2.5 shadow-lg"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Salvador, Bahia · Brasil</span>
          </motion.div>
        </div>
      </section>

      {/* ── B. ESTATÍSTICAS ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CITY_STATS.map((stat) => (
            <motion.div
              key={stat.label}
              {...fadeUp}
              className={`${stat.bg} border ${stat.border} rounded-2xl p-5 text-center hover:scale-105 hover:shadow-lg transition-all`}
            >
              <div className="flex justify-center mb-3">
                <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── EMPRESAS REAIS DA CIDADE ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">Empresas em Destaque</h2>
            <p className="text-base text-muted-foreground">Negócios locais verificados</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(LAUNCH_URLS.business)}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-xl hidden sm:flex"
          >
            Ver todas
          </Button>
        </div>

        {featuredLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {businesses.map((business, index) => {
              const isMock = business.id.startsWith('mock-');
              return (
                <motion.div
                  key={business.id}
                  {...fadeUp}
                  onClick={() => {
                    if (isMock) return;
                    if (!business.slug) return;
                    const url = BusinessUrlService.getCanonicalUrl({
                      id: business.id,
                      slug: business.slug,
                      is_premium: business.is_premium,
                      geographic_path: business.geographic_path
                    });
                    navigate(url);
                  }}
                  className={`bg-card border rounded-2xl p-5 hover:shadow-xl transition-all ${
                    isMock 
                      ? 'cursor-default border-border' 
                      : 'cursor-pointer group border-border hover:border-primary/30'
                  }`}
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
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className={`text-base font-bold truncate ${
                          isMock ? 'text-foreground' : 'text-foreground group-hover:text-primary transition-colors'
                        }`}>
                          {business.name}
                        </h3>
                        {business.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        {!isMock && business.is_premium && (
                          <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">{formatCategory(business.category)}</p>
                      {business.rating > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-foreground">{business.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma empresa cadastrada ainda</p>
          </div>
        )}
      </section>

      {/* ── SERVIÇOS REAIS DA CIDADE ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">Profissionais em Destaque</h2>
            <p className="text-base text-muted-foreground">Serviços verificados na cidade</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(LAUNCH_URLS.services)}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-xl hidden sm:flex"
          >
            Ver todos
          </Button>
        </div>

        {featuredLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {services.map((service) => {
              const isMock = service.id.startsWith('mock-');
              return (
                <motion.div
                  key={service.id}
                  {...fadeUp}
                  onClick={() => !isMock && navigate(LAUNCH_URLS.services)}
                  className={`bg-card border rounded-2xl p-5 hover:shadow-xl transition-all ${
                    isMock 
                      ? 'cursor-default border-border' 
                      : 'cursor-pointer group border-border hover:border-violet-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <BusinessLogo
                        name={service.name}
                        logoUrl={service.logo_url}
                        alt={service.name}
                        initialsClassName="text-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className={`text-base font-bold truncate ${
                          isMock ? 'text-foreground' : 'text-foreground group-hover:text-violet-500 transition-colors'
                        }`}>
                          {service.name}
                        </h3>
                        {service.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">{formatCategory(service.category)}</p>
                      {service.price_range && (
                        <p className="text-sm text-violet-500 font-semibold">{service.price_range}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum profissional cadastrado ainda</p>
          </div>
        )}
      </section>

      {/* ── CLASSIFICADOS REAIS DA CIDADE ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading mb-2">Classificados Recentes</h2>
            <p className="text-base text-muted-foreground">Anúncios ativos na cidade</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(LAUNCH_URLS.classifieds)}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-xl hidden sm:flex"
          >
            Ver todos
          </Button>
        </div>

        {featuredLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : classifieds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {classifieds.map((classified) => {
              const isMock = classified.id.startsWith('mock-');
              const thumb = classified.photos?.[0];
              
              const getUrl = () => {
                if (isMock) return '#';
                if (classified.geographic_path && classified.category_slug && classified.subcategory_slug && classified.slug && classified.public_id) {
                  try {
                    const urls = classifiedUrlService.buildUrls({
                      id: classified.id,
                      public_id: classified.public_id,
                      slug: classified.slug,
                      geographic_path: classified.geographic_path,
                      category_slug: classified.category_slug,
                      subcategory_slug: classified.subcategory_slug,
                    });
                    return urls.canonical;
                  } catch {
                    return classifiedUrls.short(classified.public_id);
                  }
                }
                return classifiedUrls.short(classified.public_id);
              };

              return (
                <motion.div
                  key={classified.id}
                  {...fadeUp}
                  onClick={() => !isMock && navigate(getUrl())}
                  className={`bg-card border rounded-2xl p-5 hover:shadow-xl transition-all ${
                    isMock 
                      ? 'cursor-default border-border' 
                      : 'cursor-pointer group border-border hover:border-orange-500/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {thumb ? (
                        <img src={thumb} alt={classified.titulo} className="h-full w-full object-cover" />
                      ) : (
                        <Tag className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-bold truncate mb-1.5 ${
                        isMock ? 'text-foreground' : 'text-foreground group-hover:text-orange-500 transition-colors'
                      }`}>
                        {classified.titulo}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mb-2">{formatCategory(classified.category)}</p>
                      <p className="text-base font-bold text-orange-500">{formatPrice(classified.price)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum classificado ativo no momento</p>
          </div>
        )}
      </section>

      {/* ── D. VAGAS DE EMPREGO ───────────────────────────────────── */}
      <section id="vagas" className="w-full bg-gradient-to-br from-primary/8 via-card to-accent/8 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Vagas de Emprego</h2>
            </div>
            <p className="text-base text-muted-foreground">Oportunidades de trabalho em Salvador</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {VAGAS_EMPREGO.map((vaga, i) => (
              <motion.div
                key={vaga.titulo}
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-5 md:p-6 hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs bg-secondary text-secondary-foreground font-semibold px-3 py-1.5 rounded-full">
                    {vaga.tipo}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {vaga.titulo}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">{vaga.empresa}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{vaga.bairro}</span>
                </div>
                <p className="text-base font-bold text-primary mb-4">{vaga.salario}</p>
                <div className="flex flex-wrap gap-2">
                  {vaga.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 font-semibold rounded-xl h-11 px-6"
              onClick={() => navigate(LAUNCH_URLS.jobs)}
            >
              Ver todas as vagas <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── E. PONTOS TURÍSTICOS ─────────────────────────────────── */}
      <section id="turismo" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Camera className="h-5 w-5 text-warning" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Pontos Turísticos</h2>
            </div>
            <p className="text-sm text-muted-foreground">Descubra as belezas de Salvador</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/pontos-turisticos/${state}/${city}`)}
            className="border-warning/30 text-warning hover:bg-warning/10 font-semibold text-sm rounded-lg hidden sm:flex"
          >
            Ver todos <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {touristPoints.map((ponto, i) => (
            <motion.div
              key={ponto.id}
              {...fadeUp}
              transition={{ delay: i * 0.08 }}
              className={`bg-card border rounded-2xl p-5 hover:shadow-xl transition-all cursor-pointer ${
                ponto.is_featured
                  ? "border-warning/30 hover:border-warning/50"
                  : "border-border hover:border-primary/30"
              }`}
              onClick={() => navigate(`/pontos-turisticos/${state}/${city}/${ponto.slug}`)}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{ponto.icon_emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">{ponto.name}</h3>
                    {ponto.is_featured && (
                      <Star className="h-3 w-3 text-warning fill-warning" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ponto.short_description || ponto.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="text-center mt-6 sm:hidden">
          <Button
            variant="outline"
            className="border-warning/30 text-warning hover:bg-warning/10 font-semibold rounded-lg"
            onClick={() => navigate(`/pontos-turisticos/${state}/${city}`)}
          >
            Ver todos os pontos <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── F. POLÍTICOS ELEITOS ──────────────────────────────────── */}
      <section className="w-full bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Vote className="h-6 w-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Representantes Eleitos</h2>
            </div>
            <p className="text-base text-muted-foreground">Poder executivo de Salvador (2025–2028)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {POLITICOS.map((pol, i) => (
              <motion.div
                key={pol.nome}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-7 text-center hover:shadow-xl hover:border-primary/30 transition-all"
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Landmark className="h-9 w-9 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">{pol.nome}</h3>
                <p className="text-sm text-primary font-semibold mb-2">{pol.cargo}</p>
                <p className="text-xs text-muted-foreground">{pol.partido} · {pol.mandato}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── G. CONTATOS ÚTEIS ─────────────────────────────────────── */}
      <section id="contatos" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-success" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Contatos Úteis</h2>
          </div>
          <p className="text-sm text-muted-foreground">Números de emergência e utilidade pública</p>
        </div>

        {/* Emergência */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Emergência
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CONTATOS_EMERGENCIA.map((c) => (
              <a
                key={c.nome}
                href={`tel:${c.telefone}`}
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

        {/* Utilidade pública */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            Utilidade Pública
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONTATOS_UTILIDADE.map((c) => (
              <a
                key={c.nome}
                href={`tel:${c.telefone.replace(/\s/g, "")}`}
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

      {/* ── H. CTA ────────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-primary font-bold text-sm">Junte-se a nós</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-heading leading-tight">
              Faça Parte da Comunidade<br className="hidden sm:block" /> de Salvador
            </h2>
            
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Conecte-se com moradores do seu bairro, descubra serviços locais, encontre vagas de emprego e fique por dentro de tudo que acontece na sua cidade.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate(user ? communityUrl : "/login")}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                {user ? "Ir para Comunidade" : "Criar Conta Grátis"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(LAUNCH_URLS.business)}
                size="lg"
                className="border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 font-semibold h-12 px-8 rounded-xl w-full sm:w-auto"
              >
                Cadastrar Negócio
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Gratuito para sempre · Sem taxas ocultas · Comunidade local
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── I. RODAPÉ DA PREFEITURA ───────────────────────────────── */}
      <footer className="w-full bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Info da Prefeitura */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Prefeitura de Salvador</h3>
                  <p className="text-[10px] text-muted-foreground">Governo Municipal</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                  {PREFEITURA.endereco}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {PREFEITURA.horario}
                </p>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-4">Contato</h3>
              <div className="space-y-2.5">
                <a href={`tel:${PREFEITURA.telefone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {PREFEITURA.telefone}
                </a>
                <a href={`mailto:${PREFEITURA.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {PREFEITURA.email}
                </a>
                <a href={PREFEITURA.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  {PREFEITURA.site.replace("https://", "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Redes sociais */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-4">Redes Sociais</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <a href={`https://instagram.com/${PREFEITURA.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-lg px-3 py-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
                <a href={`https://facebook.com/${PREFEITURA.facebook}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-lg px-3 py-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
                <a href={`https://twitter.com/${PREFEITURA.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors bg-secondary/50 rounded-lg px-3 py-2">
                  <Twitter className="h-4 w-4" />
                  Twitter/X
                </a>
                <a href={`https://youtube.com/${PREFEITURA.youtube}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors bg-secondary/50 rounded-lg px-3 py-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Divider + links */}
          <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">Início</button>
              <button onClick={() => navigate(LAUNCH_URLS.business)} className="hover:text-primary transition-colors">Empresas</button>
              <button onClick={() => navigate(LAUNCH_URLS.services)} className="hover:text-primary transition-colors">Serviços</button>
              <button onClick={() => navigate(LAUNCH_URLS.classifieds)} className="hover:text-primary transition-colors">Classificados</button>
              <button onClick={() => navigate(communityUrl)} className="hover:text-primary transition-colors">Comunidade</button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              © 2025 Comunidade Conectada · Salvador, BA · Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
