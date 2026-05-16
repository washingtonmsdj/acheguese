import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Ticket } from "lucide-react";
import { PanicAlertButton } from "./PanicAlertButton";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import { FOCUS_STYLES } from "@/core/community/components/styles/accessibilityAAA";

interface QuickAccessButtonsProps {
  userId?: string;
  isMobile: boolean;
}

export const QuickAccessButtons = ({
  userId,
  isMobile,
}: QuickAccessButtonsProps) => {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs

  return (
    <section
      className={`flex gap-2 ${isMobile ? "px-4" : "px-0"} pt-3 pb-1`}
      role="region"
      aria-label="Ações rápidas"
    >
      <PanicAlertButton userId={userId} />

      <button
        onClick={() => navigate(appUrls.community.events)} // ✅ SSOT
        className={`flex-1 flex items-center gap-2 bg-primary/10 rounded-xl p-3 hover:bg-primary/15 transition-colors ${FOCUS_STYLES.ring}`}
        aria-label="Ver eventos no seu bairro"
      >
        <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
        <div className="text-left">
          <p className="text-xs font-semibold">Eventos</p>
          <p className="text-[10px] text-muted-foreground">No seu bairro</p>
        </div>
      </button>

      <button
        onClick={() => navigate(appUrls.community.coupons)} // ✅ SSOT
        className={`flex-1 flex items-center gap-2 bg-success/10 rounded-xl p-3 hover:bg-success/15 transition-colors ${FOCUS_STYLES.ring}`}
        aria-label="Ver cupons de desconto"
      >
        <Ticket className="h-5 w-5 text-success" aria-hidden="true" />
        <div className="text-left">
          <p className="text-xs font-semibold">Cupons</p>
          <p className="text-[10px] text-muted-foreground">Economize aqui</p>
        </div>
      </button>
    </section>
  );
};

