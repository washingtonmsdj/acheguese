import { Store, Truck, Home, Globe } from "lucide-react";

export const MODOS_ICONS: Record<
  string,
  { icon: any; label: string; color: string }
> = {
  presencial: {
    icon: Store,
    label: "Presencial",
    color: "bg-primary/10 text-primary",
  },
  delivery: {
    icon: Truck,
    label: "Delivery",
    color: "bg-green-500/10 text-green-600",
  },
  domicilio: {
    icon: Home,
    label: "A domicílio",
    color: "bg-yellow-500/10 text-yellow-600",
  },
  online: { icon: Globe, label: "Online", color: "bg-sky-500/10 text-sky-600" },
};
