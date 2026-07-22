import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Heart, MapPin, Store, Users, Wrench } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { TERRITORY_CONFIG } from "@/config/territory";
import { useCityMetadata } from "@/core/city/hooks/useCityMetadata";
import { useHomeCommunityHref } from "@/core/routing/hooks/useHomeCommunityHref";
import { formatMetric } from "@/shared/utils/formatters";

export default function SplashPage() {
  const navigate = useNavigate();
  const communityHref = useHomeCommunityHref();
  const [ready, setReady] = useState(false);
  const { data: cityMetadata } = useCityMetadata(
    TERRITORY_CONFIG.launch.state,
    TERRITORY_CONFIG.launch.city,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  const cityName = cityMetadata?.city ?? TERRITORY_CONFIG.launch.name;
  const stateName = cityMetadata?.state ?? TERRITORY_CONFIG.launch.state.toUpperCase();
  const cityPath = `/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  const stats = [
    { icon: Users, label: "Habitantes", value: formatMetric(cityMetadata?.population) },
    { icon: MapPin, label: "Bairros", value: formatMetric(cityMetadata?.districts_count) },
    { icon: Store, label: "Empresas", value: formatMetric(cityMetadata?.active_businesses) },
    { icon: Wrench, label: "Profissionais", value: formatMetric(cityMetadata?.professionals_count) },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-warning/5 blur-3xl" />
      </div>

      <div className="relative flex flex-1 flex-col justify-between px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pt-8 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: ready ? 1 : 0.5, opacity: ready ? 1 : 0 }}
            transition={{ delay: 0.1, duration: 0.45, type: "spring", stiffness: 200 }}
            className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/25"
          >
            <Heart className="h-10 w-10 text-primary-foreground" fill="currentColor" />
          </motion.div>

          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">
            Achegue-se
            <br />
            <span className="text-primary">{cityName}</span>
          </h1>

          <p className="mx-auto mt-3 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
            Empresas, gastronomia, serviços, classificados, mapa e comunidade organizados por território.
          </p>

          <p className="mt-1.5 text-xs text-muted-foreground/70">
            {cityName}, {stateName}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 20 }}
          transition={{ delay: 0.25, duration: 0.55 }}
          className="my-6 grid grid-cols-2 gap-3"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: ready ? 1 : 0, scale: ready ? 1 : 0.92 }}
              transition={{ delay: 0.35 + index * 0.06, duration: 0.35 }}
              className="rounded-2xl border bg-card/80 p-4 text-center backdrop-blur-sm"
            >
              <stat.icon className="mx-auto mb-1.5 h-5 w-5 text-primary" />
              <p className="font-display text-lg font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 20 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          className="space-y-3"
        >
          <Button
            onClick={() => navigate(communityHref)}
            className="h-12 w-full gap-2 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20"
            size="lg"
          >
            Abrir o bairro
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => navigate(cityPath)}
            variant="outline"
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            Explorar a cidade
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Dados exibidos a partir do cadastro municipal e módulos ativos.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
