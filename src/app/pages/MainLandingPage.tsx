/**
 * MainLandingPage — Landing page principal do Achegue-se
 * 
 * Design profissional com hero impactante, módulos, territórios, personas e CTA.
 * Segue design system: tokens HSL, fonte DM Sans/Space Grotesk, dark theme.
 */

import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Wrench, Briefcase, Tag, Calendar,
  Users, ArrowRight, MapPin, Loader2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { TERRITORY_CONFIG } from "@/config/territory";
import { useState, useEffect, useRef } from "react";

// Imagens profissionais
import heroImg from "@/assets/hero-landing-main.jpg";
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

const LOADING_PHRASES_COMMUNITY = [
  "Organizando a comunidade... 🧭",
  "Conectando comercios locais... 🏪",
  "Preparando alertas do territorio... 🚨",
  "Atualizando eventos do bairro... 📅",
  "Ativando servicos da regiao... 🔧",
  "Chamando os vizinhos... 👋",
];

  const MODULOS = [
  {
    icon: Store,
    label: "Empresas Locais",
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/20",
    path: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
  },
  {
    icon: Wrench,
    label: "Serviços",
    color: "text-sky-400",
    bg: "bg-sky-500/15 border-sky-500/20",
    path: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
  },
  {
    icon: Briefcase,
    label: "Vagas",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    path: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
  },
  {
    icon: Tag,
    label: "Classificados",
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    path: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
  },
  {
    icon: Calendar,
    label: "Eventos",
    color: "text-rose-400",
    bg: "bg-rose-500/15 border-rose-500/20",
    path: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
  },
  {
    icon: Users,
    label: "Comunidade",
    color: "text-primary",
    bg: "bg-primary/15 border-primary/20",
    path: "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina",
  },
];

const BAIRROS_ATIVOS = [
  { name: "Santa Cruz", slug: "santa-cruz", populacao: "27.083 hab." },
  { name: "Nordeste", slug: "nordeste-de-amaralina", populacao: "21.887 hab." },
  { name: "Vale das Pedrinhas", slug: "vale-das-pedrinhas", populacao: "5.162 hab." },
  { name: "Chapada", slug: "chapada-do-rio-vermelho", populacao: "21.955 hab." },
];


const PERSONAS = [
  {
    image: personaMorador,
    label: "Moradores",
    description: "Vizinhos, eventos e tudo do bairro num só lugar.",
  },
  {
    image: personaComerciante,
    label: "Comerciantes",
    description: "Mais visibilidade para o seu negócio local.",
  },
  {
    image: personaPrestador,
    label: "Prestadores",
    description: "Clientes perto de você, sem intermediários.",
  },
  {
    image: personaEmprego,
    label: "Quem busca emprego",
    description: "Vagas reais, na sua comunidade.",
  },
];

// ── Componente principal ─────────────────────────────────────────────

