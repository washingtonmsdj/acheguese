/**
 * RouteOptions
 * 
 * Opções de rota (a pé, carro, Google Maps).
 * Exibido como dropdown animado.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, Car, ExternalLink, ChevronRight } from 'lucide-react';
import type { RouteOptionsProps } from '../../sections/types';

const ROUTE_OPTIONS = [
  {
    icon: Footprints,
    label: "A pé",
    detail: "~5 min",
    color: "text-primary",
  },
  {
    icon: Car,
    label: "De carro",
    detail: "~2 min",
    color: "text-amber-400",
  },
  {
    icon: ExternalLink,
    label: "Abrir no Google Maps",
    detail: "Navegação externa",
    color: "text-sky-400",
  },
];

export function RouteOptions({ show, onRoute }: RouteOptionsProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Escolha como chegar
            </p>
            {ROUTE_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={onRoute}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <opt.icon className={`h-5 w-5 ${opt.color}`} />
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.detail}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
