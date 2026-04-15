/**
 * MainLandingPage — Landing page principal do Achegue-se
 * 
 * Design profissional com hero impactante, módulos, territórios, personas e CTA.
 * Segue design system: tokens HSL, fonte DM Sans/Space Grotesk, dark theme.
 */

import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Store, Wrench, Briefcase, Tag, Calendar,
  Users, ArrowRight, MapPin, Clock,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { TERRITORY_CONFIG } from "@/config/territory";
import { useAuth } from "@/core/auth/hooks/useAuth";

// Imagens profissionais
import heroImg from "@/assets/hero-landing-main.jpg";
import santaCruz from "@/assets/bairro-santa-cruz.jpg";
import nordeste from "@/assets/bairro-nordeste.jpg";
import valePedrinhas from "@/assets/bairro-vale-pedrinhas.jpg";
import chapada from "@/assets/bairro-chapada.jpg";
import personaMorador from "@/assets/persona-morador.jpg";
import personaComerciante from "@/assets/persona-comerciante.jpg";
import personaPrestador from "@/assets/persona-prestador.jpg";
import personaEmprego from "@/assets/persona-emprego.jpg";

// ── Animações ────────────────────────────────────────────────────────
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

// ── Dados ────────────────────────────────────────────────────────────

const MODULOS = [
  {
    icon: Store,
    label: "Empresas Locais",
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/20",
    path: "/empresas/ba/salvador",
  },
  {
    icon: Wrench,
    label: "Serviços",
    color: "text-sky-400",
    bg: "bg-sky-500/15 border-sky-500/20",
    path: "/servicos/ba/salvador",
  },
  {
    icon: Briefcase,
    label: "Vagas",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    path: "/vagas/ba/salvador",
  },
  {
    icon: Tag,
    label: "Classificados",
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    path: "/classificados/ba/salvador",
  },
  {
    icon: Calendar,
    label: "Eventos",
    color: "text-rose-400",
    bg: "bg-rose-500/15 border-rose-500/20",
    path: "/comunidade/ba/salvador",
  },
  {
    icon: Users,
    label: "Comunidade",
    color: "text-primary",
    bg: "bg-primary/15 border-primary/20",
    path: "/comunidade/ba/salvador",
  },
];

const BAIRROS_ATIVOS = [
  { name: "Santa Cruz", image: santaCruz, slug: "santa-cruz", populacao: "~12.000 hab." },
  { name: "Nordeste", image: nordeste, slug: "nordeste-de-amaralina", populacao: "~25.000 hab." },
  { name: "Vale das Pedrinhas", image: valePedrinhas, slug: "vale-das-pedrinhas", populacao: "~18.000 hab." },
  { name: "Chapada", image: chapada, slug: "chapada-do-rio-vermelho", populacao: "~8.000 hab." },
];

const BAIRROS_EM_BREVE = [
  { name: "Pituba", populacao: "~65.000 hab." },
  { name: "Rio Vermelho", populacao: "~45.000 hab." },
  { name: "Amaralina", populacao: "~30.000 hab." },
  { name: "Itaigara", populacao: "~20.000 hab." },
];

const PERSONAS = [
  {
    image: personaMorador,
    label: "Moradores",
    description: "Conecte-se com vizinhos e fique por dentro do que acontece no seu bairro.",
  },
  {
    image: personaComerciante,
    label: "Comerciantes",
    description: "Divulgue seu negócio e alcance mais clientes na sua região.",
  },
  {
    image: personaPrestador,
    label: "Prestadores",
    description: "Ofereça seus serviços e encontre clientes perto de você.",
  },
  {
    image: personaEmprego,
    label: "Quem busca emprego",
    description: "Encontre vagas de trabalho reais na sua comunidade.",
  },
];

// ── Componente principal ─────────────────────────────────────────────

