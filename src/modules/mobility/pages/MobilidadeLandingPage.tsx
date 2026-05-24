import {
  ArrowRight,
  Bike,
  Car,
  Clock,
  MapPin,
  Package,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useTerritoryLabels } from "@/core/location";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { MobilidadeHeader } from "@/modules/mobility/components";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

/**
 * MobilidadeLandingPage - entrada canonica do modulo de mobilidade.
 * SSOT: navega por useMobilityUrls e separa passageiro, motorista e motoboy.
 */

interface MobilidadeLandingPageProps {
  resolved?: ResolvedTerritory;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const steps = [
  {
    icon: MapPin,
    title: "Solicite",
    desc: "Informe origem, destino e horario desejado.",
  },
  {
    icon: Users,
    title: "Conecte",
    desc: "Motoristas e motoboys vizinhos recebem sua solicitacao.",
  },
  {
    icon: Shield,
    title: "Combine",
    desc: "Acordo direto, local e sem taxa de aplicativo.",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Rapido e local",
    desc: "Pessoas da sua regiao, sempre por perto.",
  },
  {
    icon: Star,
    title: "Reputacao real",
    desc: "Ranking comunitario com avaliacoes verificaveis.",
  },
  {
    icon: Clock,
    title: "Agendamento",
    desc: "Programe viagens e entregas com antecedencia.",
  },
  {
    icon: Package,
    title: "Entregas",
    desc: "Envie e receba encomendas entre vizinhos.",
  },
];

const userTypes = [
  {
    icon: MapPin,
    title: "Passageiro",
    desc: "Solicite corridas e acompanhe em tempo real.",
    color: "primary",
    route: "passenger",
    badge: null,
  },
  {
    icon: Car,
    title: "Motorista",
    desc: "Receba chamadas de passageiros e gerencie seus ganhos.",
    color: "blue",
    route: "driver",
    badge: "Corridas",
  },
  {
    icon: Bike,
    title: "Motoboy",
    desc: "Receba entregas, confirme coleta e registre comprovante.",
    color: "orange",
    route: "motoboy",
    badge: "Entregas",
  },
];

export default function MobilidadeLandingPage({ resolved }: MobilidadeLandingPageProps) {
  const navigate = useNavigate();
  const mobilityUrls = useMobilityUrls();
  const territoryLabels = useTerritoryLabels(resolved);
  const [searchQuery, setSearchQuery] = useState("");

  const territoryName = useMemo(() => {
    return territoryLabels.name || "sua regiao";
  }, [territoryLabels]);

  return (
    <div className="w-full min-h-full bg-background overflow-y-auto">
      <MobilidadeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <CanonicalHero
        moduleName="Mobilidade"
        moduleIcon={Car}
        territoryName={territoryName}
        territoryFallback="Sua regiao"
        title={`${territoryName}`}
        titleHighlight="em movimento"
        subtitle="Caronas e entregas entre vizinhos. Rapido, local e sem taxa de aplicativo."
        primaryCTA={{
          label: "Pedir viagem",
          icon: MapPin,
          onClick: () => navigate(mobilityUrls.passenger),
        }}
        secondaryCTA={{
          label: "Quero dirigir",
          icon: Car,
          onClick: () => navigate(mobilityUrls.driver),
          variant: "outline",
        }}
      />

      <section className="w-full px-4 py-10 md:py-14 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Escolha seu perfil
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Cada papel tem uma central propria e um fluxo operacional separado.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {userTypes.map((type, i) => (
              <motion.div
                key={type.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card
                  className="h-full bg-card border-border hover:border-primary/30 transition-all cursor-pointer group hover:shadow-lg"
                  onClick={() => navigate(mobilityUrls[type.route as keyof ReturnType<typeof useMobilityUrls>] as string)}
                >
                  <CardContent className="flex flex-col items-center text-center gap-4 p-6">
                    <div className={`w-16 h-16 rounded-2xl ${
                      type.color === 'orange'
                        ? 'bg-orange-500/15'
                        : type.color === 'blue'
                          ? 'bg-blue-500/15'
                          : 'bg-primary/15'
                    } flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <type.icon className={`h-8 w-8 ${
                        type.color === 'orange'
                          ? 'text-orange-500'
                          : type.color === 'blue'
                            ? 'text-blue-500'
                            : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-foreground">{type.title}</h3>
                        {type.badge && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              type.color === 'orange'
                                ? 'border-orange-200 text-orange-600 bg-orange-50'
                                : 'border-blue-200 text-blue-600 bg-blue-50'
                            }`}
                          >
                            {type.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{type.desc}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10 transition-colors">
                      Acessar
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-10 md:py-14 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Como funciona
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="h-full bg-card border-border hover:border-primary/30 transition-colors">
                  <CardContent className="flex flex-col items-center text-center gap-3 p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-10 md:py-14">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground text-center mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Por que usar?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {benefits.map((benefit, i) => (
              <motion.div key={benefit.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="bg-card border-border hover:border-accent/30 transition-colors">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 pb-12">
        <motion.div
          className="max-w-3xl mx-auto bg-gradient-to-br from-primary/15 via-card to-accent/10 border border-primary/20 rounded-2xl p-8 md:p-12 text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            Pronto para comecar?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-md mx-auto">
            Junte-se aos vizinhos que ja economizam tempo e organizam deslocamentos com mobilidade comunitaria.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate(mobilityUrls.passenger)} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
              Pedir viagem
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(mobilityUrls.driver)} className="gap-2 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50">
              <Car className="h-4 w-4" />
              Motorista
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(mobilityUrls.motoboy.home)} className="gap-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50">
              <Bike className="h-4 w-4" />
              Motoboy
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
