import React, { memo } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, Trophy, Calendar } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

interface Step {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  variant: "primary" | "accent" | "warning" | "success";
}

const HOW_IT_WORKS: Step[] = [
  {
    num: "1",
    title: "Solicite uma Viagem ou Entrega",
    desc: "Informe origem, destino, horário e valor sugerido.",
    icon: <MapPin className="h-5 w-5" />,
    variant: "primary",
  },
  {
    num: "2",
    title: "Match Inteligente de Caronas",
    desc: "O sistema detecta passageiros com destinos próximos.",
    icon: <Users className="h-5 w-5" />,
    variant: "accent",
  },
  {
    num: "3",
    title: "Ranking e Gamificação",
    desc: "Avalie e suba no ranking: Bronze -> Prata -> Ouro -> Elite.",
    icon: <Trophy className="h-5 w-5" />,
    variant: "warning",
  },
  {
    num: "4",
    title: "Agendamento Antecipado",
    desc: "Programe viagens com antecedência.",
    icon: <Calendar className="h-5 w-5" />,
    variant: "success",
  },
];

const variantStyles = {
  primary: { iconBg: "bg-primary/20", text: "text-primary" },
  accent: { iconBg: "bg-accent/20", text: "text-accent" },
  warning: { iconBg: "bg-warning/20", text: "text-warning" },
  success: { iconBg: "bg-success/20", text: "text-success" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const StepCard = memo(({ step }: { step: Step }) => {
  const styles = variantStyles[step.variant];
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card border-border p-3 hover:border-primary/20 transition-all group">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
              styles.iconBg,
            )}
          >
            <span className={cn("font-bold text-sm", styles.text)}>
              {step.num}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground mb-1">
              {step.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {step.desc}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

StepCard.displayName = "StepCard";

export const HowItWorksSteps = () => {
  return (
    <motion.div
      className="space-y-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {HOW_IT_WORKS.map((step) => (
        <StepCard key={step.num} step={step} />
      ))}
    </motion.div>
  );
};
