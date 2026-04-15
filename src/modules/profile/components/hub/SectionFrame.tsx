/**
 * SectionFrame - Container de seção reutilizável
 * 
 * Fornece estrutura consistente para seções do hub
 */

import { motion } from 'framer-motion';

interface SectionFrameProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function SectionFrame({ title, description, action, children }: SectionFrameProps) {
  return (
    <motion.section variants={fadeUp} className="rounded-3xl border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </motion.section>
  );
}