export default function MainLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const launchCityPath = `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const cityNavigationTimeoutRef = useRef<number | null>(null);

  // Carrossel de frases durante o loading
  useEffect(() => {
    if (!isLoadingCity) return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES_COMMUNITY.length);
    }, 1600); // ~1.6s por frase = 10s total para 6 frases

    return () => clearInterval(interval);
  }, [isLoadingCity]);

  const handleExplorar = () => {
    navigate(`/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina`);
  };

  const handleEntrarCidade = () => {
    if (isLoadingCity || cityNavigationTimeoutRef.current !== null) return;
    setIsLoadingCity(true);
    setCurrentPhraseIndex(0);
    
    // 10 segundos de loading
    cityNavigationTimeoutRef.current = window.setTimeout(() => {
      cityNavigationTimeoutRef.current = null;
      navigate(launchCityPath);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (cityNavigationTimeoutRef.current !== null) {
        clearTimeout(cityNavigationTimeoutRef.current);
        cityNavigationTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      {/* Loading overlay em tela cheia */}
      <AnimatePresence>
        {isLoadingCity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-center w-full max-w-4xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-8"
              >
                <div className="w-20 h-20 mx-auto rounded-full border-4 border-primary/20 border-t-primary" />
              </motion.div>
              
              {/* Carrossel de frases */}
              <div className="relative min-h-[4rem] flex items-center justify-center mb-6 px-4">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={currentPhraseIndex}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground whitespace-nowrap"
                  >
                    {LOADING_PHRASES_COMMUNITY[currentPhraseIndex]}
                  </motion.h2>
                </AnimatePresence>
              </div>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm sm:text-base text-muted-foreground"
              >
                Preparando sua comunidade...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[38vh] md:min-h-[36vh] flex items-center justify-center overflow-hidden">
        {/* Parallax background image */}
        <motion.div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Achegue-se - plataforma de comunidade local"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
        </motion.div>
        <motion.div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-background" />
        {/* Extra gradient that always stays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-background" />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-5">
          {/* Header vazio - logo principal está no hero */}
        </header>

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto py-10 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-6 tracking-tight">
              Achegue<span className="text-primary">-</span>se
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/95 mb-2 max-w-2xl mx-auto drop-shadow-lg">
              Achegue-se Complexo: a comunidade digital do Complexo do Nordeste de Amaralina.
            </p>
            <p className="text-xs sm:text-sm text-white/60 mb-6">
              Salvador segue como cidade pública. O foco do MVP é a comunidade do Complexo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/25 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-sm px-6 h-11 backdrop-blur-md w-full sm:w-auto rounded-xl transition-all duration-200"
                  onClick={handleEntrarCidade}
                  disabled={isLoadingCity}
                >
                  Ver cidade (contexto técnico)
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-6 h-11 shadow-2xl shadow-primary/25 w-full sm:w-auto rounded-xl transition-all duration-200"
                  onClick={handleExplorar}
                >
                  Entrar no meu bairro
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator - container isolado */}
        <div className="absolute -bottom-2 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-2.5 rounded-full bg-white/60" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MÓDULOS ───────────────────────────────────────────────── */}
      <section className="w-full py-8 -mt-4 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-3 md:grid-cols-6 gap-2.5"
          >
            {MODULOS.map((modulo) => (
              <motion.button
                key={modulo.label}
                {...staggerItem}
                onClick={() => navigate(modulo.path)}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group shrink-0 min-w-[60px] ${modulo.bg}`}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <modulo.icon className={`h-5 w-5 ${modulo.color}`} />
                </motion.div>
                <span className="text-[11px] font-semibold text-foreground leading-tight text-center">
                  {modulo.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TERRITÓRIOS ATIVOS ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <motion.div {...fadeUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Comunidade ativa do MVP</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 font-heading">
            O Complexo é onde tudo começa.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            A navegação pública por Salvador continua ativa, com experiência comunitária priorizada no Complexo.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.button
            {...fadeUp}
            onClick={() => navigate(`/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina`)}
            whileHover={{ y: -6, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full p-5 sm:p-6 rounded-xl bg-card border-2 border-border hover:border-primary/40 transition-all duration-300 text-left group grid grid-cols-1 gap-5"
          >
            {/* Header - Linha 1 */}
            <div className="flex items-center justify-center">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors text-center">
                Complexo do Nordeste de Amaralina
              </h3>
            </div>

            {/* Bairros grid - Linha 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {BAIRROS_ATIVOS.map((bairro) => (
                <div
                  key={bairro.name}
                  className="p-2.5 sm:p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <h4 className="text-xs sm:text-sm font-bold text-foreground mb-1 sm:mb-1.5 leading-tight">
                    {bairro.name}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{bairro.populacao}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <motion.div {...fadeUp} className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Próxima comunidade</p>
          <h3 className="mt-2 text-xl font-bold text-foreground">Pituba em preparação</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            A comunidade da Pituba está chegando. Cadastre interesse e indique comércios e serviços da região.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/comunidade/ba/salvador/pituba")}>
              Ver página da comunidade da Pituba
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Para você */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground font-heading">
            Feito pra quem vive o bairro
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Morador, comerciante, prestador ou em busca de oportunidade — tem espaço pra você aqui.
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
              className="flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors duration-300"
            >
              <motion.div
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden mb-3 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
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
      <section className="relative w-full py-14 overflow-hidden">
        <motion.div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Comunidade local"
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
              O Complexo é o ponto de partida.
              <br />
              <span className="text-primary">Quem é daqui entra primeiro.</span>
            </h2>
            <p className="text-base text-white/70 mb-8 max-w-xl mx-auto">
              Encontre, divulgue e acompanhe o que importa no seu bairro com prioridade para moradores e negócios locais.
            </p>

            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-10 h-14 shadow-2xl shadow-primary/30 rounded-xl"
              onClick={handleExplorar}
            >
              Entrar no meu bairro
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="w-full bg-card/50 backdrop-blur-sm border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Main footer content */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            {/* Links */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button onClick={() => navigate("/comunidade/ba/salvador")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Navegar por Salvador
              </button>
              <button onClick={() => navigate("/sobre")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Sobre
              </button>
              <button onClick={() => navigate("/contato")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contato
              </button>
              <button onClick={() => navigate("/termos")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos
              </button>
              <button onClick={() => navigate("/privacidade")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacidade
              </button>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Achegue-se. Todos os direitos reservados.
            </p>
            <span className="text-xs text-muted-foreground">
              Feito com ❤️ para as comunidades locais
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
