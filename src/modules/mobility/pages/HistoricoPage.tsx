/**
 * Página de Histórico de Corridas
 * Mostra todas as corridas passadas do usuário
 */

import { RideHistoryUnified } from "../components/RideHistoryUnified";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ArrowLeft, History, Car, CheckCircle2, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMobilidade } from "@/modules/mobility/hooks/useMobilidade";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function HistoricoPage() {
  const navigate = useNavigate();
  const { myRides, passengerRating = 5.0 } = useMobilidade();

  const completedRides = myRides.filter((r) => r.status === "completed");
  const totalRides = myRides.length;

  const stats = [
    {
      icon: Car,
      value: totalRides,
      label: "Total de Corridas",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: CheckCircle2,
      value: completedRides.length,
      label: "Concluídas",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: Star,
      value: passengerRating.toFixed(1),
      label: "Sua Avaliação",
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-card via-card to-primary/5 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Histórico de Corridas</h1>
                <p className="text-muted-foreground">
                  Veja todas as suas corridas passadas
                </p>
              </div>
            </div>
          </div>

          {/* Stats Hero */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        stat.bg,
                      )}
                    >
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div>
                      <p className={cn("text-2xl font-bold", stat.color)}>
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Lista de Histórico */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <RideHistoryUnified variant="full" />
      </div>
    </div>
  );
}
