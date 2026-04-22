import { Suspense, useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Menu, Shield, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth";
import { classifiedReportService } from "@/shared/services/classifiedReports";
import { logger } from "@/shared/utils/logger";
import { AdminPageLoader } from "@/shared/components/loading/PageLoader";
import {
  ADMIN_NAV_SECTIONS,
  type AdminNavBadge,
} from "../config/adminNavigation.config";

function getBadgeLabel(
  badge: AdminNavBadge | undefined,
  pendingReportsCount: number,
): string | null {
  if (!badge) return null;
  if (badge === "pendingReportsCount") {
    return pendingReportsCount > 0 ? String(pendingReportsCount) : null;
  }
  return badge;
}

export default function AdminLayout() {
  const { user, isLoading: sessionLoading } = useSessionContext();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const adminBypassEnabled =
    import.meta.env.DEV && import.meta.env.VITE_ADMIN_BYPASS === "true";

  const { data: pendingReportsCount = 0 } = useQuery({
    queryKey: ["admin-pending-reports-count"],
    queryFn: () => classifiedReportService.getPendingReportsCount(),
    enabled: true,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (adminBypassEnabled) {
      setIsAdmin(true);
      setChecking(false);
      return;
    }

    if (sessionLoading) return;

    async function checkAdmin() {
      setChecking(true);

      if (!user?.id) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        const adminStatus = await AuthService.isAdmin(user.id);
        setIsAdmin(adminStatus);
      } catch (err) {
        logger.error(
          "AdminLayout: falha ao verificar permissao admin",
          err as Error,
          {
            component: "AdminLayout",
            userId: user.id,
          },
        );
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    }

    void checkAdmin();
  }, [adminBypassEnabled, sessionLoading, user?.id]);

  if (!adminBypassEnabled && (sessionLoading || checking)) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!adminBypassEnabled && !user?.id) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
        replace
      />
    );
  }

  if (!adminBypassEnabled && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="rounded-full bg-red-500/10 p-5 w-fit mx-auto">
            <Shield className="h-12 w-12 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Acesso Restrito</h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Sua conta nao tem permissao de administrador.
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </button>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-sm font-bold font-display leading-none">
              Admin Panel
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Super App de Bairro
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.id} className="mb-3">
            {section.label ? (
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 pt-3 pb-1.5">
                {section.label}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const badgeLabel = getBadgeLabel(
                  item.badge,
                  pendingReportsCount,
                );

                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badgeLabel ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        {badgeLabel}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao app
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden md:flex w-60 bg-card border-r flex-col shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-card h-full flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <main className="flex-1 overflow-auto min-w-0">
        <div className="md:hidden sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-sm font-display">Admin Panel</span>
        </div>
        <div className="p-4 md:p-6 max-w-7xl">
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
