/**
 * CanonicalHero — Componente canônico de Hero para todo o sistema.
 *
 * Base estrutural: Jobs HeroSection (clareza, busca, CTAs)
 * Base visual: Gastronomy/Services Hero (imagem imersiva, gradientes, impacto)
 *
 * Suporta:
 * - Contexto territorial dinâmico (cidade, bairro, grupo)
 * - Fallback quando sem território
 * - Imagem de fundo opcional (com overlay) ou gradient-only
 * - Busca integrada
 * - Quick-filter chips
 * - CTA primário e secundário
 * - Métricas/badges opcionais
 * - Responsivo AAA (mobile-first, sem overflow)
 */

import { type ReactNode, type FormEvent } from "react";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { LucideIcon } from "lucide-react";

// ── Animations ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// ── Types ────────────────────────────────────────────────────────────

export interface HeroQuickFilter {
  label: string;
  icon?: LucideIcon;
  emoji?: string;
  isActive?: boolean;
  onClick: () => void;
}

export interface HeroCTA {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

export interface HeroStat {
  value: string;
  label: string;
}

export interface CanonicalHeroProps {
  /** Nome do módulo — ex: "Gastronomia", "Vagas", "Serviços" */
  moduleName: string;
  /** Ícone do módulo */
  moduleIcon: LucideIcon;

  /** Nome do território — dinâmico via SSOT */
  territoryName?: string;
  /** Fallback quando não há território */
  territoryFallback?: string;

  /** Título principal — parte fixa */
  title: string;
  /** Parte do título com gradiente (highlight) */
  titleHighlight?: string;

  /** Subtítulo descritivo */
  subtitle: string;

  /** Imagem de fundo (URL ou import) */
  backgroundImage?: string;

  /** Busca */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSubmit?: () => void;
  };

  /** CTAs */
  primaryCTA?: HeroCTA;
  secondaryCTA?: HeroCTA;

  /** Quick filters (chips abaixo da busca) */
  quickFilters?: HeroQuickFilter[];

  /** Stats inline (badges com valor/label) */
  stats?: HeroStat[];

  /** Conteúdo extra abaixo de tudo (ex: sponsored banner) */
  extraContent?: ReactNode;

  /** Densidade visual do hero */
  density?: "default" | "banner";
}

// ── Component ────────────────────────────────────────────────────────

