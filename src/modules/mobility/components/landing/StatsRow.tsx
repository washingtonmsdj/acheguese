import React from "react";
import { motion } from "framer-motion";
import { Users, Navigation, Star, Shield } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

interface StatsRowProps {
  drivers: string;
  rides: string;
  rating: string;
}

const variantStyles = {
  primary: { text: "text-primary" },
  accent: { text: "text-accent" },
  warning: { text: "text-warning" },
  success: { text: "text-success" },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export const StatsRow = ({ drivers, rides, rating }: StatsRowProps) => {
  const STATS = [
    {
      icon: Users,
      value: drivers,
      label: "Motoristas",
      variant: "primary" as const,
    },
    {
      icon: Navigation,
      value: rides,
      label: "Corridas",
      variant: "accent" as const,
    },
    {
      icon: Star,
      value: rating,
      label: "Avaliação",
      variant: "warning" as const,
    },
    {
      icon: Shield,
      value: "100%",
      label: "Seguro",
      variant: "success" as const,
    },
  ];

  return (
    <motion.section variants={itemVariants} aria-label="Estatísticas">
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {STATS.map((stat) => {
          const styles = variantStyles[stat.variant];
          return (
            <Card
              key={stat.label}
              className="bg-card border-border p-3 md:p-4 text-center hover:border-primary/20 transition-colors"
            >
              <stat.icon
                className={cn(
                  "h-4 w-4 md:h-5 md:w-5 mx-auto mb-1.5",
                  styles.text,
                )}
              />
              <div className="text-base md:text-xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-[0.65rem] md:text-xs text-muted-foreground">
                {stat.label}
              </div>
            </Card>
          );
        })}
      </div>
    </motion.section>
  );
};
