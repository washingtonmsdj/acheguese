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
  initialSearchQuery?: string;
  showMobileSearch?: boolean;
  /** Align the desktop bar with the full territory shell instead of a centered content column. */
  flushDesktop?: boolean;
  /** Match compact mobile concepts that place the territory row directly below the brand row. */
  compactMobile?: boolean;
  /** Keep the mobile territory label on one line for the community concept preview. */
  conceptMobile?: boolean;
  /** Hide search and notification controls on mobile-only concept headers. */
  hideMobileUtilityActions?: boolean;
  messagesHref?: string;
  profileLabel?: string | null;
  profileAvatarUrl?: string | null;
  variant?: "brand" | "light";
}

export function TerritoryTopbar({
  territoryName,
  contextLabel,
  isAuthenticated,
  unreadCount = 0,
  searchHref,
  searchLabel = "Buscar neste território",
  initialSearchQuery,
  showMobileSearch = true,
  flushDesktop = false,
  compactMobile = false,
  conceptMobile = false,
  hideMobileUtilityActions = false,
  messagesHref = "/mensagens",
  profileLabel,
  profileAvatarUrl,
  variant = "brand",
}: TerritoryTopbarProps) {
  const isLight = variant === "light";
  const navigate = useNavigate();
  const location = useLocation();
  const queryFromUrl = new URLSearchParams(location.search).get("q");
  const searchQuery =
    queryFromUrl?.trim() ?? initialSearchQuery?.trim() ?? "";
  const [query, setQuery] = useState(searchQuery);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

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
        className={cn(
          "relative w-full",
          conceptMobile ? "max-w-[19.75rem]" : "max-w-[26rem]",
        )}
      >
        <label htmlFor={inputId} className="sr-only">
        {accessibleLabel}
        </label>
        <Search
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-territory-muted",
            conceptMobile && "min-[1000px]:h-4 min-[1000px]:w-4",
          )}
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
          className={cn(
            "h-11 w-full rounded-xl border border-white/20 bg-white px-11 pr-12 text-sm text-territory-ink outline-none placeholder:text-territory-muted focus:border-territory-sun focus:ring-2 focus:ring-territory-sun/40",
            conceptMobile && "min-[1000px]:h-9",
          )}
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
      className={cn(
        "sticky top-0 z-40 border-b",
        conceptMobile && "mx-auto max-w-[63.25rem]",
        !conceptMobile && "xl:-ml-44 xl:w-[calc(100%+11rem)]",
        isLight
          ? "border-territory-border bg-territory-surface text-territory-ink shadow-none"
          : "border-white/10 bg-territory-brand text-white shadow-territory-highlight",
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div
        className={cn(
          "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-5 py-2 sm:px-6",
          compactMobile ? "min-h-0 gap-y-0 px-4 py-0" : "min-h-16",
          conceptMobile
            ? "min-[1000px]:flex min-[1000px]:h-16 min-[1000px]:gap-4 min-[1000px]:px-4 min-[1000px]:py-0"
            : "lg:flex lg:h-16 lg:gap-6 lg:py-0",
          flushDesktop
            ? conceptMobile
              ? "mx-0 max-w-none"
              : "mx-0 max-w-none lg:px-6"
            : "mx-auto max-w-[76rem] lg:px-8",
        )}
      >
        <Link
          to="/"
          className="group flex min-h-11 min-w-0 shrink-0 items-center rounded-territory pr-1 lg:order-1"
          aria-label="Achegue-se — início"
        >
          <span
            className={cn(
              "font-heading text-[1.35rem] font-bold tracking-[-0.055em] sm:text-[1.5rem]",
              isLight ? "text-territory-brand" : "text-white",
            )}
          >
            achegue-se<span className="text-territory-sun">.</span>
          </span>
        </Link>

        <Link
          to="/?trocar=territorio"
          className={cn(
            "group col-span-2 row-start-2 flex min-h-10 min-w-0 items-center gap-2 rounded-xl px-1 lg:order-2 lg:col-auto lg:row-auto lg:px-3",
            compactMobile && isLight
              ? conceptMobile
                ? "mt-1 mb-2 border-0 bg-transparent px-1"
                : "mt-1 mb-2 border border-territory-brand/10 bg-territory-brand/5 px-3"
              : isLight
                ? "hover:bg-territory-brand/5"
                : "hover:bg-white/10",
          )}
          aria-label={`Trocar território. Você está em ${territoryName}.`}
        >
          <MapPin
            className={cn(
              "h-5 w-5 shrink-0",
              isLight ? "text-territory-brand" : "text-territory-info",
              conceptMobile && "text-white",
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              "min-w-0",
              conceptMobile &&
                "flex items-center gap-2 min-[1000px]:flex-col min-[1000px]:items-start min-[1000px]:gap-0",
            )}
          >
            <span className={cn("flex items-center gap-1", conceptMobile && "shrink-0")}>
              <span
                className={cn(
                  "block max-w-[11rem] truncate text-sm font-semibold",
                  conceptMobile && "max-w-[17rem] text-xs font-medium",
                  isLight ? "text-territory-ink" : "text-white",
                )}
              >
                {territoryName}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0",
                  conceptMobile && "hidden",
                  isLight ? "text-territory-muted" : "text-white/70",
                )}
                aria-hidden="true"
              />
            </span>
            <span
              className={cn(
                "block truncate text-[0.6875rem]",
                conceptMobile && "shrink-0 text-xs",
                isLight ? "text-territory-muted" : "text-white/70",
              )}
            >
              {contextLabel}
            </span>
          </span>
        </Link>

        <div
          className={cn(
            "hidden min-w-0 flex-1 justify-center",
            conceptMobile
              ? "min-[1000px]:order-3 min-[1000px]:flex"
              : "lg:order-3 lg:flex",
          )}
        >
          {renderSearchForm("territory-home-search-desktop")}
        </div>

        <div className="ml-auto flex items-center gap-1.5 lg:order-4 sm:gap-2">
          {searchHref && !showMobileSearch ? (
            <Link
              to={searchHref}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun",
                hideMobileUtilityActions
                  ? "hidden min-[1000px]:flex"
                  : conceptMobile
                    ? "min-[1000px]:hidden"
                    : "lg:hidden",
                isLight
                  ? "text-territory-ink hover:bg-territory-brand/5"
                  : "text-white hover:bg-white/10",
              )}
              aria-label={searchLabel}
            >
              <Search className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
            </Link>
          ) : null}
          <Link
            to={isAuthenticated ? "/notificacoes" : "/login"}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun",
              hideMobileUtilityActions && "hidden min-[1000px]:flex",
              isLight
                ? "text-territory-ink hover:bg-territory-brand/5"
                : "text-white hover:bg-white/10",
            )}
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
            className={cn(
              "relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-sun",
              !conceptMobile && "lg:flex",
              isLight
                ? "text-territory-ink hover:bg-territory-brand/5"
                : "text-white hover:bg-white/10",
            )}
            aria-label="Conversas"
          >
            <MessageCircle className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </Link>
          {!isAuthenticated ? (
            <Link
              to="/login"
              className={cn(
                "group inline-flex min-h-10 items-center gap-2 rounded-full px-1.5 text-sm font-semibold hover:bg-white/10 sm:px-2",
                isLight
                  ? "text-territory-ink hover:bg-territory-brand/5"
                  : "text-white",
              )}
              aria-label="Entrar"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full group-hover:bg-white/15",
                  isLight
                    ? "bg-territory-brand/8 text-territory-brand"
                    : "bg-white/10 text-white",
                )}
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          ) : (
            <Link
              to="/conta"
              className={cn(
                "flex h-10 max-w-[9rem] items-center gap-2 rounded-full px-1.5 text-sm font-semibold sm:px-2 sm:pr-3",
                isLight
                  ? "text-territory-ink hover:bg-territory-brand/5"
                  : "bg-white/10 text-white hover:bg-white/15",
              )}
              aria-label="Abrir minha conta"
            >
              {profileAvatarUrl ? (
                <img src={profileAvatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isLight
                      ? "bg-territory-brand/10 text-territory-brand"
                      : "bg-territory-sun text-territory-ink",
                  )}
                >
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
              <span className="hidden truncate sm:inline">
                {profileLabel ?? "Minha conta"}
              </span>
              {conceptMobile ? (
                <ChevronDown
                  className="hidden h-4 w-4 shrink-0 sm:block"
                  aria-hidden="true"
                />
              ) : null}
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
