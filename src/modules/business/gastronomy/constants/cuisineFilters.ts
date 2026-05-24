import {
  Beef,
  Beer,
  CakeSlice,
  Coffee,
  Croissant,
  IceCreamBowl,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Store,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { CuisineType } from "./cuisine";

export interface GastronomyCuisineFilter {
  id: string;
  icon: LucideIcon;
  label: string;
  cuisineFilter: CuisineType;
  iconColor: string;
  bg: string;
}

export const GASTRONOMY_CUISINE_FILTERS: readonly GastronomyCuisineFilter[] = [
  {
    id: "lanches",
    icon: Sandwich,
    label: "Lanches",
    cuisineFilter: "lanchonete",
    iconColor: "text-amber-400",
    bg: "bg-amber-500/15 border-amber-500/20",
  },
  {
    id: "pizza",
    icon: Pizza,
    label: "Pizza",
    cuisineFilter: "pizzaria",
    iconColor: "text-red-400",
    bg: "bg-red-500/15 border-red-500/20",
  },
  {
    id: "brasileira",
    icon: Utensils,
    label: "Brasileira",
    cuisineFilter: "brasileira",
    iconColor: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/20",
  },
  {
    id: "arabe",
    icon: Utensils,
    label: "\u00c1rabe",
    cuisineFilter: "arabe",
    iconColor: "text-yellow-400",
    bg: "bg-yellow-500/15 border-yellow-500/20",
  },
  {
    id: "sorveteria",
    icon: IceCreamBowl,
    label: "A\u00e7a\u00ed / Sorvete",
    cuisineFilter: "sorveteria",
    iconColor: "text-purple-400",
    bg: "bg-purple-500/15 border-purple-500/20",
  },
  {
    id: "saudavel",
    icon: Salad,
    label: "Saud\u00e1vel",
    cuisineFilter: "vegetariana",
    iconColor: "text-green-400",
    bg: "bg-green-500/15 border-green-500/20",
  },
  {
    id: "japonesa",
    icon: Store,
    label: "Japonesa",
    cuisineFilter: "japonesa",
    iconColor: "text-pink-400",
    bg: "bg-pink-500/15 border-pink-500/20",
  },
  {
    id: "salgados",
    icon: Croissant,
    label: "Salgados",
    cuisineFilter: "outros",
    iconColor: "text-lime-400",
    bg: "bg-lime-500/15 border-lime-500/20",
  },
  {
    id: "pastel",
    icon: Croissant,
    label: "Pastel",
    cuisineFilter: "pastel",
    iconColor: "text-orange-500",
    bg: "bg-orange-600/15 border-orange-600/20",
  },
  {
    id: "padaria",
    icon: Croissant,
    label: "Padarias",
    cuisineFilter: "padaria",
    iconColor: "text-yellow-600",
    bg: "bg-yellow-600/15 border-yellow-600/20",
  },
  {
    id: "doceria",
    icon: CakeSlice,
    label: "Doces & Bolos",
    cuisineFilter: "doceria",
    iconColor: "text-fuchsia-400",
    bg: "bg-fuchsia-500/15 border-fuchsia-500/20",
  },
  {
    id: "carnes",
    icon: Beef,
    label: "Carnes",
    cuisineFilter: "churrascaria",
    iconColor: "text-red-500",
    bg: "bg-red-600/15 border-red-600/20",
  },
  {
    id: "marmita",
    icon: Soup,
    label: "Marmita",
    cuisineFilter: "regional",
    iconColor: "text-teal-400",
    bg: "bg-teal-500/15 border-teal-500/20",
  },
  {
    id: "bar",
    icon: Beer,
    label: "Bares",
    cuisineFilter: "bar",
    iconColor: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/20",
  },
  {
    id: "cafeteria",
    icon: Coffee,
    label: "Caf\u00e9s",
    cuisineFilter: "cafeteria",
    iconColor: "text-yellow-500",
    bg: "bg-yellow-500/15 border-yellow-500/20",
  },
  {
    id: "hamburger",
    icon: Sandwich,
    label: "Hamb\u00farguer",
    cuisineFilter: "hamburguer",
    iconColor: "text-amber-500",
    bg: "bg-amber-600/15 border-amber-600/20",
  },
] as const;
