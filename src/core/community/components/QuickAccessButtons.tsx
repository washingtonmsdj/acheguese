import React, { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Ticket } from "lucide-react";
import { isLaunchSurfaceEnabled } from "@/config/launchScope";
import { useAppUrls } from "@/core/routing/hooks";
import { FOCUS_STYLES } from "@/core/community/components/styles/accessibilityAAA";

const PanicAlertButton = lazy(() =>
  import("./PanicAlertButton").then((module) => ({ default: module.PanicAlertButton })),
);

interface QuickAccessButtonsProps {
  userId?: string;
  isMobile: boolean;
}

export const QuickAccessButtons = ({
  userId,
  isMobile,
}: QuickAccessButtonsProps) => {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const showAlerts = isLaunchSurfaceEnabled("communityAlerts");
  const showEvents = isLaunchSurfaceEnabled("events");
  const showCoupons = isLaunchSurfaceEnabled("coupons");

  if (!showAlerts && !showEvents && !showCoupons) return null;

  return (
    <section
      className={`flex gap-2 ${isMobile ? "px-4" : "px-0"} pt-3 pb-1`}
      role="region"
      aria-label="Acoes rapidas"
    >
      {showAlerts && (
        <Suspense fallback={null}>
          <PanicAlertButton userId={userId} />
        </Suspense>
      )}

      {showEvents && (
        <button
          onClick={() => navigate(appUrls.community.events)}
          className={`flex-1 flex items-center gap-2 bg-primary/10 rounded-xl p-3 hover:bg-primary/15 transition-colors ${FOCUS_STYLES.ring}`}
          aria-label="Ver eventos no seu bairro"
        >
          <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
          <div className="text-left">
            <p className="text-xs font-semibold">Eventos</p>
            <p className="text-[10px] text-muted-foreground">No seu bairro</p>
          </div>
        </button>
      )}

      {showCoupons && (
        <button
          onClick={() => navigate(appUrls.community.coupons)}
          className={`flex-1 flex items-center gap-2 bg-success/10 rounded-xl p-3 hover:bg-success/15 transition-colors ${FOCUS_STYLES.ring}`}
          aria-label="Ver cupons de desconto"
        >
          <Ticket className="h-5 w-5 text-success" aria-hidden="true" />
          <div className="text-left">
            <p className="text-xs font-semibold">Cupons</p>
            <p className="text-[10px] text-muted-foreground">Economize aqui</p>
          </div>
        </button>
      )}
    </section>
  );
};
