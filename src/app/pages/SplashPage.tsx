import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Store, Wrench, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
const populacaoTotal = 45000;

const stats = [
  {
    icon: Users,
    label: "Moradores",
    value: `~${(populacaoTotal / 1000).toFixed(0)} mil`,
  },
  { icon: MapPin, label: "Bairros", value: "4" },
  { icon: Store, label: "Comércios", value: "200+" },
  { icon: Wrench, label: "Profissionais", value: "150+" },
];

const neighborhoodNames = [
  "Nordeste de Amaralina",
  "Santa Cruz",
  "Vale das Pedrinhas",
  "Chapada do Rio Vermelho",
];

export default function SplashPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-warning/5 blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col justify-between px-5 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center pt-8"
        >
          {/* Logo mark */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.5,
              type: "spring",
              stiffness: 200,
            }}
            className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary shadow-lg shadow-primary/25 mb-5"
          >
            <Heart
              className="h-10 w-10 text-primary-foreground"
              fill="currentColor"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-3xl font-bold font-display tracking-tight leading-tight"
          >
            Complexo do
            <br />
            <span className="text-primary">Nordeste de Amaralina</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-sm text-muted-foreground mt-3 max-w-[280px] mx-auto leading-relaxed"
          >
            Tudo do seu neighborhood em um só lugar. Comércios, serviços,
            eventos e a voz da comunidade.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-xs text-muted-foreground/70 mt-1.5"
          >
            Salvador, Bahia • Região RA VII
          </motion.p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="grid grid-cols-2 gap-3 my-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
              className="bg-card/80 backdrop-blur-sm border rounded-2xl p-4 text-center"
            >
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
              <p className="text-lg font-bold font-display">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bairros pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="mb-6"
        >
          <p className="text-xs font-medium text-muted-foreground text-center mb-2.5">
            Nossos neighborhoods
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {neighborhoodNames.map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + i * 0.08 }}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/15"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={() => navigate("/onboarding")}
            className="w-full h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20 gap-2"
            size="lg"
          >
            Entrar na comunidade
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Gratuito • Feito pela comunidade, para a comunidade
          </p>
        </motion.div>
      </div>
    </div>
  );
}
