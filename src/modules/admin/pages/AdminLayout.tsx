import React, { Suspense } from "react";
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Tag,
  Calendar,
  Users,
  ArrowLeft,
  Trophy,
  Menu,
  X,
  Ticket,
  Settings2,
  MessagesSquare,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Home,
  Car,
  BarChart3,
  Flag,
  Map,
  MapPin,
  Bell,
  Activity,
  Database,
  Image,
  Shield,
  Briefcase,
  UserCog,
  CreditCard,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth";
import { classifiedReportService } from "@/core/classifieds/services";
import { logger } from "@/shared/utils/logger";
import { AdminPageLoader } from "@/shared/components/loading/PageLoader";

const navItems: Array<{
  to: string;
  icon: any;
  label: string;
  end?: boolean;
  badge?: string;
  section?: string;
}> = [
  // VISÃƒO GERAL
  {
    to: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    end: true,
    section: "overview",
  },

  // MOBILIDADE
  {
    to: "/admin/motoristas",
    icon: Car,
    label: "Motoristas",
    section: "mobilidade",
  },
  {
    to: "/admin/reports-passageiros",
    icon: Flag,
    label: "Reports Passageiros",
    badge: "NEW",
    section: "mobilidade",
  },
  {
    to: "/admin/pontos-embarque",
    icon: MapPin,
    label: "Pontos de Embarque",
    section: "mobilidade",
  },
  {
    to: "/admin/analytics-mobilidade",
    icon: BarChart3,
    label: "Analytics",
    section: "mobilidade",
  },
  {
    to: "/admin/realtime-dashboard",
    icon: Activity,
    label: "Dashboard Tempo Real",
    badge: "LIVE",
    section: "mobilidade",
  },
  {
    to: "/admin/pricing",
    icon: CreditCard,
    label: "Pricing",
    section: "mobilidade",
  },

  // CONTEÃšDO & CADASTROS
  {
    to: "/admin/banners",
    icon: Image,
    label: "Banners",
    badge: "NEW",
    section: "conteudo",
  },
  {
    to: "/admin/empresas",
    icon: Building2,
    label: "Empresas",
    section: "conteudo",
  },
  {
    to: "/admin/gastronomia",
    icon: UtensilsCrossed,
    label: "Gastronomia",
    section: "conteudo",
  },
  {
    to: "/admin/services",
    icon: Wrench,
    label: "Serviços",
    section: "conteudo",
  },
  {
    to: "/admin/classificados",
    icon: Tag,
    label: "Classificados",
    section: "conteudo",
  },
  {
    to: "/admin/classificados/denuncias",
    icon: Flag,
    label: "Denúncias",
    badge: "pendingReportsCount",
    section: "moderacao",
  },
  {
    to: "/admin/vagas",
    icon: Briefcase,
    label: "Vagas",
    section: "conteudo",
  },
  {
    to: "/admin/eventos",
    icon: Calendar,
    label: "Eventos",
    section: "conteudo",
  },
  { to: "/admin/cupons", icon: Ticket, label: "Cupons", section: "conteudo" },
  {
    to: "/admin/promocoes",
    icon: Ticket,
    label: "Promoções",
    section: "conteudo",
  },

  // MODERAÇÃO & SEGURANÇA
  {
    to: "/admin/moderacao-completa",
    icon: ShieldCheck,
    label: "Moderação Geral",
    section: "moderacao",
  },
  {
    to: "/admin/verificacoes",
    icon: ShieldCheck,
    label: "Verificações",
    section: "moderacao",
  },
  {
    to: "/admin/reivindicacoes",
    icon: AlertTriangle,
    label: "Reivindicações",
    section: "moderacao",
  },
  {
    to: "/admin/alertas",
    icon: Bell,
    label: "Alertas",
    section: "moderacao",
  },
  {
    to: "/admin/community-alerts",
    icon: AlertTriangle,
    label: "Alertas Comunitários",
    section: "comunidade",
  },
  {
    to: "/admin/community-issues",
    icon: AlertCircle,
    label: "Problemas Urbanos",
    section: "comunidade",
  },

  // COMUNIDADE
  { to: "/admin/users", icon: Users, label: "Usuários", section: "comunidade" },
  {
    to: "/admin/zeladoria",
    icon: Home,
    label: "Zeladoria",
    section: "comunidade",
  },
  {
    to: "/admin/mensagens",
    icon: MessagesSquare,
    label: "Conversas",
    section: "comunidade",
  },
  {
    to: "/admin/gamificacao",
    icon: Trophy,
    label: "Gamificação",
    section: "comunidade",
  },

  // SISTEMA
  {
    to: "/admin/assinaturas",
    icon: CreditCard,
    label: "Assinaturas",
    section: "sistema",
  },
  {
    to: "/admin/roles",
    icon: UserCog,
    label: "Roles & Permissões",
    section: "sistema",
  },
  {
    to: "/admin/identidade",
    icon: UserCog,
    label: "Identidade",
    section: "sistema",
  },
  {
    to: "/admin/mapa",
    icon: Map,
    label: "Mapa",
    section: "sistema",
  },
  {
    to: "/admin/notifications",
    icon: Bell,
    label: "Notificações",
    section: "sistema",
  },
  {
    to: "/admin/configuracoes",
    icon: Settings2,
    label: "Configurações",
    section: "sistema",
  },
  {
    to: "/admin/operacoes",
    icon: Settings2,
    label: "Operações",
    section: "sistema",
  },
  {
    to: "/admin/analytics",
    icon: BarChart3,
    label: "Analytics Avançado",
    section: "sistema",
  },
  {
    to: "/admin/ssot",
    icon: Database,
    label: "Central SSOT",
    section: "sistema",
  },
  {
    to: "/admin/highlights",
    icon: MapPin,
    label: "Destaques Territoriais",
    section: "sistema",
  },
  {
    to: "/admin/territorial-groups",
    icon: Users,
    label: "Grupos Territoriais",
    section: "sistema",
  },
  {
    to: "/admin/territory-management",
    icon: MapPin,
    label: "Gestão de Territórios",
    section: "sistema",
  },
  {
    to: "/admin/city-metadata",
    icon: MapPin,
    label: "Metadados da Cidade",
    section: "sistema",
  },
  {
    to: "/admin/guia/pontos-turisticos",
    icon: MapPin,
    label: "Pontos Turísticos",
    section: "conteudo",
  },
  {
    to: "/admin/locations",
    icon: MapPin,
    label: "Gerenciar Locations",
    section: "sistema",
  },
];

