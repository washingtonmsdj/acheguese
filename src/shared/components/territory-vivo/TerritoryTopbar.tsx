import { useEffect, useState, type FormEvent } from "react";
import {
  Bell,
  ChevronDown,
  MapPin,
  MessageCircle,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/shared/utils/cn";

interface TerritoryTopbarProps {
  territoryName: string;
  contextLabel: string;
  isAuthenticated: boolean;
  unreadCount?: number;
  /** Kept for callers that share the shell; publishing lives in the page/bottom nav. */
  canCreatePost?: boolean;
  searchHref?: string;
  searchLabel?: string;
  showMobileSearch?: boolean;
  /** Align the desktop bar with the full territory shell instead of a centered content column. */
  flushDesktop?: boolean;
  messagesHref?: string;
  profileLabel?: string | null;
  profileAvatarUrl?: string | null;
}

export function TerritoryTopbar({
  territoryName,
  contextLabel,
  isAuthenticated,
  unreadCount = 0,
  searchHref,
  searchLabel = "Buscar neste território",
  showMobileSearch = true,
  flushDesktop = false,
  messagesHref = "/mensagens",
  profileLabel,
  profileAvatarUrl,
}: TerritoryTopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryFromUrl = new URLSearchParams(location.search).get("q")?.trim() ?? "";
  const [query, setQuery] = useState(queryFromUrl);

  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchHref) return;
    const nextQuery = query.trim();
    navigate(
      nextQuery ? `${searchHref}?q=${encodeURIComponent(nextQuery)}` : searchHref,
    );
  };

  const clearSearch = () => {
    setQuery("");
    if (searchHref) navigate(searchHref);
  };

  const renderSearchForm = (inputId: string, accessibleLabel = searchLabel) =>
    searchHref ? (
      <form
        onSubmit={submitSearch}
        role="search"
        className="relative w-full max-w-[26rem]"
      >
        <label htmlFor={inputId} className="sr-only">
        {accessibleLabel}
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted"
          aria-hidden="true"
        />
        <input
          id={inputId}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchLabel}
          autoComplete="off"
          className="h-11 w-full rounded-xl border border-white/20 bg-white px-11 pr-12 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-sun focus:ring-2 focus:ring-territory-sun/40"
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-territory-muted hover:bg-territory-raised hover:text-territory-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </form>
    ) : null;

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 bg-territory-brand text-white shadow-territory-highlight xl:-ml-44 xl:w-[calc(100%+11rem)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div
        className={cn(
          "grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-5 py-2 sm:px-6 lg:flex lg:h-16 lg:gap-6 lg:py-0",
          flushDesktop ? "mx-0 max-w-none lg:px-6" : "mx-auto max-w-[76rem] lg:px-8",
        )}
      >
        <Link
          to="/"
          className="group flex min-h-11 min-w-0 shrink-0 items-center rounded-territory pr-1 lg:order-1"
          aria-label="Achegue-se — início"
        >
          <span className="font-heading text-[1.35rem] font-bold tracking-[-0.055em] text-white sm:text-[1.5rem]">
            achegue-se<span className="text-territory-sun">.</span>
          </span>
        </Link>

        <Link
          to="/?trocar=territorio"
          className="group col-span-2 row-start-2 flex min-h-10 min-w-0 items-center gap-2 rounded-xl px-1 hover:bg-white/10 lg:order-2 lg:col-auto lg:row-auto lg:px-3"
          aria-label={`Trocar território. Você está em ${territoryName}.`}
        >
          <MapPin className="h-5 w-5 shrink-0 text-territory-info" aria-hidden="true" />
          <span className="min-w-0">
            <span className="flex items-center gap-1">
              <span className="block max-w-[11rem] truncate text-sm font-semibold text-white">
                {territoryName}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-white/70" aria-hidden="true" />
            </span>
            <span className="block truncate text-[0.6875rem] text-white/70">
              {contextLabel}
            </span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center lg:order-3 lg:flex">
          {renderSearchForm("territory-home-search-desktop")}
        </div>

        <div className="ml-auto flex items-center gap-1.5 lg:order-4 sm:gap-2">
          <Link
            to={isAuthenticated ? "/notificacoes" : "/login"}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun"
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
          <Link
            to={isAuthenticated ? messagesHref : "/login"}
            className="relative hidden h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun lg:flex"
            aria-label="Conversas"
          >
            <MessageCircle className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </Link>
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="group inline-flex min-h-10 items-center gap-2 rounded-full px-1.5 text-sm font-semibold text-white hover:bg-white/10 sm:px-2"
              aria-label="Entrar"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white group-hover:bg-white/15">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          ) : (
            <Link
              to="/conta"
              className="flex h-10 max-w-[9rem] items-center gap-2 rounded-full bg-white/10 px-1.5 text-sm font-semibold text-white hover:bg-white/15 sm:px-2 sm:pr-3"
              aria-label="Abrir minha conta"
            >
              {profileAvatarUrl ? (
                <img src={profileAvatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-territory-sun text-territory-ink">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
              <span className="hidden truncate sm:inline">
                {profileLabel ?? "Minha conta"}
              </span>
            </Link>
          )}
        </div>
      </div>
      {showMobileSearch ? (
        <div className="mx-auto flex max-w-[76rem] items-center gap-3 px-5 pb-3 sm:px-6 lg:hidden">
          <div className="min-w-0 flex-1">
            {renderSearchForm("territory-home-search", `${searchLabel} no celular`)}
          </div>
        </div>
      ) : null}
    </header>
  );
}