export function CanonicalHero({
  moduleName,
  moduleIcon: ModuleIcon,
  territoryName,
  territoryFallback = "Sua Região",
  title,
  titleHighlight,
  subtitle,
  backgroundImage,
  search,
  primaryCTA,
  secondaryCTA,
  quickFilters,
  stats,
  extraContent,
  density = "default",
}: CanonicalHeroProps) {
  const displayTerritory = territoryName || territoryFallback;
  const isBanner = density === "banner";

  const sectionContentClass = isBanner
    ? "relative max-w-7xl mx-auto px-4 sm:px-6 py-5 md:py-6 lg:py-8"
    : "relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-24";

  const titleClass = isBanner
    ? "text-2xl sm:text-3xl md:text-[2rem] lg:text-[2.4rem] font-bold font-heading text-foreground leading-[1.2] mb-2 drop-shadow-md"
    : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-foreground leading-[1.3] mb-3 drop-shadow-lg";

  const subtitleClass = isBanner
    ? "text-sm md:text-[0.95rem] text-muted-foreground/90 mb-3 max-w-2xl drop-shadow-sm"
    : "text-base md:text-lg text-muted-foreground/90 mb-7 max-w-lg drop-shadow-sm";

  const searchInputClass = isBanner
    ? "pl-10 h-11 bg-card/80 backdrop-blur-md border-border/40 text-sm rounded-xl focus:ring-2 focus:ring-primary/40 shadow-md placeholder:text-muted-foreground/60"
    : "pl-11 h-12 bg-card/80 backdrop-blur-md border-border/40 text-base rounded-2xl focus:ring-2 focus:ring-primary/40 shadow-lg placeholder:text-muted-foreground/60";

  const primaryButtonClass = isBanner
    ? "h-11 px-5 rounded-xl font-semibold shadow-md gap-2 whitespace-nowrap"
    : "h-12 px-6 rounded-2xl font-semibold shadow-lg gap-2 whitespace-nowrap";

  const secondaryButtonClass = isBanner
    ? "h-11 px-4 rounded-xl font-semibold gap-2 whitespace-nowrap border-border"
    : "h-12 px-5 rounded-2xl font-semibold gap-2 whitespace-nowrap border-border";

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    search?.onSubmit?.();
  };

  return (
    <section className={`relative w-full overflow-hidden ${isBanner ? "min-h-[240px] md:min-h-[280px]" : ""}`}>
      {/* ── Background ─────────────────────────────────────────── */}
      {backgroundImage ? (
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt={`${moduleName} — ${displayTerritory}`}
            className="w-full h-full object-cover"
            width={1920}
            height={isBanner ? 520 : 800}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/50 to-transparent" />
          <div className={`absolute inset-0 ${isBanner ? "bg-gradient-to-t from-background/70 via-background/25 to-transparent" : "bg-gradient-to-t from-background/60 via-transparent to-transparent"}`} />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/8" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.08),transparent_50%)]" />
        </>
      )}

      {/* ── Content ────────────────────────────────────────────── */}
      <div className={sectionContentClass}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className={isBanner ? "max-w-4xl" : "max-w-3xl"}
        >
          {/* Breadcrumb pills */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 text-sm mb-3 flex-wrap"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/60 backdrop-blur-sm border border-border/30 text-muted-foreground text-xs font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[180px]">{displayTerritory}</span>
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 backdrop-blur-sm border border-primary/20 text-primary font-medium text-xs">
              <ModuleIcon className="h-3.5 w-3.5 shrink-0" />
              {moduleName}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className={titleClass}
          >
            <span className="block">{title}</span>
            {titleHighlight && (
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_ease-in-out_infinite]">
                {titleHighlight}
              </span>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className={subtitleClass}
          >
            {subtitle}
          </motion.p>

          {/* Search + CTAs row */}
          {(search || primaryCTA || secondaryCTA) && (
            <motion.div variants={itemVariants}>
              {search ? (
                <form
                  onSubmit={handleSearchSubmit}
                  className={`flex flex-col sm:flex-row gap-2.5 ${isBanner ? "max-w-2xl" : "max-w-xl"}`}
                >
                  <div className="relative flex-1">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${isBanner ? "left-3.5 h-4 w-4" : "left-4 h-4.5 w-4.5"}`} />
                    <Input
                      placeholder={search.placeholder || "Buscar..."}
                      value={search.value}
                      onChange={(e) => search.onChange(e.target.value)}
                      className={searchInputClass}
                    />
                  </div>
                  <div className="flex gap-2.5">
                    {primaryCTA && (
                      <Button
                        type={primaryCTA.onClick ? "button" : "submit"}
                        onClick={primaryCTA.onClick}
                        variant={primaryCTA.variant || "default"}
                        className={primaryButtonClass}
                      >
                        {primaryCTA.icon && <primaryCTA.icon className="h-4 w-4" />}
                        {primaryCTA.label}
                      </Button>
                    )}
                    {secondaryCTA && (
                      <Button
                        type="button"
                        onClick={secondaryCTA.onClick}
                        variant={secondaryCTA.variant || "outline"}
                        className={secondaryButtonClass}
                      >
                        {secondaryCTA.icon && <secondaryCTA.icon className="h-4 w-4" />}
                        {secondaryCTA.label}
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {primaryCTA && (
                    <Button
                      onClick={primaryCTA.onClick}
                      variant={primaryCTA.variant || "default"}
                      size="lg"
                      className="h-12 px-7 rounded-2xl font-semibold shadow-lg shadow-primary/20 gap-2"
                    >
                      {primaryCTA.icon && <primaryCTA.icon className="h-4 w-4" />}
                      {primaryCTA.label}
                    </Button>
                  )}
                  {secondaryCTA && (
                    <Button
                      onClick={secondaryCTA.onClick}
                      variant={secondaryCTA.variant || "outline"}
                      size="lg"
                      className="h-12 px-7 rounded-2xl font-semibold gap-2 border-border"
                    >
                      {secondaryCTA.icon && <secondaryCTA.icon className="h-4 w-4" />}
                      {secondaryCTA.label}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Quick filters */}
          {quickFilters && quickFilters.length > 0 && (
            <motion.div
              variants={itemVariants}
              className={`flex flex-wrap gap-2 ${isBanner ? "mt-4" : "mt-5"}`}
            >
              {quickFilters.map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.onClick}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    chip.isActive
                      ? "bg-primary text-primary-foreground border border-primary shadow-md shadow-primary/20"
                      : "bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                >
                  {chip.icon && <chip.icon className="h-3.5 w-3.5 shrink-0" />}
                  {chip.emoji && <span className="text-xs">{chip.emoji}</span>}
                  {chip.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <motion.div
              variants={itemVariants}
              className={`flex flex-wrap gap-4 ${isBanner ? "mt-4" : "mt-6"}`}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span className="font-bold text-foreground text-sm">
                    {stat.value}
                  </span>
                  {stat.label}
                </div>
              ))}
            </motion.div>
          )}

          {/* Extra content */}
          {extraContent && (
            <motion.div variants={itemVariants} className="mt-5">
              {extraContent}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
