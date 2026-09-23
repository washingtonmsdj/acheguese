import { Suspense, useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Menu, Shield, X } from "lucide-react";
import { RoleService } from "@/core/authorization/services/RoleService";
import { buildLoginPath } from "@/core/auth/constants/authFlow";
import { classifiedReportService } from "@/core/classifieds/services";
import { useSessionContext } from "@/core/session";
import { AdminPageLoader } from "@/shared/components/loading/PageLoader";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { logger } from "@/shared/utils/logger";
import type {
  AdminNavBadge,
  AdminNavSection,
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

interface AdminLayoutProps {
  readonly navigationSections: readonly AdminNavSection[];
}

export default function AdminLayout({
  navigationSections,
}: AdminLayoutProps) {
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
    enabled: adminBypassEnabled || isAdmin,
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
        const adminStatus = await RoleService.isAdmin(user.id);
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
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div
          className="h-12 w-12 animate-spin rounded-full border-2 border-muted border-t-primary motion-reduce:animate-none"
          role="status"
          aria-label="Verificando acesso administrativo"
        />
      </div>
    );
  }

  if (!adminBypassEnabled && !user?.id) {
    return <Navigate to={buildLoginPath(window.location.pathname)} replace />;
  }

  if (!adminBypassEnabled && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="space-y-4 text-center">
          <div className="mx-auto w-fit rounded-full bg-destructive/10 p-5">
            <Shield className="h-12 w-12 text-destructive" aria-hidden="true" />
          </div>
          <div>
            <h1 className="mb-1 text-xl font-bold text-foreground">Acesso restrito</h1>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
              Sua conta não tem permissão de administrador.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao app
          </Button>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          <div>
            <h1 className="font-display text-sm font-bold leading-none text-foreground">
              Admin Panel
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Super App de Bairro
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Administração">
        {navigationSections.map((section) => (
          <div key={section.id} className="mb-3">
            {section.label ? (
              <p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
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
                        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {badgeLabel ? (
                      <span className="rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success">
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

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao app
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu administrativo"
          />
          <aside className="relative flex h-full w-64 flex-col bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu administrativo"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <span className="font-display text-sm font-bold">Admin Panel</span>
        </div>
        <div className="max-w-7xl p-4 md:p-6">
          <Suspense fallback={<AdminPageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
