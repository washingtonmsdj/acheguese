import { Bell, ChevronDown, MapPin, PenLine } from "lucide-react";
import { Link } from "react-router-dom";

interface TerritoryTopbarProps {
  territoryName: string;
  contextLabel: string;
  isAuthenticated: boolean;
  unreadCount?: number;
  canCreatePost?: boolean;
}

export function TerritoryTopbar({
  territoryName,
  contextLabel,
  isAuthenticated,
  unreadCount = 0,
  canCreatePost = false,
}: TerritoryTopbarProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-territory-border/80 bg-territory-canvas/90 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          to="/?trocar=territorio"
          className="group flex min-h-11 min-w-0 items-center gap-2.5 rounded-territory pr-2"
          aria-label={`Trocar território. Você está em ${territoryName}.`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-territory bg-territory-brand text-[hsl(var(--territory-canvas))]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1">
              <span className="block truncate font-heading text-base font-semibold leading-tight text-territory-ink sm:text-lg">
                {territoryName}
              </span>
              <ChevronDown
                className="h-4 w-4 shrink-0 text-territory-muted transition-transform group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </span>
            <span className="block truncate text-[0.6875rem] text-territory-muted sm:text-xs">
              {contextLabel}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {canCreatePost ? (
            <Link
              to="/novo-post"
              className="hidden min-h-11 items-center gap-2 rounded-xl bg-territory-brand px-4 text-sm font-semibold text-[hsl(var(--territory-canvas))] hover:bg-territory-brand-strong sm:inline-flex"
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              Publicar
            </Link>
          ) : null}
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-xl px-2.5 text-sm font-semibold text-territory-ink hover:bg-territory-raised"
            >
              Entrar
            </Link>
          ) : null}
          <Link
            to={isAuthenticated ? "/notificacoes" : "/login"}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-territory-border bg-territory-surface text-territory-ink hover:border-territory-brand/35 hover:text-territory-brand"
            aria-label={
              isAuthenticated && unreadCount > 0
                ? `${unreadCount} notificações não lidas`
                : "Notificações"
            }
          >
            <Bell className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
            {isAuthenticated && unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.5625rem] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