export default function MainLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Parallax: hero image moves slower than scroll
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "30%"]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0.3]);

  // Parallax: CTA section
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "end start"],
  });
  const ctaY = useTransform(ctaProgress, [0, 1], ["10%", "-10%"]);

  const handleExplorar = () => {
    navigate(`/ba/salvador/complexo-do-nordeste-de-amaralina`);
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Parallax background image */}
        <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale }}>
          <img
            src={heroImg}
            alt="Salvador - Complexo do Nordeste de Amaralina"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
        </motion.div>
        <motion.div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-background" style={{ opacity: heroOpacity }} />
        {/* Extra gradient that always stays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5">
          <span className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight">
            Achegue<span className="text-primary">-se</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex"
              onClick={() => navigate("/sobre")}
            >
              Sobre
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
              onClick={() => navigate(user ? "/perfil" : "/login")}
            >
              {user ? "Meu Perfil" : "Entrar"}
            </Button>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.15] mb-5 font-heading">
              Tudo o que importa no seu território,{" "}
              <span className="text-primary">em um só lugar.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/85 mb-2 max-w-2xl mx-auto">
              Empresas, serviços, vagas, classificados, eventos e informações úteis da sua região.
            </p>
            <p className="text-sm text-white/60 mb-10">
              Começando pelo <span className="text-primary/90 font-medium">Complexo do Nordeste de Amaralina</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-8 h-13 shadow-2xl shadow-primary/25 w-full sm:w-auto rounded-xl"
                onClick={handleExplorar}
              >
                Explorar o Complexo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base px-8 h-13 backdrop-blur-md w-full sm:w-auto rounded-xl"
                onClick={() => navigate("/empresas/ba/salvador")}
              >
                Divulgar meu negócio
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base px-8 h-13 backdrop-blur-md w-full sm:w-auto rounded-xl"
                onClick={() => navigate("/vagas/ba/salvador")}
              >
                Ver Vagas
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

      {/* ── MÓDULOS ───────────────────────────────────────────────── */}
      <section className="w-full py-12 -mt-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-3 md:grid-cols-6 gap-3"
          >
            {MODULOS.map((modulo) => (
              <motion.button
                key={modulo.label}
                {...staggerItem}
                onClick={() => navigate(modulo.path)}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group ${modulo.bg}`}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <modulo.icon className={`h-7 w-7 ${modulo.color}`} />
                </motion.div>
                <span className="text-xs font-semibold text-foreground leading-tight text-center">
                  {modulo.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TERRITÓRIOS ATIVOS ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <motion.div {...fadeUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Território ativo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 font-heading">
            Estamos começando por um território real.
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            O primeiro território é o <span className="text-primary font-semibold">Complexo do Nordeste de Amaralina</span> em Salvador.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BAIRROS_ATIVOS.map((bairro, i) => (
            <motion.div
              key={bairro.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -6 }}
              onClick={() => navigate(`/ba/salvador/${bairro.slug}`)}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
            >
              <motion.img
                src={bairro.image}
                alt={bairro.name}
                loading="lazy"
                width={800}
                height={600}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.7 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-bold text-base sm:text-lg drop-shadow-md">{bairro.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Users className="h-3 w-3 text-primary/80" />
                  <span className="text-primary/90 text-[11px] font-semibold">{bairro.populacao}</span>
                </div>
                <p className="text-white/50 text-[10px] mt-0.5">Salvador, BA</p>
              </div>
              {/* Hover overlay with glow */}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Hover arrow */}
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

      {/* ── EM BREVE ──────────────────────────────────────────────── */}
      <section className="w-full py-14 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">Em breve</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">
              Próximos bairros
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Estamos expandindo para outros bairros de Salvador.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BAIRROS_EM_BREVE.map((bairro, i) => (
              <motion.div
                key={bairro.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                whileHover={{ scale: 1.04, borderColor: "hsl(var(--primary) / 0.3)" }}
                className="relative rounded-2xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center min-h-[140px] transition-colors cursor-default"
              >
                <MapPin className="h-5 w-5 text-muted-foreground/40 mb-2" />
                <p className="text-base font-bold text-foreground">{bairro.name}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Users className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[11px] text-muted-foreground font-medium">{bairro.populacao}</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-400 mt-3 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  Em breve
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA VOCÊ ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-heading">
            Para Você
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Uma plataforma feita para quem vive, trabalha e constrói o bairro.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {PERSONAS.map((persona, i) => (
            <motion.div
              key={persona.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -6, boxShadow: "0 20px 40px -12px hsl(var(--primary) / 0.15)" }}
              className="flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors duration-300"
            >
              <motion.div
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden mb-4 ring-3 ring-primary/20 ring-offset-2 ring-offset-background"
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img
                  src={persona.image}
                  alt={persona.label}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <h3 className="text-sm sm:text-base font-bold text-foreground mb-1.5">{persona.label}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{persona.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────── */}
      <section ref={ctaRef} className="relative w-full py-24 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: ctaY }}>
          <img
            src={heroImg}
            alt="Salvador"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-black/80 to-background" />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-heading leading-tight">
              Não é mais uma rede social.{" "}
              <span className="text-primary">É uma plataforma territorial.</span>
            </h2>
            <p className="text-base text-white/70 mb-8 max-w-xl mx-auto">
              Encontre, divulgue e acompanhe o que importa no seu território.
            </p>

            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-10 h-14 shadow-2xl shadow-primary/30 rounded-xl"
              onClick={handleExplorar}
            >
              Entrar no Complexo do Nordeste
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="w-full bg-card border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-lg font-bold text-foreground font-heading">
              Achegue<span className="text-primary">-se</span>
              <span className="text-xs text-muted-foreground ml-2 font-normal">· Salvador, BA</span>
            </span>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">Início</button>
              <button onClick={() => navigate("/sobre")} className="hover:text-primary transition-colors">Sobre</button>
              <button onClick={() => navigate("/contato")} className="hover:text-primary transition-colors">Contato</button>
              <button onClick={() => navigate("/privacidade")} className="hover:text-primary transition-colors">Privacidade</button>
            </div>

            <p className="text-xs text-muted-foreground">
              © 2025 Achegue-se · Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
