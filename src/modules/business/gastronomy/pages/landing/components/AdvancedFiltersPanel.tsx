/**
 * Componente do painel de filtros avançados
 */

import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { PriceRange } from '../../../types';

// Opções alinhadas com o tipo PriceRange do SSOT
const PRICE_RANGE_OPTIONS: { value: PriceRange | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: '$', label: '$ — Econômico' },
  { value: '$$', label: '$$ — Moderado' },
  { value: '$$$', label: '$$$ — Elevado' },
  { value: '$$$$', label: '$$$$ — Premium' },
];

interface AdvancedFiltersPanelProps {
  priceRange?: PriceRange;
  onPriceChange: (value: string) => void;
}

export function AdvancedFiltersPanel({ priceRange, onPriceChange }: AdvancedFiltersPanelProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="mb-5 rounded-xl border border-border/50 bg-card p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Faixa de preço
          </label>
          <Select value={priceRange ?? 'todos'} onValueChange={onPriceChange}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}
