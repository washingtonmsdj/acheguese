/* eslint-disable react-refresh/only-export-components */
import React from "react";
import {
  Bell,
  Calendar,
  Car,
  HelpCircle,
  Lightbulb,
  List,
  PawPrint,
  Search,
  Shield,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

export type FeedCategory =
  | "todos"
  | "evento"
  | "promoção"
  | "dica"
  | "segurança"
  | "aviso"
  | "pergunta"
  | "compra_venda"
  | "achados_perdidos"
  | "animais"
  | "transito";

export const categories: { id: FeedCategory; label: string; icon: LucideIcon }[] =
  [
    { id: "todos", label: "Todos", icon: List },
    { id: "evento", label: "Evento", icon: Calendar },
    { id: "promoção", label: "Promoção", icon: Tag },
    { id: "dica", label: "Dica", icon: Lightbulb },
    { id: "segurança", label: "Segurança", icon: Shield },
    { id: "aviso", label: "Avisos", icon: Bell },
    { id: "pergunta", label: "Pergunta", icon: HelpCircle },
    { id: "compra_venda", label: "Compra/Venda", icon: ShoppingCart },
    { id: "achados_perdidos", label: "Achados", icon: Search },
    { id: "animais", label: "Animais", icon: PawPrint },
    { id: "transito", label: "Trânsito", icon: Car },
  ];

export const categoryColors: Record<string, string> = {
  alerta: "bg-warning/10 text-warning border-warning/20",
  evento: "bg-primary/10 text-primary border-primary/20",
  promoção: "bg-success/10 text-success border-success/20",
  dica: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  segurança: "bg-destructive/10 text-destructive border-destructive/20",
  aviso: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  pergunta: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  compra_venda: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  achados_perdidos: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  animais: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  transito: "bg-slate-500/10 text-slate-700 border-slate-500/20",
};

interface Props {
  filter: FeedCategory;
  onFilterChange: (cat: FeedCategory) => void;
}

export function FeedCategoryFilter({ filter, onFilterChange }: Props) {
  return (
    <div className="flex max-w-full flex-wrap gap-2 overflow-hidden px-4 py-3">
      {categories.map((cat) => {
        const Icon = cat.icon;

        return (
          <button
            key={cat.id}
            onClick={() => onFilterChange(cat.id)}
            className={cn(
              "max-w-full px-3 py-1.5 rounded-full text-xs font-medium whitespace-normal border transition-all inline-flex items-center gap-1.5",
              filter === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
