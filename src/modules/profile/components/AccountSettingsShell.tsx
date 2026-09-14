import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Home,
  KeyRound,
  LockKeyhole,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { cn } from "@/shared/utils/cn";

const settingsItems = [
  { label: "Visão geral", href: "/conta", icon: Home, exact: true },
  { label: "Dados de acesso", href: "/conta/seguranca#acesso", icon: KeyRound },
  { label: "Segurança", href: "/conta/seguranca", icon: LockKeyhole, exact: true },
  { label: "Notificações", href: "/conta/notificacoes", icon: Bell, exact: true },
  { label: "Privacidade e dados", href: "/conta/privacidade", icon: Shield, exact: true },
  { label: "Preferências", href: "/conta/preferencias", icon: SlidersHorizontal, exact: true },
  { label: "Meus perfis", href: "/conta?section=profiles", icon: UserRound },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  const target = href.split("?")[0].split("#")[0];
  return exact ? pathname === target : pathname.startsWith(target);
}

export function AccountSettingsShell({
  children,
  title,
  description,
  eyebrow = "Minha conta",
}: {
  children: ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px]">
        <aside className="hidden w-[252px] shrink-0 border-r border-territory-border bg-[hsl(var(--territory-brand))] px-3 py-5 text-white lg:block">
          <Link
            to="/"
            className="mb-8 inline-flex px-3 font-heading text-[1.65rem] font-bold tracking-[-0.06em] text-white"
            aria-label="Achegue-se — início"
          >
            achegue-se<span className="text-territory-sun">.</span>
          </Link>
          <nav aria-label="Configurações da conta" className="space-y-1">
            {settingsItems.map(({ label, href, icon: Icon, exact }) => {
              const active = isActive(location.pathname, href, exact);
              return (
                <Link
                  key={label}
                  to={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/88 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun",
                    active && "bg-white/15 font-semibold text-white",
                  )}
                >
                  {active ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-territory-sun" aria-hidden="true" />
                  ) : null}
                  <Icon className={cn("h-5 w-5 shrink-0", active && "text-territory-sun")} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 bg-territory-canvas">
          <header className="hidden h-16 items-center justify-end border-b border-territory-border bg-territory-surface px-6 lg:flex xl:px-8">
            <button
              type="button"
              className="flex min-h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              onClick={() => navigate("/conta")}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-territory-brand/10 text-territory-brand">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
              Minha conta
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <main id="main-content" tabIndex={-1} className="focus:outline-none">
            <div className="mx-auto w-full max-w-[1040px] px-4 pb-24 pt-3 sm:px-6 sm:pb-12 sm:pt-5 xl:px-8">
              <div className="mb-5 flex items-start gap-2 sm:mb-6 lg:block">
                <button
                  type="button"
                  aria-label="Voltar para Minha conta"
                  onClick={() => navigate("/conta")}
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand lg:hidden"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.72rem] font-semibold text-territory-brand">{eyebrow}</p>
                  <h1 className="mt-1 font-heading text-[1.65rem] font-bold leading-tight tracking-[-0.035em] text-territory-ink sm:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 text-sm leading-5 text-territory-muted sm:text-[0.95rem]">{description}</p>
                  ) : null}
                </div>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
