/**
 * HomePageV2 — Layout "Comunidade Conectada"
 * Dark theme com acentos teal, seguindo o design system do projeto.
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquare,
  HelpCircle,
  Tag,
  AlertTriangle,
  MapPin,
  Users,
  MessageCircle,
  Calendar,
  Bell,
  ChevronRight,
  Home,
  ArrowRight,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useState } from "react";

import heroImg from "@/assets/hero-salvador.jpg";
import featuredImg from "@/assets/neighborhood-featured.jpg";
import pituba from "@/assets/bairro-pituba.jpg";
import riovermelho from "@/assets/bairro-riovermelho.jpg";
import stiep from "@/assets/bairro-stiep.jpg";
import ondina from "@/assets/bairro-ondina.jpg";

// ── Dados do bairro em destaque ──────────────────────────────────────
const FEATURED = {
  name: "Complexo do Nordeste de Amaralina",
  description:
    "O coração pulsante de Salvador, onde a beleza das praias encontra a força da nossa comunidade. Juntos, fazemos do Nordeste um lugar ainda melhor para viver.",
  neighborhoods: ["Amaralina", "Santa Cruz", "Chapada do Rio Vermelho", "Vale das Pedrinhas", "13 de Julho"],
  stats: [
    { icon: Users, value: "12.5k", label: "moradores" },
    { icon: MessageCircle, value: "156", label: "postagens hoje" },
    { icon: Calendar, value: "8", label: "eventos este mês" },
    { icon: Bell, value: "24", label: "alertas ativos" },
  ],
  image: featuredImg,
};

// ── Bairros vizinhos ─────────────────────────────────────────────────
const OTHER_NEIGHBORHOODS = [
  {
    name: "Pituba",
    description: "Bairro empresarial e residencial, conhecido pela infraestrutura completa.",
    residents: "15.2k",
    posts: "89",
    image: pituba,
  },
  {
    name: "Rio Vermelho",
    description: "Tradicional bairro boêmio, famoso pela gastronomia e vida cultural.",
    residents: "9.8k",
    posts: "124",
    image: riovermelho,
  },
  {
    name: "STIEP",
    description: "Centro administrativo e empresarial de Salvador, com fácil acesso.",
    residents: "7.3k",
    posts: "67",
    image: stiep,
  },
  {
    name: "Ondina",
    description: "Litoral com belas praias e ambiente universitário vibrante.",
    residents: "8.1k",
    posts: "93",
    image: ondina,
  },
];

// ── Ações rápidas ────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    icon: MessageSquare,
    title: "Criar uma Postagem",
    description: "Compartilhe novidades com seus vizinhos",
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  {
    icon: HelpCircle,
    title: "Pedir uma Recomendação",
    description: "Busque dicas sobre serviços locais",
    iconClass: "text-accent",
    bgClass: "bg-accent/10",
  },
  {
    icon: Tag,
    title: "Ver Classificados",
    description: "Encontre ou anuncie produtos",
    iconClass: "text-warning",
    bgClass: "bg-warning/10",
  },
];

// ── Quick chips do hero ──────────────────────────────────────────────
const HERO_CHIPS = [
  { icon: MessageSquare, label: "Criar Postagem" },
  { icon: HelpCircle, label: "Pedir Recomendação" },
  { icon: Tag, label: "Ofertas Locais" },
  { icon: AlertTriangle, label: "Alertas de Segurança" },
];

// ── NAV LINKS ────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Início", path: "/" },
  { label: "Eventos", path: LAUNCH_URLS.events || "#" },
  { label: "Classificados", path: LAUNCH_URLS.classifieds },
  { label: "Vagas", path: LAUNCH_URLS.jobs },
  { label: "Dicas Locais", path: LAUNCH_URLS.services },
  { label: "Segurança", path: "#" },
];

export default function HomePageV2() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const communityUrl = `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* ── BANNER PROMOCIONAL ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 border-b border-primary/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Novidade!</span> Agora você pode criar eventos comunitários e convidar seus vizinhos.
          </span>
          <button className="text-primary font-semibold hover:underline ml-1 flex items-center gap-0.5">
            Saiba mais <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Salvador - Nordeste de Amaralina"
            className="w-full h-full object-cover"
            width={1920}
            height={800}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-2">
              Seu bairro, sua comunidade
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4 font-heading">
              Complexo do Nordeste
              <br />
              de Amaralina
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-6">
              Conecte-se com seus vizinhos, acompanhe as novidades do bairro e fortaleça nossa comunidade.
            </p>

            {/* Search bar */}
            <div className="flex items-center gap-2 mb-4 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="O que você está procurando?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-lg"
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 px-5 rounded-lg">
                Pesquisar
              </Button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              {HERO_CHIPS.map((chip) => (
                <button
                  key={chip.label}
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
            Amaralina, Salvador - BA
          </div>
        </div>
      </section>

      {/* ── BAIRRO EM DESTAQUE ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row"
        >
          {/* Imagem */}
          <div className="relative md:w-2/5 h-56 md:h-auto overflow-hidden">
            <img
              src={FEATURED.image}
              alt={FEATURED.name}
              className="w-full h-full object-cover"
              loading="lazy"
              width={800}
              height={600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/20" />
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1.5">
              <Home className="h-3 w-3" />
              BAIRRO EM DESTAQUE
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 font-heading">
                {FEATURED.name}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-4 leading-relaxed">
                {FEATURED.description}
              </p>

              {/* Neighborhood tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {FEATURED.neighborhoods.map((n) => (
                  <span
                    key={n}
                    className="bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1 rounded-full border border-border"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats + CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 md:gap-6">
                {FEATURED.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-1.5">
                    <stat.icon className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-sm font-bold text-foreground">{stat.value}</span>
                      <span className="text-xs text-muted-foreground ml-1">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate(communityUrl)}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 font-semibold text-sm h-10 px-5 rounded-lg shrink-0"
              >
                Ver atividades do bairro
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── AÇÕES RÁPIDAS ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="bg-secondary/50 border border-border rounded-2xl p-5 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="md:w-1/4">
              <h3 className="text-lg font-bold text-foreground font-heading">Ações Rápidas</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Participe ativamente da sua comunidade
              </p>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.title}
                  className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg transition-all text-left group"
                >
                  <div className={`${action.bgClass} p-2 rounded-lg shrink-0`}>
                    <action.icon className={`h-5 w-5 ${action.iconClass}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── OUTROS BAIRROS ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">
              Outros Bairros em Salvador
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Explore outras comunidades na sua região
            </p>
          </div>
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:border-primary hover:text-primary font-medium text-sm rounded-lg hidden sm:flex"
          >
            Ver todos os bairros
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {OTHER_NEIGHBORHOODS.map((bairro) => (
            <motion.div
              key={bairro.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="h-32 md:h-40 overflow-hidden">
                <img
                  src={bairro.image}
                  alt={bairro.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  width={640}
                  height={640}
                />
              </div>
              <div className="p-3 md:p-4">
                <h3 className="font-bold text-foreground text-sm md:text-base mb-1 font-heading">
                  {bairro.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                  {bairro.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {bairro.residents} moradores
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-muted-foreground" />
                    {bairro.posts} hoje
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 sm:hidden">
          <Button
            variant="outline"
            className="w-full border-border text-muted-foreground font-medium text-sm rounded-lg"
          >
            Ver todos os bairros
          </Button>
        </div>
      </section>

      {/* ── MAIS BAIRROS SOON ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
        <div className="bg-secondary/50 border border-border rounded-xl px-5 py-4 flex items-start gap-3">
          <Home className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Mais bairros chegando em breve!</span>{" "}
            Vitória, Graça, Barra, Itaigara e muitos outros serão adicionados à plataforma.
          </p>
        </div>
      </section>

      {/* ── CTA FOOTER ────────────────────────────────────────────── */}
      <section className="w-full bg-gradient-to-br from-primary/20 via-card to-accent/20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">
            Faça Parte da Nossa Comunidade
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
            Junte-se a milhares de moradores do Complexo do Nordeste e ajude a construir um bairro melhor para todos.
          </p>
          <Button
            onClick={() => navigate(user ? communityUrl : "/login")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-11 px-8 rounded-lg shadow-lg"
          >
            Entrar para a Comunidade
          </Button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="w-full bg-card border-t border-border px-4 sm:px-6 py-4 text-center text-muted-foreground text-xs">
        Comunidade Conectada · Salvador, BA
      </footer>
    </div>
  );
}
