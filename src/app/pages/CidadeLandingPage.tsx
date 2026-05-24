/**
 * CidadeLandingPage - Vitrine publica da cidade
 * SSOT territorial, sem hardcodes de cidade.
 */

import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, MapPin, Users, Store, Wrench,
  ArrowRight, ChevronRight, Star,
  Briefcase, Camera, GraduationCap, Shield, MapPinned,
  AlertTriangle, Ambulance, Flame,
  Loader2, BadgeCheck, Tag,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { getStateByCode } from "@/core/location/data/brazilianStates";
import { useCityMetadata } from "@/core/city/hooks/useCityMetadata";
import { useCityFeatured } from "@/core/city/hooks/useCityFeatured";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { classifiedUrlService } from "@/modules/classifieds/services/ClassifiedUrlService";
import { useClassifiedUrls } from "@/modules/classifieds/hooks/useClassifiedUrls";
import { useTouristPoints } from "@/modules/guide/tourist-points/hooks/useTouristPoints";
import { CATEGORY_ICONS } from "@/modules/guide/tourist-points/types";

import { formatCategory, formatMetric, formatPrice } from "./CidadeLanding.constants";
import {
  CityCommunityCtaSection,
  CityElectedOfficialsSection,
  CityHallFooter,
  CityUsefulContactsSection,
} from "./CidadeLanding.sections";

// Animação base
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

function toDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CidadeLandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const homeCommunityHref = useHomeCommunityHref();
  const { state = "", city = "" } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Busca metadados da cidade (população, bairros, etc.)
  const { data: cityMetadata, isLoading: metadataLoading } = useCityMetadata(state, city);
  const moduleTerritory = useModuleTerritoryFilter({ nearbyEnabled: false, includeDescendants: true });

  // Busca conteúdo em destaque (SSOT)
  const { businesses: businessesReal, services: servicesReal, classifieds: classifiedsReal, isLoading: featuredLoading } =
    useCityFeatured(state, city, moduleTerritory.territoryFilter);
  const businesses = businessesReal.slice(0, 6);
  const services = servicesReal.slice(0, 6);
  const classifieds = classifiedsReal.slice(0, 6);

  // URLs helper para classificados
  const classifiedUrls = useClassifiedUrls(null);

  // Pontos turísticos via SSOT
  const { data: touristPoints = [] } = useTouristPoints({ state, city, limit: 6 });
  const updatedAtLabel = cityMetadata?.updated_at
    ? new Date(cityMetadata.updated_at).toLocaleDateString("pt-BR")
    : null;

  if (!state || !city) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cidade não informada</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use a rota com UF e cidade.</p>
        </div>
      </div>
    );
  }

  const communityUrl = homeCommunityHref;
  const cityModuleUrls = {
    business: `/empresas/${state}/${city}`,
    services: `/servicos/${state}/${city}`,
    classifieds: `/classificados/${state}/${city}`,
    jobs: `/vagas/${state}/${city}`,
  };
  const cityDisplayName = toDisplayName(city);
  const stateDisplayName = getStateByCode(state)?.name ?? state.toUpperCase();
  const cityDescription =
    cityMetadata?.description ||
    `Plataforma territorial de ${cityDisplayName} para descobrir negócios, profissionais, classificados e oportunidades perto de você.`;
  const heroBadgeText = cityMetadata?.founded_year
    ? `${cityDisplayName} | fundada em ${cityMetadata.founded_year}`
    : `${cityDisplayName} | ${stateDisplayName}`;
  const searchPlaceholder = `Buscar em ${cityDisplayName}: mercado, diarista, vaga...`;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    const target = "/buscar/" + state + "/" + city + (query ? "?q=" + encodeURIComponent(query) : "");
    navigate(target);
  };

  const heroModules = [
    { icon: Store, label: "Empresas", value: "Negócios locais", path: cityModuleUrls.business },
    { icon: Wrench, label: "Serviços", value: "Profissionais", path: cityModuleUrls.services },
    { icon: Tag, label: "Classificados", value: "Compra e venda", path: cityModuleUrls.classifieds },
    { icon: Briefcase, label: "Vagas", value: "Oportunidades", path: cityModuleUrls.jobs },
  ];

  // Estatísticas dinâmicas da cidade
  const CITY_STATS = [
    { icon: MapPinned, value: formatMetric(cityMetadata?.districts_count), label: "Bairros", color: "text-cyan-200", bg: "bg-cyan-400/15", border: "border-cyan-200/20" },
    { icon: Users, value: formatMetric(cityMetadata?.population), label: "Habitantes", color: "text-amber-200", bg: "bg-amber-400/15", border: "border-amber-200/20" },
    { icon: Store, value: formatMetric(cityMetadata?.active_businesses), label: "Empresas ativas", color: "text-emerald-200", bg: "bg-emerald-400/15", border: "border-emerald-200/20" },
    { icon: GraduationCap, value: formatMetric(cityMetadata?.schools_count), label: "Escolas", color: "text-sky-200", bg: "bg-sky-400/15", border: "border-sky-200/20" },
    { icon: Wrench, value: formatMetric(cityMetadata?.professionals_count), label: "Profissionais", color: "text-fuchsia-200", bg: "bg-fuchsia-400/15", border: "border-fuchsia-200/20" },
  ];

  const featuredDistricts = cityMetadata?.featured_districts?.length
    ? cityMetadata.featured_districts.slice(0, 4).map((district) => ({
        nome: district.name,
        resumo: district.description || "Sem descrição cadastrada",
        imagem: district.image_url || "",
      }))
    : [];

  const emergencyContacts = cityMetadata?.emergency_contacts?.length
    ? cityMetadata.emergency_contacts.map((contact) => ({
        nome: contact.name,
        telefone: contact.phone,
        icone: contact.name.toLowerCase().includes("bombeiro")
          ? Flame
          : contact.name.toLowerCase().includes("defesa")
            ? AlertTriangle
            : contact.name.toLowerCase().includes("pol")
              ? Shield
              : Ambulance,
        cor: "text-destructive",
      }))
    : [];

  const utilityContacts = cityMetadata?.utility_contacts?.length
    ? cityMetadata.utility_contacts.map((contact) => ({
        nome: contact.name,
        telefone: contact.phone,
        tipo: contact.type,
      }))
    : [];

  const cityHallInfo = cityMetadata?.city_hall_info ?? null;
  const prefeituraInfo = {
    nome: cityHallInfo?.name || `Prefeitura de ${cityDisplayName}`,
    endereco: cityHallInfo?.address || "Endereço municipal não informado",
    telefone: cityHallInfo?.phone || "Não informado",
    email: cityHallInfo?.email || "Não informado",
    site: cityHallInfo?.website || "",
    horario: cityHallInfo?.hours || "Não informado",
    instagram: cityHallInfo?.social?.instagram || "",
    facebook: cityHallInfo?.social?.facebook || "",
    twitter: cityHallInfo?.social?.twitter || "",
    youtube: cityHallInfo?.social?.youtube || "",
  };
  const civicChannels = [];

  const electedCards = cityMetadata?.elected_officials
    ? [
        ...(cityMetadata.elected_officials.executive ?? []).map((official) => ({
          nome: official.name,
          cargo: official.position || "Executivo Municipal",
          partido: official.party,
          mandato: official.term || "Mandato atual",
        })),
        ...(cityMetadata.elected_officials.legislative?.featured ?? []).slice(0, 2).map((official) => ({
          nome: official.name,
          cargo: official.position || "Legislativo Municipal",
          partido: official.party,
          mandato: official.term || "Mandato atual",
        })),
      ].slice(0, 3)
    : [];

  const scrollTo = (id: string) => {
    if (id.startsWith("#")) {
      document.getElementById(id.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(id);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">

      {/* A. HERO */}
      <section className="relative flex min-h-[620px] w-full items-center overflow-hidden md:min-h-[720px]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(var(--background)/0.98)_0%,hsl(var(--background)/0.92)_42%,hsl(var(--background)/0.84)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.18),transparent_35%),radial-gradient(circle_at_15%_78%,rgba(6,182,212,0.18),transparent_42%)]" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-background via-background/74 to-transparent" />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.62fr)] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white shadow-2xl shadow-black/20 backdrop-blur-md"
            >
              <MapPin className="h-4 w-4 text-amber-200" />
              <span className="text-xs font-bold uppercase tracking-[0.22em]">
                {heroBadgeText}
              </span>
            </motion.div>
            {updatedAtLabel && (
              <p className="mb-3 text-xs text-white/70">Dados municipais atualizados em {updatedAtLabel}</p>
            )}

            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl">
              {cityDisplayName}
              <span className="block bg-gradient-to-r from-amber-200 via-orange-300 to-cyan-200 bg-clip-text text-transparent">
                em tempo real
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 md:text-lg">
              {cityDescription}
            </p>

            <form onSubmit={handleSearchSubmit} className="mt-8 max-w-2xl rounded-2xl border border-white/15 bg-white/12 p-2 shadow-2xl shadow-black/25 backdrop-blur-xl">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/55" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-12 border-white/10 bg-black/24 pl-12 text-white placeholder:text-white/48 focus-visible:ring-amber-300"
                  />
                </div>
                <Button type="submit" className="h-12 rounded-xl bg-amber-300 px-6 font-black text-slate-950 hover:bg-amber-200">
                  Buscar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => navigate(user ? communityUrl : "/login")} className="h-12 rounded-full bg-white text-slate-950 hover:bg-white/90">
                {user ? "Ver meu bairro" : "Entrar na comunidade"}
                <Users className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => scrollTo("#turismo")} className="h-12 rounded-full border-white/24 bg-white/8 text-white hover:bg-white/16 hover:text-white">
                Explorar turismo
                <Camera className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {heroModules.map((module, index) => (
                <motion.button
                  key={module.label}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.06 }}
                  onClick={() => navigate(module.path)}
                  className="group rounded-2xl border border-white/20 bg-background/20 p-4 text-left text-white shadow-xl shadow-black/10 backdrop-blur-md transition hover:-translate-y-1 hover:border-primary/60 hover:bg-background/35"
                >
                  <module.icon className="mb-3 h-5 w-5 text-amber-200 transition group-hover:scale-110" />
                  <span className="block text-sm font-black">{module.label}</span>
                  <span className="mt-1 block text-xs text-white/58">{module.value}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.7, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-amber-300/25 blur-3xl" />
            <div className="absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="rounded-[2rem] border border-white/18 bg-white/10 p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Dados territoriais</p>
              <p className="mt-2 text-2xl font-black">{cityDisplayName}</p>
              <p className="mt-1 text-sm text-white/70">{stateDisplayName}</p>
              <div className="mt-6 grid grid-cols-1 gap-3">
                {CITY_STATS.slice(0, 3).map((stat) => (
                  <div key={`hero-${stat.label}`} className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <p className="text-xs text-white/70">{stat.label}</p>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
              {updatedAtLabel && (
                <p className="mt-5 text-xs text-white/70">Atualizado em {updatedAtLabel}</p>
              )}
              <div className="mt-5">
                <Button
                  variant="outline"
                  onClick={() => scrollTo("#turismo")}
                  className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Explorar cidade
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CARDS DE ESTATISTICAS */}
      <section className="relative z-10 mt-0 w-full pb-8 pt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-3 rounded-[1.75rem] border border-border bg-card p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
            {CITY_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                className={["group rounded-2xl border p-4 text-foreground transition duration-200 hover:border-primary/30", stat.border, stat.bg].join(" ")}
              >
                <div className="mb-4 flex items-center justify-between">
                  <stat.icon className={["h-5 w-5", stat.color].join(" ")} />
                  {metadataLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <span className="block text-2xl font-black leading-none tracking-tight">{stat.value}</span>
                <span className="mt-1 block text-xs font-medium text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 md:pb-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Bairros em Destaque</h2>
            <p className="text-sm text-muted-foreground mt-1">Panorama territorial para navegar {cityDisplayName} por região</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredDistricts.length > 0 ? (
            featuredDistricts.map((bairro, i) => (
              <motion.article
                key={bairro.nome}
                {...fadeUp}
                transition={{ delay: i * 0.06 }}
                className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all"
              >
                {bairro.imagem ? (
                  <div className="h-32 overflow-hidden">
                    <img src={bairro.imagem} alt={`Foto de ${bairro.nome}, ${cityDisplayName}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : null}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground mb-1">{bairro.nome}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{bairro.resumo}</p>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Ainda não há bairros em destaque cadastrados para {cityDisplayName}.
            </div>
          )}
        </div>
      </section>

      {/* Empresas reais da cidade */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Empresas em Destaque</h2>
            <p className="text-sm text-muted-foreground mt-1">Negócios locais verificados</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(cityModuleUrls.business)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => {
              return (
                <motion.div
                  key={business.id}
                  {...fadeUp}
                  onClick={() => {
                    if (!business.slug) return;
                    const url = BusinessUrlService.getCanonicalUrl({
                      id: business.id,
                      slug: business.slug,
                      is_premium: business.is_premium,
                      geographic_path: business.geographic_path
                    });
                    navigate(url);
                  }}
                  className="bg-card border rounded-2xl p-5 hover:shadow-xl transition-all cursor-pointer group border-border hover:border-primary/30"
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
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="max-w-full break-words pr-1 text-base font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {business.name}
                        </h3>
                        {business.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        {business.is_premium && (
                          <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">{formatCategory(business.category)}</p>
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

      {/* SERVIÇOS REAIS DA CIDADE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Profissionais em Destaque</h2>
            <p className="text-sm text-muted-foreground mt-1">Serviços verificados na cidade</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(cityModuleUrls.services)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              return (
                <motion.div
                  key={service.id}
                  {...fadeUp}
                  onClick={() => navigate(cityModuleUrls.services)}
                  className="bg-card border rounded-2xl p-5 hover:shadow-xl transition-all cursor-pointer group border-border hover:border-violet-500/30"
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
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="max-w-full break-words pr-1 text-base font-bold leading-snug text-foreground group-hover:text-violet-500 transition-colors">
                          {service.name}
                        </h3>
                        {service.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">{formatCategory(service.category)}</p>
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

      {/* Classificados reais da cidade */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Classificados Recentes</h2>
            <p className="text-sm text-muted-foreground mt-1">Anúncios ativos na cidade</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(cityModuleUrls.classifieds)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classifieds.map((classified) => {
              const thumb = classified.photos?.[0];

              const getUrl = () => {
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
                  onClick={() => navigate(getUrl())}
                  className="bg-card border rounded-2xl p-5 hover:shadow-xl transition-all cursor-pointer group border-border hover:border-orange-500/30"
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
                      <h3 className="text-base font-bold truncate mb-1.5 text-foreground group-hover:text-orange-500 transition-colors">
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

      {/* Vagas de emprego */}
      <section id="vagas" className="w-full bg-gradient-to-br from-primary/8 via-card to-accent/8 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Vagas de Emprego</h2>
          </div>
          <p className="text-sm text-muted-foreground">Oportunidades de trabalho em {cityDisplayName}</p>
          <div className="mt-6">
            <Button
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10 font-semibold rounded-xl h-11 px-6"
              onClick={() => navigate(cityModuleUrls.jobs)}
            >
              Ver vagas da cidade <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* E. PONTOS TURÍSTICOS */}
      <section id="turismo" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Camera className="h-5 w-5 text-warning" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground font-heading">Pontos Turísticos</h2>
            </div>
            <p className="text-sm text-muted-foreground">Descubra as belezas de {cityDisplayName}</p>
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
            {touristPoints.length > 0 ? touristPoints.map((ponto, i) => (
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
              <div className="space-y-3">
                {ponto.photo_url && (
                  <div className="h-32 w-full overflow-hidden rounded-xl">
                    <img src={ponto.photo_url} alt={ponto.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  {(() => {
                    const TouristIcon = CATEGORY_ICONS[ponto.category] ?? MapPin;
                    return <TouristIcon className="h-7 w-7 shrink-0 text-warning" aria-hidden="true" />;
                  })()}
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
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Ainda não há pontos turísticos cadastrados para {cityDisplayName}.
            </div>
          )}
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

      <CityElectedOfficialsSection electedCards={electedCards} cityDisplayName={cityDisplayName} />
      <CityUsefulContactsSection
        emergencyContacts={emergencyContacts}
        utilityContacts={utilityContacts}
        civicChannels={civicChannels}
        cityDisplayName={cityDisplayName}
      />
      <CityCommunityCtaSection
        isAuthenticated={Boolean(user)}
        cityDisplayName={cityDisplayName}
        onOpenCommunity={() => navigate(user ? communityUrl : "/login")}
        onOpenBusiness={() => navigate(cityModuleUrls.business)}
      />
      <CityHallFooter
        prefeituraInfo={prefeituraInfo}
        cityDisplayName={cityDisplayName}
        stateCode={state.toUpperCase()}
        onNavigate={navigate}
        communityUrl={communityUrl}
        businessPath={cityModuleUrls.business}
        servicesPath={cityModuleUrls.services}
        classifiedsPath={cityModuleUrls.classifieds}
      />

    </div>
  );
}
