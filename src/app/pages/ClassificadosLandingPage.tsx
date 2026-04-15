/**
 * ClassificadosLandingPage — Vitrine pública de classificados
 * Estilo consistente com HomePageV2 e ServicosLandingPage: dark theme, acentos teal, motion.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Tag,
  Star,
  MapPin,
  ChevronRight,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  MessageCircle,
  Shield,
  TrendingUp,
  Clock,
  Users,
  Filter,
  Zap,
  Heart,
  ShoppingBag,
  Car,
  Home,
  Laptop,
  Shirt,
  Sofa,
  Bike,
  Package,
} from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { useAuth } from "@/core/auth/hooks/useAuth";

import heroImg from "@/assets/empresas-hero.jpg";

// ── Dados estáticos ──────────────────────────────────────────────────

const STATS = [
  { icon: ShoppingBag, value: "1.2k+", label: "anúncios ativos", color: "text-primary" },
  { icon: Users, value: "800+", label: "vendedores", color: "text-accent" },
  { icon: Shield, value: "100%", label: "gratuito", color: "text-success" },
  { icon: Clock, value: "< 1h", label: "tempo de resposta", color: "text-warning" },
];

const CATEGORIAS = [
  { id: "todos", name: "Todos", icone: "🏷️" },
  { id: "veiculos", name: "Veículos", icone: "🚗" },
  { id: "imoveis", name: "Imóveis", icone: "🏠" },
  { id: "eletronicos", name: "Eletrônicos", icone: "💻" },
  { id: "roupas", name: "Roupas", icone: "👕" },
  { id: "moveis", name: "Móveis", icone: "🛋️" },
  { id: "esportes", name: "Esportes", icone: "🚴" },
  { id: "outros", name: "Outros", icone: "📦" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  veiculos: Car,
  imoveis: Home,
  eletronicos: Laptop,
  roupas: Shirt,
  moveis: Sofa,
  esportes: Bike,
  outros: Package,
};

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Tag,
    title: "Publique seu anúncio",
    description: "Cadastre o que deseja vender com fotos, preço e descrição. É grátis e leva menos de 2 minutos.",
  },
  {
    step: "02",
    icon: MessageCircle,
    title: "Receba contatos",
    description: "Compradores interessados entram em contato diretamente via chat ou WhatsApp. Sem intermediários.",
  },
  {
    step: "03",
    icon: Star,
    title: "Conclua a venda",
    description: "Combine os detalhes, feche o negócio e avalie a experiência para ajudar a comunidade.",
  },
];

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: "Vendedores Verificados",
    description: "Perfis com identidade confirmada pela comunidade. Compre com mais segurança.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: MapPin,
    title: "Perto de Você",
    description: "Anúncios do seu bairro e região. Menos frete, mais praticidade.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Shield,
    title: "100% Gratuito",
    description: "Publique e compre sem pagar nada. Sem taxas ocultas, sem comissões.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Zap,
    title: "Negociação Direta",
    description: "Fale diretamente com o vendedor. Negocie o preço e combine a entrega do seu jeito.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

// Anúncios de exemplo para exibição estática na landing
const MOCK_ADS = [
  { id: "1", titulo: "iPhone 13 Pro 256GB", preco: 3200, categoria: "eletronicos", bairro: "Pituba", fotos: [], status: "active" },
  { id: "2", titulo: "Sofá 3 lugares retrátil", preco: 850, categoria: "moveis", bairro: "Rio Vermelho", fotos: [], status: "active" },
  { id: "3", titulo: "Bicicleta MTB Caloi", preco: 1100, categoria: "esportes", bairro: "Ondina", fotos: [], status: "active" },
  { id: "4", titulo: "Notebook Dell i5 8GB", preco: 2400, categoria: "eletronicos", bairro: "Stiep", fotos: [], status: "active" },
  { id: "5", titulo: "Cama box casal queen", preco: 700, categoria: "moveis", bairro: "Pituba", fotos: [], status: "reserved" },
  { id: "6", titulo: "Vestido festa longo", preco: 180, categoria: "roupas", bairro: "Barra", fotos: [], status: "active" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: "Disponível", color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  reserved: { label: "Reservado", color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  sold: { label: "Vendido", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
};

// ── Componentes auxiliares ────────────────────────────────────────────

function CategoryPill({
  cat,
  isActive,
  onClick,
}: {
  cat: (typeof CATEGORIAS)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all flex-shrink-0 min-w-[80px] ${
        isActive
          ? "bg-primary/15 border-primary/50 shadow-lg shadow-primary/10"
          : "bg-card border-border hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      <span className="text-2xl">{cat.icone}</span>
      <span className={`text-[11px] font-semibold whitespace-nowrap ${isActive ? "text-primary" : "text-muted-foreground"}`}>
        {cat.name}
      </span>
    </button>
  );
}

function AdCard({ ad, index, onClick }: { ad: (typeof MOCK_ADS)[number]; index: number; onClick: () => void }) {
  const status = STATUS_CONFIG[ad.status] || STATUS_CONFIG.active;
  const CatIcon = CATEGORY_ICONS[ad.categoria] || Package;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 6) * 0.05 }}
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group"
    >
      {/* Image / placeholder */}
      <div className="relative h-36 overflow-hidden bg-secondary">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
          <CatIcon className="h-12 w-12 text-primary/30" />
        </div>
        {/* Status badge */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm ${status.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </div>
        {/* Price */}
        <div className="absolute bottom-2 left-2">
          <span className="text-sm font-bold text-white drop-shadow-lg bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
            R$ {ad.preco.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors mb-2">
          {ad.titulo}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{ad.bairro}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Página principal ─────────────────────────────────────────────────

export default function ClassificadosLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const classifiedsUrl = LAUNCH_URLS.classifieds;

  const filteredAds = MOCK_ADS.filter((ad) =>
    (selectedCategory === "todos" || ad.categoria === selectedCategory) &&
    (searchQuery === "" || ad.titulo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAdClick = useCallback((adId: string) => navigate(`/classificado/${adId}`), [navigate]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Tag className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground font-heading">
              Classificados <span className="text-primary">Locais</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/")} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Início
            </button>
            <button onClick={() => navigate(LAUNCH_URLS.business)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Empresas
            </button>
            <button onClick={() => navigate(LAUNCH_URLS.services)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Serviços
            </button>
            <button onClick={() => navigate(LAUNCH_URLS.community)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Comunidade
            </button>
          </div>

          <Button
            onClick={() => navigate(user ? "/classificados/novo" : "/login")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-9 px-4 rounded-lg"
          >
            {user ? "Anunciar Grátis" : "Entrar"}
          </Button>
        </div>
      </nav>

      {/* ── BANNER PROMOCIONAL ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-primary/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Anuncie grátis!</span>{" "}
            Venda para milhares de moradores da sua região sem pagar nada.
          </span>
          <button
            onClick={() => navigate(user ? "/classificados/novo" : "/login")}
            className="text-primary font-semibold hover:underline ml-1 flex items-center gap-0.5"
          >
            Publicar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <CanonicalHero
        moduleName="Classificados"
        moduleIcon={Tag}
        territoryFallback="Sua Comunidade"
        title="Classificados da"
        titleHighlight="Sua Comunidade"
        subtitle="Eletrônicos, móveis, veículos, roupas e muito mais. Anúncios de moradores da sua região, sem taxas e sem intermediários."
        backgroundImage={heroImg}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Buscar iPhone, sofá, bicicleta...",
        }}
        primaryCTA={{ label: "Buscar", onClick: () => {} }}
        quickFilters={CATEGORIAS.slice(1, 6).map((cat) => ({
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

      {/* ── CATEGORIAS ────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="bg-secondary/50 border border-border rounded-2xl p-5 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground font-heading">Categorias</h2>
              <p className="text-sm text-muted-foreground mt-1">Encontre exatamente o que você procura</p>
            </div>
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {CATEGORIAS.map((cat) => (
              <CategoryPill
                key={cat.id}
                cat={cat}
                isActive={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── ANÚNCIOS ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              {selectedCategory === "todos"
                ? "Anúncios Recentes"
                : `${CATEGORIAS.find((c) => c.id === selectedCategory)?.name || "Anúncios"}`}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAds.length} anúncios encontrados
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(classifiedsUrl)}
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-lg hidden sm:flex"
          >
            Ver todos
          </Button>
        </div>

        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAds.map((ad, i) => (
              <AdCard key={ad.id} ad={ad} index={i} onClick={() => handleAdClick(ad.id)} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-2xl px-6 py-12 text-center">
            <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum anúncio encontrado nesta categoria.</p>
            <Button variant="outline" onClick={() => setSelectedCategory("todos")} className="mt-3">
              Ver todas as categorias
            </Button>
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => navigate(classifiedsUrl)}
            className="w-full border-border text-muted-foreground font-medium text-sm rounded-lg"
          >
            Ver todos os anúncios
          </Button>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/8 via-card to-accent/8 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Como Funciona</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Simples, rápido e sem burocracia. Compre e venda diretamente com moradores da sua região.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl hover:border-primary/30 transition-all group"
              >
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
            Vantagens exclusivas para quem compra e vende na comunidade.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all"
            >
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

      {/* ── CTA ANUNCIAR ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 md:pb-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-primary/15 via-card to-accent/15 border border-primary/20 rounded-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 font-heading">
                Tem algo para vender? Anuncie Grátis!
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-4 max-w-lg">
                Alcance compradores da sua região em minutos. Sem taxas, sem comissões,
                sem burocracia. Só você e o comprador.
              </p>
              <div className="flex items-center gap-4 justify-center md:justify-start text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Perfil verificado
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-accent" /> Avaliações reais
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-success" /> Mais visibilidade
                </span>
              </div>
            </div>
            <Button
              onClick={() => navigate(user ? "/classificados/novo" : "/login")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-12 px-8 rounded-xl shadow-lg shrink-0"
            >
              Publicar Anúncio
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/20 via-card to-accent/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">
            Procurando algo específico?
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
            Explore todos os classificados de{" "}
            {TERRITORY_CONFIG.launch.name}. Encontre ótimas oportunidades perto de você.
          </p>
          <Button
            onClick={() => navigate(classifiedsUrl)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-11 px-8 rounded-lg shadow-lg"
          >
            Explorar Classificados
          </Button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Tag className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Classificados Locais — {TERRITORY_CONFIG.launch.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">Início</button>
            <button onClick={() => navigate(LAUNCH_URLS.community)} className="hover:text-primary transition-colors">Comunidade</button>
            <button onClick={() => navigate(LAUNCH_URLS.services)} className="hover:text-primary transition-colors">Serviços</button>
            <button onClick={() => navigate(LAUNCH_URLS.business)} className="hover:text-primary transition-colors">Empresas</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