export default function AdminLayout() {
  const { user, isLoading: sessionLoading } = useSessionContext();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const adminBypassEnabled =
    import.meta.env.DEV && import.meta.env.VITE_ADMIN_BYPASS === "true";

  // Buscar contagem de denúncias pendentes
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
        logger.error("AdminLayout: falha ao verificar permissao admin", err as Error, {
          component: "AdminLayout",
          userId: user.id,
        });
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    }

    void checkAdmin();
  }, [adminBypassEnabled, user?.id, sessionLoading]);

  if (!adminBypassEnabled && (sessionLoading || checking)) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!adminBypassEnabled && !user?.id) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
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
              Sua conta não tem permissão de administrador.
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
        {(
          [
            "overview",
            "mobilidade",
            "conteudo",
            "moderacao",
            "comunidade",
            "sistema",
          ] as const
        ).map((section) => {
          const sectionItems = navItems.filter((i) => i.section === section);
          if (sectionItems.length === 0) return null;

          const sectionLabels: Record<string, string> = {
            overview: "",
            mobilidade: "MOBILIDADE",
            conteudo: "CONTEÚDO & CADASTROS",
            moderacao: "MODERAÇÃO & SEGURANÇA",
            comunidade: "COMUNIDADE",
            sistema: "SISTEMA",
          };

          return (
            <div key={section} className="mb-3">
              {sectionLabels[section] && (
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 pt-3 pb-1.5">
                  {sectionLabels[section]}
                </p>
              )}
              <div className="space-y-0.5">
                {sectionItems.map((item) => (
                  <NavLink
                    key={item.to}
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
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        {item.badge === "pendingReportsCount" && pendingReportsCount > 0
                          ? pendingReportsCount
                          : item.badge !== "pendingReportsCount"
                          ? item.badge
                          : null}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="p-2 border-t">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao app
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="hidden md:flex w-60 bg-card border-r flex-col shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {mobileOpen && (
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
      )}

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
