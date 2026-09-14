import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Accessibility,
  ArrowLeft,
  Bell,
  Home,
  KeyRound,
  LockKeyhole,
  MapPin,
  Shield,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/cn";

interface SettingsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  hashes?: readonly string[];
  excludeHashes?: readonly string[];
  search?: string;
  excludeSearch?: string;
  dividerBefore?: boolean;
  extraPaths?: readonly string[];
}

const settingsItems: readonly SettingsNavItem[] = [
  { label: "Visão geral", href: ACCOUNT_PATHS.home, icon: Home, exact: true, excludeSearch: "?section=profiles" },
  { label: "Dados de acesso", href: ACCOUNT_PATHS.access, icon: KeyRound, hashes: ["#acesso", "#email"] },
  { label: "Segurança", href: ACCOUNT_PATHS.security, icon: LockKeyhole, exact: true, excludeHashes: ["#acesso", "#email"] },
  { label: "Notificações", href: ACCOUNT_PATHS.notifications, icon: Bell, exact: true },
  { label: "Privacidade e dados", href: ACCOUNT_PATHS.privacy, icon: Shield, exact: true },
  { label: "Meus perfis", href: ACCOUNT_PATHS.profiles, icon: UserRound, exact: true, search: "?section=profiles" },
  {
    label: "Preferências",
    href: ACCOUNT_PATHS.preferences,
    icon: SlidersHorizontal,
    exact: true,
    excludeHashes: ["#acessibilidade"],
    dividerBefore: true,
    extraPaths: [ACCOUNT_PATHS.profileSettings],
  },
  { label: "Endereços e território", href: ACCOUNT_PATHS.addresses, icon: MapPin, exact: true },
  { label: "Acessibilidade", href: ACCOUNT_PATHS.accessibility, icon: Accessibility, hashes: ["#acessibilidade"] },
];

function isActive(
  pathname: string,
  locationHash: string,
  locationSearch: string,
  href: string,
  exact?: boolean,
  hashes?: readonly string[],
  excludeHashes?: readonly string[],
  search?: string,
  excludeSearch?: string,
  extraPaths?: readonly string[],
) {
  const target = href.split("?")[0].split("#")[0];
  const pathMatches =
    Boolean(extraPaths?.includes(pathname)) ||
    (exact ? pathname === target : pathname.startsWith(target));
  if (!pathMatches) return false;
  if (hashes && !hashes.includes(locationHash)) return false;
  if (excludeHashes?.includes(locationHash)) return false;
  if (search) return locationSearch === search;
  if (excludeSearch && locationSearch === excludeSearch) return false;
  return true;
}

function resolveDefaultBackTarget(pathname: string, hash: string): string {
  if (pathname === ACCOUNT_PATHS.security && ["#email", "#senha", "#mfa"].includes(hash)) {
    return ACCOUNT_PATHS.security;
  }
  if (pathname === ACCOUNT_PATHS.privacy && hash) {
    return ACCOUNT_PATHS.privacy;
  }
  if (pathname === ACCOUNT_PATHS.preferences && hash === "#acessibilidade") {
    return ACCOUNT_PATHS.preferences;
  }
  if (pathname === ACCOUNT_PATHS.profileSettings) {
    return ACCOUNT_PATHS.preferences;
  }
  return ACCOUNT_PATHS.home;
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AccountSettingsShell({
  children,
  title,
  description,
  eyebrow = "Minha conta",
  showBack = true,
  backTo,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  showBack?: boolean;
  backTo?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProfile, loading: profilesLoading } = useMultiProfileContext();
  const activeProfileName = activeProfile?.display_name?.trim() || "Minha conta";
  const resolvedBackTo = backTo ?? resolveDefaultBackTarget(location.pathname, location.hash);

  return (
    <div className="territory-vivo min-h-[100dvh] bg-territory-canvas text-territory-ink">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] bg-territory-surface lg:border-x lg:border-territory-border">
        <aside className="hidden w-[252px] shrink-0 bg-[hsl(var(--territory-brand))] px-3 py-5 text-white lg:sticky lg:top-0 lg:block lg:h-[100dvh] lg:overflow-y-auto">
          <Link
            to="/"
            className="mb-8 inline-flex px-3 font-heading text-[1.65rem] font-bold tracking-[-0.06em] text-white"
            aria-label="Achegue-se — início"
          >
            achegue-se<span className="text-territory-sun">.</span>
          </Link>
          <nav aria-label="Configurações da conta" className="space-y-1">
            {settingsItems.map(({ label, href, icon: Icon, exact, hashes, excludeHashes, search, excludeSearch, dividerBefore, extraPaths }) => {
              const active = isActive(
                location.pathname,
                location.hash,
                location.search,
                href,
                exact,
                hashes,
                excludeHashes,
                search,
                excludeSearch,
                extraPaths,
              );
              return (
                <div key={label} className={dividerBefore ? "mt-3 border-t border-white/15 pt-3" : undefined}>
                  <Link
                    to={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun",
                      active && "bg-white/15 font-semibold text-white",
                    )}
                  >
                    {active ? (
                      <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-territory-sun" aria-hidden="true" />
                    ) : null}
                    <Icon className={cn("h-5 w-5 shrink-0", active && "text-territory-sun")} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 bg-territory-canvas">
          <header className="hidden h-16 items-center justify-end border-b border-territory-border bg-territory-surface px-6 lg:sticky lg:top-0 lg:z-20 lg:flex xl:px-8">
            <Link
              to={ACCOUNT_PATHS.profiles}
              className="flex min-h-11 max-w-xs items-center gap-2 rounded-full px-2 text-sm font-semibold text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              aria-label={`Abrir Meus perfis${activeProfile ? ` — perfil ativo ${activeProfileName}` : ""}`}
            >
              <Avatar className="h-8 w-8 border border-territory-border bg-territory-raised">
                <AvatarImage src={activeProfile?.avatar_url || undefined} alt="" />
                <AvatarFallback className="bg-territory-brand/10 text-xs font-bold text-territory-brand">
                  {profilesLoading ? "…" : getInitials(activeProfileName)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-48 truncate">{profilesLoading ? "Carregando perfil..." : activeProfileName}</span>
            </Link>
          </header>

          <div className="relative flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-center border-b border-territory-border bg-territory-surface px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] lg:hidden">
            {showBack ? (
              <button
                type="button"
                aria-label="Voltar"
                onClick={() => navigate(resolvedBackTo)}
                className="absolute bottom-1 left-2 flex h-11 w-11 items-center justify-center rounded-full text-territory-ink hover:bg-territory-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-brand"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
            <Link
              to="/"
              aria-label="Achegue-se — início"
              className="flex min-h-11 items-center font-heading text-[1.35rem] font-bold tracking-[-0.06em] text-territory-brand"
            >
              achegue-se<span className="text-territory-sun">.</span>
            </Link>
          </div>

          <main id="main-content" tabIndex={-1} className="focus:outline-none">
            <div className="mx-auto w-full max-w-[1040px] px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-5 sm:px-6 sm:pb-12 sm:pt-6 xl:px-8">
              <div className="mb-5 sm:mb-6">
                <p className="text-[0.72rem] font-semibold text-territory-brand">{eyebrow}</p>
                <h1 className="mt-1 font-heading text-[1.65rem] font-bold leading-tight tracking-[-0.035em] text-territory-ink sm:text-3xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-1 text-sm leading-5 text-territory-muted sm:text-[0.95rem]">{description}</p>
                ) : null}
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
