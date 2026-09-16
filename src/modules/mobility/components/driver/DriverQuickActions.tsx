import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  FileText,
  HelpCircle,
  MapPin,
  MessageCircle,
  Navigation,
  Store,
  Users,
} from "lucide-react";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";
import { cn } from "@/shared/utils/cn";

const actions = [
  {
    icon: MapPin,
    label: "Pedidos",
    desc: "Ver mapa",
    route: mobilityRoutes.motorista.corridas,
    color: "text-category-mobility",
    bg: "bg-category-mobility/12",
  },
  {
    icon: MessageCircle,
    label: "Chat",
    desc: "Mensagens",
    route: "/chat",
    color: "text-category-discussion",
    bg: "bg-category-discussion/12",
  },
  {
    icon: AlertTriangle,
    label: "SOS",
    desc: "Contatos",
    route: mobilityRoutes.public.emergencyContacts,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    icon: FileText,
    label: "Documentos",
    desc: "CNH e veículo",
    route: mobilityRoutes.motorista.cadastro,
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    icon: Users,
    label: "Comunidade",
    desc: "Feed social",
    route: "/feed",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Store,
    label: "Comércios",
    desc: "Entregas",
    route: "/empresas",
    color: "text-category-business",
    bg: "bg-category-business/12",
  },
  {
    icon: Calendar,
    label: "Eventos",
    desc: "Do bairro",
    route: "/eventos",
    color: "text-category-event",
    bg: "bg-category-event/12",
  },
  {
    icon: HelpCircle,
    label: "Suporte",
    desc: "Ajuda",
    route: "/contato?assunto=motorista",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
] as const;

export function DriverQuickActions() {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border bg-card p-4 text-card-foreground">
      <div className="mb-3 flex items-center gap-2">
        <Navigation className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-bold">Ações rápidas</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.route)}
            className="group flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-center transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            aria-label={`${item.label}: ${item.desc}`}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                item.bg,
              )}
            >
              <item.icon className={cn("h-5 w-5", item.color)} aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-foreground">{item.label}</span>
            <span className="text-[0.65rem] text-muted-foreground">{item.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
