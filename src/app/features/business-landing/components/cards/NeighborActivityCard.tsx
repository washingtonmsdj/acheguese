/**
 * NeighborActivityCard
 * 
 * Card de atividade de vizinho
 */

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import type { NeighborActivityCardProps } from "../../sections/types";

export function NeighborActivityCard({ activity, index }: NeighborActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 min-w-[280px] shrink-0 hover:border-primary/30 transition-colors"
    >
      <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-sm text-foreground truncate">
          <span className="font-semibold">{activity.user}</span>{" "}
          <span className="text-muted-foreground">{activity.action}</span>{" "}
          <span className="font-semibold text-primary">{activity.business}</span>
        </p>
        <p className="text-xs text-muted-foreground">{activity.time}</p>
      </div>
    </motion.div>
  );
}
