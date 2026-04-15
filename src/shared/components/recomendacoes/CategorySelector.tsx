import React from "react";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";

interface Category {
  id: string;
  label: string;
  icon: string;
  hint: string;
}

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CATEGORIAS: Category[] = [
  {
    id: "services",
    label: "Serviços",
    icon: "🔧",
    hint: "Eletricista, encanador, pintor...",
  },
  {
    id: "restaurantes",
    label: "Restaurantes",
    icon: "🍽️",
    hint: "Pizzaria, lanchonete, padaria...",
  },
  {
    id: "manutencao",
    label: "Manutenção",
    icon: "🏠",
    hint: "Reformas, consertos, instalações...",
  },
  {
    id: "saude",
    label: "Saúde",
    icon: "🏥",
    hint: "Médico, dentista, farmácia...",
  },
  {
    id: "pets",
    label: "Pets",
    icon: "🐾",
    hint: "Veterinário, pet shop, banho...",
  },
  {
    id: "compras",
    label: "Compras",
    icon: "🛒",
    hint: "Lojas, mercados, materiais...",
  },
  {
    id: "outros",
    label: "Outros",
    icon: "📌",
    hint: "Qualquer outra recomendação",
  },
];

export function CategorySelector({
  selectedCategory,
  onCategoryChange,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Categoria *</Label>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIAS.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all",
              selectedCategory === category.id
                ? "bg-primary/10 border-primary"
                : "bg-card border-border hover:bg-secondary/50",
            )}
            aria-pressed={selectedCategory === category.id}
            aria-label={`Selecionar categoria ${category.label}`}
          >
            <span className="text-xl" role="img" aria-label={category.label}>
              {category.icon}
            </span>
            <div>
              <p className="text-xs font-medium">{category.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {category.hint}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
