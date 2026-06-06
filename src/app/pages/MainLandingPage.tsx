import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  MapPin,
  Store,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { LandingFooter } from "@/shared/components/landing/LandingFooter";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";
import { useCityMetadata } from "@/core/city/hooks/useCityMetadata";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import { formatMetric } from "@/shared/utils/formatters";

import heroImg from "@/assets/hero-landing-main.jpg";
import personaMorador from "@/assets/persona-morador.jpg";
import personaComerciante from "@/assets/persona-comerciante.jpg";
import personaPrestador from "@/assets/persona-prestador.jpg";
import personaEmprego from "@/assets/persona-emprego.jpg";

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

const MODULES = [
  {
    icon: Store,
    label: "Empresas",
    description: "Negócios locais, contatos, mapa e vitrines.",
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/20",
    path: LAUNCH_URLS.business,
  },
  {
    icon: Wrench,
    label: "Serviços",
    description: "Profissionais, orçamento e atendimento próximo.",
    color: "text-sky-400",
    bg: "bg-sky-500/15 border-sky-500/20",
    path: LAUNCH_URLS.services,
  },
  {
    icon: GraduationCap,
    label: "Educação",
    description: "Escolas, cursos, creches e formação local.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/15 border-cyan-500/20",
    path: LAUNCH_URLS.education,
  },
  {
    icon: Briefcase,
    label: "Vagas",
    description: "Oportunidades por território e anunciante.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
    path: LAUNCH_URLS.jobs,
  },
  {
    icon: Tag,
    label: "Classificados",
    description: "Compra, venda e anúncios locais.",
    color: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
    path: LAUNCH_URLS.classifieds,
  },
  {
    icon: Users,
    label: "Comunidade",
    description: "Feed, grupos, alertas e assuntos do território.",
    color: "text-primary",
    bg: "bg-primary/15 border-primary/20",
    path: "",
  },
] as const;

const PERSONAS = [
  {
    image: personaMorador,
    label: "Moradores",
    description: "Eventos, alertas e serviços perto de casa.",
  },
  {
    image: personaComerciante,
    label: "Comerciantes",
    description: "Mais visibilidade para o negócio local.",
  },
  {
    image: personaPrestador,
    label: "Prestadores",
    description: "Clientes próximos, agenda e orçamentos.",
  },
  {
    image: personaEmprego,
    label: "Quem busca oportunidade",
    description: "Vagas e classificados com recorte territorial.",
  },
] as const;

export default function MainLandingPage() {
  const navigate = useNavigate();
  const communityHref = useHomeCommunityHref();
  const launchCityPath = `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  const { data: cityMetadata, isLoading } = useCityMetadata(
    TERRITORY_CONFIG.launch.state,
    TERRITORY_CONFIG.launch.city,
  );

  const cityName = cityMetadata?.city ?? TERRITORY_CONFIG.launch.name;
  const cityState = cityMetadata?.state ?? TERRITORY_CONFIG.launch.state.toUpperCase();
  const cityDescription =
    cityMetadata?.description ??
    "Explore negócios, serviços, educação, oportunidades e comunidade com navegação territorial.";
  const cityMetrics = [
    { label: "Bairros", value: formatMetric(cityMetadata?.districts_count) },
    { label: "Empresas", value: formatMetric(cityMetadata?.active_businesses) },
    { label: "Escolas", value: formatMetric(cityMetadata?.schools_count) },
    { label: "Profissionais", value: formatMetric(cityMetadata?.professionals_count) },
  ];
  const modules = MODULES.map((modulo) =>
    modulo.label === "Comunidade" ? { ...modulo, path: communityHref } : modulo,
  );

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <section className="relative flex min-h-[44vh] w-full items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Achegue-se - plataforma territorial"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-background" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
              Plataforma territorial
            </p>
            <h1 className="mb-5 text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-5xl md:text-7xl">
              Achegue<span className="text-primary">-</span>se
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-sm leading-6 text-white/80 sm:text-base md:text-lg">
              Encontre o que está perto de você: empresas, escolas, serviços, vagas, classificados e comunidade em uma navegação local.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl border-white/25 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/15 sm:w-auto"
                onClick={() => navigate(launchCityPath)}
              >
                Ver cidade
              </Button>
              <Button
                size="lg"
                className="h-12 w-full rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-2xl shadow-primary/25 transition hover:bg-primary/90 sm:w-auto"
                onClick={() => navigate(communityHref)}
              >
                Ver meu bairro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 -mt-6 w-full px-4 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card/95 p-4 shadow-2xl shadow-black/10 backdrop-blur">
          <motion.div {...staggerContainer} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {modules.map((modulo) => (
              <motion.button
                key={modulo.label}
                {...staggerItem}
                onClick={() => navigate(modulo.path)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex min-h-[120px] flex-col items-start justify-between rounded-2xl border p-4 text-left transition-colors duration-200 ${modulo.bg}`}
              >
                <modulo.icon className={`h-5 w-5 ${modulo.color}`} />
                <div>
                  <p className="text-sm font-bold text-foreground">{modulo.label}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                    {modulo.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <motion.div {...fadeUp} className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" />
              Cidade de referência
            </div>
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {cityName}, {cityState}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{cityDescription}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="rounded-xl" onClick={() => navigate(launchCityPath)}>
                Ver página da cidade
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate(communityHref)}>
                Ver meu bairro
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {cityMetrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
                <p className="text-3xl font-black tracking-tight text-foreground">
                  {isLoading ? "..." : metric.value}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <motion.div {...fadeUp} className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Feito por território</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Uma base para cada cidade, bairro e comunidade.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A mesma estrutura atende módulos públicos, cadastros, painéis e administração sem duplicar dados por página.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {PERSONAS.map((persona, index) => (
            <motion.div
              key={persona.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              whileHover={{ y: -6, boxShadow: "0 20px 40px -12px hsl(var(--primary) / 0.15)" }}
              className="flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center transition-colors duration-300 hover:border-primary/30"
            >
              <div className="mb-3 h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background sm:h-20 sm:w-20">
                <img
                  src={persona.image}
                  alt={persona.label}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-foreground sm:text-base">{persona.label}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{persona.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative w-full overflow-hidden py-14">
        <motion.div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Comunidade local"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-black/80 to-background" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-heading mb-4 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
              Sua cidade pode operar como uma rede local.
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base text-white/70">
              Descubra, publique e administre informações territoriais com foco no que está perto de você.
            </p>

            <Button
              size="lg"
              className="h-14 rounded-xl bg-primary px-10 text-base font-bold text-primary-foreground shadow-2xl shadow-primary/30 hover:bg-primary/90"
              onClick={() => navigate(launchCityPath)}
            >
              Começar pela cidade
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
