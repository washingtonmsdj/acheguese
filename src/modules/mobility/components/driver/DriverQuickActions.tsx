import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  MessageCircle,
  AlertTriangle,
  FileText,
  Users,
  Store,
  Calendar,
  HelpCircle,
  Phone,
  Navigation,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

const actions = [
  {
    icon: MapPin,
    label: "Pedidos",
    desc: "Ver mapa",
    route: "/mobilidade/passageiro",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: MessageCircle,
    label: "Chat",
    desc: "Mensagens",
    route: "/chat",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: AlertTriangle,
    label: "SOS",
    desc: "Emergência",
    action: "sos",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: FileText,
    label: "Documentos",
    desc: "CNH e veículo",
    action: "docs",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Users,
    label: "Comunidade",
    desc: "Feed social",
    route: "/feed",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Store,
    label: "Comércios",
    desc: "Entregas",
    route: "/empresas",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Calendar,
    label: "Eventos",
    desc: "Do bairro",
    route: "/eventos",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: HelpCircle,
    label: "Suporte",
    desc: "Ajuda",
    action: "help",
    color: "text-gray-400",
    bg: "bg-white/5",
  },
];

export function DriverQuickActions() {
  const navigate = useNavigate();

  const handleAction = (item: (typeof actions)[0]) => {
    if (item.route) {
      navigate(item.route);
    } else if (item.action === "sos") {
      toast.error("SOS ativado. Contatos de emergência serão notificados.");
    } else if (item.action === "docs") {
      toast.info("Seção de documentos em breve.");
    } else if (item.action === "help") {
      toast.info("Suporte ao motorista em breve.");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="h-4 w-4 text-teal-400" />
        <h3 className="text-sm font-bold text-white">Ações Rápidas</h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((item) => (
          <button
            key={item.label}
            onClick={() => handleAction(item)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                item.bg,
              )}
            >
              <item.icon className={cn("h-5 w-5", item.color)} />
            </div>
            <span className="text-[0.65rem] font-semibold text-white">
              {item.label}
            </span>
            <span className="text-[0.55rem] text-gray-500 -mt-0.5">
              {item.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
