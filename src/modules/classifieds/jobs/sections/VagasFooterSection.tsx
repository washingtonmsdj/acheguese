/**
 * VagasFooterSection - Stats, Como Funciona e CTA
 * 
 * SSOT: Section modular
 * Sem gambiarras: Props tipadas
 */

import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  Shield,
  Clock,
  Search,
  Building2,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { VagasFooterSectionProps } from "./types";

const STATS = [
  {
    icon: Briefcase,
    value: "150+",
    label: "vagas ativas",
    color: "text-primary",
  },
  {
    icon: Users,
    value: "80+",
    label: "empresas contratando",
    color: "text-accent",
  },
  { icon: Shield, value: "100%", label: "gratuito", color: "text-success" },
  {
    icon: Clock,
    value: "24h",
    label: "novas vagas/dia",
    color: "text-warning",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Search,
    title: "Encontre a vaga ideal",
    description:
      "Busque por cargo, área ou localização. Use filtros para refinar os resultados.",
  },
  {
    step: "02",
    icon: Building2,
    title: "Candidate-se",
    description:
      "Entre em contato direto com a empresa via WhatsApp, e-mail ou formulário.",
  },
  {
    step: "03",
    icon: Star,
    title: "Conquiste a vaga",
    description:
      "Prepare-se, faça a entrevista e comece sua nova jornada profissional.",
  },
] as const;

export function VagasFooterSection({
  cityName,
  user,
  permission,
  isLoadingPermission,
  onOpenPublish,
}: VagasFooterSectionProps) {
  return (
    <>
      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md transition-all"
            >
              <div className="flex justify-center mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Como Funciona */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full border-t border-border">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">Como Funciona</h2>
          <p className="text-muted-foreground mt-2">
            Encontrar emprego na sua região é simples
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 text-center relative"
            >
              <span className="text-3xl font-black text-primary/10 absolute top-4 right-4">
                {item.step}
              </span>
              <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Está contratando? Publique sua vaga!
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Alcance milhares de candidatos qualificados de {cityName}. Publicação
            gratuita.
          </p>
          <Button
            onClick={onOpenPublish}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
            disabled={
              !!user && !isLoadingPermission && !permission.canPublish
            }
          >
            {user && !isLoadingPermission && !permission.canPublish
              ? "Publicação indisponível"
              : "Publicar Vaga Grátis"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </>
  );
}
