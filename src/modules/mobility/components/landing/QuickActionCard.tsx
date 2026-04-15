import React, { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  route: string;
  variant: "primary" | "accent" | "warning" | "success";
}

interface QuickActionCardProps {
  action: QuickAction;
  onClick: () => void;
}

const variantStyles = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/20 hover:border-primary/40",
    text: "text-primary",
    iconBg: "bg-primary/20",
  },
  accent: {
    bg: "bg-accent/10",
    border: "border-accent/20 hover:border-accent/40",
    text: "text-accent",
    iconBg: "bg-accent/20",
  },
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/20 hover:border-warning/40",
    text: "text-warning",
    iconBg: "bg-warning/20",
  },
  success: {
    bg: "bg-success/10",
    border: "border-success/20 hover:border-success/40",
    text: "text-success",
    iconBg: "bg-success/20",
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export const QuickActionCard = memo(
  ({ action, onClick }: QuickActionCardProps) => {
    const styles = variantStyles[action.variant];
    return (
      <motion.div variants={itemVariants}>
        <Card
          className={cn(
            "bg-card p-3 cursor-pointer transition-all duration-200 group border",
            styles.border,
            "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
          )}
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-label={
            action.subtitle
              ? `${action.title} - ${action.subtitle}`
              : action.title
          }
          onKeyDown={(e) => e.key === "Enter" && onClick()}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                styles.iconBg,
              )}
            >
              <action.icon className={cn("h-4 w-4", styles.text)} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-foreground leading-tight">
                {action.title}
              </h3>
              {action.subtitle && (
                <p className={cn("text-[0.65rem] mt-0.5", styles.text)}>
                  {action.subtitle}
                </p>
              )}
            </div>
            <ArrowRight
              className={cn(
                "h-3 w-3 flex-shrink-0 transition-transform group-hover:translate-x-1",
                styles.text,
                "opacity-0 group-hover:opacity-100",
              )}
            />
          </div>
        </Card>
      </motion.div>
    );
  },
);

QuickActionCard.displayName = "QuickActionCard";
