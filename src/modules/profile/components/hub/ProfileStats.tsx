/**
 * ProfileStats - Estatísticas do perfil
 *
 * Exibe métricas principais em cards visuais
 */

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface ProfileStatsProps {
  stats: Array<{
    icon: LucideIcon;
    label: string;
    value: number | string;
    hint: string;
  }>;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.04 },
  },
};

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </motion.div>
  );
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <StatTile key={stat.label} {...stat} />
      ))}
    </motion.div>
  );
}
